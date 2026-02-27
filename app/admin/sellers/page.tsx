"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  ShieldCheck, XCircle, Store, BadgeCheck,
  Search, ChevronDown, ChevronUp, Landmark,
  User, Calendar, Tag, Building2, AlertTriangle,
  CheckCircle2, Clock, X, Send,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ─── Tokens ──────────────────────────────────────────────────────
const N = "#0A1628"; const M = "#9BA8C0"; const B = "1px solid #E4E9F2"; const S = "#F7F8FC";

// ─── Types ────────────────────────────────────────────────────────
type TabStatus = "pending" | "verified" | "rejected";
interface StoreDoc {
  _id:                string;
  name:               string;
  handle:             string;
  description:        string;
  logoUrl?:           string;
  category:           string;
  businessType:       "individual" | "business";
  verificationStatus: TabStatus;
  shippingMethod:     string;
  isActive:           boolean;
  createdAt:          string;
  ownerId?: {
    name:  string;
    email: string;
    image?: string;
  };
  bankDetails?: {
    holderName?:    string;
    ifscCode?:      string;
    accountNumber?: string;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const ago = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30)  return `${days}d ago`;
  return fmtDate(d);
};

// ─── Skeleton ─────────────────────────────────────────────────────
const Sk = ({ h = 16, r = 8, w = "100%" }: { h?: number; r?: number; w?: string }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: "#E4E9F2", overflow: "hidden", position: "relative" }}>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#E4E9F2 0%,#F7F8FC 50%,#E4E9F2 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
  </div>
);

// ─── Tab button ───────────────────────────────────────────────────
function TabBtn({ label, count, active, color, onClick }: {
  label: string; count: number; active: boolean;
  color: { text: string; bg: string; border: string }; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 11, border: active ? `1.5px solid ${color.border}` : B, background: active ? color.bg : "white", cursor: "pointer", fontFamily: "DM Sans, sans-serif", transition: "all .18s" }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: active ? color.text : M }}>{label}</span>
      <span style={{ fontSize: 10, fontWeight: 800, padding: "1px 7px", borderRadius: 6, background: active ? color.text : "#E4E9F2", color: active ? "white" : M, transition: "all .18s" }}>
        {count}
      </span>
    </button>
  );
}

// ─── Info chip ────────────────────────────────────────────────────
const InfoChip = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: S, border: B }}>
    <Icon size={11} color={M} />
    <span style={{ fontSize: 10, fontWeight: 700, color: "#6B7A99" }}>{label}</span>
  </div>
);

