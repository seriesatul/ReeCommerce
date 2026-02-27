"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Store, ShoppingBag, ArrowLeft, Sparkles,
  Play, TrendingUp, Zap, Shield, ChevronRight,
  Video, IndianRupee, Users,
} from "lucide-react";
import { motion } from "framer-motion";

// ─── Design tokens (matching dashboard) ────────────────────────────────────────
const N = "#0A1628";
const M = "#9BA8C0";
const B = "1px solid #E4E9F2";

// ─── Stat bubbles data ──────────────────────────────────────────────────────────
const STATS = [
  { icon: IndianRupee, value: "₹2.4Cr",  label: "GMV this month",  color: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
  { icon: Users,       value: "12,400+",  label: "Active buyers",   color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  { icon: Video,       value: "38K",       label: "Reels published", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
];

const FEATURES = [
  { icon: Play,        text: "Shoppable reels with product hotspots"  },
  { icon: Zap,         text: "Go live in under 10 minutes"            },
  { icon: TrendingUp,  text: "Real-time analytics dashboard"          },
  { icon: Shield,      text: "Razorpay-secured weekly payouts"        },
];

// ─── Mini reel card mock ────────────────────────────────────────────────────────
function ReelCard({ delay, title, price, top, left, rotate }: {
  delay: number; title: string; price: string;
  top: string; left: string; rotate: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "absolute", top, left,
        width: 120, borderRadius: 16, overflow: "hidden",
        boxShadow: "0 20px 48px rgba(0,0,0,0.35)",
        border: "1.5px solid rgba(255,255,255,0.12)",
      }}
    >
      {/* Video area */}
      <div style={{ height: 160, background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <Play size={14} color="white" style={{ marginLeft: 2 }} />
        </div>
        {/* Hotspot dot */}
        <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 2 }}
          style={{ position: "absolute", top: "35%", right: "20%", width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={7} color="white" />
        </motion.div>
      </div>
      {/* Product tag */}
      <div style={{ padding: "8px 10px", background: "rgba(10,22,40,0.88)", backdropFilter: "blur(8px)" }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.65)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
        <p style={{ fontSize: 12, fontWeight: 900, color: "white", margin: 0, fontFamily: "Instrument Serif, serif" }}>{price}</p>
      </div>
    </motion.div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function SellerRegisterPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({ name: "", description: "" });
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const [focused, setFocused]   = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/seller/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register store");

      await update({ ...session, user: { ...session?.user, role: "seller" } });
      router.push("/seller/upload");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", fontFamily: "DM Sans, sans-serif" }}>

        {/* ══ LEFT PANEL — Brand statement ══════════════════════════ */}
        <div style={{ width: "52%", background: N, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", padding: "48px 56px" }}
          className="hidden lg:flex">

          {/* Dot grid texture */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

          {/* Diagonal accent */}
          <div style={{ position: "absolute", top: -120, right: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: -80, left: -60, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />

          {/* Logo / back */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={16} color="white" />
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>Recommerce</span>
            </div>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color .15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>
              <ArrowLeft size={13} /> Back to market
            </Link>
          </motion.div>

          {/* Main copy */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 2 }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", marginBottom: 24 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 8px #4ADE80" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.1em" }}>New sellers open</span>
              </div>

              <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: "clamp(2.4rem, 4vw, 3.4rem)", color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 18px" }}>
                Turn your reels<br />
                <em style={{ fontStyle: "italic", fontWeight: 300, opacity: 0.55 }}>into revenue.</em>
              </h1>

              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: "0 0 36px", maxWidth: 380 }}>
                Upload a short video, tag your products, and start selling to thousands of buyers scrolling your feed — in under 10 minutes.
              </p>

              {/* Feature list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 44 }}>
                {FEATURES.map(({ icon: Icon, text }, i) => (
                  <motion.div key={text} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07, duration: 0.5 }}
                    style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={13} color="rgba(255,255,255,0.7)" />
                    </div>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Stat chips */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {STATS.map(({ icon: Icon, value, label, color, bg, border }, i) => (
                  <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 + i * 0.08 }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ width: 24, height: 24, borderRadius: 7, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={11} color={color} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "white", margin: 0, lineHeight: 1 }}>{value}</p>
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Floating reel cards */}
          <div style={{ position: "absolute", right: -10, top: "15%", bottom: "10%", width: 200, pointerEvents: "none", zIndex: 2 }}>
            <ReelCard delay={0.6}  title="AirPods Pro"       price="₹18,999" top="8%"  left="20px" rotate={-4} />
            <ReelCard delay={0.75} title="Silk Kurta Set"     price="₹3,499"  top="38%" left="40px" rotate={3} />
            <ReelCard delay={0.9}  title="Desk Setup Bundle"  price="₹12,200" top="66%" left="10px" rotate={-2} />
          </div>

          {/* Bottom avatar row */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex" }}>
              {["#F59E0B","#3B82F6","#EC4899","#10B981"].map((c, i) => (
                <div key={i} style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: "2px solid #0A1628", marginLeft: i > 0 ? -8 : 0 }} />
              ))}
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0 }}>
              <strong style={{ color: "rgba(255,255,255,0.75)" }}>2,100+ sellers</strong> already on Recommerce
            </p>
          </motion.div>
        </div>

        {/* ══ RIGHT PANEL — Registration form ══════════════════════ */}
        <div style={{ flex: 1, background: "#F7F8FC", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px", position: "relative", overflow: "hidden" }}>

          {/* Subtle background pattern */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.018, backgroundImage: "radial-gradient(circle, #0A1628 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

          {/* Mobile back link */}
          <Link href="/" className="lg:hidden"
            style={{ position: "absolute", top: 24, left: 24, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: M, textDecoration: "none" }}>
            <ArrowLeft size={14} /> Back
          </Link>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>

            {/* Mobile brand header */}
            <div className="lg:hidden" style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: N, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <Zap size={22} color="white" />
              </div>
              <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: 28, color: N, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Launch Your Shop</h2>
              <p style={{ fontSize: 14, color: M, margin: 0 }}>Start selling with shoppable reels</p>
            </div>

            {/* Heading — desktop */}
            <div className="hidden lg:block" style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: M, marginBottom: 10 }}>Step 1 of 1</p>
              <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: "clamp(1.8rem, 3vw, 2.4rem)", color: N, letterSpacing: "-0.03em", margin: "0 0 8px", lineHeight: 1.1 }}>
                Create your<br />
                <em style={{ fontStyle: "italic", fontWeight: 300, opacity: 0.45 }}>seller account.</em>
              </h2>
              <p style={{ fontSize: 14, color: M, margin: 0, lineHeight: 1.65 }}>
                Your store name and bio are shown on your public profile and discovery feed.
              </p>
            </div>

            {/* Form card */}
            <div style={{ background: "white", borderRadius: 22, border: B, boxShadow: "0 4px 32px rgba(10,22,40,0.07)", padding: "32px 28px" }}>

              {/* Error */}
              {error && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 12, marginBottom: 20 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#DC2626", flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: "#DC2626", fontWeight: 600, margin: 0 }}>{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Store name */}
                <div>
                  <label style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: M, display: "block", marginBottom: 7 }}>
                    Shop Name <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <Store size={15} color={focused === "name" ? N : M} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", transition: "color .15s", pointerEvents: "none" }} />
                    <input
                      type="text" required
                      placeholder="e.g. Urban Threads, Glow Studio…"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      onFocus={() => setFocused("name")}
                      onBlur={() => setFocused(null)}
                      style={{
                        width: "100%", padding: "13px 14px 13px 40px",
                        borderRadius: 12, fontSize: 14, fontFamily: "DM Sans, sans-serif",
                        color: N, outline: "none", boxSizing: "border-box",
                        border: focused === "name" ? `2px solid ${N}` : "2px solid #E4E9F2",
                        background: focused === "name" ? "white" : "#FAFAFA",
                        transition: "border-color .15s, background .15s",
                      }}
                    />
                  </div>
                  {formData.name.length > 0 && formData.name.length < 3 && (
                    <p style={{ fontSize: 10, color: "#D97706", marginTop: 5, fontWeight: 600 }}>Min 3 characters</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                    <label style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: M }}>
                      Store Bio <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <span style={{ fontSize: 9, fontWeight: 700, color: formData.description.length > 260 ? "#DC2626" : M }}>{formData.description.length}/280</span>
                  </div>
                  <textarea
                    required rows={4} maxLength={280}
                    placeholder="What makes your shop unique? Tell buyers about your brand, what you sell, your style…"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    onFocus={() => setFocused("desc")}
                    onBlur={() => setFocused(null)}
                    style={{
                      width: "100%", padding: "13px 14px", resize: "none",
                      borderRadius: 12, fontSize: 14, lineHeight: 1.6,
                      fontFamily: "DM Sans, sans-serif", color: N, outline: "none",
                      boxSizing: "border-box",
                      border: focused === "desc" ? `2px solid ${N}` : "2px solid #E4E9F2",
                      background: focused === "desc" ? "white" : "#FAFAFA",
                      transition: "border-color .15s, background .15s",
                    }}
                  />
                </div>

                {/* Preview chip */}
                {(formData.name || formData.description) && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    style={{ padding: "12px 14px", background: "#F7F8FC", border: B, borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: N, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Store size={16} color="white" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: N, margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {formData.name || "Your Store Name"}
                      </p>
                      <p style={{ fontSize: 11, color: M, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {formData.description || "Your bio here"}
                      </p>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: "#F0FDF4", color: "#059669", border: "1px solid #BBF7D0", flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Preview</span>
                  </motion.div>
                )}

                {/* Submit */}
                <button type="submit" disabled={loading}
                  style={{
                    padding: "15px 24px", borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer",
                    background: loading ? "#6B7A99" : N, color: "white",
                    fontSize: 14, fontWeight: 800, fontFamily: "DM Sans, sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    boxShadow: loading ? "none" : "0 8px 28px rgba(10,22,40,0.2)",
                    transition: "background .2s, box-shadow .2s, transform .1s",
                    width: "100%",
                  }}
                  onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 36px rgba(10,22,40,0.26)"; } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = loading ? "none" : "0 8px 28px rgba(10,22,40,0.2)"; }}>
                  {loading ? (
                    <>
                      <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin .65s linear infinite" }} />
                      Deploying storefront…
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      Launch My Store
                      <ChevronRight size={15} style={{ marginLeft: -2 }} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 24 }}>
              {[
                { top: "Secured by", bot: "Razorpay" },
                { top: "Powered by", bot: "Cloudinary" },
                { top: "Protected by", bot: "NextAuth" },
              ].map(({ top, bot }) => (
                <div key={bot} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "#C4CDD8", margin: "0 0 1px" }}>{top}</p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: M, margin: 0 }}>{bot}</p>
                </div>
              ))}
            </div>

            <p style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "#C4CDD8" }}>
              By continuing you agree to our{" "}
              <Link href="#" style={{ color: M, textDecoration: "underline", textDecorationColor: "#E4E9F2" }}>Seller Terms</Link>
              {" "}and{" "}
              <Link href="#" style={{ color: M, textDecoration: "underline", textDecorationColor: "#E4E9F2" }}>Privacy Policy</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}