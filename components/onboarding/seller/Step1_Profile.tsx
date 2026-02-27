"use client";

import { useState, useEffect, useRef } from "react";
import { ShoppingBag, AtSign, AlignLeft, Check, X, Loader2, ArrowUpRight, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const N = "#0A1628"; const M = "#9BA8C0"; const B = "1px solid #E4E9F2"; const S = "#F7F8FC";
const ER = "#DC2626"; const EB = "#FFF1F2"; const EBD = "#FECDD3";

const MAX_DESC = 200; const MIN_DESC = 20;
type HandleState = "idle" | "checking" | "available" | "taken" | "short";

// ── Exported validator ────────────────────────────────────────────
export function validateStep1(f: any): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.shopName?.trim())                           e.shopName        = "Shop name is required.";
  else if (f.shopName.trim().length < 3)             e.shopName        = "Must be at least 3 characters.";
  if (!f.shopHandle?.trim())                         e.shopHandle      = "Handle is required.";
  else if (f.shopHandle.length < 3)                  e.shopHandle      = "Handle must be at least 3 characters.";
  if (!f.shopDescription?.trim())                    e.shopDescription = "Bio is required.";
  else if (f.shopDescription.trim().length < MIN_DESC)
    e.shopDescription = `${MIN_DESC - f.shopDescription.trim().length} more characters needed.`;
  return e;
}

interface Step1Props { formData: any; setFormData: (d: any) => void; showErrors?: boolean; }

