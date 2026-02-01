"use client";

import { useEffect, useState } from "react";
import { 
  Video, 
  Eye, 
  Heart, 
  MessageSquare, 
  MoreVertical, 
  Plus, 
  Search,
  Loader2,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ReelsStudio() {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const res = await fetch("/api/seller/reels");
        const data = await res.json();
        if (Array.isArray(data)) setReels(data);
      } catch (err) {
        console.error("Failed to fetch reels", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Reels Studio</h1>
          <p className="text-slate-500 font-medium">Manage and track your video performance.</p>
        </div>
        <Link href="/seller/upload" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Reel
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by product name..." 
            className="w-full bg-slate-50 border-none rounded-xl pl-11 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
          />
        </div>
        <select className="bg-slate-50 border-none text-xs font-bold rounded-xl px-4 py-2 outline-none">
          <option>All Content</option>
          <option>Top Performing</option>
          <option>Low Stock Linked</option>
        </select>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : reels.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-100 rounded-3xl p-20 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No reels uploaded yet</h3>
          <p className="text-slate-500 mb-6">Upload your first product reel to start seeing analytics.</p>
          <Link href="/seller/upload" className="btn-primary inline-flex">Upload Now</Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Reel</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Linked Product</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Performance</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reels.map((reel) => (
                <tr key={reel._id} className="hover:bg-slate-50/30 transition-colors group">
                  {/* Reel Preview */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 aspect-[9/16] rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                        <Image 
                          src={reel.thumbnailUrl} 
                          alt="Reel" 
                          fill 
                          className="object-cover"
                        />
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        Uploaded <br />
                        <span className="text-slate-900 font-bold">{new Date(reel.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </td>

                  {/* Product Info */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">{reel.productId?.name || "Deleted Product"}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600">${reel.productId?.price}</span>
                        <span className="text-xs font-medium text-slate-400">• {reel.productId?.stock} in stock</span>
                      </div>
                    </div>
                  </td>

                  {/* Metrics */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 text-sm font-black text-slate-900">
                          <Eye className="w-3.5 h-3.5 text-blue-500" /> {reel.viewsCount || 0}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Views</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 text-sm font-black text-slate-900">
                          <Heart className="w-3.5 h-3.5 text-rose-500" /> {reel.likesCount || 0}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Likes</span>
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-indigo-600 border border-transparent hover:border-slate-100">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}