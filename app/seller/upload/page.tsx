"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Video, Package, Truck, ShieldCheck, 
  ChevronRight, ChevronLeft, Loader2, 
  Plus, X, UploadCloud, Image as ImageIcon,
  Tag, AlertCircle, Camera
} from "lucide-react";
import Image from "next/image";

const UPLOAD_STEPS = [
  { id: 1, name: "Reel Content", icon: Video },
  { id: 2, name: "Gallery & Info", icon: ImageIcon },
  { id: 3, name: "Pricing & Stock", icon: Tag },
  { id: 4, name: "Logistics", icon: Truck },
];

// 1. ADDED: Explicit Interface for Type Safety
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
  weight: string;
  taxDetails: string;
  origin: string;
  returnEligible: boolean;
}

export default function UploadStudio() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  // --- 2. FIXED: Initial state now includes all properties from the interface ---
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
    weight: "",
    taxDetails: "GST 18%",
    origin: "India",
    returnEligible: true, // This was missing in the inferred type previously
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("reecommerce_draft_v3");
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem("reecommerce_draft_v3");
      }
    } else {
      setFormData(prev => ({ ...prev, sku: `SKU-${Math.random().toString(36).substr(2, 9).toUpperCase()}` }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("reecommerce_draft_v3", JSON.stringify(formData));
  }, [formData]);

  const isStepValid = (step: number) => {
    switch (step) {
      case 1: return videoFile !== null && formData.caption.trim().length >= 5;
      case 2: return formData.name.trim().length >= 3 && formData.description.trim().length >= 20 && galleryFiles.length > 0;
      case 3: return Number(formData.mrp) > 0 && Number(formData.price) > 0 && Number(formData.mrp) >= Number(formData.price);
      case 4: return formData.weight.length > 0 && formData.taxDetails.length > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (isStepValid(currentStep)) {
      setFormError(null);
      setCurrentStep(prev => prev + 1);
    } else {
      setFormError("Please complete all required fields and media for this phase.");
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
        }),
      });

      if (res.ok) {
        localStorage.removeItem("reecommerce_draft_v3");
        router.push("/dashboard/seller/reels");
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (error: any) {
      setFormError(error.message || "Failed to publish listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-sm transition-all">
            <ChevronLeft size={18} /> Exit Studio
          </button>
          
          <div className="flex items-center gap-3">
            {UPLOAD_STEPS.map((step) => (
              <div key={step.id} className="flex flex-col items-center gap-1">
                <div className={`h-1.5 w-16 rounded-full transition-all duration-700 ${currentStep >= step.id ? 'bg-indigo-600' : 'bg-slate-100'}`} />
                <span className={`text-[8px] font-black uppercase tracking-tighter ${currentStep === step.id ? 'text-indigo-600' : 'text-slate-300'}`}>{step.name}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-12">
        {formError && (
          <div className="mb-8 flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} /> {formError}
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight italic">01. Design Content</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                 <div onClick={() => document.getElementById('v-up')?.click()} className="aspect-9/16 rounded-4xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-400 transition-all group relative">
                    {videoFile ? <video src={URL.createObjectURL(videoFile)} className="h-full w-full object-cover" /> : 
                    <div className="text-center p-8"><UploadCloud size={48} className="text-slate-300 mx-auto mb-4 group-hover:text-indigo-600" /><p className="text-xs font-black text-slate-400 uppercase">Drop Product Reel (MP4)</p></div>}
                    <input id="v-up" type="file" accept="video/*" hidden onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                 </div>
                 <div onClick={() => document.getElementById('c-up')?.click()} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-all">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 text-slate-400">
                        {coverFile ? <img src={URL.createObjectURL(coverFile)} className="w-full h-full object-cover rounded-xl" alt="cover" /> : <Camera size={20} />}
                    </div>
                    <div><p className="text-xs font-bold text-slate-900">Reel Cover Image</p><p className="text-[10px] text-slate-400 font-medium">Click to upload custom cover</p></div>
                    <input id="c-up" type="file" accept="image/*" hidden onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                 </div>
              </div>
              <div className="space-y-6">
                <textarea className="input-field h-44 resize-none" placeholder="Captivating caption..." value={formData.caption} onChange={(e) => setFormData({...formData, caption: e.target.value})} />
                <input className="input-field" placeholder="Hashtags #vibe #tech" value={formData.hashtags} onChange={(e) => setFormData({...formData, hashtags: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
             <h2 className="text-4xl font-black text-slate-900 tracking-tight italic">02. Cataloging</h2>
             <div className="grid grid-cols-2 gap-6">
                <input className="input-field font-bold" placeholder="Product Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <select className="input-field font-bold uppercase" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    <option>Electronics</option><option>Fashion</option><option>Home Decor</option>
                </select>
             </div>
             <textarea className="input-field h-32 resize-none" placeholder="Technical specs..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
             <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {galleryFiles.map((file, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group">
                        <img src={URL.createObjectURL(file)} className="h-full w-full object-cover" alt="gallery" />
                        <button onClick={() => setGalleryFiles(f => f.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100"><X size={10} /></button>
                    </div>
                ))}
                <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer text-slate-300 hover:bg-slate-50 transition-all"><Plus size={20} /><input type="file" multiple accept="image/*" hidden onChange={(e) => setGalleryFiles(prev => [...prev, ...Array.from(e.target.files || [])])} /></label>
             </div>
          </div>
        )}

        {currentStep === 3 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight italic">03. Financials</h2>
                <div className="bg-slate-900 rounded-4xl p-10 grid grid-cols-2 gap-8">
                    {[
                      { label: "MRP", name: "mrp" },
                      { label: "Price", name: "price" },
                      { label: "Stock", name: "stock" },
                      { label: "SKU", name: "sku" }
                    ].map((f) => (
                      <div key={f.name} className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{f.label}</label>
                        <input 
                            className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white font-black outline-none ring-1 ring-slate-700" 
                            value={(formData as any)[f.name]} 
                            onChange={(e) => setFormData({...formData, [f.name]: e.target.value})} 
                        />
                      </div>
                    ))}
                </div>
            </div>
        )}

        {currentStep === 4 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight italic">04. Shipment</h2>
                <div className="grid grid-cols-2 gap-6">
                    <input className="input-field" placeholder="Weight (KG)" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} />
                    <input className="input-field" placeholder="Tax (e.g. GST 18%)" value={formData.taxDetails} onChange={(e) => setFormData({...formData, taxDetails: e.target.value})} />
                </div>
                {/* FIXED: returnEligible toggle logic and CSS */}
                <div className="p-8 bg-slate-50 rounded-4xl border border-slate-100 flex items-center justify-between cursor-pointer" onClick={() => setFormData(prev => ({...prev, returnEligible: !prev.returnEligible}))}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl transition-colors ${formData.returnEligible ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}><ShieldCheck /></div>
                        <div><p className="font-black text-slate-900 uppercase text-xs tracking-widest">Return Policy</p><p className="text-sm text-slate-500 font-medium italic">7-Day easy returns and replacements enabled</p></div>
                    </div>
                    <div className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${formData.returnEligible ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${formData.returnEligible ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                </div>
            </div>
        )}

        <footer className="mt-20 pt-8 border-t border-slate-100 flex items-center justify-between">
           <button disabled={currentStep === 1 || loading} onClick={() => setCurrentStep(s => s - 1)} className="flex items-center gap-2 font-black text-slate-400 hover:text-slate-900 transition-all disabled:opacity-0"><ChevronLeft /> Back</button>
           <div className="flex items-center gap-6">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Phase 0{currentStep} / 04</span>
              {currentStep < 4 ? (
                <button onClick={handleNext} className="btn-primary px-12">Continue <ChevronRight size={18} /></button>
              ) : (
                <button onClick={handleFinalSubmit} disabled={loading} className="btn-primary min-w-70 shadow-indigo-200">
                  {loading ? <div className="flex items-center gap-2 justify-center"><Loader2 className="animate-spin" size={18} /><span>Processing {uploadProgress}%</span></div> : "Publish Listing"}
                </button>
              )}
           </div>
        </footer>
      </main>
    </div>
  );
}