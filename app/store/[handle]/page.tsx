"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Store as StoreIcon, Users, Video, ShoppingBag,
  ChevronLeft, ShieldCheck, Grid3X3, Play,
  Heart, Share2, Link as LinkIcon, Check,
  Star, Package, TrendingUp, Zap,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Design tokens ───────────────────────────────────────────────
const N = "#0A1628"; const M = "#9BA8C0"; const B = "1px solid #E4E9F2"; const S = "#F7F8FC";

// ─── Helpers ─────────────────────────────────────────────────────
function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Skeleton ────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 16, r = 8 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: r, background: "#E4E9F2", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #E4E9F2 0%, #F7F8FC 50%, #E4E9F2 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.6s infinite" }} />
    </div>
  );
}

// ─── Stat tile ───────────────────────────────────────────────────
function StatTile({ icon: Icon, value, label, color, bg, border }: {
  icon: React.ElementType; value: string; label: string;
  color: string; bg: string; border: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px 18px", background: "white", border: B, borderRadius: 16, boxShadow: "0 1px 4px rgba(10,22,40,0.04)" }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={14} color={color} />
      </div>
      <p style={{ fontFamily: "Instrument Serif, serif", fontSize: 22, fontWeight: 400, color: N, margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</p>
      <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: M, margin: 0 }}>{label}</p>
    </div>
  );
}

