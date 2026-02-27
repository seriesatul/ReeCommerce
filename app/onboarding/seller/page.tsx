"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Check, ChevronRight, Store, ShieldCheck, CreditCard, Eye, Zap } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import Step1_Profile,      { validateStep1 } from "@/components/onboarding/seller/Step1_Profile";
import Step2_Verification, { validateStep2 } from "@/components/onboarding/seller/Step2_Verification";
import Step3_Payouts,      { validateStep3 } from "@/components/onboarding/seller/Step3_Payout";
import Step4_Review                           from "@/components/onboarding/seller/Step4_Review";

// ─── Design tokens ───────────────────────────────────────────────
const N = "#0A1628"; const M = "#9BA8C0"; const B = "1px solid #E4E9F2"; const S = "#F7F8FC";

const STEPS = [
  { number: 1, title: "Shop Profile",    subtitle: "Name, handle & bio",     icon: Store,       hint: "Your public store identity — buyers see this on your profile and the discovery feed."   },
  { number: 2, title: "Verification",    subtitle: "KYC & business type",    icon: ShieldCheck, hint: "Required to receive payouts. Your PAN is encrypted and never shared with buyers."       },
  { number: 3, title: "Payouts",         subtitle: "Bank account details",   icon: CreditCard,  hint: "Weekly settlements go directly to this account. Stored with bank-grade encryption."     },
  { number: 4, title: "Review & Submit", subtitle: "Confirm everything",     icon: Eye,         hint: "Double-check your details before going live. You can update them from Settings anytime." },
];

