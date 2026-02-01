"use client";

import { Landmark, Hash, UserCheck, AlertCircle } from "lucide-react";

interface Step3Props {
  formData: any;
  setFormData: (data: any) => void;
}

export default function Step3_Payouts({ formData, setFormData }: Step3Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Payout details</h2>
        <p className="text-sm text-slate-500">
          Where should we send your earnings? Payments are settled every Friday.
        </p>
      </div>

      <div className="space-y-5">
        {/* Account Holder Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            Account Holder Name
          </label>
          <input
            type="text"
            name="accountHolderName"
            placeholder="John Doe"
            className="input-field"
            value={formData.accountHolderName || ""}
            onChange={handleChange}
            required
          />
        </div>

        {/* Account Number */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Hash className="w-4 h-4 text-indigo-600" />
            Bank Account Number
          </label>
          <input
            type="password" // Use password type for security or standard text
            name="accountNumber"
            placeholder="000000000000"
            className="input-field"
            value={formData.accountNumber || ""}
            onChange={handleChange}
            required
          />
        </div>

        {/* IFSC / Routing Code */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-indigo-600" />
            IFSC / Routing Code
          </label>
          <input
            type="text"
            name="ifscCode"
            placeholder="SBIN0001234"
            className="input-field uppercase"
            value={formData.ifscCode || ""}
            onChange={handleChange}
            required
          />
        </div>

        {/* Security Notice */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-indigo-700 font-medium leading-relaxed">
            We use industry-standard encryption to protect your banking details. 
            ReeCommerce does not store your full account number in plain text.
          </p>
        </div>
      </div>
    </div>
  );
}