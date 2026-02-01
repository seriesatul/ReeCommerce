"use client";

import { User, Briefcase, CreditCard, ShieldCheck } from "lucide-react";

interface Step2Props {
  formData: any;
  setFormData: (data: any) => void;
}

export default function Step2_Verification({ formData, setFormData }: Step2Props) {
  const handleTypeSelect = (type: "individual" | "business") => {
    setFormData({ ...formData, businessType: type });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Verify your identity</h2>
        <p className="text-sm text-slate-500">
          This helps us prevent fraud and keep the marketplace secure.
        </p>
      </div>

      {/* Business Type Selector */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleTypeSelect("individual")}
          className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
            formData.businessType === "individual"
              ? "border-indigo-600 bg-indigo-50/50"
              : "border-slate-100 bg-white hover:border-slate-200"
          }`}
        >
          <User className={`w-6 h-6 ${formData.businessType === "individual" ? "text-indigo-600" : "text-slate-400"}`} />
          <span className={`text-sm font-bold ${formData.businessType === "individual" ? "text-indigo-600" : "text-slate-600"}`}>
            Individual
          </span>
        </button>

        <button
          onClick={() => handleTypeSelect("business")}
          className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
            formData.businessType === "business"
              ? "border-indigo-600 bg-indigo-50/50"
              : "border-slate-100 bg-white hover:border-slate-200"
          }`}
        >
          <Briefcase className={`w-6 h-6 ${formData.businessType === "business" ? "text-indigo-600" : "text-slate-400"}`} />
          <span className={`text-sm font-bold ${formData.businessType === "business" ? "text-indigo-600" : "text-slate-600"}`}>
            Business
          </span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Full Legal Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            {formData.businessType === "individual" ? "Full Legal Name" : "Registered Business Name"}
          </label>
          <input
            type="text"
            name="legalName"
            placeholder={formData.businessType === "individual" ? "As per ID card" : "Company Name Pvt Ltd"}
            className="input-field"
            value={formData.legalName || ""}
            onChange={handleChange}
            required
          />
        </div>

        {/* PAN / Tax ID */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            Tax ID / PAN Number
          </label>
          <input
            type="text"
            name="panNumber"
            placeholder="ABCDE1234F"
            className="input-field uppercase tracking-widest"
            maxLength={10}
            value={formData.panNumber || ""}
            onChange={handleChange}
            required
          />
          <p className="text-[10px] text-slate-400 font-medium">
            Your ID is encrypted and never shared publicly.
          </p>
        </div>
      </div>
    </div>
  );
}