export default function Step1_Profile({ formData, setFormData, showErrors = false }: Step1Props) {
  const [focused,     setFocused]     = useState<string | null>(null);
  const [handleState, setHandleState] = useState<HandleState>("idle");
  const [touched,     setTouched]     = useState<Record<string, boolean>>({});
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showErrors) setTouched({ shopName: true, shopHandle: true, shopDescription: true });
  }, [showErrors]);

  const errs = validateStep1(formData);
  const show = (f: string) => !!(touched[f] || showErrors) && !!errs[f];

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
    if (name === "shopHandle") {
      const fmt = value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      setFormData({ ...formData, shopHandle: fmt });
      if (debounce.current) clearTimeout(debounce.current);
      if (fmt.length < 3) { setHandleState(fmt.length > 0 ? "short" : "idle"); return; }
      setHandleState("checking");
      debounce.current = setTimeout(async () => {
        try { const r = await fetch(`/api/seller/check-handle?handle=${fmt}`); const d = await r.json(); setHandleState(d.available ? "available" : "taken"); }
        catch { setHandleState("idle"); }
      }, 600);
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

  const descLen = formData.shopDescription?.length ?? 0;

  const HandleBadge = () => {
    const cfg: Record<HandleState, { text: string; color: string; bg: string; bdr: string; icon: React.ReactNode } | null> = {
      idle: null,
      checking:  { text: "Checking…",   color: M,   bg: S,        bdr: "#E4E9F2", icon: <Loader2 size={9} style={{ animation: "spin .6s linear infinite" }} /> },
      available: { text: "Available",   color: "#059669", bg: "#F0FDF4", bdr: "#BBF7D0", icon: <Check size={9} strokeWidth={3} /> },
      taken:     { text: "Taken",       color: ER,  bg: EB,        bdr: EBD,       icon: <X size={9} strokeWidth={3} /> },
      short:     { text: "Min 3 chars", color: "#D97706", bg: "#FFFBEB", bdr: "#FDE68A", icon: <AlignLeft size={9} /> },
    };
    const c = cfg[handleState]; if (!c) return null;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, background: c.bg, border: `1px solid ${c.bdr}`, fontSize: 9, fontWeight: 800, color: c.color, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
        {c.icon}{c.text}
      </motion.div>
    );
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "DM Sans, sans-serif" }}>

        <div style={{ paddingBottom: 18, borderBottom: B }}>
          <p style={{ fontSize: 13, color: M, lineHeight: 1.65, margin: 0 }}>
            Visible on your public profile and the discovery feed. Choose a name buyers will remember.
          </p>
        </div>

        {/* Shop Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <LabelIcon name="shopName" icon={ShoppingBag} />
            <label style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: show("shopName") ? ER : M }}>
              Shop Name <span style={{ color: ER }}>*</span>
            </label>
          </div>
          <input type="text" name="shopName" required placeholder="e.g. Midnight Vintage"
            value={formData.shopName} onChange={onChange} onFocus={() => setFocused("shopName")} onBlur={() => onBlur("shopName")}
            style={inp("shopName")} />
          <Err name="shopName" />
        </div>

        {/* Handle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <LabelIcon name="shopHandle" icon={AtSign} />
              <label style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: show("shopHandle") ? ER : M }}>
                Store Handle <span style={{ color: ER }}>*</span>
              </label>
            </div>
            <HandleBadge />
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 700, color: M, pointerEvents: "none" }}>@</div>
            <input type="text" name="shopHandle" required placeholder="midnight-vintage"
              value={formData.shopHandle} onChange={onChange} onFocus={() => setFocused("shopHandle")} onBlur={() => onBlur("shopHandle")}
              style={{ ...inp("shopHandle"), paddingLeft: 28, borderColor: handleState === "taken" ? ER : handleState === "available" ? "#BBF7D0" : show("shopHandle") ? ER : focused === "shopHandle" ? N : "#E4E9F2" }} />
          </div>
          <Err name="shopHandle" />
          <AnimatePresence>
            {formData.shopHandle && handleState !== "taken" && handleState !== "short" && !errs.shopHandle && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: S, border: B, borderRadius: 10 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: N, display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowUpRight size={9} color="white" /></div>
                <span style={{ fontSize: 11, color: M, fontWeight: 500 }}>reecommerce.com/store/<strong style={{ color: N }}>{formData.shopHandle}</strong></span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bio */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <LabelIcon name="shopDescription" icon={AlignLeft} />
              <label style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: show("shopDescription") ? ER : M }}>
                Short Bio <span style={{ color: ER }}>*</span>
              </label>
            </div>
            <span style={{ fontSize: 9, fontWeight: 800, color: descLen > MAX_DESC - 20 ? "#D97706" : M }}>{descLen} / {MAX_DESC}</span>
          </div>
          <textarea name="shopDescription" required rows={4} maxLength={MAX_DESC}
            placeholder="What makes your shop special? Tell buyers what you sell…"
            value={formData.shopDescription} onChange={onChange} onFocus={() => setFocused("shopDescription")} onBlur={() => onBlur("shopDescription")}
            style={{ ...inp("shopDescription"), resize: "none", lineHeight: 1.65 }} />
          <Err name="shopDescription" />
          {!show("shopDescription") && (
            <div style={{ height: 2, background: "#E4E9F2", borderRadius: 99, overflow: "hidden" }}>
              <motion.div animate={{ width: `${Math.min(100, (descLen / MAX_DESC) * 100)}%`, background: descLen < MIN_DESC ? "#E4E9F2" : "#059669" }} transition={{ duration: 0.2 }} style={{ height: "100%", borderRadius: 99 }} />
            </div>
          )}
        </div>

        {/* Preview */}
        <AnimatePresence>
          {(formData.shopName || formData.shopDescription) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ padding: "14px 16px", background: S, border: B, borderRadius: 14, display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: N, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ShoppingBag size={17} color="white" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: N, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{formData.shopName || "Your Store Name"}</p>
                {formData.shopHandle && <p style={{ fontSize: 10, color: M, margin: "0 0 5px", fontWeight: 600 }}>@{formData.shopHandle}</p>}
                {formData.shopDescription && <p style={{ fontSize: 12, color: "#6B7A99", lineHeight: 1.55, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{formData.shopDescription}</p>}
              </div>
              <span style={{ fontSize: 8, fontWeight: 800, padding: "3px 7px", borderRadius: 5, background: "white", border: B, color: M, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>Preview</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}