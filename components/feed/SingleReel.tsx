"use client";

import { useEffect, useRef, useState } from "react";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  ShoppingBag, 
  Volume2, 
  VolumeX, 
  Store as StoreIcon, 
  Loader2, 
  Info, 
  UserPlus, 
  UserCheck 
} from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

export default function SingleReel({ reel, isActive }: { reel: any; isActive: boolean }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { data: session } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Interaction States
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(reel.isLiked || false);
  const [localLikes, setLocalLikes] = useState<number>(reel.likesCount || 0);
  const [isSubscribed, setIsSubscribed] = useState(reel.isSubscribed || false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // --- 1. Real-Time Follow Synchronization ---
  // Ensures that following a shop on one reel updates all other reels from the same shop instantly
  useEffect(() => {
    const handleFollowSync = (e: any) => {
      if (e.detail.storeId === reel.storeId?._id) {
        setIsSubscribed(e.detail.state);
      }
    };
    window.addEventListener('sync-follow', handleFollowSync);
    return () => window.removeEventListener('sync-follow', handleFollowSync);
  }, [reel.storeId?._id]);

  // --- 2. Video Playback Management ---
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => console.log("Autoplay blocked by browser policy"));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  // --- 3. Interaction Handlers ---

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents video from pausing
    if (!session) return router.push("/login");

    const newState = !isSubscribed;
    setIsSubscribed(newState);

    // Global Event Dispatch for Cross-Reel State Sync
    window.dispatchEvent(new CustomEvent('sync-follow', { 
        detail: { storeId: reel.storeId?._id, state: newState } 
    }));

    try {
      const res = await fetch("/api/seller/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: reel.storeId?._id }),
      });
      if (!res.ok) throw new Error();
    } catch (err) {
      // Rollback on failure
      setIsSubscribed(!newState);
      window.dispatchEvent(new CustomEvent('sync-follow', { 
        detail: { storeId: reel.storeId?._id, state: !newState } 
      }));
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!session) return router.push("/login");

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLocalLikes(prev => wasLiked ? prev - 1 : prev + 1);

    try {
      const res = await fetch("/api/reels/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reelId: reel._id }),
      });
      if (!res.ok) throw new Error();
    } catch (err) {
      setLiked(wasLiked);
      setLocalLikes(reel.likesCount);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return router.push("/login");
    setIsAddingToCart(true);
    await addToCart(reel.productId);
    setTimeout(() => setIsAddingToCart(false), 800);
  };

  const goToProduct = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/product/${reel.productId?._id || reel.productId}`);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: reel.productId?.name,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black flex justify-center">
      {/* --- VIDEO LAYER --- */}
      <video
        ref={videoRef}
        src={reel.videoUrl.replace("/upload/", "/upload/f_auto,q_auto/")}
        className="w-full h-full object-cover cursor-pointer"
        loop muted={isMuted} playsInline
        poster={reel.thumbnailUrl}
        onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}
      />

      {/* 1. Mute Toggle (Top Left) */}
      <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} 
        className="absolute top-6 left-6 z-30 p-2 bg-black/20 backdrop-blur-xl rounded-full text-white/90 border border-white/5 transition-colors hover:bg-black/40">
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {/* 2. Side Interaction Bar (Elevated Position & Smaller Icons) */}
      <div className="absolute right-4 bottom-60 flex flex-col items-center gap-6 z-30">
        <div className="flex flex-col items-center gap-1.5">
          <button 
            onClick={handleLike}
            className={`p-2.5 rounded-full transition-all active:scale-150 ${liked ? 'bg-indigo-600 shadow-lg shadow-indigo-500/50' : 'bg-black/20 backdrop-blur-md border border-white/10'}`}
          >
            <Heart className="w-5 h-5 text-white" fill={liked ? "white" : "none"} strokeWidth={2.5} />
          </button>
          <span className="text-[10px] font-black text-white drop-shadow-md tracking-tighter">{localLikes}</span>
        </div>
        
        <div className="flex flex-col items-center gap-1.5">
          <button className="p-2.5 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 border border-white/10 transition-colors">
            <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
          </button>
          <span className="text-[10px] font-black text-white drop-shadow-md tracking-tighter">0</span>
        </div>

        <button onClick={handleShare} className="p-2.5 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 border border-white/10 transition-colors">
          <Share2 className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* 3. Main Action Card (Full Width Design & Professional Brand Link) */}
      <div className="absolute bottom-4 left-2 right-2 z-30">
        <div className="bg-black/40 backdrop-blur-3xl border border-white/10 p-5 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-4">
          
          {/* Brand Identity Section (FIXED: Clickable Shop Link) */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div 
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                if (reel.storeId?.handle) {
                  router.push(`/store/${reel.storeId.handle}`);
                }
              }}
            >
               <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
                 <StoreIcon className="w-4 h-4 text-white" />
               </div>
               <div className="flex flex-col">
                 <span className="text-xs font-black text-white uppercase tracking-tighter leading-none">
                   {reel.storeId?.name || "Premium Store"}
                 </span>
                 <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Verified Partner</span>
               </div>
            </div>
            
            <button 
              onClick={handleFollow}
              className={`text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-tighter transition-all border ${
                isSubscribed 
                ? 'bg-white/10 text-white border-white/20' 
                : 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-900/40 hover:bg-indigo-700'
              }`}
            >
              {isSubscribed ? <span className="flex items-center gap-1.5"><UserCheck className="w-3 h-3" /> Following</span> : "Follow"}
            </button>
          </div>

          {/* Product Snippet Area */}
          <div className="flex items-center gap-4 bg-white/5 p-3 rounded-3xl border border-white/5 mb-4 group cursor-pointer" onClick={goToProduct}>
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-lg">
              <Image src={reel.productId?.imageUrl || reel.thumbnailUrl} alt="Product" fill className="object-cover transition-transform group-hover:scale-110" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white truncate tracking-tight">{reel.productId?.name}</h3>
              <p className="text-base font-black text-indigo-400 mt-0.5 tracking-tighter">₹{reel.productId?.price}</p>
            </div>
          </div>

          {/* Core CTAs */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={goToProduct}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest border border-white/5 transition-all"
            >
              <Info className="w-4 h-4 text-indigo-400" /> Details
            </button>
            <button 
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-900/40 transition-all active:scale-95 disabled:bg-slate-800"
            >
              {isAddingToCart ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><ShoppingBag className="w-4 h-4" /> Add to Bag</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Visual Depth Overlay */}
      <div className="absolute bottom-0 w-full h-1/2 bg-linear-to-t from-black/90 via-black/30 to-transparent pointer-events-none z-10" />
    </div>
  );
}