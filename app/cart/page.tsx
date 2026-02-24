"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import {
  Trash2, Plus, Minus, ShoppingBag, ArrowRight,
  ShieldCheck, Truck, Loader2, Tag, ChevronRight,
  RotateCcw, Lock, Sparkles, ArrowUpRight, X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── Razorpay script loader ────────────────────────────────────────
const loadRazorpay = () =>
  new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

// ─── Trust badge data ─────────────────────────────────────────────
const TRUST = [
  { icon: Lock,        label: "Secure payment",   sub: "256-bit SSL encrypted"         },
  { icon: Truck,       label: "Free delivery",    sub: "On all orders above ₹499"      },
  { icon: RotateCcw,   label: "Easy returns",     sub: "7-day hassle-free policy"      },
  { icon: ShieldCheck, label: "Buyer protection", sub: "100% refund if not satisfied"  },
];

// ─── Working promo codes ──────────────────────────────────────────
const PROMO_CODES: Record<string, number> = {
  REELS10: 0.10,   // 10 % off
  WELCOME: 0.05,   // 5 % off
};

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [promoCode,     setPromoCode]     = useState("");
  const [promoApplied,  setPromoApplied]  = useState<string | null>(null);
  const [promoError,    setPromoError]    = useState("");
  const [promoOpen,     setPromoOpen]     = useState(false);
  const [removingId,    setRemovingId]    = useState<string | null>(null);

  const discountRate  = promoApplied ? (PROMO_CODES[promoApplied] ?? 0) : 0;
  const discount      = cartTotal * discountRate;
  const shippingFee   = cartTotal >= 499 ? 0 : 49;
  const finalTotal    = cartTotal - discount + shippingFee;
  const freeShipping  = shippingFee === 0;
  const toFreeShip    = Math.max(0, 499 - cartTotal);
  const shipProgress  = Math.min((cartTotal / 499) * 100, 100);

  // ── Promo logic ──────────────────────────────────────────────────
  const handlePromo = () => {
    setPromoError("");
    const code = promoCode.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      setPromoApplied(code);
      setPromoOpen(false);
      setPromoCode("");
    } else {
      setPromoError("Invalid code. Try REELS10");
    }
  };

  // ── Animated remove ──────────────────────────────────────────────
  const handleRemove = async (id: string) => {
    setRemovingId(id);
    await new Promise(r => setTimeout(r, 220));
    removeFromCart(id);
    setRemovingId(null);
  };

  // ── Checkout ─────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!session) { router.push("/login"); return; }
    setIsCheckingOut(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { alert("Razorpay SDK failed to load."); return; }

      const orderRes  = await fetch("/api/checkout/create", { method: "POST" });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      const options = {
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        "Recommerce",
        description: `${cartCount} item${cartCount !== 1 ? "s" : ""}`,
        order_id:    orderData.id,
        handler: async (response: any) => {
          const v = await fetch("/api/checkout/verify", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(response),
          });
          const vd = await v.json();
          if (vd.success) router.push("/checkout/success");
          else alert("Payment verification failed.");
        },
        prefill: { name: session?.user?.name, email: session?.user?.email },
        theme:   { color: "#0A1628" },
      };

      const rz = new (window as any).Razorpay(options);
      rz.open();
    } catch (err) {
      console.error(err);
      alert("Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // EMPTY STATE
  // ═══════════════════════════════════════════════════════════════
  if (items.length === 0) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`}</style>
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          className="min-h-[78vh] flex flex-col items-center justify-center gap-7 px-4"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <div
            className="w-[72px] h-[72px] rounded-[18px] flex items-center justify-center"
            style={{ background: "#F4F6FB", border: "1px solid #E4E9F2" }}
          >
            <ShoppingBag className="w-8 h-8" style={{ color: "#C4CDD8" }} />
          </div>
          <div className="text-center space-y-2">
            <h1
              className="leading-tight tracking-tight"
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "clamp(1.7rem, 3vw, 2.4rem)",
                color: "#0A1628", letterSpacing: "-0.02em",
              }}
            >
              Your bag is empty
            </h1>
            <p className="text-sm max-w-xs mx-auto" style={{ color: "#9BA8C0" }}>
              Discover products through reels and add them here.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white
                       transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "#0A1628", boxShadow: "0 6px 24px rgba(10,22,40,0.16)" }}
          >
            <Sparkles className="w-4 h-4 opacity-70" />
            Browse Reels
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
          </Link>
        </motion.div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN CART
  // ═══════════════════════════════════════════════════════════════
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`}</style>

      <div className="bg-white min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

          {/* ── PAGE HEADER ──────────────────────────────────── */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-[11px] font-bold uppercase tracking-widest mb-1.5"
                style={{ color: "#9BA8C0" }}
              >
                Your bag
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="leading-none tracking-tight"
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "clamp(1.9rem, 3.5vw, 2.8rem)",
                  color: "#0A1628", letterSpacing: "-0.02em",
                }}
              >
                {cartCount} item{cartCount !== 1 ? "s" : ""}{" "}
                <em className="italic font-light" style={{ opacity: 0.35 }}>selected</em>
              </motion.h1>
            </div>
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold
                         transition-opacity hover:opacity-50"
              style={{ color: "#9BA8C0" }}
            >
              Continue shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* ── FREE SHIPPING PROGRESS ───────────────────────── */}
          <AnimatePresence>
            {!freeShipping && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-2xl px-5 py-4 mb-8 flex items-center gap-4"
                style={{ background: "#F4F6FB", border: "1px solid #E4E9F2" }}
              >
                <Truck className="w-4 h-4 flex-shrink-0" style={{ color: "#0A1628" }} />
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-semibold" style={{ color: "#0A1628" }}>
                    Add{" "}
                    <span className="font-black">₹{toFreeShip.toFixed(0)}</span>
                    {" "}more for free delivery
                  </p>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E4E9F2" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${shipProgress}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: "#0A1628" }}
                    />
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0"
                  style={{ color: "#C4CDD8" }}>
                  ₹499
                </span>
              </motion.div>
            )}
            {freeShipping && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl px-5 py-3.5 mb-8 flex items-center gap-3"
                style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
              >
                <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-xs font-bold text-emerald-700">
                  You've unlocked free delivery! 🎉
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_356px] gap-8 xl:gap-12">

            {/* ══ LEFT — ITEMS ═══════════════════════════════════ */}
            <div>
              {/* Column headers — desktop */}
              <div
                className="hidden sm:grid gap-4 pb-3 mb-1"
                style={{
                  gridTemplateColumns: "1fr 140px 96px",
                  borderBottom: "1px solid #E4E9F2",
                }}
              >
                {["Product", "Quantity", "Total"].map((h, i) => (
                  <span
                    key={h}
                    className={`text-[10px] font-bold uppercase tracking-widest ${i === 2 ? "text-right" : ""}`}
                    style={{ color: "#9BA8C0" }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: removingId === item.productId ? 0.35 : 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="grid items-center gap-4 py-5 sm:py-6 group"
                    style={{
                      gridTemplateColumns: "1fr",
                      borderBottom: "1px solid #F4F6FB",
                    }}
                  >
                    {/* Mobile layout */}
                    <div className="sm:hidden flex items-start gap-4">
                      <div
                        className="relative w-20 h-[104px] rounded-xl overflow-hidden flex-shrink-0"
                        style={{ background: "#F4F6FB", border: "1px solid #E4E9F2" }}
                      >
                        <Image src={item.imageUrl} alt={item.name} fill
                          className="object-cover" sizes="80px" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold leading-snug" style={{ color: "#0A1628" }}>
                              {item.name}
                            </p>
                            <p className="text-base font-black mt-0.5" style={{ fontFamily: "'Instrument Serif', serif", color: "#0A1628" }}>
                              ₹{item.price.toLocaleString()}
                            </p>
                          </div>
                          <button onClick={() => handleRemove(item.productId)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: "#FFF1F2" }}>
                            <X className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <QtyControl
                            quantity={item.quantity}
                            onDec={() => updateQuantity(item.productId, item.quantity - 1)}
                            onInc={() => updateQuantity(item.productId, item.quantity + 1)}
                          />
                          <span className="font-black text-base" style={{ fontFamily: "'Instrument Serif', serif", color: "#0A1628" }}>
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div
                      className="hidden sm:grid items-center gap-4"
                      style={{ gridTemplateColumns: "1fr 140px 96px" }}
                    >
                      {/* Product */}
                      <div className="flex items-center gap-4">
                        <div
                          className="relative w-[68px] h-[84px] rounded-xl overflow-hidden flex-shrink-0"
                          style={{ background: "#F4F6FB", border: "1px solid #E4E9F2" }}
                        >
                          <Image src={item.imageUrl} alt={item.name} fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="68px" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-snug truncate" style={{ color: "#0A1628" }}>
                            {item.name}
                          </p>
                          <p className="text-base font-black mt-0.5" style={{ fontFamily: "'Instrument Serif', serif", color: "#0A1628" }}>
                            ₹{item.price.toLocaleString()}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5"
                            style={{ color: "#34D399" }}>
                            In stock
                          </p>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <QtyControl
                          quantity={item.quantity}
                          onDec={() => updateQuantity(item.productId, item.quantity - 1)}
                          onInc={() => updateQuantity(item.productId, item.quantity + 1)}
                        />
                      </div>

                      {/* Total + remove */}
                      <div className="flex items-center justify-end gap-2.5">
                        <span className="font-black text-lg leading-none"
                          style={{ fontFamily: "'Instrument Serif', serif", color: "#0A1628" }}>
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleRemove(item.productId)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                          style={{ color: "#C4CDD8" }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "#FFF1F2";
                            e.currentTarget.style.color = "#F87171";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#C4CDD8";
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* ══ RIGHT — ORDER SUMMARY ══════════════════════════ */}
            <div className="space-y-4">

              {/* Summary card */}
              <div
                className="rounded-2xl p-6 sticky top-[88px] space-y-5"
                style={{ border: "1px solid #E4E9F2" }}
              >
                <h2 className="text-sm font-bold" style={{ color: "#0A1628" }}>Order summary</h2>

                {/* Line items */}
                <div className="space-y-3">
                  <SummaryRow label="Subtotal"   value={`₹${cartTotal.toLocaleString()}`} />
                  <SummaryRow
                    label="Shipping"
                    value={freeShipping ? "Free" : `₹${shippingFee}`}
                    valueColor={freeShipping ? "#34D399" : undefined}
                  />
                  <AnimatePresence>
                    {promoApplied && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <SummaryRow
                          label={`Promo (${promoApplied})`}
                          value={`-₹${discount.toFixed(0)}`}
                          valueColor="#34D399"
                          onRemove={() => { setPromoApplied(null); }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <SummaryRow label="Tax" value="At checkout" muted />
                </div>

                {/* Divider */}
                <div className="h-px" style={{ background: "#E4E9F2" }} />

                {/* Total */}
                <div className="flex items-end justify-between">
                  <span className="text-sm font-bold" style={{ color: "#0A1628" }}>Total</span>
                  <span
                    className="font-black leading-none"
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: "1.8rem", color: "#0A1628",
                    }}
                  >
                    ₹{finalTotal.toLocaleString()}
                  </span>
                </div>

                {/* Promo code */}
                <div>
                  {!promoOpen && !promoApplied && (
                    <button
                      onClick={() => setPromoOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-60"
                      style={{ color: "#0A1628" }}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      Add promo code
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}

                  <AnimatePresence>
                    {promoOpen && !promoApplied && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 overflow-hidden"
                      >
                        <div
                          className="flex rounded-xl overflow-hidden"
                          style={{ border: "1px solid #E4E9F2" }}
                        >
                          <input
                            autoFocus
                            type="text"
                            value={promoCode}
                            onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                            onKeyDown={e => e.key === "Enter" && handlePromo()}
                            placeholder="Enter code"
                            className="flex-1 px-4 py-2.5 text-sm font-medium outline-none bg-transparent"
                            style={{ color: "#0A1628", fontFamily: "'DM Sans', sans-serif" }}
                          />
                          <button
                            onClick={handlePromo}
                            className="px-4 py-2.5 text-xs font-bold border-l transition-colors"
                            style={{ borderColor: "#E4E9F2", color: "#0A1628", background: "#F4F6FB" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#E4E9F2")}
                            onMouseLeave={e => (e.currentTarget.style.background = "#F4F6FB")}
                          >
                            Apply
                          </button>
                        </div>
                        {promoError && (
                          <p className="text-[11px] font-semibold text-rose-500">{promoError}</p>
                        )}
                        <p className="text-[10px]" style={{ color: "#C4CDD8" }}>
                          Try: <span className="font-bold">REELS10</span> or <span className="font-bold">WELCOME</span>
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Checkout CTA */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold text-white
                             transition-all duration-150 disabled:opacity-60 hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: "#0A1628",
                    boxShadow: "0 4px 24px rgba(10,22,40,0.16)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={e => !isCheckingOut && (e.currentTarget.style.background = "#1c2e4a")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#0A1628")}
                >
                  {isCheckingOut ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 opacity-50" />
                      Secure checkout · ₹{finalTotal.toLocaleString()}
                      <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                    </>
                  )}
                </motion.button>

                {/* Accepted payment methods */}
                <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                  {["Visa", "Mastercard", "UPI", "Razorpay", "NetBanking"].map(b => (
                    <span
                      key={b}
                      className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-md"
                      style={{ background: "#F4F6FB", color: "#9BA8C0", border: "1px solid #E4E9F2" }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* Trust signals card */}
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{ border: "1px solid #E4E9F2", background: "#FAFAFA" }}
              >
                {TRUST.map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "#F4F6FB", border: "1px solid #E4E9F2" }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: "#0A1628" }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: "#0A1628" }}>{label}</p>
                      <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#9BA8C0" }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Quantity control ─────────────────────────────────────────────
function QtyControl({ quantity, onDec, onInc }: {
  quantity: number; onDec: () => void; onInc: () => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded-xl overflow-hidden"
      style={{ border: "1px solid #E4E9F2", background: "#FAFAFA" }}
    >
      <button
        onClick={onDec}
        className="w-9 h-9 flex items-center justify-center transition-colors hover:bg-[#F4F6FB]"
        style={{ color: "#6B7A99" }}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span
        className="w-8 text-center text-sm font-bold"
        style={{ color: "#0A1628" }}
      >
        {quantity}
      </span>
      <button
        onClick={onInc}
        className="w-9 h-9 flex items-center justify-center transition-colors hover:bg-[#F4F6FB]"
        style={{ color: "#6B7A99" }}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Summary row ──────────────────────────────────────────────────
function SummaryRow({ label, value, valueColor, muted, onRemove }: {
  label: string; value: string;
  valueColor?: string; muted?: boolean; onRemove?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="text-sm" style={{ color: muted ? "#C4CDD8" : "#9BA8C0" }}>{label}</span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="transition-colors hover:text-rose-400"
            style={{ color: "#C4CDD8" }}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <span
        className="text-sm font-bold"
        style={{ color: valueColor ?? (muted ? "#C4CDD8" : "#0A1628") }}
      >
        {value}
      </span>
    </div>
  );
}