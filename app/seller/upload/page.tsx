"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  UploadCloud, 
  Video, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle,
  DollarSign,
  Package,
  Type,
  LayoutGrid,
  Loader2
} from "lucide-react";

export default function UploadReelPage() {
  const router = useRouter();
  
  // File States
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Logic States
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Electronics",
    stock: "10"
  });

  // Handle File Selection with Preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'video') {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    } else {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file: File, folder: string) => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = { timestamp, folder };

    const sigRes = await fetch("/api/cloudinary-signature", {
      method: "POST",
      body: JSON.stringify({ paramsToSign }),
    });
    const { signature } = await sigRes.json();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("signature", signature);
    formData.append("timestamp", timestamp.toString());
    formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
    formData.append("folder", folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${file.type.startsWith("video") ? "video" : "image"}/upload`,
      { method: "POST", body: formData }
    );
    
    return await res.json();
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !imageFile) {
      alert("Please upload both a reel and a product image.");
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      setProgress(30);
      const videoData = await uploadToCloudinary(videoFile, "reecommerce_reels");
      
      setProgress(60);
      const imageData = await uploadToCloudinary(imageFile, "product_images");

      setProgress(90);
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productData,
          videoUrl: videoData.secure_url,
          thumbnailUrl: imageData.secure_url,
          price: Number(productData.price),
          stock: Number(productData.stock),
        }),
      });

      if (res.ok) router.push("/");
      else alert("Backend save failed.");
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-5xl mx-auto px-4 pt-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Listing Studio</h1>
            <p className="text-slate-500 font-medium mt-1">Create a video-first shopping experience.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full">
            <CheckCircle2 className="w-4 h-4" />
            Seller Account Active
          </div>
        </div>

        <form onSubmit={handlePublish} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Product Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-lg mb-2">
                <Type className="w-5 h-5 text-indigo-500" />
                Product Information
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Product Name" 
                    className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                    onChange={e => setProductData({...productData, name: e.target.value})} 
                    required 
                  />
                </div>

                <textarea 
                  placeholder="Describe your product. What makes it special?" 
                  className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all outline-none h-40 resize-none"
                  onChange={e => setProductData({...productData, description: e.target.value})} 
                  required 
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" 
                      placeholder="Price" 
                      className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl pl-10 pr-4 py-4 focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                      onChange={e => setProductData({...productData, price: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" 
                      placeholder="Stock" 
                      className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl pl-10 pr-4 py-4 focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                      onChange={e => setProductData({...productData, stock: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="relative">
                    <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select 
                      className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl pl-10 pr-4 py-4 focus:ring-2 focus:ring-indigo-600 transition-all outline-none appearance-none"
                      onChange={e => setProductData({...productData, category: e.target.value})}
                    >
                      <option>Electronics</option>
                      <option>Fashion</option>
                      <option>Home</option>
                      <option>Beauty</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Media Upload Studio */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Reel Upload */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 text-slate-800 font-bold mb-4">
                <Video className="w-5 h-5 text-rose-500" />
                The Reel
              </div>
              
              <label className="group relative flex flex-col items-center justify-center w-full aspect-[9/16] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition-all cursor-pointer overflow-hidden">
                {videoPreview ? (
                  <video src={videoPreview} className="w-full h-full object-cover" autoPlay muted loop />
                ) : (
                  <div className="flex flex-col items-center p-4 text-center">
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6 text-indigo-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">Upload Video</p>
                    <p className="text-xs text-slate-400 mt-1">Vertical 9:16 preferred</p>
                  </div>
                )}
                <input type="file" accept="video/*" className="hidden" onChange={e => handleFileChange(e, 'video')} />
              </label>
            </div>

            {/* Image Upload */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 text-slate-800 font-bold mb-4">
                <ImageIcon className="w-5 h-5 text-emerald-500" />
                Sample Photo
              </div>
              
              <label className="group relative flex flex-col items-center justify-center w-full aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition-all cursor-pointer overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="flex flex-col items-center p-4 text-center">
                    <UploadCloud className="w-5 h-5 text-indigo-600 mb-2" />
                    <p className="text-xs font-bold text-slate-700">Add Thumbnail</p>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'image')} />
              </label>
            </div>

            {/* Publish Button */}
            <button 
              type="submit" 
              disabled={uploading}
              className="w-full bg-slate-900 text-white rounded-2xl py-5 font-bold text-lg shadow-xl shadow-slate-200 hover:bg-indigo-600 active:scale-95 transition-all disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Publishing {progress}%</span>
                </>
              ) : (
                "Publish Product Reel"
              )}
            </button>
            
            {uploading && (
              <div className="flex items-center gap-2 justify-center text-xs text-indigo-600 font-bold animate-pulse">
                <AlertCircle className="w-3 h-3" />
                Don't close this tab
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}