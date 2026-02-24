"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail, Lock, Eye, EyeOff, Loader2,
  ArrowRight, CheckCircle2, AlertCircle, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#0A1628]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { status } = useSession();
  const searchParams = useSearchParams();

  const [formData, setFormData]       = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [focused, setFocused]         = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") window.location.replace("/");
  }, [status]);

  // URL message params
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
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email.toLowerCase(),
        password: formData.password,
      });
      if (result?.error) { setError(result.error); setLoading(false); }
      else window.location.href = "/";
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  // Session loading / already authed — prevent flicker
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#0A1628]" />
        <p
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "#9BA8C0", fontFamily: "'DM Sans', sans-serif" }}
        >
          Verifying session…
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
      `}</style>

      <div
        className="min-h-screen grid lg:grid-cols-[1fr_1fr] bg-white"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >

        {/* ══ LEFT — BRAND PANEL ════════════════════════════════ */}
        <div
          className="hidden lg:flex flex-col justify-between p-14 relative overflow-hidden"
          style={{ background: "#0A1628" }}
        >
          {/* Subtle texture dots */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* Top glow accent */}
          <div
            className="absolute top-0 right-0 w-[480px] h-[480px] pointer-events-none"
            style={{
              background: "radial-gradient(circle at top right, rgba(26,58,107,0.7) 0%, transparent 65%)",
            }}
          />

          {/* Logo */}
          <Link href="/" className="relative z-10 flex items-center gap-2.5 group w-fit">
            <div
              className="w-9 h-9 rounded-[9px] flex items-center justify-center transition-opacity group-hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span
              className="text-white font-bold leading-none tracking-tight"
              style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.3rem" }}
            >
              Re<em className="italic font-light">commerce</em>
            </span>
          </Link>

          {/* Center copy */}
          <div className="relative z-10 space-y-6">
            <h2
              className="leading-[0.92] tracking-tight"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: "clamp(2.6rem, 4vw, 4rem)",
                color: "white",
                letterSpacing: "-0.025em",
              }}
            >
              Welcome back
              <br />
              <em
                className="italic font-light"
                style={{ color: "rgba(255,255,255,0.38)" }}
              >
                to the feed.
              </em>
            </h2>
            <p
              className="leading-relaxed max-w-sm text-base"
              style={{ color: "rgba(255,255,255,0.42)", fontWeight: 400 }}
            >
              Sign in to access your curated reel feed, track orders,
              and connect with verified sellers.
            </p>
          </div>

          {/* Bottom rule */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              Secured · Est. 2025
            </p>
          </div>
        </div>

        {/* ══ RIGHT — FORM PANEL ═══════════════════════════════ */}
        <div className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[400px] space-y-8"
          >

            {/* Mobile logo */}
            <Link href="/" className="flex lg:hidden items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-[8px] flex items-center justify-center"
                style={{ background: "#0A1628" }}
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span
                className="font-bold leading-none tracking-tight"
                style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.2rem", color: "#0A1628" }}
              >
                Re<em className="italic font-light">commerce</em>
              </span>
            </Link>

            {/* Heading */}
            <div className="space-y-1.5">
              <h1
                className="leading-tight tracking-tight"
                style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: "clamp(1.9rem, 3vw, 2.4rem)",
                  color: "#0A1628",
                  letterSpacing: "-0.02em",
                }}
              >
                Sign in
              </h1>
              <p className="text-sm" style={{ color: "#9BA8C0" }}>
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold transition-colors"
                  style={{ color: "#0A1628" }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.6")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  Create one →
                </Link>
              </p>
            </div>

            {/* Alerts */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-emerald-700">{success}</p>
                </motion.div>
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "#FFF1F2", border: "1px solid #FECDD3" }}
                >
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-rose-600">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  className="block text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: "#9BA8C0" }}
                >
                  Email
                </label>
                <div
                  className="relative flex items-center rounded-xl overflow-hidden transition-all duration-150"
                  style={{
                    border: `1px solid ${focused === "email" ? "#0A1628" : "#E4E9F2"}`,
                    background: focused === "email" ? "white" : "#FAFAFA",
                  }}
                >
                  <Mail
                    className="absolute left-4 w-4 h-4 pointer-events-none"
                    style={{ color: focused === "email" ? "#0A1628" : "#9BA8C0" }}
                  />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    className="w-full pl-11 pr-4 py-3.5 bg-transparent outline-none text-sm font-medium placeholder:font-normal"
                    style={{
                      color: "#0A1628",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="block text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: "#9BA8C0" }}
                  >
                    Password
                  </label>
                  <Link
                    href="#"
                    className="text-[11px] font-semibold transition-opacity hover:opacity-60"
                    style={{ color: "#0A1628" }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div
                  className="relative flex items-center rounded-xl overflow-hidden transition-all duration-150"
                  style={{
                    border: `1px solid ${focused === "password" ? "#0A1628" : "#E4E9F2"}`,
                    background: focused === "password" ? "white" : "#FAFAFA",
                  }}
                >
                  <Lock
                    className="absolute left-4 w-4 h-4 pointer-events-none"
                    style={{ color: focused === "password" ? "#0A1628" : "#9BA8C0" }}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    className="w-full pl-11 pr-12 py-3.5 bg-transparent outline-none text-sm font-medium placeholder:text-[#C4CDD8] placeholder:font-normal"
                    style={{
                      color: "#0A1628",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 transition-colors"
                    style={{ color: "#9BA8C0" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#0A1628")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#9BA8C0")}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white
                           transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:scale-100 mt-2"
                style={{
                  background: "#0A1628",
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: "0 4px 24px rgba(10,22,40,0.16)",
                }}
                onMouseEnter={e => !loading && (e.currentTarget.style.background = "#1c2e4a")}
                onMouseLeave={e => (e.currentTarget.style.background = "#0A1628")}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px" style={{ background: "#E4E9F2" }} />
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "#C4CDD8" }}
              >
                or
              </span>
              <div className="flex-1 h-px" style={{ background: "#E4E9F2" }} />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-semibold
                         transition-all duration-150 hover:bg-[#F4F6FB] active:scale-[0.99]"
              style={{
                border: "1px solid #E4E9F2",
                color: "#0A1628",
                background: "white",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#CBD3E8")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#E4E9F2")}
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-4 h-4"
              />
              Continue with Google
            </button>

          </motion.div>
        </div>

      </div>
    </>
  );
}