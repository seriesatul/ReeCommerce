"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Store as StoreIcon,
  UserCheck,
  ShoppingBag,
  ArrowUpRight,
  Play,
  Pause,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────
interface IHotspot {
  x: number;
  y: number;
  startTime: number;
  endTime: number;
  productId: any;
}

interface ISpatialReel {
  _id: string;
  videoUrl: string;
  thumbnailUrl: string;
  productId: any;
  storeId?: { _id: string; handle: string; name: string };
  isMultiProduct?: boolean;
  hotspots?: IHotspot[];
  isLiked?: boolean;
  likesCount?: number;
  isSubscribed?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────
function fmtTime(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Chapter segment — derives unique title windows from hotspots ──
function buildChapters(hotspots: IHotspot[], duration: number) {
  if (!hotspots.length || !duration) return [];
  // sort by startTime
  const sorted = [...hotspots].sort((a, b) => a.startTime - b.startTime);
  return sorted.map((h, i) => ({
    startTime: h.startTime,
    endTime: h.endTime,
    productId: h.productId,
    widthPct: ((h.endTime - h.startTime) / duration) * 100,
    leftPct: (h.startTime / duration) * 100,
  }));
}

const spring = { type: "spring" as const, stiffness: 380, damping: 36 };

// ─────────────────────────────────────────────────────────────────
export default function SingleReel({
  reel,
  isActive,
}: {
  reel: ISpatialReel;
  isActive: boolean;
}) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { data: session } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [liked, setLiked] = useState(reel.isLiked || false);
  const [localLikes, setLocalLikes] = useState(reel.likesCount || 0);
  const [isSubscribed, setIsSubscribed] = useState(reel.isSubscribed || false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const [activeProduct, setActiveProduct] = useState(reel.productId);
  const [currentChapterLabel, setCurrentChapterLabel] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // ── Chapters derived from hotspots ──
  const chapters = reel.isMultiProduct && reel.hotspots
    ? buildChapters(reel.hotspots, duration)
    : [];

  // ── Sync follow state across reels ──
  useEffect(() => {
    const fn = (e: any) => {
      if (e.detail.storeId === reel.storeId?._id) setIsSubscribed(e.detail.state);
    };
    window.addEventListener("sync-follow", fn);
    return () => window.removeEventListener("sync-follow", fn);
  }, [reel.storeId?._id]);

  // ── Playback ──
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
      setIsPaused(false);
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  const handleVideoClick = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPaused(false);
    } else {
      videoRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const ct = videoRef.current.currentTime;
    const dur = videoRef.current.duration;
    setCurrentTime(ct);
    setProgress((ct / dur) * 100);

    if (reel.isMultiProduct && reel.hotspots) {
      const active = reel.hotspots.find(
        (h) => ct >= h.startTime && ct <= h.endTime
      );
      if (active) {
        if (active.productId._id !== activeProduct?._id)
          setActiveProduct(active.productId);
        setCurrentChapterLabel(active.productId.name || "");
      } else {
        if (activeProduct?._id !== reel.productId?._id)
          setActiveProduct(reel.productId);
        setCurrentChapterLabel("");
      }
    }
  }, [activeProduct, reel]);

