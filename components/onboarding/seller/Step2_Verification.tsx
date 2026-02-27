"use client";

import { useState, useEffect } from "react";
import { User, Briefcase, CreditCard, ShieldCheck, Eye, EyeOff, Check, Lock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const N = "#0A1628"; const M = "#9BA8C0"; const B = "1px solid #E4E9F2"; const S = "#F7F8FC";
const ER = "#DC2626"; const EB = "#FFF1F2"; const EBD = "#FECDD3";

// ── Exported validator ────────────────────────────────────────────
export function validateStep2(f: any): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.legalName?.trim())    e.legalName  = f.businessType === "individual" ? "Legal name is required." : "Business name is required.";
  if (!f.panNumber?.trim())    e.panNumber  = "PAN number is required.";
  else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(f.panNumber))
    e.panNumber = "Invalid PAN. Format: ABCDE1234F";
  return e;
}

interface Step2Props { formData: any; setFormData: (d: any) => void; showErrors?: boolean; }

export default function Step2_Verification({ formData, setFormData, showErrors = false }: Step2Props) {
  const [focused,  setFocused]  = useState<string | null>(null);
  const [showPAN,  setShowPAN]  = useState(false);
  const [touched,  setTouched]  = useState<Record<string, boolean>>({});

  useEffect(() => { if (showErrors) setTouched({ legalName: true, panNumber: true }); }, [showErrors]);

  const errs = validateStep2(formData);
  const show = (f: string) => !!(touched[f] || showErrors) && !!errs[f];

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
    if (name === "panNumber") {
      setFormData({ ...formData, panNumber: value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const onBlur = (name: string) => { setFocused(null); setTouched(t => ({ ...t, [name]: true })); };

  const inp = (name: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
    width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14,
    fontFamily: "DM Sans, sans-serif", color: N, outline: "none", boxSizing: "border-box" as const,
    border: show(name) ? `2px solid ${ER}` : focused === name ? `2px solid ${N}` : "2px solid #E4E9F2",
    background: show(name) ? EB : focused === name ? "white" : S,
    transition: "border-color .15s, background .15s", ...extra,
  });

  const Err = ({ name }: { name: string }) => show(name) ? (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
      style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <AlertCircle size={11} color={ER} /><span style={{ fontSize: 11, color: ER, fontWeight: 600 }}>{errs[name]}</span>
    </motion.div>
  ) : null;

  const LabelIcon = ({ name, icon: Icon }: { name: string; icon: React.ElementType }) => (
    <div style={{ width: 22, height: 22, borderRadius: 6, background: show(name) ? EB : S, border: `1px solid ${show(name) ? EBD : "#E4E9F2"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={11} color={show(name) ? ER : N} />
    </div>
  );

  const isIndividual = formData.businessType === "individual";
  const panStatus    = !formData.panNumber ? "empty" : /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber) ? "valid" : "invalid";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "DM Sans, sans-serif" }}>

      <div style={{ paddingBottom: 18, borderBottom: B }}>
        <p style={{ fontSize: 13, color: M, lineHeight: 1.65, margin: 0 }}>
          Required by Indian regulations to activate payouts. Your details are encrypted at rest and never shown to buyers.
        </p>
      </div>

      {/* Business type */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: M }}>
          Account Type <span style={{ color: ER }}>*</span>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {([
            { type: "individual", icon: User,     label: "Individual", sub: "Sole proprietor or freelancer" },
            { type: "business",   icon: Briefcase, label: "Business",   sub: "Registered company or firm" },
          ] as const).map(({ type, icon: Icon, label, sub }) => {
            const active = formData.businessType === type;
            return (
              <motion.button key={type} type="button" whileTap={{ scale: 0.98 }}
                onClick={() => setFormData({ ...formData, businessType: type })}
                style={{ padding: "16px 14px", borderRadius: 14, cursor: "pointer", textAlign: "left", fontFamily: "DM Sans, sans-serif", background: active ? N : "white", border: active ? `2px solid ${N}` : "2px solid #E4E9F2", boxShadow: active ? "0 8px 24px rgba(10,22,40,0.14)" : "none", transition: "all .2s", position: "relative", overflow: "hidden" }}>
                {active && <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px", pointerEvents: "none" }} />}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: active ? "rgba(255,255,255,0.12)" : S, border: active ? "1px solid rgba(255,255,255,0.15)" : B }}>
                      <Icon size={15} color={active ? "white" : N} />
                    </div>
                    <AnimatePresence>
                      {active && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Check size={9} color="white" strokeWidth={3} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: active ? "white" : N, margin: "0 0 2px" }}>{label}</p>
                    <p style={{ fontSize: 10, color: active ? "rgba(255,255,255,0.5)" : M, margin: 0, fontWeight: 500 }}>{sub}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Legal name */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <LabelIcon name="legalName" icon={ShieldCheck} />
          <label style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: show("legalName") ? ER : M }}>
            {isIndividual ? "Full Legal Name" : "Registered Business Name"} <span style={{ color: ER }}>*</span>
          </label>
        </div>
        <input type="text" name="legalName" required
          placeholder={isIndividual ? "As per Aadhaar / PAN card" : "Company Name Pvt Ltd"}
          value={formData.legalName || ""} onChange={onChange} onFocus={() => setFocused("legalName")} onBlur={() => onBlur("legalName")}
          style={inp("legalName")} />
        <Err name="legalName" />
        {!show("legalName") && (
          <p style={{ fontSize: 10, color: M, margin: 0, fontWeight: 500 }}>
            {isIndividual ? "Must match exactly as it appears on your government-issued ID." : "Must match your Certificate of Incorporation."}
          </p>
        )}
      </div>

      {/* PAN */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <LabelIcon name="panNumber" icon={CreditCard} />
            <label style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: show("panNumber") ? ER : M }}>
              PAN Number <span style={{ color: ER }}>*</span>
            </label>
          </div>
          <AnimatePresence mode="wait">
            {formData.panNumber && (
              <motion.div key={panStatus} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
                  ...(panStatus === "valid" ? { background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#059669" } : { background: "#FFFBEB", border: "1px solid #FDE68A", color: "#D97706" }) }}>
                {panStatus === "valid" ? <><Check size={9} strokeWidth={3} /> Valid</> : <>{formData.panNumber.length}/10</>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div style={{ position: "relative" }}>
          <input type={showPAN ? "text" : "password"} name="panNumber" required placeholder="ABCDE1234F" maxLength={10}
            value={formData.panNumber || ""} onChange={onChange} onFocus={() => setFocused("panNumber")} onBlur={() => onBlur("panNumber")}
            style={inp("panNumber", { paddingRight: 44, letterSpacing: showPAN ? "0.14em" : "0.08em", textTransform: "uppercase",
              borderColor: show("panNumber") ? ER : panStatus === "valid" ? "#BBF7D0" : panStatus === "invalid" && (formData.panNumber || "").length === 10 ? EBD : focused === "panNumber" ? N : "#E4E9F2" })} />
          <button type="button" onClick={() => setShowPAN(v => !v)}
            style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer" }}>
            {showPAN ? <EyeOff size={14} color={M} /> : <Eye size={14} color={M} />}
          </button>
        </div>
        <Err name="panNumber" />
        {!show("panNumber") && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {["AAAAA", "0000", "A"].map((s, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: S, border: B, color: M, letterSpacing: "0.08em", fontFamily: "monospace" }}>{s}</span>
            ))}
            <span style={{ fontSize: 9, color: M, fontWeight: 500 }}>5 letters · 4 digits · 1 letter</span>
          </div>
        )}
      </div>

      {/* Security notice */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: S, border: B, borderRadius: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "white", border: B, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Lock size={12} color={N} />
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: N, margin: "0 0 2px" }}>Bank-grade encryption</p>
          <p style={{ fontSize: 11, color: M, lineHeight: 1.6, margin: 0 }}>Your PAN and legal name are encrypted using AES-256. Used only for KYC verification — never visible to buyers.</p>
        </div>
      </div>
    </motion.div>
  );
}