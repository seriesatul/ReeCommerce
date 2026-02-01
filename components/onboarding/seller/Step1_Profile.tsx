"use client";

import { ShoppingBag, AtSign, AlignLeft } from "lucide-react";

interface Step1Props {
  formData: any;
  setFormData: (data: any) => void;
}

export default function Step1_Profile({ formData, setFormData }: Step1Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Logic for handle: Auto-format to lowercase, no spaces
    if (name === "shopHandle") {
      const formattedHandle = value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      setFormData({ ...formData, [name]: formattedHandle });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Tell us about your brand</h2>
        <p className="text-sm text-slate-500">This information will be visible to all buyers on the platform.</p>
      </div>

      <div className="space-y-4">
        {/* Shop Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
            Shop Name
          </label>
          <input
            type="text"
            name="shopName"
            placeholder="e.g. Midnight Vintage"
            className="input-field"
            value={formData.shopName}
            onChange={handleChange}
            required
          />
        </div>

        {/* Shop Handle (Unique URL) */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <AtSign className="w-4 h-4 text-indigo-600" />
            Unique Handle
          </label>
          <div className="relative">
            <input
              type="text"
              name="shopHandle"
              placeholder="midnight-vintage"
              className="input-field"
              value={formData.shopHandle}
              onChange={handleChange}
              required
            />
          </div>
          {formData.shopHandle && (
            <p className="text-[10px] font-medium text-indigo-500 ml-1 italic">
              Your store URL: reecommerce.com/store/{formData.shopHandle}
            </p>
          )}
        </div>

        {/* Shop Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-indigo-600" />
            Short Bio
          </label>
          <textarea
            name="shopDescription"
            rows={4}
            placeholder="What makes your shop special? (Min 20 characters)"
            className="input-field resize-none"
            value={formData.shopDescription}
            onChange={handleChange}
            required
          />
          <div className="flex justify-end">
            <span className={`text-[10px] font-bold ${formData.shopDescription.length < 20 ? 'text-slate-400' : 'text-indigo-600'}`}>
              {formData.shopDescription.length} / 200 characters
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}