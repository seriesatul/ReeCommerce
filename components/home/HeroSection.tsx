"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Play, Pause } from "lucide-react";
import { useRef, useState } from "react";

export default function HeroSection({ reels, onOpenReel }: any) {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const textY  = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "9%"]);

  const toggleVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (paused) { videoRef.current.play();  setPaused(false); }
    else        { videoRef.current.pause(); setPaused(true);  }
  };

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{ minHeight: "92vh", background: "#FAFAFA" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] min-h-[92vh]">

        {/* ══ LEFT — TEXT ══════════════════════════════════════ */}
        <motion.div
          style={{ y: textY }}
          className="relative z-10 flex flex-col justify-center gap-9
                     px-7 sm:px-12 md:px-16 xl:px-20
                     pt-24 pb-14 lg:pt-0 lg:pb-0"
        >
          {/* Headline */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: "clamp(3.2rem, 5.8vw, 6.2rem)",
                color: "#0A1628",
                lineHeight: 0.92,
                letterSpacing: "-0.025em",
              }}
            >
              See it move.
              <br />
              <em
                className="italic font-light"
                style={{ color: "#0A1628", opacity: 0.38 }}
              >
                Then buy it.
              </em>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28 }}
              style={{
                color: "#6B7A99",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 400,
                fontSize: "clamp(0.88rem, 1.25vw, 1rem)",
                lineHeight: 1.7,
                maxWidth: 370,
              }}
            >
              Recommerce replaces guesswork with cinematic product reels —
              so you know exactly what you're getting before it arrives at your door.
            </motion.p>
          </div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42 }}
            className="flex flex-wrap items-center gap-4"
          >
            <button
              onClick={() => reels?.[0] && onOpenReel(reels[0]._id)}
              className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full
                         text-sm font-semibold text-white
                         transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: "#0A1628",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 6px 28px rgba(10,22,40,0.16)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#1c2e4a")}
              onMouseLeave={e => (e.currentTarget.style.background = "#0A1628")}
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Watch Reels
              <ArrowUpRight
                className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100
                           group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
              />
            </button>

            <button
              className="flex items-center gap-1.5 text-sm font-semibold
                         transition-all duration-150 underline-offset-4 hover:underline"
              style={{ color: "#9BA8C0", fontFamily: "'DM Sans', sans-serif" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#0A1628")}
              onMouseLeave={e => (e.currentTarget.style.color = "#9BA8C0")}
            >
              Browse all products
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          {/* Live reel count — real data, not fake stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.58 }}
            className="flex items-center gap-3"
          >
            <div className="h-px w-10" style={{ background: "#E4E9F2" }} />
            <p
              style={{
                color: "#9BA8C0",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.68rem",
                letterSpacing: "0.07em",
                fontWeight: 500,
              }}
            >
              {reels?.length > 0
                ? `${reels.length} reel${reels.length !== 1 ? "s" : ""} live now`
                : "Reels loading…"}
            </p>
          </motion.div>
        </motion.div>

        {/* ══ RIGHT — VIDEO ════════════════════════════════════ */}
        <div className="relative overflow-hidden min-h-[52vh] lg:min-h-0">

          {/* Video */}
          <motion.div
            className="absolute inset-0"
            style={{ y: videoY, scale: 1.06 }}
          >
            {/*
            ─────────────────────────────────────────────────────────────
            VIDEO RECOMMENDATION FOR AN AWARD-WINNING HERO:

            The ideal video is a slow, 4–6 second looping lifestyle clip showing:
              • A person unboxing / holding / wearing a product in a bright, minimal space
              • Hands touching fabric, ceramic, or tech — close-up, warm light
              • A model doing a slow 180° turn in a clean studio or daylit room

            Best free sources (download .mp4, host on your CDN or /public):
              ① Coverr.co         → search "fashion walk" or "shopping bags"
              ② Pexels.com/videos → search "model studio" or "product lifestyle"
              ③ Mixkit.co         → "clothing" or "minimal lifestyle"

            The source below is a working placeholder — replace with your own:
            ─────────────────────────────────────────────────────────────
            */}
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              poster="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
            >
              <source
                src="https://cdn.coverr.co/videos/coverr-a-woman-styling-herself-in-front-of-the-mirror-2153/1080p.mp4"
                type="video/mp4"
              />
            </video>

            {/* Left fade — merges video into text side */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to right, #FAFAFA 0%, rgba(250,250,250,0.55) 14%, transparent 32%)",
              }}
            />
            {/* Bottom fade */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(to top, #FAFAFA 0%, transparent 18%)",
              }}
            />
            {/* Subtle overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "rgba(10,22,40,0.06)" }}
            />
          </motion.div>

          {/* ── Pause / play button (bottom-right) ── */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            onClick={toggleVideo}
            className="absolute bottom-6 right-6 z-20 w-9 h-9 rounded-full
                       flex items-center justify-center transition-all
                       hover:scale-110 active:scale-95"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.95)",
              boxShadow: "0 4px 16px rgba(10,22,40,0.10)",
            }}
            title={paused ? "Resume" : "Pause"}
          >
            {paused
              ? <Play  className="w-3.5 h-3.5 fill-[#0A1628] text-[#0A1628] ml-0.5" />
              : <Pause className="w-3.5 h-3.5 fill-[#0A1628] text-[#0A1628]" />
            }
          </motion.button>

          {/* ── Featured reel card (bottom-left) ── */}
          {reels?.[0] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.72, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-6 left-6 z-20 cursor-pointer group"
              style={{ maxWidth: 252 }}
              onClick={() => onOpenReel(reels[0]._id)}
            >
              <div
                className="rounded-2xl p-4 flex items-center gap-3.5
                           transition-transform duration-200 group-hover:scale-[1.025]"
                style={{
                  background: "rgba(255,255,255,0.88)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.96)",
                  boxShadow: "0 12px 40px rgba(10,22,40,0.13)",
                }}
              >
                {/* Thumbnail */}
                <div
                  className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0"
                  style={{ background: "#F4F6FB" }}
                >
                  {reels[0].thumbnailUrl && (
                    <img
                      src={reels[0].thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                  className="min-w-0 flex-1"
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "#9BA8C0" }}
                  >
                    Featured Reel
                  </p>
                  <p
                    className="text-sm font-bold mt-0.5 truncate"
                    style={{ color: "#0A1628" }}
                  >
                    {reels[0].productId?.name || "Featured Product"}
                  </p>
                  <p
                    className="text-xs font-semibold mt-0.5"
                    style={{ color: "#6B7A99" }}
                  >
                    {reels[0].productId?.price
                      ? `₹${reels[0].productId.price.toLocaleString()}`
                      : "Tap to watch →"}
                  </p>
                </div>

                {/* Play dot */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#0A1628" }}
                >
                  <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

      </div>
    </section>
  );
}