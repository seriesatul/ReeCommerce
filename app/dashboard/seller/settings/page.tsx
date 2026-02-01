"use client";

import { useState, useEffect } from "react";
import { 
  Store as StoreIcon, 
  AtSign, 
  AlignLeft, 
  Upload, 
  Check, 
  Loader2, 
  Globe 
} from "lucide-react";
import Image from "next/image";

export default function SellerSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    handle: "",
    description: "",
    logoUrl: ""
  });

  useEffect(() => {
    fetch("/api/seller/profile")
      .then(res => res.json())
      .then(data => {
        setFormData({
          name: data.name,
          handle: data.handle,
          description: data.description,
          logoUrl: data.logoUrl || ""
        });
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/seller/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) alert("Profile updated successfully!");
      else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 font-medium">Manage your shop profile and public presence.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Branding */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
            <StoreIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-black text-slate-900">Shop Branding</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Logo Upload Area */}
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Shop Logo</label>
              <div className="relative group w-32 h-32">
                <div className="w-full h-full rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center">
                  {formData.logoUrl ? (
                    <Image src={formData.logoUrl} alt="Logo" fill className="object-cover" />
                  ) : (
                    <StoreIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <button type="button" className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                  <Upload className="w-6 h-6 text-white" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">
                Recommended: Square 500x500px. <br />PNG or JPG only.
              </p>
            </div>

            {/* Basic Info Inputs */}
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Shop Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Unique Handle</label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    className="input-field pl-10 font-bold" 
                    value={formData.handle} 
                    onChange={e => setFormData({...formData, handle: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    required 
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-2 px-1">
                  <Globe className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500">
                    reecommerce.com/store/{formData.handle}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Shop Description (Bio)</label>
            <textarea 
              className="input-field min-h-[120px] resize-none" 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Tell your customers about your brand..."
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between bg-slate-900 p-6 rounded-3xl shadow-xl shadow-indigo-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-sm font-bold text-white">Your changes are automatically saved as draft.</p>
          </div>
          <button 
            type="submit" 
            disabled={saving}
            className="btn-primary bg-white text-slate-900 hover:bg-indigo-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}