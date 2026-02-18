"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Video, Package, Truck, ShieldCheck, 
  ChevronRight, ChevronLeft, Loader2, 
  Plus, X, UploadCloud, Image as ImageIcon,
  Tag, AlertCircle, Camera, Ruler, Box, RotateCcw
} from "lucide-react";
import Image from "next/image";

const UPLOAD_STEPS = [
  { id: 1, name: "Reel Content", icon: Video },
  { id: 2, name: "Gallery & Info", icon: ImageIcon },
  { id: 3, name: "Pricing & Stock", icon: Tag },
  { id: 4, name: "Logistics", icon: Truck },
];

interface ProductFormData {
  caption: string;
  hashtags: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  sku: string;
  mrp: string;
  price: string;
  stock: string;
  lowStockThreshold: string;
  // Bug #5: Dimensions
  length: string;
  width: string;
  height: string;
  weight: string;
  taxDetails: string;
  origin: string;
  // Bug #6: Return Policy
  returnEligible: boolean;
  returnWindow: string;
  policyDetails: string;
}

export default function UploadStudio() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    caption: "",
    hashtags: "",
    name: "",
    description: "",
    category: "Electronics",
    brand: "",
    sku: "",
    mrp: "",
    price: "",
    stock: "",
    lowStockThreshold: "5",
    length: "",
    width: "",
    height: "",
    weight: "",
    taxDetails: "GST 18%",
    origin: "India",
    returnEligible: true,
    returnWindow: "7",
    policyDetails: "Standard 7-day easy return policy applies.",
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  // --- 1. REAL-TIME VOLUMETRIC CALCULATION ---
  const volumetricWeight = useMemo(() => {
    const l = parseFloat(formData.length) || 0;
    const w = parseFloat(formData.width) || 0;
    const h = parseFloat(formData.height) || 0;
    return parseFloat(((l * w * h) / 5000).toFixed(2));
  }, [formData.length, formData.width, formData.height]);

  // --- 2. PERSISTENCE ENGINE ---
  useEffect(() => {
    const saved = localStorage.getItem("reecommerce_studio_draft_v4");
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem("reecommerce_studio_draft_v4");
      }
    } else {
      setFormData(prev => ({ ...prev, sku: `SKU-${Math.random().toString(36).substr(2, 9).toUpperCase()}` }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("reecommerce_studio_draft_v4", JSON.stringify(formData));
  }, [formData]);

  const isStepValid = (step: number) => {
    switch (step) {
      case 1: return videoFile !== null && formData.caption.trim().length >= 5;
      case 2: return formData.name.trim().length >= 3 && formData.description.trim().length >= 20 && galleryFiles.length > 0;
      case 3: return Number(formData.mrp) > 0 && Number(formData.price) > 0;
      case 4: return formData.length !== "" && formData.width !== "" && formData.height !== "" && formData.weight !== "";
      default: return false;
    }
  };

  const handleNext = () => {
    if (isStepValid(currentStep)) {
      setFormError(null);
      setCurrentStep(prev => prev + 1);
    } else {
      setFormError("Action Required: Please complete all fields and uploads in this phase.");
    }
  };

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
      let finalCoverUrl = videoRes.secure_url.replace(/\.[^/.]+$/, ".jpg");
      if (coverFile) {
        const coverRes = await uploadToCloudinary(coverFile, "reel_covers");
        finalCoverUrl = coverRes.secure_url;
      }
      setUploadProgress(50);
      const galleryUrls = await Promise.all(galleryFiles.map(file => uploadToCloudinary(file, "product_gallery")));
      const images = galleryUrls.map(res => res.secure_url);
      setUploadProgress(85);

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          videoUrl: videoRes.secure_url,
          thumbnailUrl: finalCoverUrl,
          images: images,
          imageUrl: images[0] || finalCoverUrl,
          dimensions: {
            length: Number(formData.length),
            width: Number(formData.width),
            height: Number(formData.height)
          },
          returnPolicy: {
            isEligible: formData.returnEligible,
            returnWindow: Number(formData.returnWindow),
            policyDetails: formData.policyDetails
          }
        }),
      });

      if (res.ok) {
        localStorage.removeItem("reecommerce_studio_draft_v4");
        router.push("/dashboard/seller/reels");
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (error: any) {
      setFormError(error.message || "Critical error during publishing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24 text-slate-900">
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-sm transition-all"><ChevronLeft size={18} /> Exit Studio</button>
        <div className="flex items-center gap-3">
          {UPLOAD_STEPS.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-1">
              <div className={`h-1 w-14 rounded-full transition-all duration-700 ${currentStep >= step.id ? 'bg-indigo-600 shadow-sm' : 'bg-slate-100'}`} />
              <span className={`text-[7px] font-black uppercase tracking-widest ${currentStep === step.id ? 'text-indigo-600' : 'text-slate-300'}`}>{step.name}</span>
            </div>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-12">
        {formError && (
          <div className="mb-8 flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-3xl text-sm font-bold animate-in slide-in-from-top-2">
            <AlertCircle size={20} /> {formError}
          </div>
        )}

        {/* --- STEP 1: CONTENT --- */}
        {currentStep === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-5xl font-black tracking-tighter italic">01. Content Design</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                 <div onClick={() => document.getElementById('v-up')?.click()} className="aspect-9/16 rounded-4xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-400 transition-all group relative">
                    {videoFile ? <video src={URL.createObjectURL(videoFile)} className="h-full w-full object-cover" /> : 
                    <div className="text-center"><UploadCloud size={48} className="text-slate-300 mx-auto mb-4 group-hover:text-indigo-600" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select MP4 Reel</p></div>}
                    <input id="v-up" type="file" accept="video/*" hidden onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                 </div>
                 <div onClick={() => document.getElementById('c-up')?.click()} className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-all group">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-200 text-slate-400 overflow-hidden shrink-0">
                        {coverFile ? <img src={URL.createObjectURL(coverFile)} className="w-full h-full object-cover" alt="cover" /> : <Camera size={24} />}
                    </div>
                    <div><p className="text-sm font-black text-slate-900 leading-none">Reel Cover Image</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Optional • Static Frame</p></div>
                    <input id="c-up" type="file" accept="image/*" hidden onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                 </div>
              </div>
              <div className="space-y-8 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Description Caption</label>
                  <textarea className="input-field h-48 resize-none bg-slate-50/50" placeholder="Tell your audience about the product..." value={formData.caption} onChange={(e) => setFormData({...formData, caption: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Discovery Tags</label>
                  <input className="input-field bg-slate-50/50" placeholder="#fashion #gadgets #2025" value={formData.hashtags} onChange={(e) => setFormData({...formData, hashtags: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 2: CATALOGING --- */}
        {currentStep === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
             <h2 className="text-5xl font-black tracking-tighter italic">02. Catalog Logic</h2>
             <div className="grid grid-cols-2 gap-6">
                <input className="input-field font-black text-xl" placeholder="Full Product Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <select className="input-field font-bold uppercase tracking-widest text-xs" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    <option>Electronics</option><option>Fashion</option><option>Home Decor</option><option>Wellness</option>
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Technical Specifications</label>
                <textarea className="input-field h-40 resize-none bg-slate-50/50" placeholder="Material, warranty, technical specs..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
             </div>
             <div className="space-y-4">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">High-Res Gallery (Shown in 'Details')</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    {galleryFiles.map((file, i) => (
                        <div key={i} className="relative aspect-square rounded-3xl overflow-hidden border border-slate-100 group shadow-sm">
                            <img src={URL.createObjectURL(file)} className="h-full w-full object-cover" alt="gallery" />
                            <button onClick={() => setGalleryFiles(f => f.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"><X size={12} /></button>
                        </div>
                    ))}
                    <label className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer text-slate-300 hover:bg-slate-50 hover:border-indigo-400 transition-all shadow-sm"><Plus size={28} /><input type="file" multiple accept="image/*" hidden onChange={(e) => setGalleryFiles(prev => [...prev, ...Array.from(e.target.files || [])])} /></label>
                </div>
             </div>
          </div>
        )}

        {/* --- STEP 3: FINANCIALS --- */}
        {currentStep === 3 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                <h2 className="text-5xl font-black tracking-tighter italic">03. Financial Control</h2>
                <div className="bg-slate-900 rounded-[3rem] p-12 grid grid-cols-2 gap-10 shadow-2xl shadow-indigo-100">
                    {[
                      { label: "List Price (MRP)", name: "mrp", ph: "₹ 0.00" },
                      { label: "Deal Price (Selling)", name: "price", ph: "₹ 0.00" },
                      { label: "Total Units in Stock", name: "stock", ph: "e.g. 100" },
                      { label: "Internal SKU ID", name: "sku", ph: "Auto-generated" }
                    ].map((f) => (
                      <div key={f.name} className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{f.label}</label>
                        <input 
                            className="w-full bg-slate-800 border-none rounded-2xl p-5 text-white font-black outline-none ring-1 ring-slate-700 focus:ring-indigo-500 transition-all" 
                            value={(formData as any)[f.name]} 
                            placeholder={f.ph}
                            onChange={(e) => setFormData({...formData, [f.name]: e.target.value})} 
                        />
                      </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- STEP 4: LOGISTICS & RETURN POLICY --- */}
        {currentStep === 4 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 pb-10">
                <h2 className="text-5xl font-black tracking-tighter italic">04. Final Shipment</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Dimensions & Volumetric Section */}
                  <div className="bg-slate-50 p-8 rounded-4xl border border-slate-100 space-y-6">
                    <div className="flex items-center gap-3 text-indigo-600 mb-2"><Ruler size={20} /><span className="text-xs font-black uppercase tracking-widest">Dimensions (cm)</span></div>
                    <div className="grid grid-cols-3 gap-3">
                      {['length', 'width', 'height'].map(dim => (
                        <input key={dim} className="input-field text-center text-sm font-bold" placeholder={dim[0].toUpperCase()} value={(formData as any)[dim]} onChange={(e) => setFormData({...formData, [dim]: e.target.value})} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <div><p className="text-[10px] font-black text-slate-400 uppercase">Computed Volumetric Weight</p><p className="text-xl font-black text-indigo-600">{volumetricWeight} kg</p></div>
                        <div className="p-3 bg-white rounded-2xl shadow-sm"><Box className="text-slate-300" /></div>
                    </div>
                  </div>

                  {/* Return Policy Section */}
                  <div className="bg-slate-50 p-8 rounded-4xl border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3 text-emerald-600"><RotateCcw size={20} /><span className="text-xs font-black uppercase tracking-widest">Return Policy</span></div>
                       <button onClick={() => setFormData(p => ({...p, returnEligible: !p.returnEligible}))} className={`w-12 h-6 rounded-full flex items-center px-1 transition-all ${formData.returnEligible ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all ${formData.returnEligible ? 'ml-auto' : 'ml-0'}`} />
                       </button>
                    </div>
                    {formData.returnEligible ? (
                      <div className="space-y-4 animate-in fade-in zoom-in-95">
                        <div className="flex items-center gap-4"><label className="text-[10px] font-black uppercase text-slate-400">Return Window</label><select className="bg-white border-none rounded-xl px-4 py-2 font-bold text-xs outline-none ring-1 ring-slate-200" value={formData.returnWindow} onChange={(e) => setFormData({...formData, returnWindow: e.target.value})}><option>7 Days</option><option>10 Days</option><option>30 Days</option></select></div>
                        <textarea className="w-full bg-white border-none rounded-2xl p-4 text-xs font-medium text-slate-500 ring-1 ring-slate-200 outline-none focus:ring-indigo-600" value={formData.policyDetails} onChange={(e) => setFormData({...formData, policyDetails: e.target.value})} />
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-rose-500 italic py-8 text-center bg-white rounded-2xl border border-rose-100">Warning: No-Return items have lower conversion rates.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4">
                    <input className="input-field" placeholder="Actual Weight (KG)" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} />
                    <input className="input-field" placeholder="Tax Info (e.g. GST 18%)" value={formData.taxDetails} onChange={(e) => setFormData({...formData, taxDetails: e.target.value})} />
                </div>
            </div>
        )}

        <footer className="mt-20 pt-10 border-t border-slate-100 flex items-center justify-between">
           <button disabled={currentStep === 1 || loading} onClick={() => setCurrentStep(s => s - 1)} className="flex items-center gap-2 font-black text-slate-400 hover:text-slate-900 transition-all disabled:opacity-0"><ChevronLeft /> Back</button>
           <div className="flex items-center gap-8">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Phase 0{currentStep} of 04</span>
              {currentStep < 4 ? (
                <button onClick={handleNext} className="btn-primary px-16 shadow-indigo-100">Continue <ChevronRight size={18} /></button>
              ) : (
                <button onClick={handleFinalSubmit} disabled={loading} className="btn-primary min-w-70 shadow-indigo-200 group">
                  {loading ? <div className="flex items-center gap-3"><Loader2 className="animate-spin" size={20} /><span>Publishing {uploadProgress}%</span></div> : <span className="flex items-center gap-2">Launch Marketplace Reel <ShieldCheck size={18} className="group-hover:animate-bounce" /></span>}
                </button>
              )}
           </div>
        </footer>
      </main>
    </div>
  );
}