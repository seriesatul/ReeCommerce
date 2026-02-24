"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { motion } from "framer-motion";

export interface IProduct {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export interface IReelCardProps {
  reel: {
    _id: string;
    thumbnailUrl: string;
    productId: IProduct;
  };
  onClick: () => void;
}

// ── "as const" narrows type from string → "spring" literal ──
const springConfig = { type: "spring" as const, stiffness: 300, damping: 30 };

export default function ReelCard({ reel, onClick }: IReelCardProps) {
  const product = reel.productId;

  if (!product || !product.name) {
    console.warn(`ReelCard: reel ${reel._id} is missing product data.`);
    return null;
  }

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={springConfig}
      // max-w-[200px] on desktop keeps the card narrow like a real vertical reel column
      className="group relative cursor-pointer w-full max-w-[200px] mx-auto"
    >
      {/* aspect-9/16 = canonical Tailwind v4 shorthand for 9:16 vertical */}
      <div className="relative aspect-9/16 w-full rounded-2xl overflow-hidden bg-[#F4F6FB]">
        <Image
          src={reel.thumbnailUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Hover play indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div
            className="p-4 rounded-full"
            style={{
              background: "rgba(255,255,255,0.22)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Product info — bottom gradient */}
        <div
          className="absolute bottom-0 left-0 right-0 p-4"
          // bg-linear-to-t is the canonical Tailwind v4 class (replaces bg-gradient-to-t)
          style={{
            background: "linear-gradient(to top, rgba(10,22,40,0.88) 0%, rgba(10,22,40,0.4) 55%, transparent 100%)",
          }}
        >
          <p
            className="text-white font-semibold text-xs truncate leading-snug"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {product.name}
          </p>
          <p
            className="text-white font-black text-base leading-tight mt-0.5"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            ₹{Number(product.price).toLocaleString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}