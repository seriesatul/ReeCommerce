"use client";

import { useEffect, useState } from "react";
import { 
  Package, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Video, 
  AlertCircle,
  Loader2,
  Filter
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ProductManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/seller/products");
        const data = await res.json();
        if (Array.isArray(data)) setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Products</h1>
          <p className="text-slate-500 font-medium">Manage your inventory and pricing.</p>
        </div>
        <Link href="/seller/upload" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search inventory..." 
            className="input-field pl-12 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="btn-secondary flex items-center gap-2 py-2 text-sm">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <select className="input-field py-2 text-sm font-bold bg-white">
            <option>All Categories</option>
            <option>Low Stock</option>
          </select>
        </div>
      </div>

      {/* Product Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Product</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Pricing & Stock</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Marketing</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{product.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {product._id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                      {product.category}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-900">${product.price.toFixed(2)}</p>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 5 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <p className={`text-xs font-bold ${product.stock > 5 ? 'text-slate-500' : 'text-rose-600'}`}>
                          {product.stock} in stock
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${product.reelCount > 0 ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                        <Video className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{product.reelCount} Reels</span>
                      </div>
                      {product.reelCount === 0 && (
                        <div className="group relative">
                          <AlertCircle className="w-4 h-4 text-orange-400" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Needs Video for Discovery
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
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