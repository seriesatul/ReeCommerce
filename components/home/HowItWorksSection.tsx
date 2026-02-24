"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Search, Play, ShoppingBag, CheckCircle } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    step: "01",
    title: "Discover",
    desc: "Browse curated reels from verified sellers across every category you care about.",
  },
  {
    icon: Play,
    step: "02",
    title: "Visualize",
    desc: "Watch vertical video. See exactly how products move, drape, and exist in the real world.",
  },
  {
    icon: CheckCircle,
    step: "03",
    title: "Decide",
    desc: "No guesswork. No returns. Total confidence before you spend a single rupee.",
  },
  {
    icon: ShoppingBag,
    step: "04",
    title: "Buy",
    desc: "One tap to cart. From reel to real — in seconds.",
  },
];

export default function HowItWorksSection() {
  const ref     = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-72px" });

  return (
    <section
      ref={ref}
      className="py-24 bg-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.4 }}
              className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3"
              style={{ color: "#9BA8C0" }}
            >
              The Process
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                color: "#0A1628",
                letterSpacing: "-0.025em",
                lineHeight: 1,
              }}
            >
              How{" "}
              <em className="italic font-light" style={{ opacity: 0.4 }}>
                it works
              </em>
            </motion.h2>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.22 }}
            className="max-w-xs text-sm leading-relaxed md:text-right"
            style={{ color: "#9BA8C0" }}
          >
            Four steps from curiosity to confident ownership.
          </motion.p>
        </div>

        {/* ── STEPS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px"
          style={{ background: "#E4E9F2", border: "1px solid #E4E9F2", borderRadius: 24, overflow: "hidden" }}
        >
          {STEPS.map(({ icon: Icon, step, title, desc }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 32 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group relative bg-white p-8 xl:p-10 flex flex-col gap-8
                         hover:bg-[#F4F6FB] transition-colors duration-200 cursor-default"
            >
              {/* Step number — top right, ghosted */}
              <span
                className="absolute top-6 right-7 font-black select-none"
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "clamp(2.8rem, 4vw, 3.8rem)",
                  color: "#E4E9F2",
                  lineHeight: 1,
                  transition: "color 0.2s",
                }}
              >
                {step}
              </span>

              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                           transition-all duration-200 group-hover:scale-105"
                style={{
                  background: "#F4F6FB",
                  border: "1px solid #E4E9F2",
                }}
              >
                <Icon
                  className="w-5 h-5 transition-colors duration-200"
                  style={{ color: "#0A1628" }}
                />
              </div>

              {/* Text */}
              <div className="space-y-2.5">
                <h3
                  className="font-bold text-lg leading-tight"
                  style={{ color: "#0A1628" }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#9BA8C0" }}
                >
                  {desc}
                </p>
              </div>

              {/* Bottom connector dot — desktop */}
              {i < STEPS.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: 1 } : {}}
                  transition={{ delay: 0.5 + i * 0.12, duration: 0.5, ease: "easeOut" }}
                  className="hidden lg:block absolute top-[52px] -right-[1px] w-2 h-2 rounded-full z-10"
                  style={{ background: "#E4E9F2", transform: "translateX(50%)" }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* ── BOTTOM RULE ── */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
          className="mt-16 h-px origin-left"
          style={{ background: "linear-gradient(to right, #E4E9F2, transparent)" }}
        />
      </div>
    </section>
  );
}