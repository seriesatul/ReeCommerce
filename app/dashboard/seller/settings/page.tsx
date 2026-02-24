"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Store as StoreIcon, AtSign, Upload, Check, Globe,
  Camera, Eye, EyeOff, ShieldCheck, ShieldAlert, ShieldX,
  Truck, Warehouse, CreditCard, Hash, User, MapPin,
  ChevronDown, ExternalLink, AlertTriangle, X, Layers,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ─── Design tokens ──────────────────────────────────────────────────────────────
const N = "#0A1628";
const M = "#9BA8C0";
const B = "1px solid #E4E9F2";
const S = "#F7F8FC";

// ─── Types ──────────────────────────────────────────────────────────────────────
interface StoreForm {
  // Identity
  name: string;
  handle: string;
  description: string;
  logoUrl: string;
  category: string;
  // Verification
  verificationStatus: "pending" | "verified" | "rejected";
  businessType: "individual" | "business";
  panNumber: string;
  // Finance
  bankDetails: { accountNumber: string; ifscCode: string; holderName: string };
  // Operations
  pickupAddress: string;
  shippingMethod: "self" | "platform";
  isActive: boolean;
}

// ─── Shared style helpers ───────────────────────────────────────────────────────
const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  border: B, background: "#FAFAFA", color: N, fontFamily: "DM Sans,sans-serif",
  width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14,
  outline: "none", boxSizing: "border-box", ...extra,
});
const LBL: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.12em", color: M, marginBottom: 6, display: "block",
};
const CARD: React.CSSProperties = {
  background: "white", border: B, borderRadius: 20, padding: 24,
  display: "flex", flexDirection: "column", gap: 20,
};

