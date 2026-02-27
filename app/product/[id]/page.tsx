"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag, ShieldCheck, Truck, ArrowLeft,
  Store, Loader2, AlertCircle, ChevronRight,
  Zap, RotateCcw, Plus, Minus, Share2,
  CheckCircle2, Tag, Flame, Package, Lock,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { IProduct } from "@/models/Products";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────
interface PopulatedProduct extends Omit<IProduct, "storeId" | "images"> {
  storeId: { _id: string; name: string; handle?: string; logoUrl?: string };
  images:  string[];   // re-declared as required to match IProduct exactly
  stock:   number;
  mrp:     number;
}

// ─── Tokens ──────────────────────────────────────────────────────
const N = "#0A1628";
const M = "#9BA8C0";
const B = "1px solid #E4E9F2";
const S = "#F7F8FC";

// ─── Helpers ─────────────────────────────────────────────────────
const fmtRupee = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function stockBadge(stock: number) {
  if (stock === 0)  return { label: "Out of Stock",       color: "#DC2626", bg: "#FFF1F2", border: "#FECDD3", pulse: false };
  if (stock <= 5)   return { label: `Only ${stock} left`, color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", pulse: true  };
  if (stock <= 20)  return { label: "Low stock",           color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", pulse: false };
  return                   { label: "In Stock",            color: "#059669", bg: "#F0FDF4", border: "#BBF7D0", pulse: false };
}

// ─── Sub-components ───────────────────────────────────────────────
function InfoTile({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 16, background: "white", border: B, flex: 1, minWidth: 120 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: S, border: B, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={15} color={N} />
      </div>
      <div>
        <p style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: M, margin: 0 }}>{title}</p>
        <p style={{ fontSize: 12, fontWeight: 700, color: N, margin: "2px 0 0" }}>{sub}</p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────
const Sk = ({ h = 16, r = 8, w = "100%" }: { h?: number; r?: number; w?: string }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: "#E4E9F2", overflow: "hidden", position: "relative", flexShrink: 0 }}>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#E4E9F2 0%,#F7F8FC 50%,#E4E9F2 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════
export default function ProductDetailPage() {
  const { id }       = useParams();
  const router       = useRouter();
  const { addToCart } = useCart();

  const [product,    setProduct]    = useState<PopulatedProduct | null>(null);
  const [activeImg,  setActiveImg]  = useState("");
  const [qty,        setQty]        = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [cartState,  setCartState]  = useState<"idle" | "adding" | "added">("idle");
  const [buyLoading, setBuyLoading] = useState(false);
  const [shared,     setShared]     = useState(false);
  const [imgZoomed,  setImgZoomed]  = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}`)
      .then(r => { if (!r.ok) throw new Error("Product not found"); return r.json(); })
      .then(d  => { setProduct(d); setActiveImg(d.imageUrl); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Add to cart with success state ───────────────────────────
  const handleAddToCart = useCallback(async () => {
    if (!product || cartState !== "idle") return;
    setCartState("adding");
    try {
      for (let i = 0; i < qty; i++) await addToCart(product);
      setCartState("added");
      setTimeout(() => setCartState("idle"), 2400);
    } catch {
      setCartState("idle");
    }
  }, [product, qty, cartState, addToCart]);

  // ── Buy now ───────────────────────────────────────────────────
  const handleBuyNow = async () => {
    if (!product || buyLoading) return;
    setBuyLoading(true);
    try {
      for (let i = 0; i < qty; i++) await addToCart(product);
      router.push("/checkout");
    } catch {
      setBuyLoading(false);
    }
  };

  // ── Share ─────────────────────────────────────────────────────
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product?.name, url });
      else                  await navigator.clipboard.writeText(url);
    } catch { /* cancelled */ }
    setShared(true);
    setTimeout(() => setShared(false), 2200);
  };

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      <div style={{ minHeight: "100vh", background: S, paddingBottom: 80 }}>
        <div style={{ height: 58, background: "white", borderBottom: B }} />
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 52 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Sk h={480} r={22} />
            <div style={{ display: "flex", gap: 10 }}>{[0,1,2,3].map(i => <Sk key={i} h={76} w="76px" r={14} />)}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22, paddingTop: 8 }}>
            <Sk h={22} w="45%" r={8} />
            <Sk h={52} r={10} />
            <Sk h={38} w="55%" r={8} />
            <Sk h={110} r={16} />
            <Sk h={60} r={14} />
            <div style={{ display: "flex", gap: 12 }}><Sk h={56} r={14} /><Sk h={56} r={14} /></div>
          </div>
        </div>
      </div>
    </>
  );

  // ── Error ─────────────────────────────────────────────────────
  if (error || !product) return (
    <>
      <style>{`body{font-family:'DM Sans',sans-serif;margin:0;}`}</style>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: S, padding: 24, textAlign: "center", fontFamily: "DM Sans, sans-serif" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "#FFF1F2", border: "1px solid #FECDD3", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <AlertCircle size={28} color="#DC2626" />
        </div>
        <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: 28, color: N, margin: "0 0 8px", letterSpacing: "-0.025em" }}>Product Unavailable</h1>
        <p style={{ fontSize: 14, color: M, margin: "0 0 28px", maxWidth: 300, lineHeight: 1.6 }}>This item may have been removed or is no longer available.</p>
        <button onClick={() => router.push("/")}
          style={{ padding: "13px 28px", borderRadius: 14, background: N, color: "white", border: "none", fontWeight: 800, cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 14, boxShadow: "0 6px 20px rgba(10,22,40,0.2)" }}>
          Back to Discovery
        </button>
      </div>
    </>
  );

  // ── Derived values ────────────────────────────────────────────
  const allImages   = [product.imageUrl, ...(product.images || [])].filter(Boolean);
  const discountPct = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const stock       = stockBadge(product.stock ?? 99);
  const outOfStock  = product.stock === 0;
  const maxQty      = Math.min(product.stock || 1, 10);
  const storeHref   = product.storeId?.handle
    ? `/store/${product.storeId.handle}`
    : `/store/${product.storeId?._id}`;

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.45} }
        .no-scrollbar::-webkit-scrollbar { display:none }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none }
        * { box-sizing:border-box }
        body { font-family:'DM Sans',sans-serif; margin:0; background:${S} }
      `}</style>

      <div style={{ minHeight: "100vh", background: S, paddingBottom: 88, fontFamily: "DM Sans, sans-serif" }}>

        {/* ── Main grid ──────────────────────────────────────── */}
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 24px 0" }}>
          {/* ── Inline top bar: back + breadcrumb + share ─── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
            <button onClick={() => router.back()}
              style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: N, fontFamily: "DM Sans, sans-serif", padding: 0 }}>
              <ArrowLeft size={15} /> Back
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: M, overflow: "hidden", flex: 1, justifyContent: "center", maxWidth: 400 }}>
              <Link href="/" style={{ color: M, textDecoration: "none" }}>Home</Link>
              <ChevronRight size={10} />
              <span style={{ color: N, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</span>
            </div>

            <button onClick={handleShare}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 10, border: B, background: shared ? "#F0FDF4" : "white", cursor: "pointer", fontSize: 11, fontWeight: 700, color: shared ? "#059669" : N, fontFamily: "DM Sans, sans-serif", transition: "all .2s", flexShrink: 0 }}>
              <AnimatePresence mode="wait">
                {shared ? (
                  <motion.span key="ok" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <CheckCircle2 size={12} color="#059669" /> Copied!
                  </motion.span>
                ) : (
                  <motion.span key="sh" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Share2 size={12} /> Share
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 48, alignItems: "start" }}>

            {/* ── LEFT: Image gallery ─────────────────────────── */}
            <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Main image — capped height so right column is always visible */}
              <div
                onMouseEnter={() => setImgZoomed(true)}
                onMouseLeave={() => setImgZoomed(false)}
                style={{ position: "relative", width: "100%", height: "min(48vw, 520px)", borderRadius: 22, overflow: "hidden", background: "white", border: B, boxShadow: "0 8px 40px rgba(10,22,40,0.08)", cursor: imgZoomed ? "zoom-out" : "zoom-in" }}>
                <Image src={activeImg} alt={product.name} fill priority
                  style={{ objectFit: "cover", transform: imgZoomed ? "scale(1.09)" : "scale(1)", transition: "transform .55s cubic-bezier(0.16,1,0.3,1)" }} />

                {/* Discount badge */}
                {discountPct > 0 && (
                  <div style={{ position: "absolute", top: 14, left: 14, display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 10, background: N, boxShadow: "0 4px 12px rgba(10,22,40,0.22)" }}>
                    <Tag size={10} color="rgba(255,255,255,0.6)" />
                    <span style={{ fontSize: 11, fontWeight: 900, color: "white" }}>{discountPct}% OFF</span>
                  </div>
                )}

                {/* Low stock badge */}
                {product.stock > 0 && product.stock <= 5 && (
                  <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 10, background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                    <Flame size={10} color="#D97706" />
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#D97706" }}>{stock.label}</span>
                  </div>
                )}

                {/* Out of stock overlay */}
                {outOfStock && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(247,248,252,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ padding: "12px 24px", borderRadius: 16, background: "white", border: "1px solid #FECDD3", boxShadow: "0 8px 24px rgba(10,22,40,0.10)" }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: "#DC2626", margin: 0 }}>Out of Stock</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="no-scrollbar" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                  {allImages.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(img)}
                      style={{ position: "relative", width: 76, height: 76, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: "white",
                        border: activeImg === img ? `2.5px solid ${N}` : "2px solid #E4E9F2",
                        cursor: "pointer", transition: "all .2s",
                        transform: activeImg === img ? "scale(1.05)" : "scale(1)",
                        boxShadow: activeImg === img ? "0 4px 14px rgba(10,22,40,0.14)" : "none",
                        filter: activeImg === img ? "none" : "grayscale(0.35)" }}>
                      <Image src={img} alt={`View ${i + 1}`} fill style={{ objectFit: "cover" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: Product info ─────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: 22 }}>

              {/* Store + stock pills */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {product.storeId && (
                  <Link href={storeHref}
                    style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px 6px 8px", borderRadius: 10, background: N, textDecoration: "none", transition: "opacity .15s" }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                      {product.storeId.logoUrl
                        ? <Image src={product.storeId.logoUrl} alt="" fill sizes="22px" style={{ objectFit: "cover" }} />
                        : <Store size={11} color="white" />}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "white" }}>{product.storeId.name}</span>
                    <ChevronRight size={10} color="rgba(255,255,255,0.4)" />
                  </Link>
                )}

                {/* Stock chip */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 9, background: stock.bg, border: `1px solid ${stock.border}` }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: stock.color, animation: stock.pulse ? "pulse 1.5s ease-in-out infinite" : "none" }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: stock.color }}>{stock.label}</span>
                </div>
              </div>

              {/* Product name */}
              <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: 38, color: N, margin: 0, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
                {product.name}
              </h1>

              {/* Price block */}
              <div style={{ padding: "18px 20px", borderRadius: 18, background: "white", border: B, display: "flex", alignItems: "flex-end", gap: 16 }}>
                <span style={{ fontFamily: "Instrument Serif, serif", fontSize: 42, color: N, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {fmtRupee(product.price)}
                </span>
                {discountPct > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", marginBottom: 5 }}>
                    <span style={{ fontSize: 14, color: M, textDecoration: "line-through", fontWeight: 700 }}>
                      {fmtRupee(product.mrp)}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#059669" }}>
                      You save {fmtRupee(product.mrp - product.price)}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={{ padding: "18px 20px", borderRadius: 18, background: "white", border: B }}>
                <p style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: M, margin: "0 0 10px" }}>Description</p>
                <p style={{ fontSize: 14, color: "#4B5775", lineHeight: 1.75, margin: 0, fontWeight: 500 }}>
                  {product.description}
                </p>
              </div>

              {/* Quantity picker */}
              {!outOfStock && (
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: M, margin: 0, flexShrink: 0 }}>Qty</p>
                  <div style={{ display: "inline-flex", alignItems: "center", background: "white", border: B, borderRadius: 14, overflow: "hidden" }}>
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}
                      style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: qty <= 1 ? "not-allowed" : "pointer", opacity: qty <= 1 ? 0.3 : 1, transition: "opacity .15s" }}>
                      <Minus size={13} color={N} />
                    </button>
                    <span style={{ width: 48, textAlign: "center", fontSize: 15, fontWeight: 800, color: N, fontFamily: "DM Mono, monospace" }}>
                      {qty}
                    </span>
                    <button onClick={() => setQty(q => Math.min(maxQty, q + 1))} disabled={qty >= maxQty}
                      style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: qty >= maxQty ? "not-allowed" : "pointer", opacity: qty >= maxQty ? 0.3 : 1, transition: "opacity .15s" }}>
                      <Plus size={13} color={N} />
                    </button>
                  </div>
                  {qty > 1 && (
                    <span style={{ fontSize: 13, color: M, fontWeight: 700 }}>
                      = {fmtRupee(product.price * qty)}
                    </span>
                  )}
                  {qty >= maxQty && (
                    <span style={{ fontSize: 11, color: "#D97706", fontWeight: 700 }}>Max qty</span>
                  )}
                </div>
              )}

              {/* Info tiles */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <InfoTile icon={Truck}        title="Shipping" sub="Free pan-India"  />
                <InfoTile icon={ShieldCheck}  title="Seller"   sub="Verified store"  />
                <InfoTile icon={RotateCcw}    title="Returns"  sub="7-day easy"      />
              </div>

              {/* ── CTA buttons ──────────────────────────────── */}
              <div style={{ display: "flex", gap: 12 }}>

                {/* Add to bag */}
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddToCart}
                  disabled={cartState !== "idle" || outOfStock}
                  style={{ flex: "1.2", padding: "16px 18px", borderRadius: 16, cursor: outOfStock ? "not-allowed" : "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .22s",
                    background: cartState === "added" ? "#F0FDF4" : "white",
                    border: cartState === "added" ? "2px solid #BBF7D0" : `2px solid ${outOfStock ? "#E4E9F2" : "#E4E9F2"}`,
                    color: cartState === "added" ? "#059669" : outOfStock ? M : N }}>
                  <AnimatePresence mode="wait">
                    {cartState === "adding" && (
                      <motion.span key="ld" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Adding…
                      </motion.span>
                    )}
                    {cartState === "added" && (
                      <motion.span key="ok" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}
                        style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle2 size={15} color="#059669" /> Added to Bag!
                      </motion.span>
                    )}
                    {cartState === "idle" && (
                      <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ShoppingBag size={15} /> Add to Bag
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Buy now */}
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleBuyNow}
                  disabled={buyLoading || outOfStock}
                  style={{ flex: "1.5", padding: "16px 18px", borderRadius: 16, border: "none", fontFamily: "DM Sans, sans-serif", fontSize: 14, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "box-shadow .2s, transform .2s",
                    background: outOfStock ? "#E4E9F2" : N,
                    color: outOfStock ? M : "white",
                    cursor: outOfStock ? "not-allowed" : "pointer",
                    boxShadow: outOfStock ? "none" : "0 8px 24px rgba(10,22,40,0.22)" }}>
                  {buyLoading
                    ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Processing…</>
                    : <><Zap size={15} fill={outOfStock ? M : "white"} /> Buy It Now</>}
                </motion.button>
              </div>

              {/* Razorpay trust line */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px", borderRadius: 12, background: "white", border: B }}>
                <Lock size={12} color={M} />
                <span style={{ fontSize: 9, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Secure Payments by Razorpay · 256-bit SSL
                </span>
              </div>

            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Sticky mobile CTA ──────────────────────────────────── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60, background: "rgba(247,248,252,0.95)", backdropFilter: "blur(16px)", borderTop: B, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontFamily: "Instrument Serif, serif", fontSize: 22, color: N, lineHeight: 1, display: "block" }}>
            {fmtRupee(product.price * qty)}
          </span>
          {discountPct > 0 && (
            <span style={{ fontSize: 9, fontWeight: 800, color: "#059669", display: "block" }}>
              {discountPct}% off · MRP {fmtRupee(product.mrp * qty)}
            </span>
          )}
        </div>

        {/* Bag */}
        <button onClick={handleAddToCart} disabled={cartState !== "idle" || outOfStock}
          style={{ padding: "12px 16px", borderRadius: 13, border: cartState === "added" ? "2px solid #BBF7D0" : "2px solid #E4E9F2",
            background: cartState === "added" ? "#F0FDF4" : "white", fontSize: 12, fontWeight: 800,
            color: cartState === "added" ? "#059669" : outOfStock ? M : N,
            cursor: outOfStock ? "not-allowed" : "pointer", fontFamily: "DM Sans, sans-serif",
            display: "flex", alignItems: "center", gap: 6, flexShrink: 0, transition: "all .2s" }}>
          {cartState === "added"
            ? <><CheckCircle2 size={14} color="#059669" /> Added!</>
            : <><ShoppingBag size={14} /> Bag</>}
        </button>

        {/* Buy now */}
        <button onClick={handleBuyNow} disabled={buyLoading || outOfStock}
          style={{ padding: "12px 22px", borderRadius: 13, border: "none",
            background: outOfStock ? "#E4E9F2" : N, fontSize: 13, fontWeight: 900,
            color: outOfStock ? M : "white",
            cursor: outOfStock ? "not-allowed" : "pointer", fontFamily: "DM Sans, sans-serif",
            display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
            boxShadow: outOfStock ? "none" : "0 4px 16px rgba(10,22,40,0.2)", transition: "all .2s" }}>
          <Zap size={14} fill={outOfStock ? M : "white"} />
          Buy Now
        </button>
      </div>
    </>
  );
}