  // ── Seek on timeline click ──
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = ratio * duration;
  };

  // ── Actions ──
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return router.push("/login");
    const prev = liked;
    setLiked(!prev);
    setLocalLikes((n) => (prev ? n - 1 : n + 1));
    try {
      await fetch("/api/reels/like", {
        method: "POST",
        body: JSON.stringify({ reelId: reel._id }),
      });
    } catch {
      setLiked(prev);
      setLocalLikes(reel.likesCount || 0);
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return router.push("/login");
    const next = !isSubscribed;
    setIsSubscribed(next);
    window.dispatchEvent(
      new CustomEvent("sync-follow", {
        detail: { storeId: reel.storeId?._id, state: next },
      })
    );
    try {
      await fetch("/api/seller/subscribe", {
        method: "POST",
        body: JSON.stringify({ sellerId: reel.storeId?._id }),
      });
    } catch {
      setIsSubscribed(!next);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return router.push("/login");
    setIsAddingToCart(true);
    await addToCart(activeProduct);
    setTimeout(() => setIsAddingToCart(false), 900);
  };

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full overflow-hidden bg-black flex justify-center select-none">

      {/* ══ VIDEO ══════════════════════════════════════════════════ */}
      <video
        ref={videoRef}
        src={reel.videoUrl.replace("/upload/", "/upload/f_auto,q_auto/")}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        poster={reel.thumbnailUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={handleVideoClick}
        style={{ cursor: "pointer" }}
      />

      {/* Cinematic gradient — bottom 65% */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 38%, transparent 62%)",
        }}
      />

      {/* ══ PAUSE ICON FLASH ═══════════════════════════════════════ */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <Pause className="w-7 h-7 text-white fill-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ TOP BAR — mute ═════════════════════════════════════════ */}
      <div className="absolute top-5 left-4 right-4 z-30 flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={(e) => { e.stopPropagation(); setIsMuted((v) => !v); }}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          {isMuted
            ? <VolumeX className="w-4 h-4 text-white" />
            : <Volume2 className="w-4 h-4 text-white" />
          }
        </motion.button>
      </div>

      {/* ══ RIGHT SIDEBAR — engagement ═════════════════════════════ */}
      <div
        className="absolute right-3 z-30 flex flex-col items-center gap-5"
        style={{ bottom: "calc(var(--card-height, 280px) + 24px)" }}
      >
        {/* Like */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 1.35 }}
            transition={spring}
            onClick={handleLike}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{
              background: liked ? "white" : "rgba(255,255,255,0.12)",
              backdropFilter: "blur(14px)",
              border: liked ? "none" : "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <Heart
              className="w-5 h-5 transition-colors"
              style={{ color: liked ? "#e11d48" : "white" }}
              fill={liked ? "#e11d48" : "none"}
            />
          </motion.button>
          <span
            className="text-[10px] font-bold text-white"
            style={{ fontFamily: "'DM Sans', sans-serif", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
          >
            {localLikes}
          </span>
        </div>

        {/* Comment */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle className="w-5 h-5 text-white" />
        </motion.button>

        {/* Share */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Share2 className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* ══ BOTTOM PANEL ═══════════════════════════════════════════ */}
      <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-6 space-y-3">

        {/* ── CHAPTER TIMELINE ──────────────────────────────────── */}
        <div className="space-y-2">

          {/* Chapter label — product title for current segment */}
          <AnimatePresence mode="wait">
            {currentChapterLabel && (
              <motion.div
                key={currentChapterLabel}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1.5"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(10px)",
                    color: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                >
                  Now featuring
                </span>
                <span
                  className="text-xs font-semibold text-white truncate max-w-40"
                  style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}
                >
                  {currentChapterLabel}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Timeline bar + chapter markers */}
          <div
            className="relative h-0.75 w-full rounded-full cursor-pointer group"
            style={{ background: "rgba(255,255,255,0.22)" }}
            onClick={(e) => { e.stopPropagation(); handleSeek(e); }}
          >
            {/* Progress fill */}
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-white transition-all duration-100"
              style={{ width: `${progress}%` }}
            />

            {/* Chapter segments */}
            {duration > 0 && chapters.map((ch, i) => (
              <div key={i}>
                {/* Segment divider tick */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full"
                  style={{
                    left: `${ch.leftPct}%`,
                    background: "rgba(255,255,255,0.9)",
                    zIndex: 10,
                  }}
                />

                {/* Invisible hover target for tooltip */}
                <div
                  className="absolute -top-2 h-5 group/ch"
                  style={{ left: `${ch.leftPct}%`, width: `${ch.widthPct}%` }}
                >
                  {/* Chapter tooltip on hover — like YouTube */}
                  <div
                    className="absolute bottom-full mb-2 left-0 pointer-events-none opacity-0 group-hover/ch:opacity-100 transition-opacity duration-150"
                    style={{ minWidth: 0 }}
                  >
                    <div
                      className="px-2 py-1 rounded-lg whitespace-nowrap flex items-center gap-1.5"
                      style={{
                        background: "rgba(10,22,40,0.88)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <span className="text-[9px] font-bold text-white/50 shrink-0">
                        {fmtTime(ch.startTime)}
                      </span>
                      <span className="text-[10px] font-semibold text-white truncate max-w-30">
                        {ch.productId?.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Scrubber thumb — visible on hover */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md -translate-x-1/2"
              style={{ left: `${progress}%` }}
            />
          </div>

          {/* Time labels */}
          <div
            className="flex items-center justify-between"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <span className="text-[9px] font-medium text-white/50">{fmtTime(currentTime)}</span>
            <span className="text-[9px] font-medium text-white/30">{fmtTime(duration)}</span>
          </div>
        </div>

        {/* ── PRODUCT + STORE CARD ──────────────────────────────── */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring, delay: 0.1 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.09)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.13)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Store row */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <button
              className="flex items-center gap-2.5 group"
              onClick={(e) => { e.stopPropagation(); router.push(`/store/${reel.storeId?.handle}`); }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-opacity group-hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <StoreIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-left">
                <p
                  className="text-xs font-bold text-white leading-none"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {reel.storeId?.name || "Store"}
                </p>
                <p
                  className="text-[9px] text-white/40 mt-0.5 font-medium"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  @{reel.storeId?.handle || "store"}
                </p>
              </div>
            </button>

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleFollow}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold transition-all"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                background: isSubscribed ? "rgba(255,255,255,0.1)" : "white",
                color: isSubscribed ? "rgba(255,255,255,0.7)" : "#0A1628",
                border: isSubscribed ? "1px solid rgba(255,255,255,0.18)" : "none",
              }}
            >
              {isSubscribed
                ? <><UserCheck className="w-3 h-3" /> Following</>
                : "Follow"
              }
            </motion.button>
          </div>

          {/* Active product row */}
          <motion.button
            key={activeProduct?._id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={spring}
            className="w-full flex items-center gap-3 px-4 py-3 transition-all text-left hover:bg-white/5"
            onClick={(e) => { e.stopPropagation(); router.push(`/product/${activeProduct?._id}`); }}
          >
            {/* Product thumbnail */}
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
              <Image
                src={activeProduct?.imageUrl || reel.thumbnailUrl}
                alt={activeProduct?.name || "Product"}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold text-white truncate leading-snug"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {activeProduct?.name}
              </p>
              <p
                className="text-base font-black text-white mt-0.5 leading-none"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                ₹{Number(activeProduct?.price).toLocaleString()}
              </p>
            </div>

            <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
          </motion.button>

          {/* Action buttons */}
          <div
            className="grid grid-cols-2 gap-2 px-4 pb-4 pt-1"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={(e) => { e.stopPropagation(); router.push(`/product/${activeProduct?._id}`); }}
              className="flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-bold transition-all"
              style={{
                background: "rgba(255,255,255,0.09)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "rgba(255,255,255,0.8)",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
            >
              View Details
              <ArrowUpRight className="w-3.5 h-3.5" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-bold transition-all"
              style={{
                background: isAddingToCart ? "rgba(255,255,255,0.85)" : "white",
                color: "#0A1628",
                fontFamily: "'DM Sans', sans-serif",
                opacity: isAddingToCart ? 0.85 : 1,
              }}
            >
              {isAddingToCart ? (
                <div className="w-3.5 h-3.5 border-2 border-[#0A1628] border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShoppingBag className="w-3.5 h-3.5" />
              )}
              {isAddingToCart ? "Adding…" : "Add to Cart"}
            </motion.button>
          </div>
        </motion.div>
      </div>

    </div>
  );
}