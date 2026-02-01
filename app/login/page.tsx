"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Loader2, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

// Using a wrapper component because useSearchParams requires a Suspense boundary in Next.js
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 1. STATE
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 2. CHECK FOR URL ALERTS (e.g., from registration success)
  useEffect(() => {
    const msg = searchParams.get("success");
    const err = searchParams.get("error");
    if (msg) setSuccess(msg);
    if (err) setError(err);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await signIn("credentials", {
      redirect: false,
      email: formData.email,
      password: formData.password,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      
      {/* LEFT SIDE: BRANDING (Consistent with Register Page) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full -mr-48 -mt-48" />
        
        <Link href="/" className="relative z-10 flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">ReeCommerce</span>
        </Link>

        <div className="relative z-10">
          <h2 className="text-5xl font-black text-white leading-tight mb-6">
            Welcome back to the <br />
            <span className="text-indigo-400 italic font-serif">future of shopping.</span>
          </h2>
          <p className="text-slate-400 text-lg font-medium max-w-md">
            Log in to access your personalized feed, saved reels, and track your orders.
          </p>
        </div>

        <p className="relative z-10 text-slate-500 text-sm font-bold uppercase tracking-widest">
          EST. 2025 • PREMIUM SOCIAL COMMERCE
        </p>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-10">
          
          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Sign In</h1>
            <p className="text-slate-500 font-medium">Enter your credentials to continue.</p>
          </div>

          {/* ALERTS */}
          <div className="space-y-3">
            {success && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                {success}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                {error}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="input-field pl-11"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Password</label>
                <Link href="#" className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-tighter">Forgot Password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="input-field pl-11 pr-12"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* SOCIAL LOGIN */}
          <div className="space-y-4">
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Or use social</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <button
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-[0.98]"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
              Sign in with Google
            </button>
          </div>

          <p className="text-center text-sm font-bold text-slate-500">
            New to the platform?{" "}
            <Link href="/register" className="text-indigo-600 hover:text-indigo-700 transition-colors underline decoration-2 underline-offset-4">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}