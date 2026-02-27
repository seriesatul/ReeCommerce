"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Heart, MessageCircle, Share2, Volume2, VolumeX,
  Store as StoreIcon, UserCheck, ShoppingBag, ArrowUpRight,
  Pause, ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────
interface IHotspot {
  x: number; y: number;
  startTime: number; endTime: number;
  productId: any;
}

interface ISpatialReel {
  _id: string; videoUrl: string; thumbnailUrl: string;
  productId: any;
  storeId?: { _id: string; handle: string; name: string };
  isMultiProduct?: boolean;
  hotspots?: IHotspot[];
  isLiked?: boolean; likesCount?: number; isSubscribed?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────
function fmtTime(s: number): string {
  if (!isFinite(s) || isNaN(s) || s < 0) return "0:00";
  const m   = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Build ordered segment list ───────────────────────────────────
// Fills the full [0, duration] range with either:
//   • isChapter: true  — a hotspot window with product info
//   • isChapter: false — a gap (no product active)
interface Segment {
  start: number;
  end:   number;
  product: any | null;
  isChapter: boolean;
}

function buildSegments(hotspots: IHotspot[], duration: number): Segment[] {
  if (!duration || duration <= 0 || !hotspots.length) return [];
  const sorted = [...hotspots].sort((a, b) => a.startTime - b.startTime);
  const segs: Segment[] = [];
  let cursor = 0;
  for (const h of sorted) {
    const s = Math.max(0,        h.startTime);
    const e = Math.min(duration, h.endTime);
    if (e <= s) continue;
    if (s > cursor)
      segs.push({ start: cursor, end: s, product: null, isChapter: false });
    segs.push({ start: s, end: e, product: h.productId, isChapter: true });
    cursor = e;
  }
  if (cursor < duration)
    segs.push({ start: cursor, end: duration, product: null, isChapter: false });
  return segs;
}

const SPRING = { type: "spring" as const, stiffness: 380, damping: 36 };

// ═══════════════════════════════════════════════════════════════════
// CHAPTER TIMELINE COMPONENT
// ═══════════════════════════════════════════════════════════════════
function ChapterTimeline({
  segments, currentTime, duration, onSeek,
}: {
  segments: Segment[];
  currentTime: number;
  duration: number;
  onSeek: (t: number) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // ── Fallback: single bar if no chapters ──
  if (!duration || segments.length === 0) {
    const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div onClick={e => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          onSeek(((e.clientX - rect.left) / rect.width) * duration);
        }} style={{
          height: 3, background: "rgba(255,255,255,0.22)", borderRadius: 99,
          cursor: "pointer", position: "relative",
        }}>
          <div style={{
            position: "absolute", left: 0, top: 0,
            height: "100%", width: `${pct}%`,
            background: "white", borderRadius: 99, transition: "width .1s",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontFamily: "DM Sans,sans-serif", fontWeight: 600 }}>{fmtTime(currentTime)}</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", fontFamily: "DM Sans,sans-serif", fontWeight: 600 }}>{fmtTime(duration)}</span>
        </div>
      </div>
    );
  }

  // ── Chapter bars ──
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>

      {/* Bar row */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 20 }}>
        {segments.map((seg, i) => {
          const widthPct = ((seg.end - seg.start) / duration) * 100;
          const isHov    = hoveredIdx === i;

          // Per-segment fill progress
          let fill = 0;
          if (currentTime >= seg.end) fill = 100;
          else if (currentTime > seg.start)
            fill = ((currentTime - seg.start) / (seg.end - seg.start)) * 100;

          // Bar height: chapter taller than gap; lift on hover
          const barH = isHov ? 10 : seg.isChapter ? 4 : 2.5;

          return (
            <div key={i}
              style={{ flex: `0 0 calc(${widthPct}% - 2px)`, position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}>

              {/* ── Tooltip (chapter segments only) ── */}
              {isHov && seg.isChapter && seg.product && (
                <div style={{
                  position: "absolute", bottom: "calc(100% + 10px)",
                  left: "50%", transform: "translateX(-50%)",
                  zIndex: 60, pointerEvents: "none",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 11px 7px 7px", borderRadius: 11,
                    background: "rgba(10,22,40,0.94)", backdropFilter: "blur(14px)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.55)",
                    whiteSpace: "nowrap",
                  }}>
                    {seg.product.imageUrl && (
                      <div style={{ width: 34, height: 34, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }}>
                        <img src={seg.product.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "white", margin: 0, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", fontFamily: "DM Sans, sans-serif" }}>
                        {seg.product.name}
                      </p>
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.42)", margin: 0, fontWeight: 600, fontFamily: "DM Sans, sans-serif" }}>
                        {fmtTime(seg.start)} – {fmtTime(seg.end)}
                      </p>
                    </div>
                    {seg.product.price && (
                      <span style={{ fontSize: 13, fontWeight: 900, color: "white", fontFamily: "Instrument Serif, serif", marginLeft: 6, flexShrink: 0 }}>
                        ₹{Number(seg.product.price).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {/* Caret */}
                  <div style={{
                    position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                    width: 0, height: 0,
                    borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
                    borderTop: "5px solid rgba(10,22,40,0.94)",
                  }} />
                </div>
              )}

              {/* ── The bar ── */}
              <div
                onClick={e => {
                  e.stopPropagation();
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  onSeek(seg.start + ratio * (seg.end - seg.start));
                }}
                style={{
                  height: barH,
                  borderRadius: 99,
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  // Chapter = brighter; gap = dimmer
                  background: seg.isChapter
                    ? isHov ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.26)"
                    : "rgba(255,255,255,0.12)",
                  transition: "height .15s ease, background .12s",
                }}>
                {/* Fill */}
                <div style={{
                  position: "absolute", left: 0, top: 0,
                  height: "100%", width: `${fill}%`,
                  background: seg.isChapter ? "white" : "rgba(255,255,255,0.5)",
                  borderRadius: 99,
                  transition: "width .08s linear",
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Time labels */}
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "DM Sans, sans-serif" }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{fmtTime(currentTime)}</span>
        <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.28)" }}>{fmtTime(duration)}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SINGLE REEL
// ═══════════════════════════════════════════════════════════════════
export default function SingleReel({
  reel, isActive,
}: {
  reel: ISpatialReel;
  isActive: boolean;
}) {
  const router         = useRouter();
  const { addToCart }  = useCart();
  const { data: session } = useSession();
  const videoRef       = useRef<HTMLVideoElement>(null);

  const [isMuted,        setIsMuted]        = useState(true);
  const [isPaused,       setIsPaused]       = useState(false);
  const [liked,          setLiked]          = useState(reel.isLiked || false);
  const [localLikes,     setLocalLikes]     = useState(reel.likesCount || 0);
  const [isSubscribed,   setIsSubscribed]   = useState(reel.isSubscribed || false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [activeProduct,  setActiveProduct]  = useState(reel.productId);
  const [chapterLabel,   setChapterLabel]   = useState("");
  const [currentTime,    setCurrentTime]    = useState(0);
  const [duration,       setDuration]       = useState(0);

  const segments = (reel.isMultiProduct && reel.hotspots && duration > 0)
    ? buildSegments(reel.hotspots, duration)
    : [];

  // ── Sync follow ────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: any) => {
      if (e.detail.storeId === reel.storeId?._id) setIsSubscribed(e.detail.state);
    };
    window.addEventListener("sync-follow", fn);
    return () => window.removeEventListener("sync-follow", fn);
  }, [reel.storeId?._id]);

  // ── Playback control ───────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    if (isActive) { v.play().catch(() => {}); setIsPaused(false); }
    else v.pause();
  }, [isActive]);

  const handleVideoClick = () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) { v.play(); setIsPaused(false); }
    else           { v.pause(); setIsPaused(true); }
  };

  // Duration — listen to both events for browser compatibility
  const captureDuration = () => {
    const v = videoRef.current; if (!v) return;
    const d = v.duration;
    if (isFinite(d) && d > 0) setDuration(d);
  };

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    const ct  = v.currentTime;
    const dur = v.duration;
    if (!isFinite(dur) || dur <= 0) return;
    setCurrentTime(ct);

    if (reel.isMultiProduct && reel.hotspots) {
      const active = reel.hotspots.find(h => ct >= h.startTime && ct <= h.endTime);
      if (active) {
        if (active.productId._id !== activeProduct?._id) setActiveProduct(active.productId);
        setChapterLabel(active.productId.name || "");
      } else {
        if (activeProduct?._id !== reel.productId?._id) setActiveProduct(reel.productId);
        setChapterLabel("");
      }
    }
  }, [activeProduct, reel]);

  const handleSeek = useCallback((t: number) => {
    const v = videoRef.current; if (!v || !duration) return;
    v.currentTime = Math.max(0, Math.min(t, duration));
  }, [duration]);

  // ── Like ───────────────────────────────────────────────────────
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return router.push("/login");
    const prev = liked;
    setLiked(!prev); setLocalLikes(n => prev ? n - 1 : n + 1);
    try {
      await fetch("/api/reels/like", { method: "POST", body: JSON.stringify({ reelId: reel._id }) });
    } catch { setLiked(prev); setLocalLikes(reel.likesCount || 0); }
  };

