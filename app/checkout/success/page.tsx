"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, ArrowRight, ShoppingBag,
  Loader2, Package, Sparkles, MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Tokens ──────────────────────────────────────────────────────
const N = "#0A1628"; const M = "#9BA8C0"; const B = "1px solid #E4E9F2"; const S = "#F7F8FC";

// ─── Confetti particle ────────────────────────────────────────────
function Particle({ i }: { i: number }) {
  const colors = ["#0A1628", "#4ADE80", "#60A5FA", "#F59E0B", "#C084FC", "#FB7185"];
  const color  = colors[i % colors.length];
  const left   = `${8 + (i * 11.3) % 84}%`;
  const delay  = (i * 0.07) % 0.9;
  const size   = 5 + (i % 4) * 2;
  const rotate = i % 2 === 0 ? 45 : 0;

  return (
    <motion.div
      initial={{ y: -20, opacity: 0, scale: 0 }}
      animate={{ y: ["0%", "110vh"], opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0.6], rotate: [0, rotate * 8] }}
      transition={{ delay, duration: 2.2 + (i % 5) * 0.3, ease: "easeIn", times: [0, 0.1, 0.8, 1] }}
      style={{ position: "fixed", top: 0, left, width: size, height: size, borderRadius: rotate === 45 ? 2 : "50%", background: color, zIndex: 60, pointerEvents: "none" }}
    />
  );
}

// ─── Step row ─────────────────────────────────────────────────────
function StepRow({ icon: Icon, title, sub, delay, color, bg, border }: {
  icon: React.ElementType; title: string; sub: string; delay: number;
  color: string; bg: string; border: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: N, margin: 0 }}>{title}</p>
        <p style={{ fontSize: 11, color: M, margin: 0 }}>{sub}</p>
      </div>
    </motion.div>
  );
}

// ─── Main content ─────────────────────────────────────────────────
function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId      = searchParams.get("orderId");
  const [showParticles, setShowParticles] = useState(true);

  // Stop confetti after 3s
  useEffect(() => {
    const t = setTimeout(() => setShowParticles(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const shortId = orderId ? orderId.slice(-10).toUpperCase() : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&display=swap');
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes drift { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; margin: 0; }
      `}</style>

      {/* Confetti */}
      <AnimatePresence>
        {showParticles && Array.from({ length: 22 }).map((_, i) => <Particle key={i} i={i} />)}
      </AnimatePresence>

      <div style={{ minHeight: "100vh", background: S, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "DM Sans, sans-serif", position: "relative", overflow: "hidden" }}>

        {/* Background blobs */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Main card ──────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: "white", border: B, borderRadius: 28, padding: "40px 36px 32px", textAlign: "center", boxShadow: "0 8px 40px rgba(10,22,40,0.08)" }}>

            {/* Icon */}
            <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 24px" }}>
              {/* Ping rings */}
              <div style={{ position: "absolute", inset: -6, borderRadius: "50%", background: "rgba(74,222,128,0.12)", animation: "ping 1.8s cubic-bezier(0,0,0.2,1) infinite" }} />
              <div style={{ position: "absolute", inset: -12, borderRadius: "50%", background: "rgba(74,222,128,0.06)", animation: "ping 1.8s cubic-bezier(0,0,0.2,1) 0.3s infinite" }} />
              {/* Circle */}
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 280, damping: 18 }}
                style={{ width: 80, height: 80, borderRadius: "50%", background: "#F0FDF4", border: "2px solid #BBF7D0", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <CheckCircle2 size={36} color="#16A34A" strokeWidth={2} />
              </motion.div>
            </div>

            {/* Text */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "#16A34A", margin: "0 0 8px" }}>
                Payment successful
              </p>
              <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: 34, color: N, margin: "0 0 10px", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
                Order Confirmed!
              </h1>
              <p style={{ fontSize: 14, color: M, lineHeight: 1.65, margin: "0 0 28px", fontWeight: 500 }}>
                Your transaction was successful. Sellers have been notified and are preparing your package.
              </p>
            </motion.div>

            {/* Order ID pill */}
            {shortId && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.45, duration: 0.3 }}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12, background: N, margin: "0 0 28px" }}>
                <Sparkles size={12} color="rgba(255,255,255,0.5)" />
                <span style={{ fontSize: 11, fontWeight: 800, color: "white", letterSpacing: "0.08em", fontFamily: "DM Mono, monospace" }}>
                  {shortId}
                </span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>ORDER ID</span>
              </motion.div>
            )}

            {/* CTA buttons */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.35 }}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link href={orderId ? `/orders/${orderId}` : "/"}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 24px", borderRadius: 14, background: N, color: "white", textDecoration: "none", fontSize: 14, fontWeight: 800, fontFamily: "DM Sans, sans-serif", boxShadow: "0 6px 20px rgba(10,22,40,0.22)", transition: "all .18s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 28px rgba(10,22,40,0.28)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(10,22,40,0.22)"; }}>
                {orderId ? (
                  <><MapPin size={15} /> Track My Order</>
                ) : (
                  <>Back to Home <ArrowRight size={15} /></>
                )}
              </Link>

              <Link href="/"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 24px", borderRadius: 14, background: S, border: B, color: N, textDecoration: "none", fontSize: 14, fontWeight: 700, fontFamily: "DM Sans, sans-serif", transition: "background .15s" }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#EEF0F5")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = S)}>
                <ShoppingBag size={15} /> Continue Shopping
              </Link>
            </motion.div>
          </motion.div>

          {/* ── What happens next card ────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: "white", border: B, borderRadius: 22, padding: "24px 28px", boxShadow: "0 2px 12px rgba(10,22,40,0.05)" }}>
            <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: M, margin: "0 0 16px" }}>
              What happens next
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <StepRow icon={CheckCircle2} title="Order confirmed"       sub="Payment received and verified"                   delay={0.60} color="#059669" bg="#F0FDF4" border="#BBF7D0" />
              <StepRow icon={Package}     title="Seller preparing"      sub="Your items are being packed"                     delay={0.68} color="#7C3AED" bg="#F5F3FF" border="#DDD6FE" />
              <StepRow icon={MapPin}      title="Out for delivery"      sub="Tracking updates will be sent to your email"     delay={0.76} color="#2563EB" bg="#EFF6FF" border="#BFDBFE" />
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F8FC" }}>
        <Loader2 size={28} color="#9BA8C0" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}