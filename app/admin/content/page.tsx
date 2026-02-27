"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Trash2, Play, Search, RefreshCw, RotateCcw,
  Eye, Heart, TrendingUp, Video, EyeOff,
  AlertTriangle, X, ShieldAlert, Grid3X3,
  ChevronLeft, ChevronRight, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ─── Tokens ──────────────────────────────────────────────────────
const N = "#0A1628"; const M = "#9BA8C0"; const B = "1px solid #E4E9F2"; const S = "#F7F8FC";

// ─── Types ────────────────────────────────────────────────────────
type Filter = "all" | "live" | "taken-down";
interface ReelDoc {
  _id:           string;
  title?:        string;
  description?:  string;
  thumbnailUrl:  string;
  videoUrl:      string;
  isPublished:   boolean;
  isMultiProduct:boolean;
  likesCount:    number;
  viewsCount:    number;
  score:         number;
  createdAt:     string;
  storeId?: { _id: string; name: string; handle: string; logoUrl?: string };
  productId?: { name: string; imageUrl: string; price: number };
  hotspots: any[];
}

// ─── Helpers ─────────────────────────────────────────────────────
const fmtCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n ?? 0);
};
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// ─── Skeleton ─────────────────────────────────────────────────────
const Sk = ({ h = 16, r = 8, w = "100%" }: { h?: number; r?: number; w?: string }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: "#E4E9F2", overflow: "hidden", position: "relative" }}>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#E4E9F2 0%,#F7F8FC 50%,#E4E9F2 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
  </div>
);

// ─── Filter tab ───────────────────────────────────────────────────
function FilterTab({ label, count, active, onClick, color }: {
  label: string; count: number; active: boolean; onClick: () => void;
  color: { text: string; bg: string; border: string };
}) {
  return (
    <button onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 11, border: active ? `1.5px solid ${color.border}` : B, background: active ? color.bg : "white", cursor: "pointer", fontFamily: "DM Sans, sans-serif", transition: "all .18s" }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: active ? color.text : M }}>{label}</span>
      <span style={{ fontSize: 10, fontWeight: 800, padding: "1px 7px", borderRadius: 6, background: active ? color.text : "#E4E9F2", color: active ? "white" : M, transition: "all .18s" }}>
        {count}
      </span>
    </button>
  );
}

