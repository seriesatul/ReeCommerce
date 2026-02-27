"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Check, Sparkles, Smartphone, Shirt, Zap,
  Heart, Home, Gamepad2, ChevronRight, BookOpen,
  Utensils, Bike,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Design tokens ──────────────────────────────────────────────────────────────
const N = "#0A1628";
const M = "#9BA8C0";
const B = "1px solid #E4E9F2";
const S = "#F7F8FC";

// ─── Categories ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "tech",     label: "Electronics", sub: "Gadgets & gear",     icon: Smartphone, accent: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  { id: "fashion",  label: "Fashion",     sub: "Style & apparel",    icon: Shirt,      accent: "#DB2777", bg: "#FDF2F8", border: "#FBCFE8" },
  { id: "fitness",  label: "Fitness",     sub: "Health & sports",    icon: Bike,       accent: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  { id: "beauty",   label: "Beauty",      sub: "Skincare & makeup",  icon: Heart,      accent: "#DC2626", bg: "#FFF1F2", border: "#FECDD3" },
  { id: "home",     label: "Home",        sub: "Decor & living",     icon: Home,       accent: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
  { id: "gaming",   label: "Gaming",      sub: "Games & setup",      icon: Gamepad2,   accent: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  { id: "food",     label: "Food",        sub: "Gourmet & kitchen",  icon: Utensils,   accent: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" },
  { id: "books",    label: "Books",       sub: "Reads & learning",   icon: BookOpen,   accent: "#0E7490", bg: "#ECFEFF", border: "#A5F3FC" },
];

const MIN_SELECT = 3;

export default function BuyerOnboarding() {
  const { data: session, update } = useSession();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading,  setLoading]  = useState(false);

  const toggle = (id: string) =>
    setSelected(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);

  const handleComplete = async () => {
    if (selected.length < MIN_SELECT) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user/onboarding", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ interests: selected }),
      });
      if (res.ok) {
        await update({ onboardingCompleted: true });
        window.location.href = "/";
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const remaining = Math.max(0, MIN_SELECT - selected.length);
  const ready     = selected.length >= MIN_SELECT;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>

      <div style={{ minHeight: "100vh", background: S, fontFamily: "DM Sans, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px 100px" }}>

        {/* ── Subtle background texture ───────────────────────────── */}
        <div style={{ position: "fixed", inset: 0, opacity: 0.022, backgroundImage: "radial-gradient(circle, #0A1628 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

        <div style={{ width: "100%", maxWidth: 760, position: "relative", zIndex: 1 }}>

          {/* ── Header ─────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: "center", marginBottom: 44 }}>

            {/* Floating icon */}
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
              style={{ width: 56, height: 56, borderRadius: 16, background: N, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 16px 40px rgba(10,22,40,0.22)" }}>
              <Sparkles size={24} color="white" />
            </motion.div>

            <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: "clamp(2.2rem, 5vw, 3rem)", color: N, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 14px" }}>
              What do you{" "}
              <em style={{ fontStyle: "italic", fontWeight: 300, opacity: 0.45 }}>love?</em>
            </h1>

            <p style={{ fontSize: 15, color: M, margin: 0, lineHeight: 1.65 }}>
              Pick at least{" "}
              <strong style={{ color: N, fontWeight: 800 }}>{MIN_SELECT} categories</strong>
              {" "}— we'll curate your reel feed around them.
            </p>
          </motion.div>

          {/* ── Category grid ───────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 12, marginBottom: 32 }}>
            {CATEGORIES.map(({ id, label, sub, icon: Icon, accent, bg, border }, i) => {
              const active = selected.includes(id);
              return (
                <motion.button key={id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.055, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => toggle(id)}
                  style={{
                    padding: "20px 18px", borderRadius: 18, cursor: "pointer", textAlign: "left",
                    fontFamily: "DM Sans, sans-serif", position: "relative", overflow: "hidden",
                    background: active ? N : "white",
                    border: active ? `2px solid ${N}` : B,
                    boxShadow: active ? "0 12px 36px rgba(10,22,40,0.18)" : "0 1px 4px rgba(10,22,40,0.04)",
                    transform: active ? "translateY(-3px)" : "translateY(0)",
                    transition: "all .22s cubic-bezier(0.16,1,0.3,1)",
                    outline: "none",
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(10,22,40,0.10)"; (e.currentTarget as HTMLElement).style.borderColor = "#C4CDD8"; } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(10,22,40,0.04)"; (e.currentTarget as HTMLElement).style.borderColor = "#E4E9F2"; } }}>

                  {/* Inactive dot grid texture */}
                  {active && (
                    <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px", pointerEvents: "none" }} />
                  )}

                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, marginBottom: 14,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: active ? "rgba(255,255,255,0.1)" : bg,
                    border: active ? "1px solid rgba(255,255,255,0.15)" : `1px solid ${border}`,
                    transition: "all .22s",
                  }}>
                    <Icon size={18} color={active ? "rgba(255,255,255,0.9)" : accent} />
                  </div>

                  {/* Labels */}
                  <p style={{ fontSize: 14, fontWeight: 800, color: active ? "white" : N, margin: "0 0 3px", letterSpacing: "-0.01em", lineHeight: 1 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 11, color: active ? "rgba(255,255,255,0.5)" : M, margin: 0, fontWeight: 500 }}>
                    {sub}
                  </p>

                  {/* Check badge */}
                  <AnimatePresence>
                    {active && (
                      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        style={{ position: "absolute", top: 12, right: 12, width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={11} color="white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          {/* ── Progress + CTA ──────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.45 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>

            {/* Selection counter */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Progress dots */}
              <div style={{ display: "flex", gap: 6 }}>
                {Array.from({ length: MIN_SELECT }).map((_, i) => (
                  <motion.div key={i}
                    animate={{ background: selected.length > i ? N : "#E4E9F2", width: selected.length > i ? 24 : 8 }}
                    transition={{ duration: 0.3 }}
                    style={{ height: 6, borderRadius: 99 }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: M }}>
                {selected.length} selected
              </span>
            </div>

            {/* Status message */}
            <AnimatePresence mode="wait">
              <motion.p key={remaining} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                style={{ fontSize: 13, fontWeight: 600, color: ready ? "#059669" : M, margin: 0, textAlign: "center" }}>
                {ready
                  ? `Great picks! You can add ${8 - selected.length} more or continue.`
                  : `Select ${remaining} more to continue`}
              </motion.p>
            </AnimatePresence>

            {/* CTA button */}
            <motion.button
              whileHover={ready && !loading ? { scale: 1.02, boxShadow: "0 16px 48px rgba(10,22,40,0.24)" } : {}}
              whileTap={ready && !loading ? { scale: 0.98 } : {}}
              onClick={handleComplete}
              disabled={!ready || loading}
              style={{
                minWidth: 280, padding: "15px 32px",
                borderRadius: 14, border: "none", cursor: ready && !loading ? "pointer" : "not-allowed",
                background: ready ? N : "#E4E9F2",
                color: ready ? "white" : M,
                fontSize: 14, fontWeight: 800, fontFamily: "DM Sans, sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: ready ? "0 8px 28px rgba(10,22,40,0.18)" : "none",
                transition: "background .22s, color .22s, box-shadow .22s",
              }}>
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin .65s linear infinite" }} />
                  Curating your feed…
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Curate My Feed
                  <ChevronRight size={15} style={{ marginLeft: -2 }} />
                </>
              )}
            </motion.button>

            {/* Selected chips */}
            <AnimatePresence>
              {selected.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", maxWidth: 480 }}>
                  {selected.map(id => {
                    const cat = CATEGORIES.find(c => c.id === id)!;
                    return (
                      <motion.button key={id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => toggle(id)}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 8px", borderRadius: 20, background: "white", border: B, cursor: "pointer", fontSize: 11, fontWeight: 700, color: N }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "#DC2626")} onMouseLeave={e => (e.currentTarget.style.borderColor = "#E4E9F2")}>
                        <cat.icon size={11} color={cat.accent} />
                        {cat.label}
                        <X size={9} color={M} />
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <p style={{ fontSize: 11, color: "#C4CDD8", marginTop: 4 }}>
              You can update your interests any time in settings.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}

// small inline X icon
function X({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}