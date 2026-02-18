"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, ShoppingBag, Loader2 } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white p-6 text-center">
      <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-8 animate-in zoom-in duration-500">
        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
      </div>

      <div className="space-y-2 mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Order Confirmed!</h1>
        <p className="text-slate-500 font-medium max-w-md mx-auto">
          Your transaction was successful. Our sellers have been notified and are preparing your package.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        {/* If orderId exists, link to the specific tracking page, else fallback to home */}
        <Link 
          href={orderId ? `/orders/${orderId}` : "/"} 
          className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 shadow-indigo-200"
        >
          {orderId ? "Track Order" : "Back to Home"} <ArrowRight className="w-4 h-4" />
        </Link>
        
        <Link 
          href="/" 
          className="flex-1 bg-slate-50 text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" /> Continue
        </Link>
      </div>

      {orderId && (
        <p className="mt-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Reference ID: {orderId.slice(-12)}
        </p>
      )}
    </div>
  );
}

export default function SuccessPage() {
  return (
    // Industry Practice: useSearchParams must be inside Suspense
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}