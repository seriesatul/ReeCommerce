"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function SuccessPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white p-6 text-center">
      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 mb-2">Order Confirmed!</h1>
      <p className="text-slate-500 font-medium max-w-md mb-8">
        Thank you for shopping with ReeCommerce. We have sent a confirmation to your email.
      </p>
      
      <div className="flex gap-4">
        <Link href="/" className="btn-secondary">
          Continue Shopping
        </Link>
        {/* We will build the Orders page later, for now link to home */}
        <Link href="/" className="btn-primary flex items-center gap-2">
          View Orders <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}