  // ── Follow ─────────────────────────────────────────────────────
  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return router.push("/login");
    const next = !isSubscribed;
    setIsSubscribed(next);
    window.dispatchEvent(new CustomEvent("sync-follow", { detail: { storeId: reel.storeId?._id, state: next } }));
    try {
      await fetch("/api/seller/subscribe", { method: "POST", body: JSON.stringify({ sellerId: reel.storeId?._id }) });
    } catch { setIsSubscribed(!next); }
  };

  // ── Add to cart ────────────────────────────────────────────────
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return router.push("/login");
    setIsAddingToCart(true);
    await addToCart(activeProduct);
    setTimeout(() => setIsAddingToCart(false), 900);
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full overflow-hidden bg-black flex justify-center select-none">

      {/* VIDEO */}
      <video
        ref={videoRef}
        src={reel.videoUrl.replace("/upload/", "/upload/f_auto,q_auto/")}
        className="w-full h-full object-cover"
        loop muted={isMuted} playsInline
        poster={reel.thumbnailUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={captureDuration}
        onDurationChange={captureDuration}
        onClick={handleVideoClick}
        style={{ cursor: "pointer" }}
      />

      {/* Gradient */}
      <div className="absolute inset-0 pointer-events-none z-10"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.44) 38%, transparent 62%)" }} />

      {/* Pause flash */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)" }}>
              <Pause className="w-7 h-7 text-white fill-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mute */}
      <div className="absolute top-5 left-4 right-4 z-30 flex items-center justify-between">
        <motion.button whileTap={{ scale: 0.88 }}
          onClick={e => { e.stopPropagation(); const next = !isMuted; setIsMuted(next); if (videoRef.current) videoRef.current.muted = next; }}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.18)" }}>
          {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
        </motion.button>
      </div>

      {/* Right sidebar */}
      <div className="absolute right-3 z-30 flex flex-col items-center gap-5"
        style={{ bottom: "calc(var(--card-height, 280px) + 24px)" }}>
        <div className="flex flex-col items-center gap-1.5">
          <motion.button whileTap={{ scale: 1.35 }} transition={SPRING} onClick={handleLike}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{ background: liked ? "white" : "rgba(255,255,255,0.12)", backdropFilter: "blur(14px)", border: liked ? "none" : "1px solid rgba(255,255,255,0.18)" }}>
            <Heart className="w-5 h-5" style={{ color: liked ? "#e11d48" : "white" }} fill={liked ? "#e11d48" : "none"} />
          </motion.button>
          <span className="text-[10px] font-bold text-white" style={{ fontFamily: "DM Sans, sans-serif", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
            {localLikes}
          </span>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.18)" }}
          onClick={e => e.stopPropagation()}>
          <MessageCircle className="w-5 h-5 text-white" />
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.18)" }}
          onClick={e => e.stopPropagation()}>
          <Share2 className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* Bottom panel */}
      <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-6 space-y-3">

        {/* "Now featuring" label */}
        <AnimatePresence mode="wait">
          {chapterLabel && (
            <motion.div key={chapterLabel}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2" style={{ fontFamily: "DM Sans, sans-serif" }}>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.18)" }}>
                Now featuring
              </span>
              <span className="text-xs font-semibold text-white truncate max-w-40"
                style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>
                {chapterLabel}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chapter timeline */}
        <ChapterTimeline
          segments={segments}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
        />

        {/* Product + store card */}
        <motion.div
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.09)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.13)" }}
          onClick={e => e.stopPropagation()}>

          {/* Store row */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <button className="flex items-center gap-2.5"
              onClick={e => { e.stopPropagation(); router.push(`/store/${reel.storeId?.handle}`); }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <StoreIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-none" style={{ fontFamily: "DM Sans, sans-serif" }}>
                  {reel.storeId?.name || "Store"}
                </p>
                <p className="text-[9px] text-white/40 mt-0.5 font-medium" style={{ fontFamily: "DM Sans, sans-serif" }}>
                  @{reel.storeId?.handle || "store"}
                </p>
              </div>
            </button>
            <motion.button whileTap={{ scale: 0.94 }} onClick={handleFollow}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold"
              style={{ fontFamily: "DM Sans, sans-serif", background: isSubscribed ? "rgba(255,255,255,0.1)" : "white", color: isSubscribed ? "rgba(255,255,255,0.7)" : "#0A1628", border: isSubscribed ? "1px solid rgba(255,255,255,0.18)" : "none" }}>
              {isSubscribed ? <><UserCheck className="w-3 h-3" /> Following</> : "Follow"}
            </motion.button>
          </div>

          {/* Product row */}
          <motion.button key={activeProduct?._id}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={SPRING}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-all"
            onClick={e => { e.stopPropagation(); router.push(`/product/${activeProduct?._id}`); }}>
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
              <Image src={activeProduct?.imageUrl || reel.thumbnailUrl} alt={activeProduct?.name || "Product"} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-snug" style={{ fontFamily: "DM Sans, sans-serif" }}>
                {activeProduct?.name}
              </p>
              <p className="text-base font-black text-white mt-0.5 leading-none" style={{ fontFamily: "Instrument Serif, serif" }}>
                ₹{Number(activeProduct?.price).toLocaleString()}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
          </motion.button>

          {/* CTAs */}
          <div className="grid grid-cols-2 gap-2 px-4 pb-4 pt-1">
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={e => { e.stopPropagation(); router.push(`/product/${activeProduct?._id}`); }}
              className="flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-bold transition-all"
              style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.8)", fontFamily: "DM Sans, sans-serif" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}>
              View Details <ArrowUpRight className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart} disabled={isAddingToCart}
              className="flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-bold"
              style={{ background: isAddingToCart ? "rgba(255,255,255,0.85)" : "white", color: "#0A1628", fontFamily: "DM Sans, sans-serif" }}>
              {isAddingToCart
                ? <div className="w-3.5 h-3.5 border-2 border-[#0A1628] border-t-transparent rounded-full animate-spin" />
                : <ShoppingBag className="w-3.5 h-3.5" />}
              {isAddingToCart ? "Adding…" : "Add to Cart"}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}