"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, ChevronRight,
  Smartphone, Shirt, Bike, Heart,
  Home, Gamepad2, Utensils, BookOpen,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────
const N = "#0A1628";
const M = "#9BA8C0";
const B = "1px solid #E4E9F2";
const S = "#F7F8FC";

// ─── Exact categories from onboarding/buyer/page.tsx ─────────────
const CATEGORIES = [
  {
    id: "tech",
    label: "Electronics",
    sub: "Gadgets & gear",
    icon: Smartphone,
    accent: "#2563EB",
    image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?q=80&w=600&auto=format&fit=crop",
    tag: "Most Popular",
  },
  {
    id: "fashion",
    label: "Fashion",
    sub: "Style & apparel",
    icon: Shirt,
    accent: "#DB2777",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=600&auto=format&fit=crop",
    tag: "Trending",
  },
  {
    id: "fitness",
    label: "Fitness",
    sub: "Health & sports",
    icon: Bike,
    accent: "#D97706",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&auto=format&fit=crop",
    tag: null as string | null,
  },
  {
    id: "beauty",
    label: "Beauty",
    sub: "Skincare & makeup",
    icon: Heart,
    accent: "#DC2626",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600&auto=format&fit=crop",
    tag: null as string | null,
  },
  {
    id: "home",
    label: "Home",
    sub: "Decor & living",
    icon: Home,
    accent: "#059669",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=600&auto=format&fit=crop",
    tag: null as string | null,
  },
  {
    id: "gaming",
    label: "Gaming",
    sub: "Games & setup",
    icon: Gamepad2,
    accent: "#7C3AED",
    image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=600&auto=format&fit=crop",
    tag: "New",
  },
  {
    id: "food",
    label: "Food",
    sub: "Gourmet & kitchen",
    icon: Utensils,
    accent: "#EA580C",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop",
    tag: null as string | null,
  },
  {
    id: "books",
    label: "Books",
    sub: "Reads & learning",
    icon: BookOpen,
    accent: "#0E7490",
    image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=600&auto=format&fit=crop",
    tag: null as string | null,
  },
];