// ─── Reject modal ─────────────────────────────────────────────────
function RejectModal({ store, onClose, onConfirm }: {
  store: StoreDoc; onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
}) {
  const [note,    setNote]    = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const submit = async () => {
    setLoading(true);
    await onConfirm(note);
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.55)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{ background: "white", borderRadius: 22, padding: "28px", width: "100%", maxWidth: 460, boxShadow: "0 24px 64px rgba(10,22,40,0.22)", fontFamily: "DM Sans, sans-serif" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#FFF1F2", border: "1px solid #FECDD3", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <XCircle size={20} color="#DC2626" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: N, margin: 0 }}>Reject Application</h3>
              <p style={{ fontSize: 11, color: M, margin: 0 }}>{store.name} · @{store.handle}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: B, background: S, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={13} color={M} />
          </button>
        </div>

        {/* Reason */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: M, display: "block", marginBottom: 8 }}>
            Rejection Reason <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <textarea ref={textareaRef} rows={4} value={note} onChange={e => setNote(e.target.value)}
            placeholder="e.g. PAN document is unclear. Please resubmit with a legible copy."
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: note.trim() ? "2px solid #0A1628" : "2px solid #E4E9F2", background: note.trim() ? "white" : S, fontSize: 13, fontFamily: "DM Sans, sans-serif", color: N, resize: "none", outline: "none", lineHeight: 1.65, boxSizing: "border-box", transition: "border-color .15s, background .15s" }} />
          <p style={{ fontSize: 10, color: M, margin: "5px 0 0" }}>
            This message will be sent to the seller as a notification.
          </p>
        </div>

        {/* Quick reason chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 22 }}>
          {[
            "PAN document unclear",
            "Bank details incomplete",
            "Invalid business category",
            "Duplicate application",
          ].map(r => (
            <button key={r} onClick={() => setNote(r)}
              style={{ padding: "4px 10px", borderRadius: 8, border: note === r ? `1.5px solid ${N}` : B, background: note === r ? N : S, color: note === r ? "white" : "#6B7A99", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "DM Sans, sans-serif", transition: "all .15s" }}>
              {r}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: "11px", borderRadius: 12, border: B, background: "white", fontSize: 13, fontWeight: 700, color: "#6B7A99", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
            Cancel
          </button>
          <button onClick={submit} disabled={!note.trim() || loading}
            style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", background: !note.trim() || loading ? "#E4E9F2" : "#DC2626", color: !note.trim() || loading ? M : "white", fontSize: 13, fontWeight: 800, cursor: !note.trim() || loading ? "not-allowed" : "pointer", fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "background .15s" }}>
            <Send size={13} />
            {loading ? "Rejecting…" : "Reject & Notify"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Store card ───────────────────────────────────────────────────
function StoreCard({ store, tab, onApprove, onReject }: {
  store: StoreDoc; tab: TabStatus;
  onApprove: () => void; onReject: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusBadge = {
    pending:  { label: "Pending Review", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: Clock },
    verified: { label: "Verified",       color: "#059669", bg: "#F0FDF4", border: "#BBF7D0", icon: CheckCircle2 },
    rejected: { label: "Rejected",       color: "#DC2626", bg: "#FFF1F2", border: "#FECDD3", icon: XCircle },
  }[store.verificationStatus];

  const StatusIcon = statusBadge.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: "white", border: B, borderRadius: 20, overflow: "hidden", boxShadow: "0 1px 4px rgba(10,22,40,0.04)" }}>

      {/* ── Main row ─────────────────────────────────────────── */}
      <div style={{ padding: "22px 24px", display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* Avatar */}
        <div style={{ width: 56, height: 56, borderRadius: 16, background: N, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", boxShadow: "0 4px 16px rgba(10,22,40,0.15)" }}>
          {store.logoUrl
            ? <img src={store.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <Store size={24} color="rgba(255,255,255,0.6)" />}
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
            <h3 style={{ fontFamily: "Instrument Serif, serif", fontSize: 20, color: N, margin: 0, letterSpacing: "-0.02em" }}>{store.name}</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: M }}>@{store.handle}</span>
            {/* Status badge */}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 7, background: statusBadge.bg, border: `1px solid ${statusBadge.border}`, fontSize: 9, fontWeight: 800, color: statusBadge.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              <StatusIcon size={9} />
              {statusBadge.label}
            </span>
          </div>

          {/* Description */}
          <p style={{ fontSize: 13, color: "#6B7A99", lineHeight: 1.6, margin: "0 0 12px", maxWidth: 520 }}>
            {store.description || <span style={{ color: M, fontStyle: "italic" }}>No description provided.</span>}
          </p>

          {/* Chips row */}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <InfoChip icon={Tag}       label={store.category || "General"} />
            <InfoChip icon={Building2} label={store.businessType === "individual" ? "Individual" : "Business"} />
            {store.ownerId && <InfoChip icon={User}     label={store.ownerId.name || store.ownerId.email} />}
            <InfoChip icon={Calendar}  label={`Applied ${ago(store.createdAt)}`} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* Expand toggle */}
          <button onClick={() => setExpanded(v => !v)}
            style={{ width: 36, height: 36, borderRadius: 10, border: B, background: expanded ? N : "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s" }}>
            {expanded
              ? <ChevronUp size={14} color="white" />
              : <ChevronDown size={14} color={M} />}
          </button>

          {tab === "pending" && (
            <>
              <button onClick={onReject}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 11, border: "1px solid #FECDD3", background: "#FFF1F2", fontSize: 12, fontWeight: 800, color: "#DC2626", cursor: "pointer", fontFamily: "DM Sans, sans-serif", transition: "all .15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#DC2626"; (e.currentTarget as HTMLElement).style.color = "white"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#FFF1F2"; (e.currentTarget as HTMLElement).style.color = "#DC2626"; }}>
                <XCircle size={14} /> Reject
              </button>
              <button onClick={onApprove}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 11, border: "none", background: N, fontSize: 12, fontWeight: 800, color: "white", cursor: "pointer", fontFamily: "DM Sans, sans-serif", boxShadow: "0 4px 14px rgba(10,22,40,0.18)", transition: "all .15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(10,22,40,0.28)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(10,22,40,0.18)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                <ShieldCheck size={14} /> Approve
              </button>
            </>
          )}

          {tab === "verified" && (
            <button onClick={onReject}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 11, border: "1px solid #FECDD3", background: "#FFF1F2", fontSize: 12, fontWeight: 800, color: "#DC2626", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
              <XCircle size={14} /> Revoke
            </button>
          )}

          {tab === "rejected" && (
            <button onClick={onApprove}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 11, border: "none", background: "#059669", fontSize: 12, fontWeight: 800, color: "white", cursor: "pointer", fontFamily: "DM Sans, sans-serif", boxShadow: "0 4px 14px rgba(5,150,105,0.2)" }}>
              <CheckCircle2 size={14} /> Approve
            </button>
          )}
        </div>
      </div>

      {/* ── Expanded detail panel ────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderTop: B, background: S, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>

              {/* Owner */}
              <DetailBlock label="Owner" icon={User}>
                <p style={{ fontSize: 13, fontWeight: 700, color: N, margin: 0 }}>{store.ownerId?.name || "—"}</p>
                <p style={{ fontSize: 11, color: M, margin: 0 }}>{store.ownerId?.email || "—"}</p>
              </DetailBlock>

              {/* Bank */}
              <DetailBlock label="Bank Account" icon={Landmark}>
                <p style={{ fontSize: 13, fontWeight: 700, color: N, margin: 0 }}>{store.bankDetails?.holderName || "—"}</p>
                <p style={{ fontSize: 11, color: M, margin: 0, fontFamily: "DM Mono, monospace" }}>{store.bankDetails?.ifscCode || "IFSC not provided"}</p>
              </DetailBlock>

              {/* Business type */}
              <DetailBlock label="Entity Type" icon={Building2}>
                <p style={{ fontSize: 13, fontWeight: 700, color: N, margin: 0, textTransform: "capitalize" }}>{store.businessType}</p>
                <p style={{ fontSize: 11, color: M, margin: 0 }}>{store.shippingMethod === "platform" ? "Platform shipping" : "Self shipping"}</p>
              </DetailBlock>

              {/* Applied date */}
              <DetailBlock label="Applied On" icon={Calendar}>
                <p style={{ fontSize: 13, fontWeight: 700, color: N, margin: 0 }}>{fmtDate(store.createdAt)}</p>
                <p style={{ fontSize: 11, color: M, margin: 0 }}>{ago(store.createdAt)}</p>
              </DetailBlock>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Detail block ─────────────────────────────────────────────────