// ─── Reel card ───────────────────────────────────────────────────
function ReelCard({ reel, index }: { reel: any; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      <Link href={`/?reelId=${reel._id}`}
        style={{ display: "block", position: "relative", borderRadius: 18, overflow: "hidden", background: "#0A1628", boxShadow: hovered ? "0 16px 40px rgba(10,22,40,0.18)" : "0 2px 8px rgba(10,22,40,0.08)", transform: hovered ? "translateY(-3px)" : "translateY(0)", transition: "all .28s cubic-bezier(0.16,1,0.3,1)", aspectRatio: "9/16" }}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <Image src={reel.thumbnailUrl} alt={reel.caption || "Reel"} fill className="object-cover"
          style={{ transform: hovered ? "scale(1.06)" : "scale(1)", transition: "transform .5s cubic-bezier(0.16,1,0.3,1)" }} />
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: hovered ? "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)" : "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)", transition: "background .28s" }} />
        {/* Play icon */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: hovered ? 1 : 0, transition: "opacity .2s" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Play size={18} color="white" fill="white" style={{ marginLeft: 2 }} />
          </div>
        </div>
        {/* Like count */}
        {reel.likesCount > 0 && (
          <div style={{ position: "absolute", bottom: 10, left: 10, display: "flex", alignItems: "center", gap: 4 }}>
            <Heart size={11} color="white" fill="rgba(255,255,255,0.8)" />
            <span style={{ fontSize: 10, fontWeight: 700, color: "white", fontFamily: "DM Sans, sans-serif" }}>{fmtCount(reel.likesCount)}</span>
          </div>
        )}
        {/* Multi-product dot */}
        {reel.isMultiProduct && (
          <div style={{ position: "absolute", top: 10, right: 10, width: 22, height: 22, borderRadius: "50%", background: "rgba(10,22,40,0.7)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Grid3X3 size={9} color="white" />
          </div>
        )}
      </Link>
    </motion.div>
  );
}

// ─── Product card ─────────────────────────────────────────────────
function ProductCard({ product, index }: { product: any; index: number }) {
  const [hovered, setHovered] = useState(false);
  const discount = product.mrp && product.price < product.mrp
    ? Math.round((1 - product.price / product.mrp) * 100)
    : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      <Link href={`/product/${product._id}`} style={{ display: "block", textDecoration: "none" }}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {/* Image */}
        <div style={{ position: "relative", aspectRatio: "1", borderRadius: 18, overflow: "hidden", background: S, border: B, boxShadow: hovered ? "0 12px 32px rgba(10,22,40,0.12)" : "0 2px 8px rgba(10,22,40,0.04)", transform: hovered ? "translateY(-2px)" : "translateY(0)", transition: "all .28s cubic-bezier(0.16,1,0.3,1)", marginBottom: 12 }}>
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover"
            style={{ transform: hovered ? "scale(1.05)" : "scale(1)", transition: "transform .5s" }} />
          {discount > 0 && (
            <div style={{ position: "absolute", top: 10, left: 10, padding: "2px 7px", borderRadius: 6, background: "#F0FDF4", border: "1px solid #BBF7D0", fontSize: 9, fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              -{discount}%
            </div>
          )}
          <div style={{ position: "absolute", bottom: 10, right: 10, opacity: hovered ? 1 : 0, transition: "opacity .2s" }}>
            <div style={{ padding: "5px 10px", borderRadius: 8, background: "rgba(10,22,40,0.8)", backdropFilter: "blur(6px)" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "white", fontFamily: "DM Sans, sans-serif" }}>View</span>
            </div>
          </div>
        </div>
        {/* Info */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: N, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "DM Sans, sans-serif" }}>{product.name}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <p style={{ fontFamily: "Instrument Serif, serif", fontSize: 16, fontWeight: 400, color: N, margin: 0 }}>₹{Number(product.price).toLocaleString()}</p>
            {product.mrp && product.price < product.mrp && (
              <p style={{ fontSize: 11, color: M, margin: 0, textDecoration: "line-through", fontFamily: "DM Sans, sans-serif" }}>₹{Number(product.mrp).toLocaleString()}</p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function StoreProfilePage() {
  const { handle }        = useParams();
  const router            = useRouter();
  const { data: session } = useSession();

  const [data,          setData]          = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState<"reels" | "products">("reels");
  const [isFollowing,   setIsFollowing]   = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [copied,        setCopied]        = useState(false);
  const [scrolled,      setScrolled]      = useState(false);

  useEffect(() => {
    fetch(`/api/store/${handle}`)
      .then(r => r.json())
      .then(json => {
        setData(json);
        setIsFollowing(json.isFollowing ?? false);
        setFollowerCount(json.followerCount ?? 0);
        setLoading(false);
      });
  }, [handle]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleFollow = async () => {
    if (!session) return router.push("/login");
    const next = !isFollowing;
    setIsFollowing(next);
    setFollowerCount(c => next ? c + 1 : c - 1);
    try {
      await fetch("/api/seller/subscribe", {
        method: "POST", body: JSON.stringify({ sellerId: data.store._id }),
      });
    } catch { setIsFollowing(!next); setFollowerCount(c => next ? c - 1 : c + 1); }
  };

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { if (navigator.share) navigator.share({ title: data?.store?.name, url }); }
  }, [data]);

  // ── Loading skeleton ───────────────────────────────────────────
  if (loading) return (
    <>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
      <div style={{ minHeight: "100vh", background: S, fontFamily: "DM Sans, sans-serif" }}>
        <div style={{ height: 56, background: "rgba(247,248,252,0.95)", borderBottom: B }} />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ display: "flex", gap: 32, marginBottom: 40 }}>
            <Skeleton w={120} h={120} r={24} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              <Skeleton w="60%" h={28} r={8} />
              <Skeleton w="40%" h={14} r={6} />
              <Skeleton w="80%" h={14} r={6} />
              <Skeleton w="80%" h={14} r={6} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 40 }}>
            {[0,1,2,3].map(i => <Skeleton key={i} h={100} r={16} />)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[0,1,2,3,4,5].map(i => <Skeleton key={i} h={280} r={18} />)}
          </div>
        </div>
      </div>
    </>
  );

  if (!data?.store) return (
    <div style={{ minHeight: "100vh", background: S, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif" }}>
      <StoreIcon size={40} color={M} />
      <p style={{ fontSize: 18, fontWeight: 800, color: N, marginTop: 16 }}>Store Not Found</p>
      <p style={{ fontSize: 14, color: M }}>This store doesn't exist or has been removed.</p>
      <button onClick={() => router.back()} style={{ marginTop: 20, padding: "10px 20px", borderRadius: 12, background: N, color: "white", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>Go Back</button>
    </div>
  );

  const { store, reels = [], products = [] } = data;
  const totalViews = reels.reduce((a: number, r: any) => a + (r.viewsCount || 0), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      <div style={{ minHeight: "100vh", background: S, fontFamily: "DM Sans, sans-serif", paddingBottom: 80 }}>

        {/* ── Sticky top bar ─────────────────────────────────────── */}
        <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(247,248,252,0.96)", backdropFilter: "blur(14px)", borderBottom: B, transition: "box-shadow .2s" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={() => router.back()}
              style={{ width: 34, height: 34, borderRadius: 10, border: B, background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 4px rgba(10,22,40,0.06)", transition: "box-shadow .15s" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 3px 12px rgba(10,22,40,0.10)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 4px rgba(10,22,40,0.06)")}>
              <ChevronLeft size={15} color="#6B7A99" />
            </button>

            {/* Store name appears on scroll */}
            <AnimatePresence>
              {scrolled && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: N, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <StoreIcon size={12} color="white" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: N, letterSpacing: "-0.01em" }}>@{store.handle}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Share */}
              <button onClick={handleShare}
                style={{ width: 34, height: 34, borderRadius: 10, border: B, background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 4px rgba(10,22,40,0.06)", transition: "all .15s" }}>
                <AnimatePresence mode="wait">
                  {copied
                    ? <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check size={13} color="#059669" /></motion.div>
                    : <motion.div key="share" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Share2 size={13} color="#6B7A99" /></motion.div>}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 0" }}>

          {/* ── Identity section ──────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 36, borderBottom: B }}>

            <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
              {/* Avatar */}
              <div style={{ width: 100, height: 100, borderRadius: 24, overflow: "hidden", background: N, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "3px solid white", boxShadow: "0 12px 40px rgba(10,22,40,0.18)", position: "relative" }}>
                {store.logoUrl
                  ? <Image src={store.logoUrl} alt="Logo" fill className="object-cover" />
                  : <StoreIcon size={36} color="rgba(255,255,255,0.25)" />}
              </div>

              {/* Name + bio + CTA */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                  <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", color: N, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                    {store.name}
                  </h1>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                    <ShieldCheck size={10} color="#059669" />
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "0.12em" }}>Verified</span>
                  </div>
                </div>

                <p style={{ fontSize: 12, fontWeight: 600, color: M, margin: "0 0 12px" }}>@{store.handle}</p>

                <p style={{ fontSize: 14, color: "#4A5568", lineHeight: 1.65, margin: "0 0 20px", maxWidth: 500 }}>
                  {store.description || "Welcome to our official ReeCommerce shop."}
                </p>

                {/* CTA row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <motion.button onClick={handleFollow} whileTap={{ scale: 0.97 }}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 800, transition: "all .2s",
                      background: isFollowing ? S : N,
                      color: isFollowing ? N : "white",
                      boxShadow: isFollowing ? "none" : "0 4px 16px rgba(10,22,40,0.16)",
                      ...(isFollowing ? { border: B } : {}),
                    }}>
                    {isFollowing ? <><Check size={13} /> Following</> : <><Users size={13} /> Follow</>}
                  </motion.button>

                  <button onClick={handleShare}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 12, border: B, background: "white", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 700, color: "#6B7A99", boxShadow: "0 1px 4px rgba(10,22,40,0.06)", transition: "box-shadow .15s" }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(10,22,40,0.10)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 4px rgba(10,22,40,0.06)")}>
                    {copied ? <><Check size={13} color="#059669" /> Copied!</> : <><Share2 size={13} /> Share</>}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Stat tiles ──────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              <StatTile icon={Users}      value={fmtCount(followerCount)} label="Followers"   color="#2563EB" bg="#EFF6FF" border="#BFDBFE" />
              <StatTile icon={Video}      value={String(reels.length)}   label="Reels"       color="#7C3AED" bg="#F5F3FF" border="#DDD6FE" />
              <StatTile icon={Package}    value={String(products.length)} label="Products"    color="#D97706" bg="#FFFBEB" border="#FDE68A" />
              <StatTile icon={TrendingUp} value={fmtCount(totalViews)}   label="Total Views" color="#059669" bg="#F0FDF4" border="#BBF7D0" />
            </div>
          </motion.div>

          {/* ── Tab bar ───────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: 0, marginTop: 28, borderBottom: B }}>
            {([
              { id: "reels",    label: "Reels",   icon: Play,      count: reels.length },
              { id: "products", label: "Shop",    icon: ShoppingBag, count: products.length },
            ] as const).map(({ id, label, icon: Icon, count }) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 4px 14px", marginRight: 28, background: "transparent", border: "none", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em",
                    color: active ? N : M,
                    borderBottom: `2px solid ${active ? N : "transparent"}`,
                    transition: "color .15s, border-color .15s", position: "relative" }}>
                  <Icon size={13} />
                  {label}
                  {count > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 6, background: active ? N : "#E4E9F2", color: active ? "white" : M, transition: "all .15s" }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Content grid ─────────────────────────────────────── */}
          <div style={{ marginTop: 28 }}>
            <AnimatePresence mode="wait">
              {activeTab === "reels" ? (
                <motion.div key="reels" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {reels.length === 0 ? (
                    <EmptyState icon={Video} title="No reels yet" sub="This seller hasn't published any reels yet." />
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
                      {reels.map((reel: any, i: number) => <ReelCard key={reel._id} reel={reel} index={i} />)}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {products.length === 0 ? (
                    <EmptyState icon={Package} title="No products yet" sub="This seller hasn't listed any products yet." />
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 20 }}>
                      {products.map((product: any, i: number) => <ProductCard key={product._id} product={product} index={i} />)}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Empty state ─────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", gap: 12, background: "white", border: B, borderRadius: 20 }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: S, border: B, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={22} color={M} />
      </div>
      <p style={{ fontSize: 15, fontWeight: 800, color: N, margin: 0 }}>{title}</p>
      <p style={{ fontSize: 13, color: M, margin: 0 }}>{sub}</p>
    </motion.div>
  );
}