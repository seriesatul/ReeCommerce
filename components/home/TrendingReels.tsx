"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, ArrowUpRight, Eye, Heart, Play, Plus, Volume2, VolumeX } from "lucide-react";
import { IReel } from "@/app/page";

interface TrendingReelsProps {
  reels: IReel[];
  onOpenReel: (id: string) => void;
}

const BADGE_LABELS = ["Trending", "New Drop", "Top Rated", "Premium"];

function VideoCard({ reel, i, onOpen }: { reel: IReel; i: number; onOpen: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);

  const optimizedUrl = reel.videoUrl.replace("/upload/", "/upload/f_auto,q_auto:best,w_720/");

  const handleMouseEnter = () => {
    videoRef.current?.play().catch(() => {});
    setIsPlaying(true);
  };
  const handleMouseLeave = () => {
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
    setIsPlaying(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── VIDEO CARD ── */}
      <div
        className="relative w-full overflow-hidden cursor-pointer mb-4"
        style={{
          aspectRatio: "3/4",
          borderRadius: 20,
          background: "#F4F6FB",
          boxShadow: "0 2px 12px rgba(10,22,40,0.06)",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onOpen}
      >
        {/* Badge */}
        <div className="absolute top-3 left-3 z-30">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(12px)",
              color: i === 0 ? "#1A3A6B" : "#0A1628",
              border: "1px solid rgba(10,22,40,0.08)",
            }}
          >
            {BADGE_LABELS[i % BADGE_LABELS.length]}
          </span>
        </div>

        {/* Mute toggle */}
        <AnimPresence show={isPlaying}>
          <button
            onClick={e => {
              e.stopPropagation();
              if (videoRef.current) videoRef.current.muted = !muted;
              setMuted(v => !v);
            }}
            className="absolute top-3 right-3 z-30 w-7 h-7 flex items-center justify-center rounded-full transition-transform hover:scale-110"
            style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(10,22,40,0.08)",
            }}
          >
            {muted
              ? <VolumeX className="w-3 h-3" style={{ color: "#0A1628" }} />
              : <Volume2 className="w-3 h-3" style={{ color: "#0A1628" }} />
            }
          </button>
        </AnimPresence>

        {/* Thumbnail */}
        {reel.thumbnailUrl && (
          <img
            src={reel.thumbnailUrl}
            alt={reel.productId?.name || "Reel"}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03] z-0"
          />
        )}

        {/* Video */}
        <video
          ref={videoRef}
          src={optimizedUrl}
          muted={muted}
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-500"
          style={{ opacity: isPlaying ? 1 : 0 }}
        />

        {/* Bottom gradient */}
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(10,22,40,0.72) 0%, transparent 55%)" }}
        />

        {/* Price + views */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
          <div className="flex items-center justify-between">
            <span className="text-white font-black text-lg leading-none" style={{ fontFamily: "'Instrument Serif', serif" }}>
              ₹{reel.productId?.price?.toLocaleString() || "143.65"}
            </span>
            <span className="flex items-center gap-1 text-white/60 text-[11px] font-medium">
              <Eye className="w-3 h-3" />
              {(reel.metrics?.views || 12400).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Like */}
        <button
          onClick={e => { e.stopPropagation(); setLiked(v => !v); }}
          className="absolute bottom-[52px] right-3 z-30 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
          style={{
            background: liked ? "#fff" : "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <Heart
            className="w-3.5 h-3.5 transition-colors"
            style={{ color: liked ? "#e11d48" : "white", fill: liked ? "#e11d48" : "transparent" }}
          />
        </button>

        {/* Center play hint on hover */}
        <div
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none transition-all duration-300"
          style={{ opacity: isPlaying ? 0 : undefined }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            <Play className="w-3.5 h-3.5 text-white fill-white" />
            <span className="text-white text-xs font-semibold">Preview</span>
          </div>
        </div>
      </div>

      {/* ── CARD FOOTER ── */}
      <div className="flex items-start justify-between gap-3 px-0.5">
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-sm leading-snug line-clamp-1 mb-0.5"
            style={{ color: "#0A1628" }}
          >
            {reel.productId?.name || "Premium Product"}
          </h3>
          <p className="text-[11px] font-medium" style={{ color: "#9BA8C0" }}>
            Verified Seller
          </p>
        </div>
        <button
          onClick={e => e.stopPropagation()}
          className="flex-shrink-0 flex items-center gap-1 px-3.5 py-2 rounded-full text-[11px] font-bold transition-all duration-150 hover:scale-[1.04] active:scale-[0.96]"
          style={{
            background: "#0A1628",
            color: "white",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#1A3A6B")}
          onMouseLeave={e => (e.currentTarget.style.background = "#0A1628")}
        >
          <Plus className="w-3 h-3" /> Cart
        </button>
      </div>
    </motion.div>
  );
}

// tiny helper — avoids framer-motion overhead for a simple conditional
function AnimPresence({ show, children }: { show: boolean; children: React.ReactNode }) {
  return show ? <>{children}</> : null;
}

export default function TrendingReels({ reels, onOpenReel }: TrendingReelsProps) {
  const headerRef = useRef(null);
  const isInView   = useInView(headerRef, { once: true, margin: "-60px" });

  return (
    <section className="py-20 bg-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">

        {/* ── HEADER ── */}
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4"
        >
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.4 }}
              className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2"
              style={{ color: "#9BA8C0" }}
            >
              Curated for you
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="leading-tight"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                color: "#0A1628",
                letterSpacing: "-0.02em",
              }}
            >
              Trending <em className="italic font-light" style={{ color: "#1A3A6B" }}>Reels</em>
            </motion.h2>
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.25 }}
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold transition-colors group"
            style={{ color: "#6B7A99" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#0A1628")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6B7A99")}
          >
            View all reels
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        </div>

        {/* ── GRID ── */}
        {reels.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {reels.slice(0, 4).map((reel, i) => (
              <VideoCard key={reel._id} reel={reel} i={i} onOpen={() => onOpenReel(reel._id)} />
            ))}
          </div>
        ) : (
          /* skeleton */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div
                  className="w-full animate-pulse rounded-[20px]"
                  style={{ aspectRatio: "3/4", background: "#F4F6FB" }}
                />
                <div className="h-4 rounded-full animate-pulse" style={{ background: "#F4F6FB", width: "70%" }} />
                <div className="h-3 rounded-full animate-pulse" style={{ background: "#F4F6FB", width: "40%" }} />
              </div>
            ))}
          </div>
        )}

        {/* ── MOBILE "VIEW ALL" ── */}
        <div className="mt-8 flex justify-center sm:hidden">
          <button
            className="flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-full border transition-all"
            style={{ color: "#0A1628", borderColor: "#E4E9F2" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "#F4F6FB";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#CBD3E8";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#E4E9F2";
            }}
          >
            View all reels <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}