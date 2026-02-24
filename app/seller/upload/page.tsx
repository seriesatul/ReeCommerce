"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Video, Package, Truck, ShieldCheck, 
  ChevronRight, ChevronLeft, Loader2, 
  Plus, X, UploadCloud, Tag, 
  AlertCircle, Camera, Clock, Target, Trash2, Layout,
  DollarSign, Ruler, RotateCcw, ImageIcon, ChevronDown
} from "lucide-react";
import Image from "next/image";

// --- TYPES ---
interface MultiProductEntry {
  name: string;
  price: string;
  mrp: string;
  description: string;
  stock: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  startTime: string;
  endTime: string;
  x: number;
  y: number;
  galleryFiles: File[];
  returnEligible: boolean;
}

interface ProductFormData {
  listingType: "single" | "multi";
  caption: string;
  hashtags: string;
  category: string;
  taxDetails: string;
}

export default function UploadStudio() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // --- UI STATES ---
  const [currentStep, setCurrentStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<number>(0);

  // --- DATA STATES ---
  const [formData, setFormData] = useState<ProductFormData>({
    listingType: "single",
    caption: "",
    hashtags: "",
    category: "Electronics",
    taxDetails: "GST 18%",
  });

  const [products, setProducts] = useState<MultiProductEntry[]>([
    { 
      name: "", price: "", mrp: "", description: "", stock: "50", 
      weight: "", length: "", width: "", height: "",
      startTime: "0", endTime: "5", x: 50, y: 50, 
      galleryFiles: [], returnEligible: true 
    }
  ]);

  const [videoFile, setVideoFile] = useState<File | null>(null);

  // --- 1. PERSISTENCE ---
  useEffect(() => {
    const saved = localStorage.getItem("reecommerce_studio_v7");
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData);
        // Note: Files cannot be persisted in localStorage
      } catch (e) { localStorage.removeItem("reecommerce_studio_v7"); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("reecommerce_studio_v7", JSON.stringify({ formData }));
  }, [formData]);

  // --- 2. HANDLERS ---
  const handleNext = () => {
    if (isStepValid(currentStep)) {
      setFormError(null);
      setCurrentStep(prev => prev + 1);
    } else {
      setFormError("Action Required: Please complete all fields and uploads for this phase.");
    }
  };

  const addProductSlot = () => {
    if (products.length < 5) {
      setProducts([...products, { 
        name: "", price: "", mrp: "", description: "", stock: "50", 
        weight: "", length: "", width: "", height: "",
        startTime: "0", endTime: "5", x: 50, y: 50, 
        galleryFiles: [], returnEligible: true 
      }]);
      setExpandedProduct(products.length);
      setFormError(null);
    } else {
      setFormError("Platform Limit: Maximum 5 products per Lookbook.");
    }
  };

  const removeProductSlot = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
      if (expandedProduct >= index) setExpandedProduct(0);
    }
  };

  const updateProduct = (index: number, updates: Partial<MultiProductEntry>) => {
    const updated = [...products];
    updated[index] = { ...updated[index], ...updates };
    setProducts(updated);
  };

  const isStepValid = (step: number) => {
    if (step === 0) return true;
    if (step === 1) return videoFile !== null && formData.caption.trim().length >= 5;
    if (step === 2) {
      return products.every(p => 
        p.name.length > 2 && 
        p.price !== "" && 
        p.galleryFiles.length > 0 &&
        p.weight !== ""
      );
    }
    return true;
  };

  // --- 3. UPLOAD ENGINE ---
  const uploadToCloudinary = async (file: File, folder: string) => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = { timestamp, folder };
    const sigRes = await fetch("/api/cloudinary-signature", { method: "POST", body: JSON.stringify({ paramsToSign }) });
    const { signature } = await sigRes.json();
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("signature", signature);
    uploadData.append("timestamp", timestamp.toString());
    uploadData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
    uploadData.append("folder", folder);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${file.type.startsWith("video") ? "video" : "image"}/upload`, { method: "POST", body: uploadData });
    return await res.json();
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setUploadProgress(5);
    try {
      const videoRes = await uploadToCloudinary(videoFile!, "reecommerce_reels");
      setUploadProgress(30);

      const processedProducts = await Promise.all(products.map(async (p) => {
        const galleryUrls = await Promise.all(p.galleryFiles.map(f => uploadToCloudinary(f, "product_gallery")));
        const imageUrls = galleryUrls.map(r => r.secure_url);
        
        return {
          ...p,
          imageUrl: imageUrls[0],
          images: imageUrls,
          price: Number(p.price),
          mrp: Number(p.mrp),
          stock: Number(p.stock),
          volumetricWeight: parseFloat(((Number(p.length) * Number(p.width) * Number(p.height)) / 5000).toFixed(2))
        };
      }));
      setUploadProgress(90);

      const res = await fetch("/api/products/multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          products: processedProducts,
          videoUrl: videoRes.secure_url,
          thumbnailUrl: videoRes.secure_url.replace(/\.[^/.]+$/, ".jpg"),
        }),
      });

      if (res.ok) {
        localStorage.removeItem("reecommerce_studio_v7");
        router.push("/dashboard/seller/reels");
      }
    } catch (e) {
      setFormError("Platform error during high-volume upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900 font-sans">
      <header className="border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-50 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-6">
           <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-all"><ChevronLeft /></button>
           <h1 className="text-xl font-black tracking-tighter uppercase">Studio <span className="text-indigo-600">v4.5</span></h1>
        </div>
        <div className="flex items-center gap-3">
          {[0, 1, 2, 3].map(i => (
             <div key={i} className={`h-1 w-14 rounded-full transition-all duration-700 ${currentStep >= i ? 'bg-indigo-600 shadow-sm' : 'bg-slate-200'}`} />
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-12">
        {formError && <div className="mb-8 p-5 bg-rose-50 border border-rose-100 text-rose-600 rounded-3xl font-bold flex items-center gap-3 animate-in fade-in"><AlertCircle size={20} /> {formError}</div>}

        {currentStep === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10 animate-in fade-in slide-in-from-bottom-4">
             <button onClick={() => { setFormData({...formData, listingType: 'single'}); setCurrentStep(1); }} className="group p-12 rounded-[3.5rem] bg-white border-2 border-slate-100 hover:border-indigo-600 transition-all text-left space-y-6">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Package size={32} /></div>
                <h3 className="text-3xl font-black">Spotlight</h3>
                <p className="text-slate-500 font-medium leading-relaxed">Focus on a single hero product. Best for high-conversion individual item launches.</p>
             </button>
             <button onClick={() => { setFormData({...formData, listingType: 'multi'}); setCurrentStep(1); }} className="group p-12 rounded-[3.5rem] bg-white border-2 border-slate-100 hover:border-indigo-600 transition-all text-left space-y-6 shadow-2xl shadow-indigo-50">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Layout size={32} /></div>
                <h3 className="text-3xl font-black">Lookbook</h3>
                <p className="text-slate-500 font-medium leading-relaxed">Showcase up to 5 items in one video. Perfect for outfits, setups, and lifestyle collections.</p>
             </button>
          </div>
        )}

        {currentStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4">
             <div onClick={() => document.getElementById('v-up')?.click()} className="aspect-9/16 rounded-4xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-400 transition-all group relative">
                {videoFile ? <video src={URL.createObjectURL(videoFile)} className="h-full w-full object-cover" /> : <div className="text-center"><UploadCloud size={48} className="text-slate-300 mx-auto mb-4" /><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Product Reel (MP4)</p></div>}
                <input id="v-up" type="file" accept="video/*" hidden onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
             </div>
             <div className="space-y-6 py-4">
                <h2 className="text-4xl font-black tracking-tighter italic leading-tight">Reel Branding</h2>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Caption</label>
                   <textarea className="input-field h-44 resize-none font-medium" placeholder="What's happening in this video?" value={formData.caption} onChange={(e) => setFormData({...formData, caption: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Search Keywords</label>
                   <input className="input-field font-medium" placeholder="#tag #style #vibe" value={formData.hashtags} onChange={(e) => setFormData({...formData, hashtags: e.target.value})} />
                </div>
             </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
             <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black tracking-tighter italic">Catalog Logic</h2>
                {formData.listingType === "multi" && (
                  <button onClick={addProductSlot} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all">
                    <Plus size={16} /> Add Another Product
                  </button>
                )}
             </div>

             <div className="space-y-6">
                {products.map((p, i) => (
                  <div key={i} className={`bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden transition-all duration-500 ${expandedProduct === i ? 'ring-2 ring-indigo-600 shadow-2xl' : 'opacity-60 hover:opacity-100 shadow-sm'}`}>
                     <div onClick={() => setExpandedProduct(i)} className="p-6 bg-slate-50 flex items-center justify-between cursor-pointer border-b border-slate-100">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">{i + 1}</div>
                           <p className="font-black uppercase tracking-tight text-sm truncate max-w-37.5">{p.name || "Configure Item"}</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-[10px] font-black text-indigo-600 uppercase">₹{p.price || '0.00'}</span>
                           {products.length > 1 && <button onClick={(e) => { e.stopPropagation(); removeProductSlot(i); }} className="text-slate-300 hover:text-rose-500"><Trash2 size={18} /></button>}
                           <ChevronDown className={`transition-transform duration-300 ${expandedProduct === i ? 'rotate-180' : ''}`} />
                        </div>
                     </div>

                     {expandedProduct === i && (
                        <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in slide-in-from-top-2">
                           <div className="space-y-6">
                              <input className="input-field font-black text-xl" placeholder="Full Product Name" value={p.name} onChange={(e) => updateProduct(i, { name: e.target.value })} />
                              <textarea className="input-field h-32 resize-none text-sm" placeholder="Tell buyers about this specific item..." value={p.description} onChange={(e) => updateProduct(i, { description: e.target.value })} />
                              
                              <div className="space-y-4">
                                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Photo Gallery (Min 1)</label>
                                 <div className="grid grid-cols-4 gap-4">
                                    {p.galleryFiles.map((file, fIdx) => (
                                       <div key={fIdx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm group">
                                          <img src={URL.createObjectURL(file)} className="h-full w-full object-cover" alt="prev" />
                                          <button onClick={() => updateProduct(i, { galleryFiles: p.galleryFiles.filter((_, idx) => idx !== fIdx) })} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"><X size={10} /></button>
                                       </div>
                                    ))}
                                    <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all text-slate-300"><Plus size={24} /><input type="file" multiple accept="image/*" hidden onChange={(e) => updateProduct(i, { galleryFiles: [...p.galleryFiles, ...Array.from(e.target.files || [])] })} /></label>
                                 </div>
                              </div>
                           </div>

                           <div className="bg-slate-50 p-8 rounded-4xl space-y-10">
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">MRP</label><input type="number" className="input-field" value={p.mrp} onChange={(e) => updateProduct(i, { mrp: e.target.value })} /></div>
                                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deal Price</label><input type="number" className="input-field border-indigo-200" value={p.price} onChange={(e) => updateProduct(i, { price: e.target.value })} /></div>
                              </div>

                              <div className="space-y-4">
                                 <div className="flex items-center gap-3 text-indigo-600"><Ruler size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Dimensions (cm) & Weight (kg)</span></div>
                                 <div className="grid grid-cols-4 gap-2">
                                    {['length', 'width', 'height', 'weight'].map(field => (
                                       <input key={field} className="input-field p-2 text-center text-xs font-bold" placeholder={field[0].toUpperCase()} value={(p as any)[field]} onChange={(e) => updateProduct(i, { [field]: e.target.value })} />
                                    ))}
                                 </div>
                              </div>

                              {formData.listingType === "multi" && (
                                 <div className="space-y-4 pt-6 border-t border-slate-200">
                                    <div className="flex items-center gap-3 text-indigo-600"><Clock size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Active Timestamp (Seconds)</span></div>
                                    <div className="grid grid-cols-2 gap-4">
                                       <input className="input-field text-center font-bold text-xs" placeholder="Show At (s)" value={p.startTime} onChange={(e) => updateProduct(i, { startTime: e.target.value })} />
                                       <input className="input-field text-center font-bold text-xs" placeholder="Hide At (s)" value={p.endTime} onChange={(e) => updateProduct(i, { endTime: e.target.value })} />
                                    </div>
                                    <div className="flex items-center gap-3 text-indigo-600 pt-2"><Target size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Pulse Position (%)</span></div>
                                    <div className="grid grid-cols-2 gap-4">
                                       <input className="input-field text-center text-xs" placeholder="X" type="number" value={p.x} onChange={(e) => updateProduct(i, { x: Number(e.target.value) })} />
                                       <input className="input-field text-center text-xs" placeholder="Y" type="number" value={p.y} onChange={(e) => updateProduct(i, { y: Number(e.target.value) })} />
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                     )}
                  </div>
                ))}
             </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="py-24 text-center space-y-12 animate-in zoom-in-95">
             <div className="w-24 h-24 bg-indigo-600 rounded-4xl flex items-center justify-center text-white mx-auto shadow-2xl rotate-3"><ShieldCheck size={48} /></div>
             <div className="space-y-2">
                <h2 className="text-5xl font-black tracking-tighter">Ready for Deployment</h2>
                <p className="text-slate-500 font-medium max-w-sm mx-auto italic text-sm">Processing {formData.listingType === "multi" ? `${products.length} products` : "spotlight listing"}. All assets optimized for edge delivery.</p>
             </div>
             <button onClick={handleFinalSubmit} disabled={loading} className="btn-primary min-w-70 py-6 text-xl shadow-2xl shadow-indigo-100 flex items-center justify-center gap-4 mx-auto disabled:opacity-50">
                {loading ? <><Loader2 className="animate-spin" /><span>Syncing {uploadProgress}%</span></> : "Publish to Marketplace"}
             </button>
          </div>
        )}

        <footer className="mt-24 pt-12 border-t border-slate-100 flex items-center justify-between">
           <button disabled={currentStep === 0 || loading} onClick={() => setCurrentStep(s => s - 1)} className={`flex items-center gap-2 font-black text-slate-400 hover:text-slate-900 transition-all ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}><ChevronLeft /> Previous</button>
           <div className="flex items-center gap-10">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Step 0{currentStep} of 03</span>
              {currentStep < 3 && <button onClick={handleNext} className="btn-primary px-20 shadow-indigo-100">Continue <ChevronRight size={18} /></button>}
           </div>
        </footer>
      </main>
    </div>
  );
}