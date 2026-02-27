"use client";

import { Store, ShieldCheck, Landmark, Edit3, Check, AtSign, AlignLeft, User, CreditCard, Hash, Zap } from "lucide-react";
import { motion } from "framer-motion";

const N = "#0A1628"; const M = "#9BA8C0"; const B = "1px solid #E4E9F2"; const S = "#F7F8FC";

interface Step4Props { formData: any; setCurrentStep: (step: number) => void; }

function mask(str: string, visible = 4): string {
  if (!str) return "—";
  if (str.length <= visible) return str;
  return "•".repeat(str.length - visible) + str.slice(-visible);
}

function SectionCard({ icon: Icon, label, step, onEdit, delay, children }: {
  icon: React.ElementType; label: string; step: number; onEdit: () => void; delay: number; children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: "white", border: B, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(10,22,40,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", background: S, borderBottom: B }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: N, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={12} color="white" /></div>
          <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: N, fontFamily: "DM Sans, sans-serif" }}>{label}</span>
        </div>
        <button type="button" onClick={onEdit}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, border: B, background: "white", cursor: "pointer", fontSize: 10, fontWeight: 700, color: "#6B7A99", transition: "all .15s", fontFamily: "DM Sans, sans-serif" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = N; (e.currentTarget as HTMLElement).style.color = "white"; (e.currentTarget as HTMLElement).style.borderColor = N; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; (e.currentTarget as HTMLElement).style.color = "#6B7A99"; (e.currentTarget as HTMLElement).style.borderColor = "#E4E9F2"; }}>
          <Edit3 size={10} /> Edit
        </button>
      </div>
      <div style={{ padding: "16px" }}>{children}</div>
    </motion.div>
  );
}

function Field({ icon: Icon, label, value, mono = false, fullWidth = false }: {
  icon?: React.ElementType; label: string; value: string; mono?: boolean; fullWidth?: boolean;
}) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
        {Icon && <Icon size={9} color={M} />}
        <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: M, fontFamily: "DM Sans, sans-serif" }}>{label}</span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: value === "—" ? "#C4CDD8" : N, margin: 0, lineHeight: 1.45, fontFamily: mono ? "DM Mono, monospace" : "DM Sans, sans-serif", letterSpacing: mono ? "0.06em" : undefined, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: fullWidth ? "normal" : "nowrap", display: fullWidth ? "-webkit-box" : undefined, WebkitLineClamp: fullWidth ? 2 : undefined, WebkitBoxOrient: fullWidth ? "vertical" : undefined }}>
        {value || "—"}
      </p>
    </div>
  );
}

export default function Step4_Review({ formData, setCurrentStep }: Step4Props) {
  const allFilled = formData.shopName && formData.shopHandle && formData.legalName && formData.panNumber && formData.accountHolderName && formData.accountNumber && formData.ifscCode;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "DM Sans, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: allFilled ? "#F0FDF4" : S, border: `1px solid ${allFilled ? "#BBF7D0" : "#E4E9F2"}`, borderRadius: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: allFilled ? "#059669" : N, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: allFilled ? "0 4px 16px rgba(5,150,105,0.24)" : "0 4px 16px rgba(10,22,40,0.14)" }}>
          {allFilled ? <Check size={18} color="white" strokeWidth={2.8} /> : <Zap size={18} color="white" />}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: allFilled ? "#059669" : N, margin: "0 0 2px" }}>{allFilled ? "Everything looks good!" : "Review your details"}</p>
          <p style={{ fontSize: 11, color: allFilled ? "#059669" : M, margin: 0, opacity: allFilled ? 0.75 : 1 }}>{allFilled ? "All sections complete — click Finish to launch your store." : "Double-check before submitting."}</p>
        </div>
      </div>

      <SectionCard icon={Store} label="Shop Identity" step={1} onEdit={() => setCurrentStep(1)} delay={0.06}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
          <Field icon={Store}    label="Shop Name" value={formData.shopName} />
          <Field icon={AtSign}   label="Handle"    value={formData.shopHandle ? `@${formData.shopHandle}` : "—"} />
          <Field icon={AlignLeft} label="Bio"      value={formData.shopDescription} fullWidth />
        </div>
      </SectionCard>

      <SectionCard icon={ShieldCheck} label="Legal & KYC" step={2} onEdit={() => setCurrentStep(2)} delay={0.12}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
          <Field icon={User}       label="Entity Type" value={formData.businessType === "individual" ? "Individual" : "Business"} />
          <Field icon={AlignLeft}  label="Legal Name"  value={formData.legalName} />
          <Field icon={CreditCard} label="PAN Number"  value={mask(formData.panNumber, 3)} mono />
        </div>
      </SectionCard>

      <SectionCard icon={Landmark} label="Bank Details" step={3} onEdit={() => setCurrentStep(3)} delay={0.18}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
          <Field icon={User}     label="Account Holder" value={formData.accountHolderName} />
          <Field icon={Hash}     label="Account Number" value={mask(formData.accountNumber, 4)} mono />
          <Field icon={Landmark} label="IFSC Code"      value={formData.ifscCode} mono />
        </div>
      </SectionCard>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        style={{ fontSize: 10, color: M, textAlign: "center", lineHeight: 1.65, margin: 0 }}>
        By submitting, you confirm all details are accurate and agree to the{" "}
        <a href="/terms/seller" target="_blank" style={{ color: N, fontWeight: 700, textDecoration: "underline", textDecorationColor: "#E4E9F2" }}>Seller Terms of Service</a>.
      </motion.p>
    </motion.div>
  );
}