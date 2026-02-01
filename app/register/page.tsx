"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight,
  Loader2,
  CheckCircle2
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  
  // 1. FORM STATE
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  // 2. UI STATE
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // 3. LIVE PASSWORD STRENGTH LOGIC
  useEffect(() => {
    let strength = 0;
    if (formData.password.length >= 6) strength++;
    if (/[A-Z]/.test(formData.password)) strength++;
    if (/[0-9]/.test(formData.password)) strength++;
    if (/[^A-Za-z0-9]/.test(formData.password)) strength++;
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!formData.acceptTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Registration failed");

      // CONNECTED FLOW: Move directly to Buyer Onboarding (Interests/Personalization)
      router.push("/onboarding/buyer?welcome=true");
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      
      {/* LEFT SIDE: VISION/BRANDING (Desktop Only) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 relative overflow-hidden">
        {/* Abstract Background Decor */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -ml-32 -mb-32" />

        <Link href="/" className="relative z-10 flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">ReeCommerce</span>
        </Link>

        <div className="relative z-10">
          <h2 className="text-5xl font-black text-white leading-tight mb-6">
            The next generation of <br />
            <span className="text-indigo-400 italic font-serif">social commerce.</span>
          </h2>
          <div className="space-y-4">
            {[
              "Experience products through vertical video.",
              "Follow your favorite creators and stores.",
              "Seamless checkout in under 30 seconds."
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-400 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                {text}
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-slate-500 text-sm font-bold uppercase tracking-widest">
          EST. 2025 • JOIN THE MOVEMENT
        </p>
      </div>

      {/* RIGHT SIDE: REGISTRATION FORM */}
      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-10">
          
          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Create Account</h1>
            <p className="text-slate-500 font-medium italic">Join 12,000+ shoppers today.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Atul Singh"
                  className="input-field pl-11"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="atul@example.com"
                  className="input-field pl-11"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
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
              
              {/* STRENGTH INDICATOR */}
              <div className="flex gap-1 mt-2 px-1">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      i < passwordStrength 
                        ? (passwordStrength <= 2 ? "bg-orange-400" : "bg-indigo-600") 
                        : "bg-slate-100"
                    }`} 
                  />
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
              <input
                type="password"
                required
                className="input-field"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-1">
                <input 
                  type="checkbox" 
                  className="peer appearance-none w-5 h-5 border-2 border-slate-200 rounded-md checked:bg-indigo-600 checked:border-indigo-600 transition-all"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({...formData, acceptTerms: e.target.checked})}
                />
                <CheckCircle2 className="absolute w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform" />
              </div>
              <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                I agree to the <span className="text-indigo-600 underline">Terms of Service</span> and <span className="text-indigo-600 underline">Privacy Policy</span>.
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Start Exploring</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm font-bold text-slate-500">
            Already a member?{" "}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 transition-colors underline decoration-2 underline-offset-4">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}