// ─── Takedown confirm modal ────────────────────────────────────────
function TakedownModal({ reel, onClose, onConfirm }: {
  reel: ReelDoc; onClose: () => void; onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.6)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{ background: "white", borderRadius: 22, padding: "28px", width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(10,22,40,0.22)", fontFamily: "DM Sans, sans-serif" }}>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#FFF1F2", border: "1px solid #FECDD3", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldAlert size={20} color="#DC2626" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: N, margin: 0 }}>Takedown Reel</h3>
              <p style={{ fontSize: 11, color: M, margin: 0 }}>This is reversible — you can restore it later</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: B, background: S, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={13} color={M} />
          </button>
        </div>

        {/* Reel preview strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: S, border: B, borderRadius: 14, marginBottom: 22 }}>
          <div style={{ width: 42, height: 56, borderRadius: 9, overflow: "hidden", background: N, flexShrink: 0, position: "relative" }}>
            {reel.thumbnailUrl && (
              <img src={reel.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: N, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {reel.title || "Untitled Reel"}
            </p>
            <p style={{ fontSize: 11, color: M, margin: 0 }}>{reel.storeId?.name || "Unknown store"}</p>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <span style={{ fontSize: 10, color: M }}><Eye size={9} style={{ display: "inline", marginRight: 3 }} />{fmtCount(reel.viewsCount)}</span>
              <span style={{ fontSize: 10, color: M }}><Heart size={9} style={{ display: "inline", marginRight: 3 }} />{fmtCount(reel.likesCount)}</span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: "#6B7A99", lineHeight: 1.6, margin: "0 0 22px" }}>
          The reel will be removed from public feed immediately. The seller will still see it in their dashboard. You can restore it at any time from the <strong style={{ color: N }}>Taken Down</strong> tab.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: "11px", borderRadius: 12, border: B, background: "white", fontSize: 13, fontWeight: 700, color: "#6B7A99", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
            Cancel
          </button>
          <button onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); }} disabled={loading}
            style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", background: loading ? "#E4E9F2" : "#DC2626", color: loading ? M : "white", fontSize: 13, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <Trash2 size={13} />
            {loading ? "Taking down…" : "Take Down"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Reel card ────────────────────────────────────────────────────
function ReelCard({ reel, onTakedown, onRestore }: {
  reel: ReelDoc; onTakedown: () => void; onRestore: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const taken = !reel.isPublished;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#0A1628", aspectRatio: "9/16",
        boxShadow: hovered ? "0 16px 40px rgba(10,22,40,0.22)" : "0 2px 8px rgba(10,22,40,0.10)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "all .28s cubic-bezier(0.16,1,0.3,1)",
        filter: taken ? "grayscale(0.4)" : "none",
        opacity: taken ? 0.85 : 1,
      }}>

      {/* Thumbnail */}
      {reel.thumbnailUrl && (
        <img src={reel.thumbnailUrl} alt={reel.title || "Reel"}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            transform: hovered ? "scale(1.06)" : "scale(1)", transition: "transform .5s cubic-bezier(0.16,1,0.3,1)" }} />
      )}

      {/* Gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: hovered ? "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.1) 55%)" : "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)", transition: "background .28s" }} />

      {/* Taken-down banner */}
      {taken && (
        <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 8, background: "rgba(220,38,38,0.85)", backdropFilter: "blur(6px)" }}>
          <EyeOff size={9} color="white" />
          <span style={{ fontSize: 9, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.1em" }}>Taken Down</span>
        </div>
      )}

      {/* Multi-product badge */}
      {reel.isMultiProduct && (
        <div style={{ position: "absolute", top: taken ? 38 : 10, right: 10, width: 22, height: 22, borderRadius: "50%", background: "rgba(10,22,40,0.7)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Grid3X3 size={9} color="white" />
        </div>
      )}

      {/* Hover action buttons */}
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
            style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {/* Preview */}
            <a href={`/?reelId=${reel._id}`} target="_blank" rel="noopener noreferrer"
              style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <Play size={16} color="white" fill="white" style={{ marginLeft: 2 }} />
            </a>

            {/* Takedown or Restore */}
            {taken ? (
              <button onClick={onRestore}
                style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(5,150,105,0.85)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(74,222,128,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <RotateCcw size={15} color="white" />
              </button>
            ) : (
              <button onClick={onTakedown}
                style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(220,38,38,0.85)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(254,205,211,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Trash2 size={15} color="white" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom info */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px" }}>
        {reel.storeId && (
          <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.6)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {reel.storeId.name}
          </p>
        )}
        {reel.title && (
          <p style={{ fontSize: 11, fontWeight: 700, color: "white", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {reel.title}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
            <Eye size={9} />{fmtCount(reel.viewsCount)}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
            <Heart size={9} />{fmtCount(reel.likesCount)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────
function StatTile({ icon: Icon, value, label, iColor, iBg, iBorder }: {
  icon: React.ElementType; value: string | number; label: string;
  iColor: string; iBg: string; iBorder: string;
}) {
  return (
    <div style={{ background: "white", border: B, borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: iBg, border: `1px solid ${iBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} color={iColor} />
      </div>
      <div>
        <p style={{ fontFamily: "Instrument Serif, serif", fontSize: 22, color: N, margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</p>
        <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: M, margin: "3px 0 0" }}>{label}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function ContentModeration() {
  const [reels,         setReels]         = useState<ReelDoc[]>([]);
  const [counts,        setCounts]        = useState({ all: 0, live: 0, takenDown: 0 });
  const [pagination,    setPagination]    = useState({ page: 1, pages: 1, total: 0 });
  const [filter,        setFilter]        = useState<Filter>("all");
  const [search,        setSearch]        = useState("");
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [takedownTarget,setTakedownTarget]= useState<ReelDoc | null>(null);
  const [actioning,     setActioning]     = useState<string | null>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (opts: { filter?: Filter; page?: number; q?: string; isRefresh?: boolean } = {}) => {
    const f = opts.filter ?? filter;
    const p = opts.page   ?? 1;
    const q = opts.q      ?? search;
    if (opts.isRefresh) setRefreshing(true); else setLoading(true);

    try {
      const params = new URLSearchParams({ filter: f, page: String(p), q });
      const res    = await fetch(`/api/admin/content?${params}`);
      const data   = await res.json();

      if (data.error) { toast.error(data.error); return; }

      setReels(data.reels ?? []);
      setCounts(data.counts ?? { all: 0, live: 0, takenDown: 0 });
      setPagination(data.pagination ?? { page: 1, pages: 1, total: 0 });
    } catch {
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, search]);

  useEffect(() => { load({ filter, page: 1, q: "" }); }, [filter]);

  // Debounced search
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => load({ filter, page: 1, q: search }), 400);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [search]);

  // Takedown (soft delete)
  const handleTakedown = async (reel: ReelDoc) => {
    setActioning(reel._id);
    try {
      const res = await fetch(`/api/admin/content/${reel._id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Takedown failed"); return; }
      toast.success("Reel taken down", { description: "Removed from public feed. Restorable anytime." });
      setReels(prev => prev.map(r => r._id === reel._id ? { ...r, isPublished: false } : r));
      setCounts(prev => ({ ...prev, live: Math.max(0, prev.live - 1), takenDown: prev.takenDown + 1 }));
      setTakedownTarget(null);
    } catch {
      toast.error("Network error");
    } finally {
      setActioning(null);
    }
  };

  // Restore
  const handleRestore = async (reel: ReelDoc) => {
    setActioning(reel._id);
    try {
      const res = await fetch(`/api/admin/content/${reel._id}`, { method: "PATCH" });
      if (!res.ok) { toast.error("Restore failed"); return; }
      toast.success("Reel restored", { description: "Now live on the public feed." });
      setReels(prev => prev.map(r => r._id === reel._id ? { ...r, isPublished: true } : r));
      setCounts(prev => ({ ...prev, live: prev.live + 1, takenDown: Math.max(0, prev.takenDown - 1) }));
    } catch {
      toast.error("Network error");
    } finally {
      setActioning(null);
    }
  };

  const FILTER_CONFIG: { id: Filter; label: string; color: { text: string; bg: string; border: string } }[] = [
    { id: "all",        label: "All Reels",   color: { text: N,        bg: "#F7F8FC", border: "#E4E9F2" } },
    { id: "live",       label: "Live",        color: { text: "#059669", bg: "#F0FDF4", border: "#BBF7D0" } },
    { id: "taken-down", label: "Taken Down",  color: { text: "#DC2626", bg: "#FFF1F2", border: "#FECDD3" } },
  ];

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 22, fontFamily: "DM Sans, sans-serif" }}>

        {/* ── Page header ──────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: M, margin: "0 0 4px" }}>
              {counts.all} total · {counts.live} live · {counts.takenDown} taken down
            </p>
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: 28, color: N, margin: 0, letterSpacing: "-0.025em" }}>Content Moderation</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={13} color={M} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input type="text" placeholder="Search title or store…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding: "9px 14px 9px 34px", borderRadius: 11, border: B, background: "white", fontSize: 12, fontFamily: "DM Sans, sans-serif", color: N, outline: "none", width: 220, transition: "border-color .15s" }}
                onFocus={e => (e.target.style.borderColor = N)} onBlur={e => (e.target.style.borderColor = "#E4E9F2")} />
            </div>
            {/* Refresh */}
            <button onClick={() => load({ isRefresh: true })} disabled={refreshing}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 11, border: B, background: "white", cursor: "pointer", fontSize: 12, fontWeight: 700, color: refreshing ? M : N, fontFamily: "DM Sans, sans-serif" }}>
              <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>
        </div>

        {/* ── Stat tiles ───────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          <StatTile icon={Video}       value={fmtCount(counts.all)}       label="Total Reels"  iColor="#7C3AED" iBg="#F5F3FF" iBorder="#DDD6FE" />
          <StatTile icon={Eye}         value={fmtCount(counts.live)}       label="Live"         iColor="#059669" iBg="#F0FDF4" iBorder="#BBF7D0" />
          <StatTile icon={EyeOff}      value={fmtCount(counts.takenDown)}  label="Taken Down"   iColor="#DC2626" iBg="#FFF1F2" iBorder="#FECDD3" />
          <StatTile icon={TrendingUp}  value={fmtCount(reels.reduce((a, r) => a + (r.viewsCount || 0), 0))} label="Views (page)" iColor="#D97706" iBg="#FFFBEB" iBorder="#FDE68A" />
        </div>

        {/* ── Filter tabs ──────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {FILTER_CONFIG.map(f => (
            <FilterTab key={f.id} label={f.label}
              count={f.id === "all" ? counts.all : f.id === "live" ? counts.live : counts.takenDown}
              active={filter === f.id} color={f.color}
              onClick={() => { setFilter(f.id); setSearch(""); }} />
          ))}
        </div>

        {/* ── Grid ─────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
              {Array(15).fill(0).map((_, i) => (
                <div key={i} style={{ aspectRatio: "9/16" }}>
                  <Sk h={undefined as any} r={16} w="100%" />
                </div>
              ))}
            </motion.div>
          ) : reels.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: "60px 24px", textAlign: "center", background: "white", border: `2px dashed #E4E9F2`, borderRadius: 20 }}>
              <Video size={40} color="#C4CDD8" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, fontWeight: 800, color: N, margin: "0 0 4px" }}>
                {search ? "No reels match your search" : `No ${filter === "taken-down" ? "taken-down" : filter} reels`}
              </p>
              <p style={{ fontSize: 12, color: M, margin: 0 }}>
                {search ? "Try a different title or store name." : "Nothing to moderate here."}
              </p>
            </motion.div>
          ) : (
            <motion.div key={filter + search} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
              {reels.map(reel => (
                <ReelCard key={reel._id} reel={reel}
                  onTakedown={() => setTakedownTarget(reel)}
                  onRestore={() => handleRestore(reel)} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Pagination ───────────────────────────────────────── */}
        {pagination.pages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <button onClick={() => load({ page: pagination.page - 1 })} disabled={pagination.page <= 1}
              style={{ width: 36, height: 36, borderRadius: 10, border: B, background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: pagination.page <= 1 ? "not-allowed" : "pointer", opacity: pagination.page <= 1 ? 0.4 : 1 }}>
              <ChevronLeft size={15} color={N} />
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, color: N }}>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button onClick={() => load({ page: pagination.page + 1 })} disabled={pagination.page >= pagination.pages}
              style={{ width: 36, height: 36, borderRadius: 10, border: B, background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: pagination.page >= pagination.pages ? "not-allowed" : "pointer", opacity: pagination.page >= pagination.pages ? 0.4 : 1 }}>
              <ChevronRight size={15} color={N} />
            </button>
          </div>
        )}
      </div>

      {/* ── Takedown confirm modal ───────────────────────────────── */}
      <AnimatePresence>
        {takedownTarget && (
          <TakedownModal reel={takedownTarget}
            onClose={() => setTakedownTarget(null)}
            onConfirm={() => handleTakedown(takedownTarget)} />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}