// ─── Sidebar ─────────────────────────────────────────────────────
function Sidebar({ current }: { current: number }) {
  return (
    <div style={{ width: 284, flexShrink: 0, background: N, display: "flex", flexDirection: "column", padding: "36px 22px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.035, backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -90, right: -50, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 44, position: "relative", zIndex: 1 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.13)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={15} color="white" />
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, color: "white", letterSpacing: "-0.02em", fontFamily: "DM Sans, sans-serif" }}>Recommerce</span>
      </div>

      <div style={{ marginBottom: 30, position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.28)", margin: "0 0 9px", fontFamily: "DM Sans, sans-serif" }}>Seller Onboarding</p>
        <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: 22, color: "white", letterSpacing: "-0.025em", lineHeight: 1.2, margin: 0 }}>
          Set up your<br /><em style={{ fontWeight: 300, fontStyle: "italic", opacity: 0.38 }}>creator store.</em>
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2, position: "relative", zIndex: 1 }}>
        {STEPS.map(({ number, title, subtitle, icon: Icon }, i) => {
          const done   = number < current;
          const active = number === current;
          return (
            <div key={number}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 12, background: active ? "rgba(255,255,255,0.07)" : "transparent", border: active ? "1px solid rgba(255,255,255,0.09)" : "1px solid transparent", transition: "all .22s" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: done ? "rgba(74,222,128,0.11)" : active ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.04)", border: done ? "1px solid rgba(74,222,128,0.26)" : active ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(255,255,255,0.06)", transition: "all .28s" }}>
                  {done ? <Check size={13} color="#4ADE80" strokeWidth={2.8} /> : <Icon size={14} color={active ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.22)"} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: active ? "white" : done ? "rgba(255,255,255,0.46)" : "rgba(255,255,255,0.22)", margin: 0, lineHeight: 1.2, fontFamily: "DM Sans, sans-serif" }}>{title}</p>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: active ? "rgba(255,255,255,0.34)" : "rgba(255,255,255,0.14)", margin: 0, fontFamily: "DM Sans, sans-serif" }}>{subtitle}</p>
                </div>
                {done && (
                  <div style={{ width: 15, height: 15, borderRadius: "50%", background: "rgba(74,222,128,0.13)", border: "1px solid rgba(74,222,128,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={8} color="#4ADE80" strokeWidth={3} />
                  </div>
                )}
              </div>
              {i < STEPS.length - 1 && <div style={{ width: 1, height: 9, background: number < current ? "rgba(74,222,128,0.18)" : "rgba(255,255,255,0.06)", margin: "0 0 0 32px", transition: "background .4s" }} />}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
          style={{ marginTop: "auto", padding: "14px 15px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)", margin: "0 0 5px", fontFamily: "DM Sans, sans-serif" }}>About this step</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.7, margin: 0, fontFamily: "DM Sans, sans-serif" }}>{STEPS[current - 1].hint}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ height: 2, background: "#E9ECF1", overflow: "hidden" }}>
      <motion.div animate={{ width: `${((current - 1) / (total - 1)) * 100}%` }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{ height: "100%", background: N }} />
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────
export default function SellerOnboardingPage() {
  const router       = useRouter();
  const { update }   = useSession();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading,     setLoading]     = useState(false);
  // showErrors[step] = true means "user clicked Next on that step with invalid data"
  const [showErrors,  setShowErrors]  = useState<Record<number, boolean>>({});
  const [formData,    setFormData]    = useState({
    shopName: "", shopHandle: "", shopDescription: "",
    businessType: "individual", panNumber: "", legalName: "",
    accountHolderName: "", accountNumber: "", ifscCode: "",
  });

  // ── Validation map ──────────────────────────────────────────────
  const validators: Record<number, (f: any) => Record<string, string>> = {
    1: validateStep1,
    2: validateStep2,
    3: validateStep3,
  };

  const isStepValid = (step: number) => {
    if (!validators[step]) return true; // step 4 (review) has no form
    return Object.keys(validators[step](formData)).length === 0;
  };

  const handleNext = () => {
    if (!isStepValid(currentStep)) {
      // Trigger error display in the current step
      setShowErrors(e => ({ ...e, [currentStep]: true }));
      return; // Block advancement
    }
    setShowErrors(e => ({ ...e, [currentStep]: false }));
    if (currentStep < STEPS.length) setCurrentStep(s => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seller/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (res.ok) { await update({ role: "seller" }); router.push("/dashboard/seller"); }
      else { const d = await res.json(); alert(d.error || "Something went wrong"); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const renderStep = () => {
    const props = { formData, setFormData, showErrors: !!showErrors[currentStep] };
    switch (currentStep) {
      case 1: return <Step1_Profile      {...props} />;
      case 2: return <Step2_Verification {...props} />;
      case 3: return <Step3_Payouts      {...props} />;
      case 4: return <Step4_Review formData={formData} setCurrentStep={setCurrentStep} />;
      default: return null;
    }
  };

  const step      = STEPS[currentStep - 1];
  const stepValid = isStepValid(currentStep);
  // Show a warning on the Next button if errors are being displayed
  const showNextWarning = !!showErrors[currentStep] && !stepValid;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .sidebar-hide { display: none; }
        @media (min-width: 1024px) { .sidebar-hide { display: flex; } .mobile-only { display: none !important; } }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", fontFamily: "DM Sans, sans-serif" }}>

        {/* Sidebar */}
        <div className="sidebar-hide"><Sidebar current={currentStep} /></div>

        {/* Main */}
        <div style={{ flex: 1, background: S, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "fixed", inset: 0, opacity: 0.016, backgroundImage: "radial-gradient(circle, #0A1628 1px, transparent 1px)", backgroundSize: "30px 30px", pointerEvents: "none", zIndex: 0 }} />

          {/* Top bar */}
          <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(247,248,252,0.95)", backdropFilter: "blur(12px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 56 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Link href="/" style={{ width: 34, height: 34, borderRadius: 10, border: B, background: "white", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", boxShadow: "0 1px 4px rgba(10,22,40,0.06)" }}>
                  <ArrowLeft size={14} color="#6B7A99" />
                </Link>
                <div className="mobile-only" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: N, display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={12} color="white" /></div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: N }}>Recommerce</span>
                </div>
              </div>
              <div className="mobile-only" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {STEPS.map((_, i) => (
                  <motion.div key={i} animate={{ width: i < currentStep ? 16 : 5, background: i < currentStep ? N : "#E4E9F2" }} transition={{ duration: 0.3 }} style={{ height: 5, borderRadius: 99 }} />
                ))}
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: M }}>{currentStep} / {STEPS.length}</span>
            </div>
            <ProgressBar current={currentStep} total={STEPS.length} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: "28px 28px 120px", position: "relative", zIndex: 1, overflowY: "auto" }}>

            {/* Step header */}
            <AnimatePresence mode="wait">
              <motion.div key={`hd-${currentStep}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.26 }}
                style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "white", border: B, boxShadow: "0 2px 10px rgba(10,22,40,0.055)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <step.icon size={18} color={N} />
                </div>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: M, margin: "0 0 3px" }}>Step {currentStep} — {step.subtitle}</p>
                  <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: "clamp(1.5rem, 3vw, 2.1rem)", color: N, letterSpacing: "-0.025em", margin: 0, lineHeight: 1.1 }}>{step.title}</h1>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Inline step error summary banner — appears when Next is clicked with invalid data */}
            <AnimatePresence>
              {showNextWarning && currentStep < 4 && (
                <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -8, height: 0 }} transition={{ duration: 0.22 }}
                  style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 12 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "white", fontSize: 11, fontWeight: 900, lineHeight: 1 }}>!</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#DC2626", fontWeight: 600, margin: 0 }}>
                    Please fix the errors above before continuing.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step card */}
            <AnimatePresence mode="wait">
              <motion.div key={`step-${currentStep}`} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                style={{ background: "white", border: B, borderRadius: 20, padding: "28px 24px", boxShadow: "0 4px 24px rgba(10,22,40,0.055)", minHeight: 290 }}>
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom nav */}
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20, background: "rgba(247,248,252,0.97)", backdropFilter: "blur(14px)", borderTop: B }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 28px" }}>

              {/* Back */}
              {currentStep > 1 ? (
                <button onClick={handleBack} disabled={loading}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 11, border: B, background: "white", fontSize: 13, fontWeight: 700, color: "#6B7A99", cursor: "pointer", fontFamily: "DM Sans, sans-serif", boxShadow: "0 1px 4px rgba(10,22,40,0.06)" }}>
                  <ArrowLeft size={14} /> Back
                </button>
              ) : <div />}

              {/* Breadcrumb chips */}
              <div style={{ display: "flex", alignItems: "center", gap: 5 }} className="sidebar-hide">
                {STEPS.map(({ number, title }) => {
                  const done   = number < currentStep;
                  const active = number === currentStep;
                  const hasErr = showErrors[number] && !isStepValid(number);
                  return (
                    <div key={number} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px 4px 8px", borderRadius: 8,
                      background: hasErr ? "#FFF1F2" : done ? "#F0FDF4" : active ? "white" : "transparent",
                      border: hasErr ? "1px solid #FECDD3" : done ? "1px solid #BBF7D0" : active ? B : "1px solid transparent",
                      transition: "all .22s" }}>
                      {hasErr
                        ? <span style={{ fontSize: 9, color: "#DC2626" }}>!</span>
                        : done ? <Check size={9} color="#059669" strokeWidth={3} />
                        : <div style={{ width: 7, height: 7, borderRadius: "50%", background: active ? N : "#D8DEE9" }} />}
                      <span style={{ fontSize: 10, fontWeight: 700, color: hasErr ? "#DC2626" : done ? "#059669" : active ? N : M }}>{title}</span>
                    </div>
                  );
                })}
              </div>

              {/* Next / Finish */}
              {currentStep < STEPS.length ? (
                <button onClick={handleNext}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 11,
                    background: showNextWarning ? "#DC2626" : N,
                    color: "white", fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif", boxShadow: `0 4px 18px ${showNextWarning ? "rgba(220,38,38,0.3)" : "rgba(10,22,40,0.16)"}`,
                    transition: "background .2s, box-shadow .2s" }}>
                  {showNextWarning ? "Fix errors above" : "Next Step"} <ChevronRight size={14} />
                </button>
              ) : (
                <button onClick={handleFinalSubmit} disabled={loading}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 11, background: loading ? "#6B7A99" : N, color: "white", fontSize: 13, fontWeight: 800, border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "DM Sans, sans-serif", boxShadow: loading ? "none" : "0 4px 18px rgba(10,22,40,0.16)", transition: "background .2s" }}>
                  {loading ? (
                    <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.28)", borderTopColor: "white", borderRadius: "50%", animation: "spin .65s linear infinite" }} /> Processing…</>
                  ) : (
                    <><Check size={14} /> Finish & Go to Dashboard</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}