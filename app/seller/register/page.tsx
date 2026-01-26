"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Store, ShoppingBag, ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function SellerRegisterPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/seller/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register store");
      }

      // Refresh the session to include the new 'seller' role
      await update({
        ...session,
        user: { ...session?.user, role: "seller" },
      });

      router.push("/seller/upload");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex flex-col items-center justify-center px-4 py-12">
      {/* Back Button */}
      <Link
        href="/"
        className="fixed top-8 left-8 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to marketplace
      </Link>

      <div className="w-full max-w-[480px]">
        {/* Header Icon Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Launch Your Shop
          </h1>
          <p className="mt-2 text-slate-600 font-medium">
            Turn your reels into revenue in minutes.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 border border-slate-100 p-8 md:p-10">
          {error && (
            <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">
                Shop Name
              </label>
              <div className="relative">
                <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Urban Threads"
                  className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl pl-12 pr-4 py-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">
                Tell your story
              </label>
              <textarea
                required
                placeholder="What makes your shop unique? (Buyers will see this on your profile)"
                rows={4}
                className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl px-4 py-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group bg-slate-900 text-white py-4 rounded-xl font-bold text-lg overflow-hidden transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Deploying Storefront...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
                    <span>Create Creator Account</span>
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Trust Badge */}
          <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-center gap-6 text-slate-400">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest font-bold">Secure</span>
              <span className="text-xs font-medium text-slate-500">Payments</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest font-bold">Fast</span>
              <span className="text-xs font-medium text-slate-500">Video Uploads</span>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          By continuing, you agree to our{" "}
          <Link href="#" className="underline decoration-indigo-200 hover:text-indigo-600 transition-colors">Seller Terms</Link>
        </p>
      </div>
    </div>
  );
}