function SectionHead({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 18, borderBottom: B }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: S, border: B, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 800, color: N, margin: 0 }}>{title}</p>
        {subtitle && <p style={{ fontSize: 11, color: M, margin: 0 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function FocusInput({ value, onChange, type = "text", placeholder, prefix, style: extraStyle, ...rest }: any) {
  return (
    <div style={{ position: "relative" }}>
      {prefix && (
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: M, pointerEvents: "none", userSelect: "none" }}>{prefix}</span>
      )}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={inp({ ...(prefix ? { paddingLeft: 34 } : {}), ...extraStyle })}
        onFocus={e => { e.currentTarget.style.borderColor = N; e.currentTarget.style.background = "white"; }}
        onBlur={e  => { e.currentTarget.style.borderColor = "#E4E9F2"; e.currentTarget.style.background = "#FAFAFA"; }}
        {...rest}
      />
    </div>
  );
}

// ─── Handle checker ────────────────────────────────────────────────────────────
function HandleField({ value, onChange, original }: { value: string; onChange: (v: string) => void; original: string }) {
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!value || value === original) { setStatus("idle"); return; }
    setStatus("checking");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/seller/check-handle?handle=${value}`);
        const d = await r.json();
        setStatus(d.available ? "ok" : "taken");
      } catch { setStatus("idle"); }
    }, 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [value, original]);

  const statusColor = status === "ok" ? "#059669" : status === "taken" ? "#DC2626" : M;

  return (
    <div>
      <span style={LBL}>Unique Handle</span>
      <div style={{ position: "relative" }}>
        <AtSign size={14} color={M} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input type="text" value={value}
          onChange={e => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
          style={inp({ paddingLeft: 36, fontWeight: 700 })}
          onFocus={e => { e.currentTarget.style.borderColor = N; e.currentTarget.style.background = "white"; }}
          onBlur={e  => { e.currentTarget.style.borderColor = "#E4E9F2"; e.currentTarget.style.background = "#FAFAFA"; }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 7 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Globe size={11} color="#059669" />
          <span style={{ fontSize: 11, color: "#6B7A99" }}>
            recommerce.app/store/<strong style={{ color: N }}>{value || "your-handle"}</strong>
          </span>
          {value && (
            <a href={`/store/${value}`} target="_blank" rel="noreferrer" style={{ display: "inline-flex" }}>
              <ExternalLink size={10} color={M} />
            </a>
          )}
        </div>
        {status !== "idle" && (
          <span style={{ fontSize: 11, fontWeight: 700, color: statusColor }}>
            {status === "checking" ? "Checking…" : status === "ok" ? "Available ✓" : "Already taken ✗"}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Logo uploader ─────────────────────────────────────────────────────────────
function LogoUploader({ url, onUploaded }: { url: string; onUploaded: (u: string) => void }) {
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const timestamp = Math.round(Date.now() / 1000);
      const folder    = "seller-logos";
      const sigRes = await fetch("/api/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paramsToSign: { timestamp, folder } }),
      });
      if (!sigRes.ok) throw new Error("Signature request failed");
      const { signature } = await sigRes.json();
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const apiKey    = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
      const fd = new FormData();
      fd.append("file",      file);
      fd.append("signature", signature);
      fd.append("timestamp", String(timestamp));
      fd.append("api_key",   apiKey!);
      fd.append("folder",    folder);
      const up   = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
      const data = await up.json();
      if (!data.secure_url) throw new Error("Upload failed");
      onUploaded(data.secure_url);
      toast.success("Logo uploaded");
    } catch { toast.error("Upload failed"); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <span style={LBL}>Store Logo</span>
      <div onClick={() => ref.current?.click()} style={{ position: "relative", width: 90, height: 90, borderRadius: 18, overflow: "hidden", background: S, border: "2px dashed #E4E9F2", cursor: busy ? "wait" : "pointer" }}>
        {url
          ? <Image src={url} alt="logo" fill style={{ objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><StoreIcon size={24} color="#C4CDD8" /></div>}
        <div style={{ position: "absolute", inset: 0, background: "rgba(10,22,40,0.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, opacity: 0, transition: "opacity .18s" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "1")} onMouseLeave={e => { if (!busy) e.currentTarget.style.opacity = "0"; }}>
          {busy
            ? <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin .6s linear infinite" }} />
            : <><Camera size={15} color="white" /><span style={{ fontSize: 10, color: "white", fontWeight: 700 }}>Change</span></>}
        </div>
        <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handle} />
      </div>
      <p style={{ fontSize: 10, color: M, marginTop: 6 }}>Square · 500×500px</p>
    </div>
  );
}

// ─── Verification badge ─────────────────────────────────────────────────────────
function VerificationBadge({ status }: { status: StoreForm["verificationStatus"] }) {
  const cfg = {
    verified: { color: "#059669", bg: "#F0FDF4", border: "#BBF7D0", Icon: ShieldCheck, text: "Verified seller" },
    pending:  { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", Icon: ShieldAlert, text: "Verification pending" },
    rejected: { color: "#DC2626", bg: "#FFF1F2", border: "#FECDD3", Icon: ShieldX,    text: "Verification rejected" },
  }[status];
  const { color, bg, border, Icon, text } = cfg;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, background: bg, border: `1px solid ${border}` }}>
      <Icon size={15} color={color} />
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{text}</span>
    </div>
  );
}

// ─── Masked input (bank/PAN) ───────────────────────────────────────────────────
function MaskedInput({ value, onChange, placeholder, label: lbl }: {
  value: string; onChange: (v: string) => void; placeholder?: string; label: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <span style={LBL}>{lbl}</span>
      <div style={{ position: "relative" }}>
        <input type={show ? "text" : "password"} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={inp({ paddingRight: 44, fontFamily: show ? "DM Sans,sans-serif" : "monospace", letterSpacing: show ? "normal" : "0.15em" })}
          onFocus={e => { e.currentTarget.style.borderColor = N; e.currentTarget.style.background = "white"; }}
          onBlur={e  => { e.currentTarget.style.borderColor = "#E4E9F2"; e.currentTarget.style.background = "#FAFAFA"; }}
        />
        <button type="button" onClick={() => setShow(v => !v)}
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {show ? <EyeOff size={15} color={M} /> : <Eye size={15} color={M} />}
        </button>
      </div>
    </div>
  );
}

// ─── Danger zone delete modal ──────────────────────────────────────────────────
function DeleteModal({ storeName, onClose, onConfirm }: {
  storeName: string; onClose: () => void; onConfirm: () => Promise<void>;
}) {
  const [typed, setTyped] = useState("");
  const [busy,  setBusy]  = useState(false);
  const match = typed === storeName;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,22,40,0.6)", backdropFilter: "blur(14px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }} transition={{ ease: [0.16,1,0.3,1], duration: 0.26 }}
        style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 440, border: B, boxShadow: "0 32px 96px rgba(10,22,40,0.22)", fontFamily: "DM Sans,sans-serif", overflow: "hidden" }}>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#FFF1F2", border: "1px solid #FECDD3", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={20} color="#DC2626" />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: N, margin: "0 0 8px" }}>Delete your store?</p>
            <p style={{ fontSize: 13, color: M, lineHeight: 1.65, margin: 0 }}>
              This permanently deletes your store, all products, reels, and order history.{" "}
              <strong style={{ color: N }}>This cannot be undone.</strong>
            </p>
          </div>
          <div>
            <span style={LBL}>Type <strong style={{ color: "#DC2626" }}>{storeName}</strong> to confirm</span>
            <FocusInput value={typed} onChange={(e: any) => setTyped(e.target.value)} placeholder={storeName} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: B, background: "transparent", fontSize: 13, fontWeight: 600, color: "#6B7A99", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = S)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              Cancel
            </button>
            <button type="button" disabled={!match || busy}
              onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", borderRadius: 12, border: "none", fontSize: 13, fontWeight: 700,
                background: match ? "#DC2626" : "#F1F5F9", color: match ? "white" : M,
                cursor: match && !busy ? "pointer" : "not-allowed", transition: "all .2s" }}>
              {busy ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "white", borderRadius: "50%", animation: "spin .6s linear infinite" }} /> : <AlertTriangle size={13} />}
              Delete forever
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── CATEGORIES ────────────────────────────────────────────────────────────────
const CATEGORIES = ["General", "Fashion", "Electronics", "Beauty", "Home & Living", "Sports", "Books", "Food", "Toys", "Art"];

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function SellerSettings() {
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [dirty,       setDirty]       = useState(false);
  const [showDelete,  setShowDelete]  = useState(false);
  const [activeTab,   setActiveTab]   = useState<"branding" | "verification" | "finance" | "operations">("branding");
  const [originalHandle, setOriginalHandle] = useState("");

  const [form, setForm] = useState<StoreForm>({
    name: "", handle: "", description: "", logoUrl: "", category: "General",
    verificationStatus: "pending", businessType: "individual", panNumber: "",
    bankDetails: { accountNumber: "", ifscCode: "", holderName: "" },
    pickupAddress: "", shippingMethod: "platform", isActive: true,
  });

  const patch = useCallback((updates: Partial<StoreForm>) => {
    setForm(f => ({ ...f, ...updates }));
    setDirty(true);
  }, []);

  const patchBank = useCallback((updates: Partial<StoreForm["bankDetails"]>) => {
    setForm(f => ({ ...f, bankDetails: { ...f.bankDetails, ...updates } }));
    setDirty(true);
  }, []);

  useEffect(() => {
    fetch("/api/seller/profile")
      .then(r => r.json())
      .then(data => {
        setForm({
          name:               data.name               ?? "",
          handle:             data.handle             ?? "",
          description:        data.description        ?? "",
          logoUrl:            data.logoUrl            ?? "",
          category:           data.category           ?? "General",
          verificationStatus: data.verificationStatus ?? "pending",
          businessType:       data.businessType       ?? "individual",
          panNumber:          data.panNumber          ?? "",
          bankDetails: {
            accountNumber: data.bankDetails?.accountNumber ?? "",
            ifscCode:      data.bankDetails?.ifscCode      ?? "",
            holderName:    data.bankDetails?.holderName    ?? "",
          },
          pickupAddress:  data.pickupAddress  ?? "",
          shippingMethod: data.shippingMethod ?? "platform",
          isActive:       data.isActive       ?? true,
        });
        setOriginalHandle(data.handle ?? "");
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/seller/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Profile saved");
        setDirty(false);
        setOriginalHandle(form.handle);
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Save failed");
      }
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  };

  const TABS = [
    { key: "branding",     label: "Branding"     },
    { key: "verification", label: "Verification" },
    { key: "finance",      label: "Finance"      },
    { key: "operations",   label: "Operations"   },
  ] as const;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400 }}>
      <div style={{ width: 36, height: 36, border: `2px solid ${N}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <form onSubmit={handleSave}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 80, fontFamily: "DM Sans, sans-serif", maxWidth: 720 }}>

          {/* ── Header ──────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: "clamp(1.6rem, 2.5vw, 2.1rem)", color: N, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
                Settings
                <em style={{ fontWeight: 300, fontStyle: "italic", opacity: 0.38, marginLeft: 10 }}>profile</em>
              </h1>
              <p style={{ fontSize: 14, color: M, margin: "4px 0 0" }}>Manage your shop identity, verification and finance</p>
            </div>
            {/* Verification status badge */}
            <VerificationBadge status={form.verificationStatus} />
          </div>

          {/* ── Store preview card ───────────────────────────────────── */}
          <div style={{ background: "white", border: B, borderRadius: 20, overflow: "hidden" }}>
            {/* Banner stripe */}
            <div style={{ height: 72, background: `linear-gradient(135deg, ${N} 0%, #1a3a6b 100%)`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
            </div>
            <div style={{ padding: "0 20px 20px", position: "relative" }}>
              {/* Logo bubble */}
              <div style={{ position: "relative", width: 52, height: 52, borderRadius: 14, border: "3px solid white", overflow: "hidden", background: S, marginTop: -26, boxShadow: "0 4px 16px rgba(10,22,40,0.12)" }}>
                {form.logoUrl
                  ? <Image src={form.logoUrl} alt="logo" fill style={{ objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><StoreIcon size={18} color={M} /></div>}
              </div>
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <p style={{ fontFamily: "Instrument Serif, serif", fontSize: 18, fontWeight: 900, color: N, margin: 0 }}>{form.name || "Your Store Name"}</p>
                  <p style={{ fontSize: 12, color: M, margin: "2px 0 0" }}>@{form.handle || "handle"} · {form.category}</p>
                </div>
                <a href={`/store/${form.handle}`} target="_blank" rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: N, textDecoration: "none", padding: "6px 12px", borderRadius: 8, border: B, background: S }}>
                  <ExternalLink size={12} /> View store
                </a>
              </div>
              {form.description && (
                <p style={{ fontSize: 12, color: "#6B7A99", lineHeight: 1.55, margin: "10px 0 0", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
                  {form.description}
                </p>
              )}
            </div>
          </div>

          {/* ── Tab bar ─────────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: 4, padding: 4, background: "white", border: B, borderRadius: 14 }}>
            {TABS.map(t => (
              <button type="button" key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "DM Sans,sans-serif",
                  background: activeTab === t.key ? N : "transparent",
                  color: activeTab === t.key ? "white" : M,
                  transition: "all .15s" }}>
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ══ BRANDING ══════════════════════════════════════════════ */}
            {activeTab === "branding" && (
              <motion.div key="branding" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={CARD}>
                  <SectionHead icon={<StoreIcon size={16} color={N} />} title="Store Identity" subtitle="Public-facing name, handle and bio" />

                  {/* Logo + Name row */}
                  <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                    <LogoUploader url={form.logoUrl} onUploaded={url => patch({ logoUrl: url })} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <span style={LBL}>Store Name</span>
                        <FocusInput value={form.name} onChange={(e: any) => patch({ name: e.target.value })} placeholder="My Awesome Store" required />
                      </div>
                      <HandleField value={form.handle} onChange={v => patch({ handle: v })} original={originalHandle} />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={LBL}>Store Bio</span>
                      <span style={{ fontSize: 10, color: form.description.length > 260 ? "#DC2626" : M }}>{form.description.length}/300</span>
                    </div>
                    <textarea value={form.description} rows={4} maxLength={300}
                      onChange={e => patch({ description: e.target.value })}
                      placeholder="Tell customers what makes your store special…"
                      style={inp({ resize: "none" } as any)}
                      onFocus={e => { e.currentTarget.style.borderColor = N; e.currentTarget.style.background = "white"; }}
                      onBlur={e  => { e.currentTarget.style.borderColor = "#E4E9F2"; e.currentTarget.style.background = "#FAFAFA"; }} />
                  </div>

                  {/* Category */}
                  <div>
                    <span style={LBL}>Store Category</span>
                    <div style={{ position: "relative" }}>
                      <Layers size={14} color={M} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                      <select value={form.category} onChange={e => patch({ category: e.target.value })}
                        style={{ ...inp({ paddingLeft: 36 }), cursor: "pointer", appearance: "none" }}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={14} color={M} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ VERIFICATION ══════════════════════════════════════════ */}
            {activeTab === "verification" && (
              <motion.div key="verification" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={CARD}>
                  <SectionHead icon={<ShieldCheck size={16} color={N} />} title="KYC Verification" subtitle="Required to receive payouts and sell on the platform" />

                  {/* Status read-only info */}
                  <div style={{ padding: "14px 16px", background: S, border: B, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: M, margin: "0 0 4px" }}>Verification Status</p>
                      <VerificationBadge status={form.verificationStatus} />
                    </div>
                    {form.verificationStatus === "pending" && (
                      <p style={{ fontSize: 11, color: M, maxWidth: 200, textAlign: "right", lineHeight: 1.5 }}>Our team reviews submissions within 2–3 business days.</p>
                    )}
                    {form.verificationStatus === "rejected" && (
                      <p style={{ fontSize: 11, color: "#DC2626", maxWidth: 200, textAlign: "right", lineHeight: 1.5 }}>Please update your PAN and resubmit.</p>
                    )}
                  </div>

                  {/* Business type toggle */}
                  <div>
                    <span style={LBL}>Business Type</span>
                    <div style={{ display: "flex", gap: 10 }}>
                      {(["individual", "business"] as const).map(type => (
                        <button type="button" key={type} onClick={() => patch({ businessType: type })}
                          style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: form.businessType === type ? `2px solid ${N}` : B, background: form.businessType === type ? N : "white", color: form.businessType === type ? "white" : "#6B7A99", fontSize: 13, fontWeight: 700, cursor: "pointer", textTransform: "capitalize", transition: "all .15s", fontFamily: "DM Sans,sans-serif" }}>
                          {type === "individual" ? "👤 Individual" : "🏢 Business"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PAN */}
                  <MaskedInput value={form.panNumber} onChange={v => patch({ panNumber: v.toUpperCase() })}
                    label="PAN Number" placeholder="ABCDE1234F" />
                  <p style={{ fontSize: 11, color: M, marginTop: -10 }}>Your PAN is encrypted and never shown publicly. Required for payouts above ₹50,000/year.</p>
                </div>
              </motion.div>
            )}

            {/* ══ FINANCE ═══════════════════════════════════════════════ */}
            {activeTab === "finance" && (
              <motion.div key="finance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={CARD}>
                  <SectionHead icon={<CreditCard size={16} color={N} />} title="Bank Details" subtitle="Used for weekly payout transfers" />

                  {/* Bank details info banner */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12 }}>
                    <AlertTriangle size={14} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 12, color: "#92400E", margin: 0, lineHeight: 1.55 }}>
                      Bank details are encrypted and only used for payout transfers. Verify your store first to enable payouts.
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <span style={LBL}>Account Holder Name</span>
                      <div style={{ position: "relative" }}>
                        <User size={14} color={M} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                        <FocusInput value={form.bankDetails.holderName}
                          onChange={(e: any) => patchBank({ holderName: e.target.value })}
                          placeholder="As on bank account" style={{ paddingLeft: 36 }} />
                      </div>
                    </div>

                    <MaskedInput value={form.bankDetails.accountNumber}
                      onChange={v => patchBank({ accountNumber: v.replace(/\D/g, "") })}
                      label="Account Number" placeholder="Enter account number" />

                    <div>
                      <span style={LBL}>IFSC Code</span>
                      <div style={{ position: "relative" }}>
                        <Hash size={14} color={M} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                        <FocusInput value={form.bankDetails.ifscCode}
                          onChange={(e: any) => patchBank({ ifscCode: e.target.value.toUpperCase() })}
                          placeholder="e.g. HDFC0001234" style={{ paddingLeft: 36, fontFamily: "monospace", letterSpacing: "0.08em" }} />
                      </div>
                      {form.bankDetails.ifscCode.length >= 4 && (
                        <a href={`https://ifsccode.com/${form.bankDetails.ifscCode}`} target="_blank" rel="noreferrer"
                          style={{ fontSize: 11, color: "#4F46E5", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, textDecoration: "none" }}>
                          <ExternalLink size={10} /> Verify IFSC →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ OPERATIONS ════════════════════════════════════════════ */}
            {activeTab === "operations" && (
              <motion.div key="operations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={CARD}>
                  <SectionHead icon={<Truck size={16} color={N} />} title="Shipping & Logistics" subtitle="How orders are picked up and delivered" />

                  {/* Shipping method */}
                  <div>
                    <span style={LBL}>Shipping Method</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {([
                        { key: "platform", Icon: Truck,     title: "Platform handles shipping",  desc: "We pick up from your address and deliver. Fees deducted from payout." },
                        { key: "self",     Icon: Warehouse,  title: "I ship it myself",            desc: "You arrange your own courier. Full control over packaging and tracking." },
                      ] as const).map(({ key, Icon, title, desc }) => {
                        const active = form.shippingMethod === key;
                        return (
                          <button type="button" key={key} onClick={() => patch({ shippingMethod: key })}
                            style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px", borderRadius: 14, border: active ? `2px solid ${N}` : B, background: active ? S : "white", cursor: "pointer", textAlign: "left", transition: "all .15s", fontFamily: "DM Sans,sans-serif" }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: active ? N : "#F0F2F8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}>
                              <Icon size={16} color={active ? "white" : M} />
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: N, margin: "0 0 3px" }}>{title}</p>
                              <p style={{ fontSize: 12, color: M, margin: 0, lineHeight: 1.5 }}>{desc}</p>
                            </div>
                            <div style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", border: active ? `5px solid ${N}` : `2px solid #E4E9F2`, background: "white", flexShrink: 0, transition: "all .15s" }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pickup address */}
                  <div>
                    <span style={LBL}>Pickup Address</span>
                    <div style={{ position: "relative" }}>
                      <MapPin size={14} color={M} style={{ position: "absolute", left: 14, top: 14, pointerEvents: "none" }} />
                      <textarea value={form.pickupAddress} rows={3}
                        onChange={e => patch({ pickupAddress: e.target.value })}
                        placeholder="Full address where orders will be collected from…"
                        style={inp({ paddingLeft: 36, resize: "none" } as any)}
                        onFocus={e => { e.currentTarget.style.borderColor = N; e.currentTarget.style.background = "white"; }}
                        onBlur={e  => { e.currentTarget.style.borderColor = "#E4E9F2"; e.currentTarget.style.background = "#FAFAFA"; }} />
                    </div>
                    <p style={{ fontSize: 11, color: M, marginTop: 6 }}>Include flat/door number, street, city, state and PIN code.</p>
                  </div>
                </div>

                {/* ── Store visibility ── */}
                <div style={CARD}>
                  <SectionHead icon={<Eye size={16} color={N} />} title="Store Visibility" subtitle="Control whether your store is publicly accessible" />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: S, border: B, borderRadius: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {form.isActive ? <Eye size={16} color="#059669" /> : <EyeOff size={16} color={M} />}
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: N, margin: 0 }}>{form.isActive ? "Store is Live" : "Store is Hidden"}</p>
                        <p style={{ fontSize: 11, color: M, margin: 0 }}>{form.isActive ? "Visible to all buyers on the platform" : "Only you can see your store"}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => patch({ isActive: !form.isActive })}
                      style={{ position: "relative", width: 44, height: 22, borderRadius: 999, background: form.isActive ? N : "#E4E9F2", border: "none", cursor: "pointer", flexShrink: 0, transition: "background .2s" }}>
                      <span style={{ position: "absolute", top: 3, width: 16, height: 16, borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.18)", transition: "left .2s", left: form.isActive ? "calc(100% - 19px)" : 3 }} />
                    </button>
                  </div>
                </div>

                {/* ── Danger zone ── */}
                <div style={{ ...CARD, border: "1px solid #FECDD3", background: "#FFF9F9" }}>
                  <SectionHead icon={<AlertTriangle size={16} color="#DC2626" />} title="Danger Zone" subtitle="Irreversible actions — proceed with caution" />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: N, margin: "0 0 3px" }}>Delete this store</p>
                      <p style={{ fontSize: 12, color: M, margin: 0 }}>Permanently removes all products, reels and order history.</p>
                    </div>
                    <button type="button" onClick={() => setShowDelete(true)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 12, background: "#FFF1F2", color: "#DC2626", border: "1px solid #FECDD3", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "DM Sans,sans-serif", whiteSpace: "nowrap" }}>
                      <AlertTriangle size={13} /> Delete store
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Sticky save bar ─────────────────────────────────────── */}
          <AnimatePresence>
            {dirty && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 40, display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", background: N, borderRadius: 16, boxShadow: "0 16px 56px rgba(10,22,40,0.28)", fontFamily: "DM Sans,sans-serif" }}>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0 }}>You have unsaved changes</p>
                <button type="button" onClick={() => window.location.reload()}
                  style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", background: "transparent", border: "none", cursor: "pointer" }}>
                  Discard
                </button>
                <button type="submit" disabled={saving}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 10, background: "white", color: N, fontSize: 13, fontWeight: 800, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.8 : 1 }}>
                  {saving
                    ? <div style={{ width: 14, height: 14, border: `2px solid rgba(10,22,40,0.25)`, borderTopColor: N, borderRadius: "50%", animation: "spin .6s linear infinite" }} />
                    : <Check size={14} />}
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>

      {/* ── Modals ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showDelete && (
          <DeleteModal
            storeName={form.name}
            onClose={() => setShowDelete(false)}
            onConfirm={async () => {
              const res = await fetch("/api/seller/store", { method: "DELETE" });
              if (res.ok) { toast.success("Store deleted"); window.location.href = "/"; }
              else toast.error("Failed to delete store");
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}