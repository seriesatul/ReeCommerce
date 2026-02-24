"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail, Lock, User, Eye, EyeOff,
  ArrowRight, Loader2, CheckCircle2,
  AlertCircle, Sparkles, Check, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Password rule definitions ────────────────────────────────────
const PASSWORD_RULES = [
  { label: "At least 6 characters",  test: (p: string) => p.length >= 6 },
  { label: "One uppercase letter",   test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number",             test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character",  test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password: string) {
  return PASSWORD_RULES.filter(r => r.test(password)).length;
}

const STRENGTH_META = [
  { label: "Too weak",  color: "#F87171" },
  { label: "Weak",      color: "#FB923C" },
  { label: "Fair",      color: "#FBBF24" },
  { label: "Strong",    color: "#34D399" },
  { label: "Very strong", color: "#10B981" },
];

// ─── Left panel features ─────────────────────────────────────────
const FEATURES = [
  "Watch products move before you buy",
  "Verified sellers only — no fakes",
  "Seamless checkout in seconds",
];

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "", email: "", password: "", confirmPassword: "", acceptTerms: false,
  });
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirm, setShowConfirm]           = useState(false);
  const [error, setError]                       = useState<string | null>(null);
  const [fieldErrors, setFieldErrors]           = useState<Record<string, string>>({});
  const [loading, setLoading]                   = useState(false);
  const [focused, setFocused]                   = useState<string | null>(null);
  const [passwordTouched, setPasswordTouched]   = useState(false);

  const strength = getStrength(formData.password);
  const strengthMeta = formData.password.length === 0 ? null : STRENGTH_META[strength] ?? STRENGTH_META[4];

  // ── Field-level validation ──────────────────────────────────────
  const validateField = (name: string, value: string) => {
    const errs = { ...fieldErrors };
    if (name === "name") {
      errs.name = value.trim().length < 2 ? "Name must be at least 2 characters" : "";
    }
    if (name === "email") {
      errs.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Enter a valid email address";
    }
    if (name === "password") {
      errs.password = value.length === 0 ? "Password is required" : "";
    }
    if (name === "confirmPassword") {
      errs.confirmPassword = value !== formData.password ? "Passwords don't match" : "";
    }
    setFieldErrors(errs);
  };

  const handleChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (typeof value === "string") validateField(name, value);
    if (name === "password") setPasswordTouched(true);
    // re-check confirm whenever password changes
    if (name === "password" && formData.confirmPassword) {
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: (value as string) !== formData.confirmPassword ? "Passwords don't match" : "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Final validation sweep
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (strength < 2) {
      setError("Please choose a stronger password.");
      return;
    }
    if (!formData.acceptTerms) {
      setError("Please accept the Terms of Service to continue.");
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push("/onboarding/buyer?welcome=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name: string) => ({
    border: `1px solid ${
      fieldErrors[name]  ? "#FECACA"
      : focused === name ? "#0A1628"
      : "#E4E9F2"
    }`,
    background: focused === name ? "white" : "#FAFAFA",
  });

  const iconColor = (name: string) =>
    fieldErrors[name] ? "#F87171" : focused === name ? "#0A1628" : "#9BA8C0";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
      `}</style>

      <div
        className="min-h-screen grid lg:grid-cols-[1fr_1fr] bg-white"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >

        {/* ══ LEFT — VISUAL PANEL ══════════════════════════════ */}
        <div
          className="hidden lg:flex flex-col justify-between p-14 relative overflow-hidden"
          style={{ background: "#0A1628" }}
        >
          {/* Dot grid texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          {/* Top-right glow */}
          <div
            className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none"
            style={{ background: "radial-gradient(circle at top right, rgba(26,58,107,0.65) 0%, transparent 65%)" }}
          />
          {/* Bottom-left glow */}
          <div
            className="absolute bottom-0 left-0 w-[300px] h-[300px] pointer-events-none"
            style={{ background: "radial-gradient(circle at bottom left, rgba(26,58,107,0.35) 0%, transparent 65%)" }}
          />

          {/* Logo */}
          <Link href="/" className="relative z-10 flex items-center gap-2.5 group w-fit">
            <div
              className="w-9 h-9 rounded-[9px] flex items-center justify-center"
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

          {/* Hero image strip */}
          <div className="relative z-10 my-8 rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
            <img
              src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1974&auto=format&fit=crop"
              alt="Fashion lifestyle"
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.82) contrast(1.05)" }}
            />
            {/* Overlay */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(10,22,40,0.75) 0%, transparent 55%)" }}
            />
            {/* Live pill */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.18)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Reels</span>
            </div>
          </div>

          {/* Headline + features */}
          <div className="relative z-10 space-y-6">
            <h2
              className="leading-[0.92] tracking-tight"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: "clamp(2.2rem, 3.2vw, 3.2rem)",
                color: "white",
                letterSpacing: "-0.025em",
              }}
            >
              Join the next
              <br />
              <em className="italic font-light" style={{ color: "rgba(255,255,255,0.38)" }}>
                generation of buying.
              </em>
            </h2>

            <div className="space-y-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.1, duration: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}
                  >
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                  <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>{f}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom rule */}
          <div className="relative z-10 flex items-center gap-3 mt-6">
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.22)" }}>
              Est. 2025 · Join the movement
            </p>
          </div>
        </div>

        {/* ══ RIGHT — FORM ════════════════════════════════════ */}
        <div className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[400px] space-y-7"
          >

            {/* Mobile logo */}
            <Link href="/" className="flex lg:hidden items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-[#0A1628]">
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
                Create account
              </h1>
              <p className="text-sm" style={{ color: "#9BA8C0" }}>
                Already a member?{" "}
                <Link
                  href="/login"
                  className="font-semibold transition-opacity hover:opacity-60"
                  style={{ color: "#0A1628" }}
                >
                  Sign in →
                </Link>
              </p>
            </div>

            {/* Global error */}
            <AnimatePresence>
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

            {/* ── FORM ── */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name */}
              <Field label="Full Name" error={fieldErrors.name}>
                <FieldInput
                  icon={<User className="w-4 h-4" style={{ color: iconColor("name") }} />}
                  inputStyle={inputStyle("name")}
                >
                  <input
                    type="text" required placeholder="Arjun Mehta"
                    value={formData.name}
                    onChange={e => handleChange("name", e.target.value)}
                    onFocus={() => setFocused("name")}
                    onBlur={() => { setFocused(null); validateField("name", formData.name); }}
                    className="w-full pl-11 pr-4 py-3.5 bg-transparent outline-none text-sm font-medium placeholder:text-[#C4CDD8] placeholder:font-normal"
                    style={{ color: "#0A1628", fontFamily: "'DM Sans', sans-serif" }}
                  />
                </FieldInput>
              </Field>

              {/* Email */}
              <Field label="Email Address" error={fieldErrors.email}>
                <FieldInput
                  icon={<Mail className="w-4 h-4" style={{ color: iconColor("email") }} />}
                  inputStyle={inputStyle("email")}
                >
                  <input
                    type="email" required placeholder="arjun@example.com"
                    value={formData.email}
                    onChange={e => handleChange("email", e.target.value)}
                    onFocus={() => setFocused("email")}
                    onBlur={() => { setFocused(null); validateField("email", formData.email); }}
                    className="w-full pl-11 pr-4 py-3.5 bg-transparent outline-none text-sm font-medium placeholder:text-[#C4CDD8] placeholder:font-normal"
                    style={{ color: "#0A1628", fontFamily: "'DM Sans', sans-serif" }}
                  />
                </FieldInput>
              </Field>

              {/* Password */}
              <Field label="Password" error={fieldErrors.password}>
                <FieldInput
                  icon={<Lock className="w-4 h-4" style={{ color: iconColor("password") }} />}
                  inputStyle={inputStyle("password")}
                  trail={
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-4 transition-colors"
                      style={{ color: "#9BA8C0" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#0A1628")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#9BA8C0")}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                >
                  <input
                    type={showPassword ? "text" : "password"} required placeholder="••••••••"
                    value={formData.password}
                    onChange={e => handleChange("password", e.target.value)}
                    onFocus={() => setFocused("password")}
                    onBlur={() => { setFocused(null); validateField("password", formData.password); }}
                    className="w-full pl-11 pr-12 py-3.5 bg-transparent outline-none text-sm font-medium placeholder:text-[#C4CDD8] placeholder:font-normal"
                    style={{ color: "#0A1628", fontFamily: "'DM Sans', sans-serif" }}
                  />
                </FieldInput>

                {/* Strength bar + rules — only show when field touched */}
                <AnimatePresence>
                  {passwordTouched && formData.password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2.5 space-y-2.5 overflow-hidden"
                    >
                      {/* Strength bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1 flex-1">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className="h-[3px] flex-1 rounded-full transition-all duration-400"
                              style={{
                                background: i < strength
                                  ? (strengthMeta?.color ?? "#E4E9F2")
                                  : "#E4E9F2",
                              }}
                            />
                          ))}
                        </div>
                        {strengthMeta && (
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                            style={{ color: strengthMeta.color }}
                          >
                            {strengthMeta.label}
                          </span>
                        )}
                      </div>

                      {/* Rule checklist */}
                      <div className="grid grid-cols-2 gap-1">
                        {PASSWORD_RULES.map(rule => {
                          const passed = rule.test(formData.password);
                          return (
                            <div key={rule.label} className="flex items-center gap-1.5">
                              <div
                                className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                                style={{ background: passed ? "#D1FAE5" : "#F4F6FB" }}
                              >
                                {passed
                                  ? <Check className="w-2 h-2 text-emerald-600" />
                                  : <X className="w-2 h-2" style={{ color: "#C4CDD8" }} />
                                }
                              </div>
                              <span
                                className="text-[10px] font-medium transition-colors"
                                style={{ color: passed ? "#059669" : "#9BA8C0" }}
                              >
                                {rule.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Field>

              {/* Confirm Password */}
              <Field label="Confirm Password" error={fieldErrors.confirmPassword}>
                <FieldInput
                  icon={<Lock className="w-4 h-4" style={{ color: iconColor("confirmPassword") }} />}
                  inputStyle={inputStyle("confirmPassword")}
                  trail={
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-4 transition-colors"
                      style={{ color: "#9BA8C0" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#0A1628")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#9BA8C0")}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                >
                  <input
                    type={showConfirm ? "text" : "password"} required placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={e => handleChange("confirmPassword", e.target.value)}
                    onFocus={() => setFocused("confirmPassword")}
                    onBlur={() => { setFocused(null); validateField("confirmPassword", formData.confirmPassword); }}
                    className="w-full pl-11 pr-12 py-3.5 bg-transparent outline-none text-sm font-medium placeholder:text-[#C4CDD8] placeholder:font-normal"
                    style={{ color: "#0A1628", fontFamily: "'DM Sans', sans-serif" }}
                  />
                </FieldInput>
                {/* Match indicator */}
                {formData.confirmPassword.length > 0 && !fieldErrors.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 mt-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </motion.p>
                )}
              </Field>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    className="peer appearance-none w-4 h-4 rounded border transition-all cursor-pointer"
                    style={{ borderColor: "#E4E9F2" }}
                    checked={formData.acceptTerms}
                    onChange={e => handleChange("acceptTerms", e.target.checked)}
                  />
                  {/* Custom checked state */}
                  <div
                    className="absolute inset-0 rounded flex items-center justify-center pointer-events-none transition-all"
                    style={{
                      background: formData.acceptTerms ? "#0A1628" : "transparent",
                      border: `1px solid ${formData.acceptTerms ? "#0A1628" : "#E4E9F2"}`,
                    }}
                  >
                    {formData.acceptTerms && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                </div>
                <span className="text-xs leading-relaxed" style={{ color: "#9BA8C0" }}>
                  I agree to the{" "}
                  <span className="font-semibold underline underline-offset-2 cursor-pointer" style={{ color: "#0A1628" }}>
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="font-semibold underline underline-offset-2 cursor-pointer" style={{ color: "#0A1628" }}>
                    Privacy Policy
                  </span>
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white
                           transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:scale-100"
                style={{
                  background: "#0A1628",
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: "0 4px 24px rgba(10,22,40,0.16)",
                }}
                onMouseEnter={e => !loading && (e.currentTarget.style.background = "#1c2e4a")}
                onMouseLeave={e => (e.currentTarget.style.background = "#0A1628")}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                ) : (
                  <>Start exploring <ArrowRight className="w-4 h-4 opacity-60" /></>
                )}
              </button>
            </form>

            {/* Already have account */}
            <p className="text-center text-xs" style={{ color: "#C4CDD8" }}>
              Already a member?{" "}
              <Link href="/login" className="font-semibold transition-opacity hover:opacity-60" style={{ color: "#0A1628" }}>
                Sign in
              </Link>
            </p>

          </motion.div>
        </div>
      </div>
    </>
  );
}

// ─── Reusable field wrapper ───────────────────────────────────────
function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="block text-[11px] font-bold uppercase tracking-widest"
        style={{ color: "#9BA8C0" }}
      >
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[11px] font-semibold text-rose-500 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Input shell with leading icon + optional trail ───────────────
function FieldInput({ icon, inputStyle, trail, children }: {
  icon: React.ReactNode;
  inputStyle: React.CSSProperties;
  trail?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative flex items-center rounded-xl overflow-hidden transition-all duration-150"
      style={inputStyle}
    >
      <span className="absolute left-4 pointer-events-none">{icon}</span>
      {children}
      {trail}
    </div>
  );
}