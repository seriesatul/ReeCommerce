"use client";

import { useState, useEffect } from "react";
import { Landmark, Hash, UserCheck, Lock, Eye, EyeOff, Check, ExternalLink, IndianRupee, Calendar, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const N = "#0A1628"; const M = "#9BA8C0"; const B = "1px solid #E4E9F2"; const S = "#F7F8FC";
const ER = "#DC2626"; const EB = "#FFF1F2"; const EBD = "#FECDD3";

// ── Exported validator ────────────────────────────────────────────
export function validateStep3(f: any): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.accountHolderName?.trim())   e.accountHolderName = "Account holder name is required.";
  const accLen = (f.accountNumber || "").length;
  if (!f.accountNumber)               e.accountNumber     = "Account number is required.";
  else if (accLen < 9 || accLen > 18) e.accountNumber     = "Must be 9–18 digits.";
  if (!f.ifscCode?.trim())            e.ifscCode          = "IFSC code is required.";
  else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(f.ifscCode))
    e.ifscCode = "Invalid IFSC. Format: SBIN0001234";
  return e;
}

function mask(v: string): string {
  if (v.length <= 4) return v;
  return "•".repeat(v.length - 4) + v.slice(-4);
}

interface Step3Props { formData: any; setFormData: (d: any) => void; showErrors?: boolean; }