export default function CategoriesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&display=swap');
        .cat-card img { transition: transform 0.7s cubic-bezier(0.16,1,0.3,1); }
        .cat-card:hover img { transform: scale(1.1); }
        .cat-explore { opacity: 0; transform: translateY(6px); transition: all 0.25s ease; }
        .cat-card:hover .cat-explore { opacity: 1; transform: translateY(0); }
        .cat-shine::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 60%);
          border-radius: inherit;
          pointer-events: none;
        }
        @media (max-width: 1024px) {
          .cat-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .cat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <section
        ref={ref}
        style={{ padding: "96px 0", background: S, fontFamily: "'DM Sans', sans-serif" }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>

          {/* ── Header ──────────────────────────────────────────── */}
          <div style={{
            display: "flex", alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 48, flexWrap: "wrap", gap: 20,
          }}>
            <div>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5 }}
                style={{
                  fontSize: 10, fontWeight: 800,
                  textTransform: "uppercase", letterSpacing: "0.22em",
                  color: "#059669", margin: "0 0 12px",
                }}
              >
                Explore by Category
              </motion.p>

              <motion.h2
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "clamp(32px, 4vw, 52px)",
                  color: N, margin: 0,
                  letterSpacing: "-0.025em", lineHeight: 1.1,
                }}
              >
                Shop by{" "}
                <em style={{ fontStyle: "italic", color: M }}>Category</em>
              </motion.h2>
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 }}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "11px 20px", borderRadius: 12,
                border: B, background: "white", color: N,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 1px 4px rgba(10,22,40,0.05)",
              }}
            >
              Browse All <ArrowRight size={14} />
            </motion.button>
          </div>

          {/* ── Stats strip ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.15, duration: 0.4 }}
            style={{ display: "flex", gap: 6, marginBottom: 28, flexWrap: "wrap" }}
          >
            {["8 Categories", "10.1K+ Reels", "Live Products", "New drops daily"].map((label) => (
              <div
                key={label}
                style={{
                  padding: "5px 13px", borderRadius: 99,
                  background: "white", border: B,
                  fontSize: 11, fontWeight: 700, color: M,
                }}
              >
                {label}
              </div>
            ))}
          </motion.div>

          {/* ── 4×2 Category Grid ────────────────────────────────── */}
          <div
            className="cat-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
            }}
          >
            {CATEGORIES.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.id}
                  className="cat-card cat-shine"
                  initial={{ opacity: 0, y: 36, scale: 0.96 }}
                  animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ duration: 0.55, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -6 }}
                  style={{
                    position: "relative",
                    borderRadius: 20,
                    overflow: "hidden",
                    cursor: "pointer",
                    aspectRatio: "3/4",
                    border: "1.5px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 4px 20px rgba(10,22,40,0.10)",
                  }}
                >
                  {/* BG image */}
                  <img
                    src={cat.image}
                    alt={cat.label}
                    style={{
                      position: "absolute", inset: 0,
                      width: "100%", height: "100%",
                      objectFit: "cover",
                    }}
                  />

                  {/* Navy gradient overlay */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: `linear-gradient(to top, ${N}F0 0%, ${N}88 40%, transparent 100%)`,
                  }} />

                  {/* Accent colour bloom */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: `radial-gradient(circle at 50% 90%, ${cat.accent}88, transparent 65%)`,
                    opacity: 0.55,
                  }} />

                  {/* Tag badge */}
                  {cat.tag && (
                    <div style={{
                      position: "absolute", top: 12, right: 12,
                      padding: "3px 9px", borderRadius: 99,
                      background: "rgba(255,255,255,0.12)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      fontSize: 9, fontWeight: 800,
                      color: "white",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}>
                      {cat.tag}
                    </div>
                  )}

                  {/* Content */}
                  <div style={{
                    position: "absolute", inset: 0, padding: "16px",
                    display: "flex", flexDirection: "column",
                    justifyContent: "space-between",
                  }}>
                    {/* Icon in frosted glass */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: "rgba(255,255,255,0.12)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={18} color="white" />
                    </div>

                    {/* Bottom text */}
                    <div>
                      <p style={{
                        fontSize: 9, fontWeight: 700,
                        color: "rgba(255,255,255,0.5)",
                        margin: "0 0 4px",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}>
                        {cat.sub}
                      </p>
                      <h3 style={{
                        fontFamily: "'Instrument Serif', serif",
                        fontSize: 17, fontWeight: 400,
                        color: "white", margin: "0 0 10px",
                        lineHeight: 1.2, letterSpacing: "-0.01em",
                      }}>
                        {cat.label}
                      </h3>

                      <div
                        className="cat-explore"
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          fontSize: 11, fontWeight: 800, color: "#4ADE80",
                        }}
                      >
                        Explore <ChevronRight size={12} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Bottom CTA strip ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{
              marginTop: 28, padding: "22px 28px", borderRadius: 18,
              background: N, display: "flex", alignItems: "center",
              justifyContent: "space-between", flexWrap: "wrap", gap: 16,
              position: "relative", overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "18px 18px", pointerEvents: "none",
            }} />

            <div style={{ position: "relative" }}>
              <p style={{
                fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)",
                margin: "0 0 4px",
              }}>
                Can&apos;t find your category?
              </p>
              <p style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: 20, color: "white", margin: 0,
                letterSpacing: "-0.015em",
              }}>
                More categories arriving every week
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 22px", borderRadius: 12,
                background: "white", border: "none",
                color: N, fontSize: 13, fontWeight: 800,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                position: "relative",
                boxShadow: "0 4px 16px rgba(255,255,255,0.15)",
              }}
            >
              Browse All Categories <ArrowRight size={14} />
            </motion.button>
          </motion.div>

        </div>
      </section>
    </>
  );
}