"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  ShoppingBag, ShieldCheck, Truck, ArrowLeft, 
  Star, Store, Loader2, Package, AlertCircle 
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { IProduct } from "@/models/Products";

// 1. Define the shape of the data AFTER it has been joined/populated by MongoDB
interface PopulatedProduct extends Omit<IProduct, 'storeId'> {
  storeId: {
    _id: string;
    name: string;
    logoUrl?: string;
  }
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  
  // 2. FIXED: Change <IProduct | null> to <PopulatedProduct | null>
  // This tells TypeScript that storeId is an object with a name, not just an ID.
  const [product, setProduct] = useState<PopulatedProduct | null>(null);
  const [activeImage, setActiveImage] = useState<string>(""); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Product not found");
        const data = await res.json();
        
        setProduct(data);
        setActiveImage(data.imageUrl); 
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    await addToCart(product);
    setAdding(false);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Data</p>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
      <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
      <h1 className="text-2xl font-black text-slate-900 uppercase">Product Unavailable</h1>
      <p className="text-slate-500 mt-2 mb-8 max-w-xs">This item might have been removed or is no longer in stock.</p>
      <button onClick={() => router.push("/")} className="btn-primary px-10">Back to Discovery</button>
    </div>
  );

  const discountPercent = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <div className="min-h-screen bg-white pb-32">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="group flex items-center gap-2 text-slate-900 font-bold transition-all">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Stock & Verified</span>
          </div>
          <div className="w-10" /> 
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-start">
          
          <div className="space-y-6 sticky top-28">
            <div className="relative aspect-square w-full rounded-4xl overflow-hidden bg-slate-50 border border-slate-100 shadow-2xl shadow-slate-200">
              <Image 
                src={activeImage} 
                alt={product.name} 
                fill 
                className="object-cover transition-all duration-700 ease-in-out" 
                priority 
              />
            </div>
            
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {[product.imageUrl, ...(product.images || [])].map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveImage(img)}
                  className={`relative aspect-square w-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImage === img ? "border-indigo-600 scale-105 shadow-lg" : "border-slate-100 grayscale hover:grayscale-0"
                  }`}
                >
                  <Image src={img} alt={`Gallery ${i}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-10">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full">
                  <Store className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">
                    {/* TypeScript will no longer complain here */}
                    {product.storeId?.name || "Official Store"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 rounded-full border border-amber-100">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="text-[10px] font-black text-amber-700 uppercase">4.9 Creator Rating</span>
                </div>
              </div>
              
              {/* FIXED: Applied 'wrap-break-word' as suggested by linter */}
              <h1 className="text-6xl font-black text-slate-900 tracking-tight leading-[0.85] wrap-break-word">
                {product.name}
              </h1>
              
              <div className="flex items-end gap-4">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">${product.price}</span>
                <div className="flex flex-col mb-1">
                   <span className="text-sm text-slate-400 line-through font-bold">${product.mrp}</span>
                   <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">{discountPercent}% OFF Today</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">Product Bio</h3>
              <div className="bg-slate-50 p-8 rounded-4xl border border-slate-100">
                <p className="text-slate-600 leading-relaxed font-medium">
                  {product.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white border border-slate-100 p-5 rounded-3xl flex items-center gap-4 group hover:border-indigo-600 transition-all">
                 <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Truck className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Shipping</p>
                    <p className="text-sm font-bold text-slate-900">Free Express</p>
                 </div>
               </div>
               <div className="bg-white border border-slate-100 p-5 rounded-3xl flex items-center gap-4 group hover:border-indigo-600 transition-all">
                 <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <ShieldCheck className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Authentic</p>
                    <p className="text-sm font-bold text-slate-900">Verified HQ</p>
                 </div>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={handleAddToCart}
                disabled={adding || product.stock === 0}
                className="flex-[1.5] bg-slate-900 text-white py-6 rounded-3xl font-black text-xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 disabled:bg-slate-200 disabled:text-slate-400"
              >
                {adding ? <Loader2 className="animate-spin" /> : <><ShoppingBag className="w-6 h-6" /> Add to Bag</>}
              </button>
              
              <button 
                disabled={product.stock === 0}
                className="flex-1 bg-indigo-600 text-white py-6 rounded-3xl font-black text-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-2xl shadow-indigo-200 disabled:bg-slate-200"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}