export default function Step3_Payouts({ formData, setFormData, showErrors = false }: Step3Props) {
  const [focused,     setFocused]     = useState<string | null>(null);
  const [showAccount, setShowAccount] = useState(false);
  const [touched,     setTouched]     = useState<Record<string, boolean>>({});

  useEffect(() => { if (showErrors) setTouched({ accountHolderName: true, accountNumber: true, ifscCode: true }); }, [showErrors]);

  const errs = validateStep3(formData);
  const show = (f: string) => !!(touched[f] || showErrors) && !!errs[f];

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
    if (name === "accountNumber")
      setFormData({ ...formData, accountNumber: value.replace(/\D/g, "").slice(0, 18) });
    else if (name === "ifscCode")
      setFormData({ ...formData, ifscCode: value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11) });
    else
      setFormData({ ...formData, [name]: value });
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

  const accLen    = (formData.accountNumber || "").length;
  const accValid  = accLen >= 9 && accLen <= 18;
  const ifscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode || "");

  const Badge = ({ valid, len, max }: { valid: boolean; len?: number; max?: number }) => (
    <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.1em",
        ...(valid ? { background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#059669" } : { background: "#FFFBEB", border: "1px solid #FDE68A", color: "#D97706" }) }}>
      {valid ? <><Check size={9} strokeWidth={3} /> Valid</> : <>{len !== undefined ? `${len}${max ? `/${max}` : ""}` : "Check format"}</>}
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "DM Sans, sans-serif" }}>

      <div style={{ paddingBottom: 18, borderBottom: B }}>
        <p style={{ fontSize: 13, color: M, lineHeight: 1.65, margin: "0 0 14px" }}>
          Earnings are settled directly to your bank account every Friday. Enter details exactly as registered with your bank.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { icon: Calendar,    text: "Every Friday",         color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
            { icon: IndianRupee, text: "NEFT / IMPS transfer", color: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
            { icon: Lock,        text: "AES-256 encrypted",    color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
          ].map(({ icon: Icon, text, color, bg, border }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: bg, border: `1px solid ${border}` }}>
              <Icon size={10} color={color} />
              <span style={{ fontSize: 10, fontWeight: 700, color }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Account holder name */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <LabelIcon name="accountHolderName" icon={UserCheck} />
          <label style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: show("accountHolderName") ? ER : M }}>
            Account Holder Name <span style={{ color: ER }}>*</span>
          </label>
        </div>
        <input type="text" name="accountHolderName" required placeholder="As registered with your bank"
          value={formData.accountHolderName || ""} onChange={onChange} onFocus={() => setFocused("accountHolderName")} onBlur={() => onBlur("accountHolderName")}
          style={inp("accountHolderName")} />
        <Err name="accountHolderName" />
        {!show("accountHolderName") && <p style={{ fontSize: 10, color: M, margin: 0, fontWeight: 500 }}>Must match your bank passbook or cheque exactly.</p>}
      </div>

      {/* Account number */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <LabelIcon name="accountNumber" icon={Hash} />
            <label style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: show("accountNumber") ? ER : M }}>
              Account Number <span style={{ color: ER }}>*</span>
            </label>
          </div>
          <AnimatePresence>{accLen > 0 && <Badge valid={accValid} len={accLen} max={18} />}</AnimatePresence>
        </div>
        <div style={{ position: "relative" }}>
          <input type={showAccount ? "text" : "password"} name="accountNumber" required placeholder="Enter your bank account number"
            value={formData.accountNumber || ""} onChange={onChange} onFocus={() => setFocused("accountNumber")} onBlur={() => onBlur("accountNumber")}
            style={inp("accountNumber", { paddingRight: 44, fontFamily: showAccount ? "DM Mono, monospace" : "DM Sans, sans-serif", letterSpacing: showAccount ? "0.1em" : undefined,
              borderColor: show("accountNumber") ? ER : accLen > 0 && accValid ? "#BBF7D0" : focused === "accountNumber" ? N : "#E4E9F2" })} />
          <button type="button" onClick={() => setShowAccount(v => !v)}
            style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer" }}>
            {showAccount ? <EyeOff size={14} color={M} /> : <Eye size={14} color={M} />}
          </button>
        </div>
        <Err name="accountNumber" />
        <AnimatePresence>
          {accLen >= 4 && !showAccount && !show("accountNumber") && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ fontSize: 10, color: M, margin: 0, fontWeight: 600, fontFamily: "DM Mono, monospace" }}>
              Stored as: <strong style={{ color: N }}>{mask(formData.accountNumber)}</strong>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* IFSC */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <LabelIcon name="ifscCode" icon={Landmark} />
            <label style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: show("ifscCode") ? ER : M }}>
              IFSC Code <span style={{ color: ER }}>*</span>
            </label>
          </div>
          <AnimatePresence>{formData.ifscCode && <Badge valid={ifscValid} />}</AnimatePresence>
        </div>
        <input type="text" name="ifscCode" required placeholder="SBIN0001234" maxLength={11}
          value={formData.ifscCode || ""} onChange={onChange} onFocus={() => setFocused("ifscCode")} onBlur={() => onBlur("ifscCode")}
          style={inp("ifscCode", { letterSpacing: "0.12em", fontFamily: "DM Mono, monospace", textTransform: "uppercase",
            borderColor: show("ifscCode") ? ER : ifscValid ? "#BBF7D0" : (formData.ifscCode || "").length === 11 && !ifscValid ? EBD : focused === "ifscCode" ? N : "#E4E9F2" })} />
        <Err name="ifscCode" />
        {!show("ifscCode") && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 3 }}>
              {["AAAA", "0", "AAAAAA"].map((s, i) => (
                <span key={i} style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: S, border: B, color: M, fontFamily: "monospace" }}>{s}</span>
              ))}
              <span style={{ fontSize: 9, color: M, fontWeight: 500, alignSelf: "center", marginLeft: 4 }}>4 letters · 0 · 6 chars</span>
            </div>
            <a href="https://ifsccode.com" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: N, textDecoration: "none" }}>
              Find IFSC <ExternalLink size={10} />
            </a>
          </div>
        )}
      </div>

      {/* Preview */}
      <AnimatePresence>
        {formData.accountHolderName && (formData.accountNumber || formData.ifscCode) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ padding: "14px 16px", background: S, border: B, borderRadius: 14, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: N, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Landmark size={16} color="white" /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: N, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{formData.accountHolderName}</p>
              <div style={{ display: "flex", gap: 8 }}>
                {formData.accountNumber && <span style={{ fontSize: 10, color: M, fontFamily: "DM Mono, monospace", fontWeight: 600 }}>{mask(formData.accountNumber)}</span>}
                {formData.ifscCode && <span style={{ fontSize: 10, color: M, fontFamily: "DM Mono, monospace", fontWeight: 600, letterSpacing: "0.08em" }}>{formData.ifscCode}</span>}
              </div>
            </div>
            <span style={{ fontSize: 8, fontWeight: 800, padding: "3px 7px", borderRadius: 5, background: "white", border: B, color: M, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>Preview</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: S, border: B, borderRadius: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "white", border: B, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Lock size={12} color={N} /></div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: N, margin: "0 0 2px" }}>Your banking details are secure</p>
          <p style={{ fontSize: 11, color: M, lineHeight: 1.6, margin: 0 }}>Account numbers are stored encrypted. Only the last 4 digits are ever displayed. ReeCommerce never stores full account numbers in plain text.</p>
        </div>
      </div>
    </motion.div>
  );
}