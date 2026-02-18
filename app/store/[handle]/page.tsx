"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Store as StoreIcon, 
  Users, 
  Video, 
  ShoppingBag, 
  ChevronLeft, 
  ShieldCheck, 
  Loader2,
  Grid3X3,
  Play
} from "lucide-react";
import Link from "next/link";

export default function StoreProfilePage() {
  const { handle } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reels" | "products">("reels");

  useEffect(() => {
    fetch(`/api/store/${handle}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
  }, [handle]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  if (!data?.store) return <div className="p-20 text-center font-bold">Store Not Found</div>;

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 1. STICKY BRAND HEADER */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-50 rounded-full transition-all">
            <ChevronLeft size={24} />
          </button>
          <span className="font-black text-slate-900 tracking-tighter uppercase text-sm">
            @{data.store.handle}
          </span>
          <div className="w-10" />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-10">
        
        {/* 2. IDENTITY SECTION */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 border-b border-slate-100 pb-12">
          {/* Logo/Avatar */}
          <div className="relative w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-2xl shadow-indigo-100 shrink-0 bg-slate-900 flex items-center justify-center">
            {data.store.logoUrl ? (
              <Image src={data.store.logoUrl} alt="Logo" fill className="object-cover" />
            ) : (
              <StoreIcon size={48} className="text-white/20" />
            )}
          </div>

          {/* Bio & Stats */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
               <h1 className="text-4xl font-black text-slate-900 tracking-tight">{data.store.name}</h1>
               <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mx-auto md:mx-0">
                 <ShieldCheck size={12} /> Verified Seller
               </div>
            </div>
            
            <p className="text-slate-500 font-medium max-w-lg leading-relaxed text-sm">
              {data.store.description || "Welcome to our official ReeCommerce shop."}
            </p>

            <div className="flex items-center justify-center md:justify-start gap-8 pt-4">
               <div className="text-center md:text-left">
                  <p className="text-2xl font-black text-slate-900">{data.followerCount}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Followers</p>
               </div>
               <div className="text-center md:text-left border-l border-slate-100 pl-8">
                  <p className="text-2xl font-black text-slate-900">{data.reels.length}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reels Published</p>
               </div>
            </div>
          </div>
        </div>

        {/* 3. TABS SELECTION */}
        <div className="flex justify-center md:justify-start gap-12 mt-8">
          <button 
            onClick={() => setActiveTab("reels")}
            className={`flex items-center gap-2 pb-4 text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'reels' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-300'}`}
          >
            <Video size={16} /> Reels
          </button>
          <button 
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 pb-4 text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'products' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-300'}`}
          >
            <Grid3X3 size={16} /> Shop
          </button>
        </div>

        {/* 4. CONTENT GRID */}
        <div className="mt-10 animate-in fade-in duration-700">
           {activeTab === "reels" ? (
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {data.reels.map((reel: any) => (
                  <Link 
                    key={reel._id} 
                    href={`/?reelId=${reel._id}`} 
                    className="group relative aspect-9/16 rounded-3xl overflow-hidden bg-slate-100 border border-slate-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <Image src={reel.thumbnailUrl} alt="R" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <Play fill="white" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
             </div>
           ) : (
             <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {data.products.map((product: any) => (
                  <Link 
                    key={product._id} 
                    href={`/product/${product._id}`}
                    className="group space-y-3"
                  >
                    <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm group-hover:shadow-lg transition-all">
                      <Image src={product.imageUrl} alt="P" fill className="object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 truncate">{product.name}</p>
                      <p className="text-sm font-black text-indigo-600">₹{product.price}</p>
                    </div>
                  </Link>
                ))}
             </div>
           )}
        </div>

      </div>
    </div>
  );
}