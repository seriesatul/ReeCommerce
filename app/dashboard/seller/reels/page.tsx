"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Video, Eye, Heart, MoreVertical, Plus, Search,
  ExternalLink, Trash2, Edit2, Globe, EyeOff,
  Check, X, RefreshCw, Package, Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Reel {
  _id: string; thumbnailUrl: string; videoUrl: string;
  productId: { _id: string; name: string; price: number; stock: number } | null;
  viewsCount: number; likesCount: number; score: number;
  isMultiProduct: boolean; title?: string;
  isPublished?: boolean; createdAt: string;
}
type SortKey   = "createdAt" | "viewsCount" | "likesCount" | "score";
type FilterKey = "all" | "published" | "draft";

const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1_000).toFixed(1)}K` : String(n ?? 0);
const relDate = (iso: string) => {
  const d = Date.now() - new Date(iso).getTime();
  const days = Math.floor(d / 86400000);
  if (days === 0) return "Today"; if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days/30)}mo ago`;
  return `${Math.floor(days/365)}y ago`;
};

const N = "#0A1628", M = "#9BA8C0", B = "1px solid #E4E9F2", S = "#F7F8FC";

function EditModal({ reel, onClose, onSave }: {
  reel: Reel; onClose: () => void;
  onSave: (id: string, u: Record<string, any>) => Promise<void>;
}) {
  const [title, setTitle] = useState(reel.title ?? reel.productId?.name ?? "");
  const [desc,  setDesc]  = useState("");
  const [pub,   setPub]   = useState(reel.isPublished ?? true);
  const [busy,  setBusy]  = useState(false);
  const go = async () => {
    setBusy(true);
    try { await onSave(reel._id, { title, description: desc, isPublished: pub }); onClose(); }
    catch { setBusy(false); }
  };
  const inp: React.CSSProperties = {
    border: B, background: "#FAFAFA", color: N, fontFamily: "DM Sans,sans-serif",
    width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14, outline: "none",
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,22,40,0.5)", backdropFilter: "blur(12px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }} transition={{ ease: [0.16,1,0.3,1], duration: 0.28 }}
        style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 520, border: B,
          boxShadow: "0 32px 96px rgba(10,22,40,0.22)", fontFamily: "DM Sans,sans-serif", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: B }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {reel.thumbnailUrl && (
              <div style={{ width: 30, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: S }}>
                <img src={reel.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: N, margin: 0 }}>Edit reel</p>
              <p style={{ fontSize: 11, color: M, margin: 0 }}>{reel.productId?.name ?? "No product"}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: B, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={e => (e.currentTarget.style.background = S)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <X size={15} color="#6B7A99" />
          </button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: M, marginBottom: 6 }}>Title</p>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Optional reel title" style={inp}
              onFocus={e => { e.currentTarget.style.borderColor = N; e.currentTarget.style.background = "white"; }}
              onBlur={e  => { e.currentTarget.style.borderColor = "#E4E9F2"; e.currentTarget.style.background = "#FAFAFA"; }} />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: M, marginBottom: 6 }}>Description</p>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Describe what is in this reel..." rows={3}
              style={{ ...inp, resize: "none" as any }}
              onFocus={e => { e.currentTarget.style.borderColor = N; e.currentTarget.style.background = "white"; }}
              onBlur={e  => { e.currentTarget.style.borderColor = "#E4E9F2"; e.currentTarget.style.background = "#FAFAFA"; }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: S, border: B, borderRadius: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {pub ? <Globe size={15} color="#059669" /> : <EyeOff size={15} color={M} />}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: N, margin: 0 }}>{pub ? "Published" : "Draft"}</p>
                <p style={{ fontSize: 10, color: M, margin: 0 }}>{pub ? "Visible to all buyers" : "Only visible to you"}</p>
              </div>
            </div>
            <button onClick={() => setPub(v => !v)} style={{ position: "relative", width: 40, height: 20, borderRadius: 999, background: pub ? N : "#E4E9F2", border: "none", cursor: "pointer", flexShrink: 0 }}>
              <span style={{ position: "absolute", top: 2, width: 16, height: 16, borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.18)", transition: "left .2s", left: pub ? "calc(100% - 18px)" : 2 }} />
            </button>          </div>
          {reel.productId && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: S, border: B, borderRadius: 12 }}>
              <Package size={14} color={M} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: N, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reel.productId.name}</p>
                <p style={{ fontSize: 11, color: M, margin: 0 }}>Rs.{reel.productId.price} &middot; {reel.productId.stock} in stock</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "#E4E9F2", color: "#6B7A99" }}>Linked</span>
            </div>
          )}
          {reel.isMultiProduct && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10 }}>
              <Zap size={13} color="#059669" />
              <p style={{ fontSize: 11, fontWeight: 600, color: "#059669", margin: 0 }}>Multi-product reel with hotspots</p>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, padding: "14px 24px", borderTop: B }}>
          <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 12, border: B, background: "transparent", fontSize: 13, fontWeight: 600, color: "#6B7A99", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = S)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            Cancel
          </button>
          <button onClick={go} disabled={busy} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: N, color: "white", fontSize: 13, fontWeight: 700, border: "none", cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, boxShadow: "0 4px 16px rgba(10,22,40,0.16)" }}>
            {busy ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> : <Check size={14} />}
            Save changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DeleteModal({ reel, onClose, onConfirm }: {
  reel: Reel; onClose: () => void; onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const go = async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,22,40,0.5)", backdropFilter: "blur(12px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }} transition={{ ease: [0.16,1,0.3,1], duration: 0.25 }}
        style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 400, border: B, boxShadow: "0 24px 80px rgba(10,22,40,0.2)", fontFamily: "DM Sans,sans-serif", overflow: "hidden" }}>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#FFF1F2", border: "1px solid #FECDD3", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trash2 size={18} color="#F87171" />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: N, margin: "0 0 6px" }}>Delete this reel?</p>
            <p style={{ fontSize: 13, color: M, lineHeight: 1.6, margin: 0 }}>The video and thumbnail will be permanently removed from Cloudinary. This cannot be undone.</p>
          </div>
          {reel.productId && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: S, border: B, borderRadius: 10 }}>
              <Package size={13} color={M} />
              <span style={{ fontSize: 11, fontWeight: 600, color: N }}>Linked to: {reel.productId.name}</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: B, background: "transparent", fontSize: 13, fontWeight: 600, color: "#6B7A99", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = S)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>Cancel</button>
            <button onClick={go} disabled={busy} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", borderRadius: 12, background: "#F87171", color: "white", fontSize: 13, fontWeight: 700, border: "none", cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}>
              {busy ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> : <Trash2 size={14} />}
              Delete
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ActionsMenu({ reel, onEdit, onDelete, onToggle }: {
  reel: Reel; onEdit: () => void; onDelete: () => void; onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const items = [
    { icon: Edit2, label: "Edit details", action: () => { setOpen(false); onEdit(); } },
    { icon: reel.isPublished ? EyeOff : Globe, label: reel.isPublished ? "Unpublish" : "Publish", action: () => { setOpen(false); onToggle(); } },
    { icon: ExternalLink, label: "View live", action: () => { setOpen(false); window.open(`/?reelId=${reel._id}`, "_blank"); } },
    { icon: Trash2, label: "Delete", danger: true, action: () => { setOpen(false); onDelete(); } },
  ];
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width: 32, height: 32, borderRadius: 10, border: B, background: open ? S : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        onMouseEnter={e => (e.currentTarget.style.background = S)} onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}>
        <MoreVertical size={15} color="#6B7A99" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -2 }} transition={{ duration: 0.14 }}
            style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "white", borderRadius: 12, border: B, boxShadow: "0 8px 32px rgba(10,22,40,0.12)", minWidth: 160, overflow: "hidden", zIndex: 20 }}>
            {items.map(item => (
              <button key={item.label} onClick={item.action}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: (item as any).danger ? "#F87171" : N, textAlign: "left", fontFamily: "DM Sans,sans-serif" }}
                onMouseEnter={e => (e.currentTarget.style.background = (item as any).danger ? "#FFF1F2" : S)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <item.icon size={14} />
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ReelsStudio() {
  const [reels,   setReels]   = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState<FilterKey>("all");
  const [sort,    setSort]    = useState<SortKey>("createdAt");
  const [editR,   setEditR]   = useState<Reel | null>(null);
  const [delR,    setDelR]    = useState<Reel | null>(null);

 const fetchReels = useCallback(async (silent = false) => {
  if (!silent) setLoading(true); else setRefresh(true);
  try {
    const res  = await fetch("/api/seller/reels");
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.reels ?? []);
    setReels(list.map((r: any) => ({ ...r, isPublished: r.isPublished ?? true })));
  } catch { toast.error("Failed to load reels"); }
  finally { setLoading(false); setRefresh(false); }
}, []);

  useEffect(() => { fetchReels(); }, [fetchReels]);

  const saveReel = async (id: string, updates: Record<string, any>) => {
    const res = await fetch(`/api/seller/reels/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
    setReels(p => p.map(r => r._id === id ? { ...r, ...updates } : r));
    toast.success("Reel updated");
  };

  const deleteReel = async (id: string) => {
    const res = await fetch(`/api/seller/reels/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
    setReels(p => p.filter(r => r._id !== id));
    setDelR(null);
    toast.success("Reel deleted");
  };

  const visible = reels
    .filter(r => filter === "published" ? (r.isPublished ?? true) : filter === "draft" ? !(r.isPublished ?? true) : true)
    .filter(r => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (r.title ?? r.productId?.name ?? "").toLowerCase().includes(q) || (r.productId?.name ?? "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === "viewsCount") return (b.viewsCount ?? 0) - (a.viewsCount ?? 0);
      if (sort === "likesCount") return (b.likesCount ?? 0) - (a.likesCount ?? 0);
      if (sort === "score")      return (b.score ?? 0) - (a.score ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const pub   = reels.filter(r => r.isPublished ?? true).length;
  const draft = reels.filter(r => !(r.isPublished ?? true)).length;
  const totalViews = reels.reduce((a, r) => a + (r.viewsCount ?? 0), 0);
  const totalLikes = reels.reduce((a, r) => a + (r.likesCount ?? 0), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 64, fontFamily: "DM Sans, sans-serif" }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: "clamp(1.6rem, 2.5vw, 2.1rem)", color: N, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
              Reels Studio
              <em style={{ fontWeight: 300, fontStyle: "italic", opacity: 0.38, marginLeft: 10 }}>content</em>
            </h1>
            <p style={{ fontSize: 14, color: M, margin: "4px 0 0" }}>Manage, edit and track your video performance</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => fetchReels(true)}
              style={{ width: 36, height: 36, borderRadius: 10, border: B, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => (e.currentTarget.style.background = S)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <RefreshCw size={15} color="#6B7A99" className={refresh ? "animate-spin" : ""} />
            </button>
            <Link href="/seller/upload"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 12, background: N, color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 16px rgba(10,22,40,0.14)" }}>
              <Plus size={15} />
              Upload reel
            </Link>
          </div>
        </div>

        {/* ── Summary stats ───────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {[
            { label: "Total reels", value: String(reels.length), Icon: Video },
            { label: "Published",   value: String(pub),          Icon: Globe },
            { label: "Total views", value: fmt(totalViews),      Icon: Eye   },
            { label: "Total likes", value: fmt(totalLikes),      Icon: Heart },
          ].map(({ label, value, Icon }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ background: "white", border: B, borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: S, border: B, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={15} color={N} />
              </div>
              <div>
                <p style={{ fontFamily: "Instrument Serif, serif", fontSize: 22, fontWeight: 900, color: N, margin: 0, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: M, margin: "3px 0 0" }}>{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Filter + search bar ──────────────────────────────────── */}
        <div style={{ background: "white", border: B, borderRadius: 16, padding: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={15} color={M} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search reels or products..."
              style={{ width: "100%", paddingLeft: 40, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: B, background: S, fontSize: 13, color: N, outline: "none", fontFamily: "DM Sans,sans-serif", boxSizing: "border-box" }}
              onFocus={e => { e.currentTarget.style.borderColor = N; e.currentTarget.style.background = "white"; }}
              onBlur={e  => { e.currentTarget.style.borderColor = "#E4E9F2"; e.currentTarget.style.background = S; }}
            />
          </div>
          <div style={{ display: "flex", gap: 4, padding: 4, background: S, border: B, borderRadius: 12 }}>
            {([
              { key: "all",       label: `All (${reels.length})` },
              { key: "published", label: `Live (${pub})` },
              { key: "draft",     label: `Draft (${draft})` },
            ] as { key: FilterKey; label: string }[]).map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "DM Sans,sans-serif", background: filter === f.key ? "white" : "transparent", color: filter === f.key ? N : M, boxShadow: filter === f.key ? "0 1px 4px rgba(10,22,40,0.08)" : "none", transition: "all .15s" }}>
                {f.label}
              </button>
            ))}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
            style={{ padding: "10px 14px", borderRadius: 10, border: B, background: S, fontSize: 12, fontWeight: 700, color: "#6B7A99", outline: "none", cursor: "pointer", fontFamily: "DM Sans,sans-serif" }}>
            <option value="createdAt">Newest first</option>
            <option value="viewsCount">Most viewed</option>
            <option value="likesCount">Most liked</option>
            <option value="score">Top score</option>
          </select>
        </div>

        {/* ── Content area ─────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 14 }}>
            <div style={{ width: 36, height: 36, border: `2px solid ${N}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: M }}>Loading reels…</p>
          </div>
        ) : reels.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: "white", border: "1px dashed #E4E9F2", borderRadius: 20, padding: "64px 24px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: S, border: B, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Video size={24} color="#C4CDD8" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: N, margin: "0 0 8px" }}>No reels yet</p>
            <p style={{ fontSize: 14, color: M, margin: "0 0 24px" }}>Upload your first product reel to start getting views</p>
            <Link href="/seller/upload" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 12, background: N, color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              <Plus size={15} /> Upload now
            </Link>
          </motion.div>
        ) : visible.length === 0 ? (
          <div style={{ background: "white", border: B, borderRadius: 20, padding: "48px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: M }}>No reels match your filters</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: "white", border: B, borderRadius: 20, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F4F6FB" }}>
                    {["Reel / Product", "Status", "Views", "Likes", "Score", "Uploaded", ""].map((h, i) => (
                      <th key={i} style={{ padding: "14px 20px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: M, whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {visible.map((reel, i) => {
                      const isLive = reel.isPublished ?? true;
                      const reelTitle = reel.title ?? reel.productId?.name ?? "Untitled";
                      return (
                        <motion.tr key={reel._id}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.04 }}
                          style={{ borderBottom: i < visible.length - 1 ? "1px solid #F7F8FC" : "none" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#FAFBFF")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                          {/* Thumbnail + title */}
                          <td style={{ padding: "12px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ position: "relative", width: 36, height: 52, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: S, border: B }}>
                                {reel.thumbnailUrl
                                  ? <Image src={reel.thumbnailUrl} alt={reelTitle} fill className="object-cover" />
                                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Video size={14} color="#C4CDD8" /></div>
                                }
                                {reel.isMultiProduct && (
                                  <div style={{ position: "absolute", top: 3, right: 3, width: 14, height: 14, borderRadius: 4, background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Zap size={8} color="white" />
                                  </div>
                                )}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: N, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{reelTitle}</p>
                                {reel.productId && (
                                  <p style={{ fontSize: 11, color: M, margin: 0 }}>Rs.{reel.productId.price} &middot; {reel.productId.stock} in stock</p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: "12px 20px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: isLive ? "#F0FDF4" : "#F7F8FC", color: isLive ? "#059669" : M, border: `1px solid ${isLive ? "#BBF7D0" : "#E4E9F2"}` }}>
                              {isLive ? <Globe size={11} /> : <EyeOff size={11} />}
                              {isLive ? "Live" : "Draft"}
                            </span>
                          </td>

                          {/* Views */}
                          <td style={{ padding: "12px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Eye size={13} color={M} />
                              <span style={{ fontSize: 13, fontWeight: 700, color: N }}>{fmt(reel.viewsCount ?? 0)}</span>
                            </div>
                          </td>

                          {/* Likes */}
                          <td style={{ padding: "12px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Heart size={13} color={M} />
                              <span style={{ fontSize: 13, fontWeight: 700, color: N }}>{fmt(reel.likesCount ?? 0)}</span>
                            </div>
                          </td>

                          {/* Score bar */}
                          <td style={{ padding: "12px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 48, height: 4, borderRadius: 99, background: "#E4E9F2", overflow: "hidden" }}>
                                <div style={{ height: "100%", borderRadius: 99, background: N, width: `${Math.min((reel.score ?? 0) / 100 * 100, 100)}%` }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: N }}>{reel.score ?? 0}</span>
                            </div>
                          </td>

                          {/* Upload date */}
                          <td style={{ padding: "12px 20px", whiteSpace: "nowrap" }}>
                            <span style={{ fontSize: 12, color: M }}>{relDate(reel.createdAt)}</span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: "12px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                              <button onClick={() => setEditR(reel)}
                                style={{ width: 30, height: 30, borderRadius: 8, border: B, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                title="Edit"
                                onMouseEnter={e => (e.currentTarget.style.background = S)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                <Edit2 size={13} color="#6B7A99" />
                              </button>
                              <ActionsMenu
                                reel={reel}
                                onEdit={() => setEditR(reel)}
                                onDelete={() => setDelR(reel)}
                                onToggle={() => saveReel(reel._id, { isPublished: !(reel.isPublished ?? true) }).catch(e => toast.error(e.message))}
                              />
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid #F4F6FB", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 11, color: M, margin: 0 }}>Showing {visible.length} of {reels.length} reels</p>
              <Link href="/seller/upload" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: N, textDecoration: "none", opacity: 0.8 }}
                onMouseEnter={(e: any) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e: any) => (e.currentTarget.style.opacity = "0.8")}>
                <Plus size={13} /> Upload new
              </Link>
            </div>
          </motion.div>
        )}

        {/* ── Modals ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {editR && <EditModal reel={editR} onClose={() => setEditR(null)} onSave={saveReel} />}
          {delR  && <DeleteModal reel={delR} onClose={() => setDelR(null)} onConfirm={() => deleteReel(delR._id)} />}
        </AnimatePresence>
      </div>
    </>
  );
}