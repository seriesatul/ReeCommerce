"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Mail, Sparkles } from "lucide-react";

export default function CTASection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const handleSubmit = () => {
    if (email.includes("@")) {
      setSubmitted(true);
    }
  };

  return (
    <section ref={ref} className="py-24 bg-[#070A0F] relative overflow-hidden">
      {/* Giant background text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span
          className="text-[20vw] font-black text-white/[0.015] select-none whitespace-nowrap"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          RECOMMERCE
        </span>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-bold tracking-wide">Early Access + 10% Off</span>
            </div>
            <h2
              className="text-4xl md:text-6xl font-black text-white leading-[0.95] mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Start Your{" "}
              <em className="italic font-light text-emerald-400">Visual</em>
              <br />
              Shopping Journey
            </h2>
            <p className="text-white/50 text-lg leading-relaxed max-w-md">
              Join 50,000+ shoppers who've discovered the smarter way to buy.
              Get exclusive reels, early deals, and curated picks — delivered weekly.
            </p>
          </motion.div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#0F1520] border border-white/[0.06] rounded-[32px] p-10"
          >
            {!submitted ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Stay in the Loop</p>
                    <p className="text-white/40 text-xs">No spam. Unsubscribe anytime.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 text-white placeholder:text-white/20 outline-none focus:border-emerald-500/40 transition-colors text-base"
                  />
                  <button
                    onClick={handleSubmit}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_24px_rgba(74,222,128,0.3)]"
                  >
                    Get Early Access <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-8 mt-8 pt-8 border-t border-white/[0.06]">
                  {[["50K+", "Members"], ["4.9★", "Rating"], ["10%", "First Order"]].map(([val, label]) => (
                    <div key={label}>
                      <p className="text-white font-black text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>{val}</p>
                      <p className="text-white/40 text-xs mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="flex flex-col items-center text-center py-8"
              >
                <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="w-9 h-9 text-emerald-400" />
                </div>
                <h3
                  className="text-3xl font-black text-white mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  You're In! 🎉
                </h3>
                <p className="text-white/50">
                  Welcome to the future of shopping. Check your email for your 10% discount code.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}