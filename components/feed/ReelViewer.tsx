"use client";

import { useEffect, useRef, useState } from "react";
import SingleReel from "./SingleReel";
import { X } from "lucide-react";

interface ReelViewerProps {
  reels: any[];
  initialReelId: string;
  onClose: () => void;
}

export default function ReelViewer({ reels, initialReelId, onClose }: ReelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const index = reels.findIndex((r) => r._id === initialReelId);
    if (index !== -1) {
      setActiveIndex(index);
      setTimeout(() => {
        if (containerRef.current) {
          const reelHeight = containerRef.current.clientHeight;
          containerRef.current.scrollTo({
            top: index * reelHeight,
            behavior: "instant",
          });
        }
      }, 10);
    }
  }, [initialReelId, reels]);

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollPosition = containerRef.current.scrollTop;
      const height = containerRef.current.clientHeight;
      const index = Math.round(scrollPosition / height);
      if (index !== activeIndex) setActiveIndex(index);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
      {/* External Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-[110] p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      {/* 
         THE NARROW FRAME 
         - Width reduced to max-w-[380px]
         - Height reduced to 80vh
         - Overflows & Scrollbars hidden
      */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="relative h-[95vh] aspect-[9/16] w-full max-w-[380px] bg-black rounded-[2.5rem] overflow-y-scroll snap-y snap-mandatory no-scrollbar shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
      >
        {reels.map((reel, index) => (
          <div key={reel._id} className="w-full h-full snap-start snap-always">
            <SingleReel 
              reel={reel} 
              isActive={index === activeIndex} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}