function DetailBlock({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ background: "white", border: B, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Icon size={11} color={M} />
        <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: M }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function AdminSellersQueue() {
  const [stores,      setStores]      = useState<StoreDoc[]>([]);
  const [counts,      setCounts]      = useState({ pending: 0, verified: 0, rejected: 0 });
  const [tab,         setTab]         = useState<TabStatus>("pending");
  const [search,      setSearch]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [rejectTarget,setRejectTarget]= useState<StoreDoc | null>(null);
  const [actioning,   setActioning]   = useState<string | null>(null);

  const load = useCallback(async (status: TabStatus) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/pending-stores?status=${status}`);
      const data = await res.json();
      setStores(data.stores  ?? []);
      setCounts(data.counts  ?? { pending: 0, verified: 0, rejected: 0 });
    } catch {
      toast.error("Failed to load stores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  // Live search filter
  const filtered = stores.filter(s => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.handle.toLowerCase().includes(q) || s.ownerId?.email?.toLowerCase().includes(q);
  });

  // Action handler — approve or reject
  const handleAction = async (storeId: string, status: "verified" | "rejected", note?: string) => {
    setActioning(storeId);
    try {
      const res = await fetch("/api/admin/verify-store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, status, note }),
      });

      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Action failed");
        return;
      }

      toast.success(
        status === "verified" ? "✅ Store approved — seller notified" : "Store rejected — seller notified",
        { description: status === "verified" ? "Store is now live on ReeCommerce." : note }
      );

      // Remove from current tab list + update counts
      setStores(prev => prev.filter(s => s._id !== storeId));
      setCounts(prev => {
        const updated = { ...prev };
        // decrement current tab
        if (tab === "pending")  updated.pending  = Math.max(0, updated.pending - 1);
        if (tab === "verified") updated.verified = Math.max(0, updated.verified - 1);
        if (tab === "rejected") updated.rejected = Math.max(0, updated.rejected - 1);
        // increment target
        if (status === "verified") updated.verified += 1;
        if (status === "rejected") updated.rejected += 1;
        return updated;
      });
      setRejectTarget(null);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setActioning(null);
    }
  };

  const TAB_CONFIG: { id: TabStatus; label: string; color: { text: string; bg: string; border: string } }[] = [
    { id: "pending",  label: "Pending",  color: { text: "#D97706", bg: "#FFFBEB", border: "#FDE68A" } },
    { id: "verified", label: "Verified", color: { text: "#059669", bg: "#F0FDF4", border: "#BBF7D0" } },
    { id: "rejected", label: "Rejected", color: { text: "#DC2626", bg: "#FFF1F2", border: "#FECDD3" } },
  ];

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "DM Sans, sans-serif" }}>

        {/* ── Header ───────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: M, margin: "0 0 4px" }}>
              {counts.pending} pending · {counts.verified} verified · {counts.rejected} rejected
            </p>
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: 28, color: N, margin: 0, letterSpacing: "-0.025em" }}>Sellers Queue</h1>
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={13} color={M} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input type="text" placeholder="Search by name, handle, email…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: "9px 14px 9px 34px", borderRadius: 11, border: B, background: "white", fontSize: 12, fontFamily: "DM Sans, sans-serif", color: N, outline: "none", width: 260, transition: "border-color .15s" }}
              onFocus={e => (e.target.style.borderColor = N)}
              onBlur={e  => (e.target.style.borderColor = "#E4E9F2")} />
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TAB_CONFIG.map(t => (
            <TabBtn key={t.id} label={t.label} count={counts[t.id]} active={tab === t.id}
              color={t.color} onClick={() => { setTab(t.id); setSearch(""); }} />
          ))}
        </div>

        {/* ── Content ──────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[0, 1, 2].map(i => <Sk key={i} h={120} r={20} />)}
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: "60px 24px", textAlign: "center", background: "white", border: `2px dashed #E4E9F2`, borderRadius: 20 }}>
              <BadgeCheck size={40} color="#C4CDD8" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, fontWeight: 800, color: N, margin: "0 0 4px" }}>
                {search ? "No stores match your search" : `No ${tab} applications`}
              </p>
              <p style={{ fontSize: 12, color: M, margin: 0 }}>
                {search ? "Try a different name or handle." : tab === "pending" ? "All caught up — no stores waiting for review." : `No stores have been ${tab} yet.`}
              </p>
            </motion.div>
          ) : (
            <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Result count if searching */}
              {search && (
                <p style={{ fontSize: 11, color: M, margin: 0 }}>
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "<strong style={{ color: N }}>{search}</strong>"
                </p>
              )}

              {filtered.map(store => (
                <StoreCard
                  key={store._id}
                  store={store}
                  tab={tab}
                  onApprove={() => handleAction(store._id, "verified")}
                  onReject={() => {
                    if (tab === "verified") {
                      // Revoke = reject with a default note
                      handleAction(store._id, "rejected", "Verification revoked by admin.");
                    } else {
                      setRejectTarget(store);
                    }
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Reject modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            store={rejectTarget}
            onClose={() => setRejectTarget(null)}
            onConfirm={async (note) => {
              await handleAction(rejectTarget._id, "rejected", note);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}