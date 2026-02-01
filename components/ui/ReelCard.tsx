"use client";

import { IReel } from "@/models/Reel";
import { IProduct } from "@/models/Products";
import Image from "next/image";
import { Play } from "lucide-react";

interface Props {
  reel: any; 
  onClick: () => void;
}

export default function ReelCard({ reel, onClick }: Props) {
  // DEFENSIVE CHECK: Ensure the populated product exists
  const product = reel.productId as unknown as IProduct;

  // If the product was deleted or failed to load, don't crash, just don't render this card.
  if (!product || !product.name) {
    console.warn(`Reel ${reel._id} is missing its associated product data.`);
    return null; 
  }

  return (
    <div 
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
    >
      <div className="relative aspect-[9/16] w-full">
        <Image
          src={reel.thumbnailUrl}
          alt={product.name || "Product Video"} // Use fallback string
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Play Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/20 backdrop-blur-md p-4 rounded-full">
            <Play className="w-8 h-8 text-white fill-white" />
          </div>
        </div>

        {/* Product Brief Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          <p className="text-white font-bold text-sm truncate">{product.name}</p>
          <p className="text-indigo-300 font-black text-lg">${product.price}</p>
        </div>
      </div>
    </div>
  );
}