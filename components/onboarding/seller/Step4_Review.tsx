"use client";

import { CheckCircle2, Store, ShieldCheck, Landmark, Edit3 } from "lucide-react";

interface Step4Props {
  formData: any;
  setCurrentStep: (step: number) => void;
}

export default function Step4_Review({ formData, setCurrentStep }: Step4Props) {
  // Utility to mask sensitive strings (e.g., PAN and Bank Account)
  const maskString = (str: string, visibleChars: number = 4) => {
    if (!str) return "N/A";
    return "*".repeat(str.length - visibleChars) + str.slice(-visibleChars);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mb-2">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Review your details</h2>
        <p className="text-sm text-slate-500">
          Almost there! Please double-check your info before launching your shop.
        </p>
      </div>

      <div className="space-y-4">
        {/* Section 1: Shop Profile */}
        <div className="border border-slate-100 rounded-2xl p-5 relative group">
          <button 
            onClick={() => setCurrentStep(1)}
            className="absolute top-4 right-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-3 text-indigo-600 font-bold text-xs uppercase tracking-widest">
            <Store className="w-4 h-4" />
            Shop Identity
          </div>
          <div className="grid grid-cols-2 gap-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Shop Name</p>
              <p className="text-sm font-bold text-slate-900">{formData.shopName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Handle</p>
              <p className="text-sm font-bold text-slate-900">@{formData.shopHandle}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Bio</p>
              <p className="text-sm text-slate-600 line-clamp-2">{formData.shopDescription}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Verification */}
        <div className="border border-slate-100 rounded-2xl p-5 relative group">
          <button 
            onClick={() => setCurrentStep(2)}
            className="absolute top-4 right-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-3 text-indigo-600 font-bold text-xs uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            Legal & Tax
          </div>
          <div className="grid grid-cols-2 gap-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Entity Type</p>
              <p className="text-sm font-bold capitalize text-slate-900">{formData.businessType}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Tax ID / PAN</p>
              <p className="text-sm font-bold text-slate-900 font-mono tracking-tighter">
                {maskString(formData.panNumber, 3)}
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Payouts */}
        <div className="border border-slate-100 rounded-2xl p-5 relative group">
          <button 
            onClick={() => setCurrentStep(3)}
            className="absolute top-4 right-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-3 text-indigo-600 font-bold text-xs uppercase tracking-widest">
            <Landmark className="w-4 h-4" />
            Bank Details
          </div>
          <div className="grid grid-cols-2 gap-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Holder Name</p>
              <p className="text-sm font-bold text-slate-900">{formData.accountHolderName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Account Number</p>
              <p className="text-sm font-bold text-slate-900 font-mono tracking-tighter">
                {maskString(formData.accountNumber, 4)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}