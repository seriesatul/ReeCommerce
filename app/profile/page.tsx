"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Heart, Store, Settings, LogOut, ChevronRight,
  Package, Truck, CheckCircle2, Clock, Eye, PlayCircle,
  User, Mail, Phone, Shield, Edit3, IndianRupee, TrendingUp,
  Loader2, ArrowUpRight, BadgeCheck, Crown, Zap, Star,
  UserCheck, UserMinus, RefreshCw, X, Check, Tag, Sparkles,
  AlertCircle, Camera, LayoutGrid,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────
//  DESIGN TOKENS — matches ReeCommerce brand
// ─────────────────────────────────────────────────────────────────
const T = {
  navy:    "#0A1628",
  navy2:   "#0F1F3D",
  navy3:   "#162544",
  accent:  "#2563EB",
  green:   "#059669",
  muted:   "#9BA8C0",
  border:  "#E4E9F2",
  surface: "#F7F8FC",
  white:   "#FFFFFF",
  red:     "#E11D48",
};

// ─────────────────────────────────────────────────────────────────
//  UTILS
// ─────────────────────────────────────────────────────────────────
const fmtRupee = (n: number) =>
  `₹${Number(n || 0).toLocaleString("en-IN")}`;

const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1e6).toFixed(1)}M`
  : n >= 1_000   ? `${(n / 1e3).toFixed(1)}K`
  : String(n || 0);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

async function safeFetch(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${body ? `: ${body}` : ""}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────────
//  STATUS & ROLE CONFIGS
// ─────────────────────────────────────────────────────────────────
const STATUS: Record<string, {
  label: string; bg: string; color: string; dot: string; Icon: any;
}> = {
  pending:    { label: "Pending",    bg: "#FFFBEB", color: "#B45309", dot: "#F59E0B", Icon: Clock        },
  processing: { label: "Processing", bg: "#EFF6FF", color: "#1D4ED8", dot: "#3B82F6", Icon: Package      },
  shipped:    { label: "Shipped",    bg: "#ECFDF5", color: "#047857", dot: "#10B981", Icon: Truck        },
  delivered:  { label: "Delivered",  bg: "#ECFDF5", color: "#047857", dot: "#10B981", Icon: CheckCircle2 },
  cancelled:  { label: "Cancelled",  bg: "#FFF1F2", color: "#BE123C", dot: "#F43F5E", Icon: X           },
};

const ROLE: Record<string, {
  label: string; Icon: any; bg: string; color: string; ring: string;
}> = {
  admin:  { label: "Admin",  Icon: Crown,      bg: "rgba(251,191,36,0.12)",  color: "#F59E0B", ring: "#F59E0B" },
  seller: { label: "Seller", Icon: Zap,        bg: "rgba(99,102,241,0.12)",  color: "#818CF8", ring: "#818CF8" },
  user:   { label: "Member", Icon: BadgeCheck, bg: "rgba(16,185,129,0.12)",  color: "#34D399", ring: "#34D399" },
};

// ─────────────────────────────────────────────────────────────────
//  ANIMATED NUMBER
// ─────────────────────────────────────────────────────────────────
function AnimNum({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current, end = value;
    if (start === end) return;
    const dur = 800, t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      const c = Math.round(start + (end - start) * e);
      setDisplay(c); prev.current = c;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{fmtNum(display)}</>;
}

// ─────────────────────────────────────────────────────────────────
//  ROLE CHIP
// ─────────────────────────────────────────────────────────────────
function RoleChip({ role }: { role: string }) {
  const c = ROLE[role] ?? ROLE.user;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 99,
      background: c.bg, border: `1px solid ${c.ring}30`,
      fontSize: 10, fontWeight: 700, color: c.color,
      letterSpacing: "0.06em", textTransform: "uppercase",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <c.Icon size={10} strokeWidth={2.5} /> {c.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
//  STATUS BADGE
// ─────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const c = STATUS[status] ?? STATUS.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99,
      background: c.bg, fontSize: 10, fontWeight: 700, color: c.color,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: c.dot,
        flexShrink: 0,
      }} />
      {c.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
//  STAT CARD (hero stats)
// ─────────────────────────────────────────────────────────────────
function StatItem({ value, label, Icon, delay = 0 }: {
  value: number; label: string; Icon: any; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Icon size={12} color="rgba(255,255,255,0.3)" />
        <span style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
          color: "white", lineHeight: 1,
          letterSpacing: "-0.04em",
        }}>
          <AnimNum value={value} />
        </span>
      </div>
      <span style={{
        fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)",
        letterSpacing: "0.18em", textTransform: "uppercase",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {label}
      </span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  TAB BUTTON
// ─────────────────────────────────────────────────────────────────
function TabBtn({ Icon, label, active, count, onClick }: {
  Icon: any; label: string; active: boolean; count?: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rc-tab${active ? " rc-tab-active" : ""}`}
    >
      <Icon size={14} strokeWidth={active ? 2.5 : 2} />
      <span className="rc-tab-label">{label}</span>
      {!!count && count > 0 && (
        <span className={`rc-tab-badge${active ? " rc-tab-badge-active" : ""}`}>
          {fmtNum(count)}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
//  EMPTY STATE
// ─────────────────────────────────────────────────────────────────
function Empty({ Icon, title, sub, href, cta }: {
  Icon: any; title: string; sub: string; href?: string; cta?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: "80px 24px", display: "flex", flexDirection: "column",
        alignItems: "center", gap: 18, textAlign: "center" }}
    >
      <div style={{
        width: 80, height: 80, borderRadius: 28,
        background: T.surface, border: `1.5px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 16px rgba(10,22,40,0.06)",
      }}>
        <Icon size={30} color="#C4CDD8" />
      </div>
      <div style={{ maxWidth: 280 }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: T.navy,
          margin: "0 0 8px", fontFamily: "'DM Sans', sans-serif" }}>
          {title}
        </p>
        <p style={{ fontSize: 13, color: T.muted, margin: 0,
          lineHeight: 1.65, fontFamily: "'DM Sans', sans-serif" }}>
          {sub}
        </p>
      </div>
      {href && cta && (
        <Link href={href} style={{
          padding: "12px 28px", borderRadius: 14,
          background: T.navy, color: "white",
          fontSize: 13, fontWeight: 700, textDecoration: "none",
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: "0 4px 20px rgba(10,22,40,0.2)",
        }}>
          {cta}
        </Link>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  ERROR STATE
// ─────────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: "80px 24px", display: "flex", flexDirection: "column",
        alignItems: "center", gap: 18, textAlign: "center" }}
    >
      <div style={{
        width: 80, height: 80, borderRadius: 28,
        background: "#FFF1F2", border: "1.5px solid #FECDD3",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <AlertCircle size={30} color={T.red} />
      </div>
      <div style={{ maxWidth: 300 }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: T.navy,
          margin: "0 0 8px", fontFamily: "'DM Sans', sans-serif" }}>
          Something went wrong
        </p>
        <p style={{ fontSize: 12, color: T.muted, margin: "0 0 20px",
          lineHeight: 1.65, fontFamily: "'DM Sans', sans-serif" }}>
          {message}
        </p>
        <button
          onClick={onRetry}
          style={{
            padding: "11px 24px", borderRadius: 12,
            background: T.navy, color: "white", border: "none",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            display: "inline-flex", alignItems: "center", gap: 7,
          }}
        >
          <RefreshCw size={13} /> Try Again
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: {
  msg: string; type: "ok" | "err"; onClose: () => void;
}) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.94 }}
      style={{
        position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
        zIndex: 9999, display: "flex", alignItems: "center", gap: 10,
        padding: "12px 20px", borderRadius: 16,
        background: type === "ok"
          ? "linear-gradient(135deg, #059669, #047857)"
          : "linear-gradient(135deg, #E11D48, #BE123C)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.28)",
        whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif",
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: "rgba(255,255,255,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {type === "ok"
          ? <Check size={12} color="white" strokeWidth={3} />
          : <X size={12} color="white" strokeWidth={3} />
        }
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{msg}</span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  FOLLOW BUTTON (unfollow action on profile)
// ─────────────────────────────────────────────────────────────────
function FollowButton({ storeId, onUnfollow }: {
  storeId: string; onUnfollow: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const unfollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/follow`, { method: "DELETE" });
      if (res.ok) onUnfollow();
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <button
      onClick={unfollow}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "9px 16px", borderRadius: 11,
        border: hovered ? "1.5px solid #FECDD3" : `1.5px solid ${T.border}`,
        background: hovered ? "#FFF1F2" : T.surface,
        color: hovered ? T.red : T.navy,
        fontSize: 12, fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "'DM Sans', sans-serif",
        transition: "all .18s ease",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading
        ? <Loader2 size={12} style={{ animation: "rc-spin .6s linear infinite" }} />
        : hovered
        ? <><UserMinus size={12} /> Unfollow</>
        : <><UserCheck size={12} /> Following</>
      }
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
//  UNLIKE BUTTON
// ─────────────────────────────────────────────────────────────────
function UnlikeButton({ reelId, onUnlike }: {
  reelId: string; onUnlike: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const unlike = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`/api/reels/${reelId}/like`, { method: "DELETE" });
      if (res.ok) onUnlike();
    } catch {}
    finally { setLoading(false); }
  };
  return (
    <button
      onClick={unlike} disabled={loading}
      style={{
        position: "absolute", top: 8, right: 8,
        width: 32, height: 32, borderRadius: 10,
        background: "rgba(10,22,40,0.72)", backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "background .18s",
      }}
    >
      {loading
        ? <Loader2 size={12} color="white" style={{ animation: "rc-spin .6s linear infinite" }} />
        : <Heart size={12} color="#fb7185" fill="#fb7185" />
      }
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
//  FORM FIELD
// ─────────────────────────────────────────────────────────────────
function FormField({ Icon, label, value, onChange, readOnly, type = "text", hint }: {
  Icon: any; label: string; value: string;
  onChange?: (v: string) => void; readOnly?: boolean; type?: string; hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{
        display: "block", fontSize: 10, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.14em",
        color: T.muted, marginBottom: 8,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <Icon
          size={14}
          color={focused && !readOnly ? T.navy : T.muted}
          style={{
            position: "absolute", left: 14, top: "50%",
            transform: "translateY(-50%)", transition: "color .15s", pointerEvents: "none",
          }}
        />
        <input
          type={type} value={value} readOnly={readOnly}
          onChange={e => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "13px 14px 13px 42px", borderRadius: 13,
            border: focused && !readOnly
              ? `2px solid ${T.navy}`
              : `1.5px solid ${T.border}`,
            background: readOnly ? "#F0F3F8" : focused ? T.white : T.surface,
            fontSize: 14, color: readOnly ? T.muted : T.navy,
            outline: "none", fontFamily: "'DM Sans', sans-serif",
            cursor: readOnly ? "not-allowed" : "text",
            transition: "all .15s",
          }}
        />
      </div>
      {hint && (
        <p style={{
          fontSize: 11, color: T.muted, margin: "6px 0 0 4px",
          fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5,
        }}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  SECTION HEADER
// ─────────────────────────────────────────────────────────────────
function SectionHead({ label, count }: { label: string; count?: number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: 20,
    }}>
      <h2 style={{
        fontSize: 11, fontWeight: 700, color: T.muted,
        textTransform: "uppercase", letterSpacing: "0.18em",
        margin: 0, fontFamily: "'DM Sans', sans-serif",
      }}>
        {label}
      </h2>
      {count !== undefined && count > 0 && (
        <span style={{
          fontSize: 11, fontWeight: 700, color: T.muted,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {fmtNum(count)} {label.toLowerCase()}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  type TabId = "orders" | "liked" | "following" | "settings";

  const [tab,        setTab]       = useState<TabId>("orders");
  const [profile,    setProfile]   = useState<any>(null);
  const [orders,     setOrders]    = useState<any[]>([]);
  const [liked,      setLiked]     = useState<any[]>([]);
  const [following,  setFollowing] = useState<any[]>([]);
  const [tabLoaded,  setTabLoaded] = useState<Set<TabId>>(new Set());
  const [tabErrors,  setTabErrors] = useState<Partial<Record<TabId, string>>>({});
  const [pageLoad,   setPageLoad]  = useState(true);
  const [tabLoad,    setTabLoad]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editName,   setEditName]  = useState("");
  const [editPhone,  setEditPhone] = useState("");
  const [saving,     setSaving]    = useState(false);
  const [toast,      setToast]     = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Load profile
  useEffect(() => {
    if (status !== "authenticated") return;
    safeFetch("/api/profile")
      .then(d => {
        setProfile(d);
        setEditName(d.name ?? "");
        setEditPhone(d.phone ?? "");
      })
      .catch(() => {})
      .finally(() => setPageLoad(false));
  }, [status]);

  // Fetch tab data
  const fetchTab = useCallback(async (t: TabId, force = false) => {
    if (t === "settings") { setTab(t); return; }
    setTab(t);
    if (!force && tabLoaded.has(t)) return;
    setTabLoad(true);
    setTabErrors(prev => { const n = { ...prev }; delete n[t]; return n; });
    try {
      if (t === "orders") {
        const d = await safeFetch("/api/profile/orders");
        setOrders(d.orders ?? []);
      } else if (t === "liked") {
        const d = await safeFetch("/api/profile/liked-reels");
        setLiked(d.reels ?? []);
      } else if (t === "following") {
        const d = await safeFetch("/api/profile/following");
        setFollowing(d.stores ?? []);
      }
      setTabLoaded(prev => new Set([...prev, t]));
    } catch (err: any) {
      setTabErrors(prev => ({ ...prev, [t]: err?.message ?? "Failed to load." }));
    } finally {
      setTabLoad(false);
    }
  }, [tabLoaded]);

  useEffect(() => {
    if (!pageLoad && profile) fetchTab("orders");
  }, [pageLoad]); // eslint-disable-line

  // Refresh
  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setTabLoaded(prev => { const n = new Set(prev); n.delete(tab); return n; });
    setTabErrors(prev => { const n = { ...prev }; delete n[tab]; return n; });
    const [profileData] = await Promise.all([
      safeFetch("/api/profile").catch(() => null),
      fetchTab(tab, true),
    ]);
    if (profileData) {
      setProfile(profileData);
      setEditName(profileData.name ?? "");
      setEditPhone(profileData.phone ?? "");
    }
    setRefreshing(false);
  };

  // Optimistic unlike
  const handleUnlike = useCallback((reelId: string) => {
    setLiked(prev => prev.filter(r => r._id.toString() !== reelId));
    setProfile((p: any) => p && {
      ...p, stats: { ...p.stats, likedReels: Math.max(0, (p.stats?.likedReels ?? 1) - 1) },
    });
  }, []);

  // Optimistic unfollow
  const handleUnfollow = useCallback((storeId: string) => {
    setFollowing(prev => prev.filter(s => s._id.toString() !== storeId));
    setProfile((p: any) => p && {
      ...p, stats: { ...p.stats, following: Math.max(0, (p.stats?.following ?? 1) - 1) },
    });
  }, []);

  // Save profile
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, phone: editPhone }),
      });
      const data = await res.json();
      if (!res.ok) { setToast({ msg: data.error ?? "Save failed", type: "err" }); return; }
      setProfile((p: any) => ({ ...p, name: editName, phone: editPhone }));
      setToast({ msg: "Profile updated!", type: "ok" });
    } catch {
      setToast({ msg: "Network error", type: "err" });
    } finally {
      setSaving(false);
    }
  };

  // Loading screen
  if (status === "loading" || pageLoad) return (
    <div style={{
      minHeight: "100vh", background: T.navy,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 18,
    }}>
      <style>{`@keyframes rc-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.1)",
        borderTopColor: "rgba(255,255,255,0.7)",
        animation: "rc-spin .8s linear infinite",
      }} />
      <p style={{
        fontSize: 10, fontWeight: 700,
        color: "rgba(255,255,255,0.25)",
        letterSpacing: "0.22em", textTransform: "uppercase",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        Loading profile
      </p>
    </div>
  );

  if (!profile) return null;

  const role     = profile.role as string;
  const isSeller = role === "seller";
  const isAdmin  = role === "admin";
  const initial  = (profile.name || "U")[0].toUpperCase();

  return (
    <>
      {/* ── Global styles & responsive breakpoints ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        @keyframes rc-spin    { to { transform: rotate(360deg); } }
        @keyframes rc-pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes rc-fade-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rc-glow    { 0%,100%{opacity:0.5} 50%{opacity:1} }

        /* ── TAB BAR ── */
        .rc-tabs {
          display: flex; gap: 2px; padding: 4px;
          border-radius: 14px;
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.08);
          overflow-x: auto; -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .rc-tabs::-webkit-scrollbar { display: none; }

        .rc-tab {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 16px; border-radius: 11px;
          border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600;
          transition: all .2s ease;
          white-space: nowrap; flex-shrink: 0;
          background: transparent;
          color: rgba(255,255,255,0.4);
        }
        .rc-tab-label { display: inline; }
        .rc-tab:hover { color: rgba(255,255,255,0.7); }
        .rc-tab-active {
          background: white !important;
          color: #0A1628 !important;
          font-weight: 700;
          box-shadow: 0 2px 12px rgba(10,22,40,0.18);
        }
        .rc-tab-badge {
          padding: 1px 7px; border-radius: 99px;
          font-size: 9px; font-weight: 800;
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.45);
        }
        .rc-tab-badge-active {
          background: #0A1628; color: white;
        }

        /* ── REEL CARD ── */
        .rc-reel-card { transition: transform .22s ease, box-shadow .22s ease; }
        .rc-reel-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(10,22,40,0.14) !important; }
        .rc-reel-thumb { transition: transform .4s ease; }
        .rc-reel-card:hover .rc-reel-thumb { transform: scale(1.07); }
        .rc-reel-play { transition: opacity .2s ease; }
        .rc-reel-card:hover .rc-reel-play { opacity: 1 !important; }

        /* ── ORDER CARD ── */
        .rc-order-card { transition: background .15s, box-shadow .18s; }
        .rc-order-card:hover { box-shadow: 0 4px 24px rgba(10,22,40,0.08); }

        /* ── STORE CARD ── */
        .rc-store-card { transition: transform .22s ease, box-shadow .22s ease; }
        .rc-store-card:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(10,22,40,0.12) !important; }

        /* ── SETTINGS GRID ── */
        .rc-settings-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .rc-settings-grid {
            grid-template-columns: 1fr 300px;
          }
        }

        /* ── REEL GRID ── */
        .rc-reel-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 480px) {
          .rc-reel-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 768px) {
          .rc-reel-grid { grid-template-columns: repeat(4, 1fr); gap: 14px; }
        }
        @media (min-width: 1024px) {
          .rc-reel-grid { grid-template-columns: repeat(5, 1fr); }
        }

        /* ── STORE GRID ── */
        .rc-store-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 540px) {
          .rc-store-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 900px) {
          .rc-store-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; }
        }

        /* ── STATS ROW ── */
        .rc-stats-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
        }
        @media (min-width: 480px) {
          .rc-stats-row { grid-template-columns: repeat(4, 1fr); }
        }

        /* ── HERO PROFILE ROW ── */
        .rc-profile-row {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 20px;
        }
        @media (min-width: 640px) {
          .rc-profile-row {
            flex-direction: row;
            align-items: flex-end;
          }
        }

        /* ── HERO ACTIONS ── */
        .rc-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 4px;
        }
        @media (min-width: 640px) {
          .rc-hero-actions { margin-top: 0; margin-left: auto; flex-shrink: 0; }
        }

        /* ── TAB LABEL hide on small mobile ── */
        @media (max-width: 400px) {
          .rc-tab-label { display: none; }
          .rc-tab { padding: 9px 13px; }
        }

        /* ── SETTINGS QUICK LINK hover ── */
        .rc-quicklink { transition: background .15s; }
        .rc-quicklink:hover { background: #F7F8FC !important; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: T.surface,
        fontFamily: "'DM Sans', sans-serif",
        paddingBottom: 80,
      }}>

        {/* ══════════════════════════════════════════
            HERO  — full navy with layered depth
        ══════════════════════════════════════════ */}
        <div style={{
          background: T.navy,
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Dot texture */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.038) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }} />

          {/* Radial gradient accent top-right */}
          <div style={{
            position: "absolute", top: -160, right: -100, pointerEvents: "none",
            width: 600, height: 600, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 65%)",
          }} />

          {/* Accent bottom-left */}
          <div style={{
            position: "absolute", bottom: -80, left: -60, pointerEvents: "none",
            width: 400, height: 400, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(5,150,105,0.04) 0%, transparent 65%)",
          }} />

          {/* Thin color accent line at top */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: "linear-gradient(90deg, #2563EB 0%, #059669 50%, #2563EB 100%)",
            opacity: 0.7,
          }} />

          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(28px,5vw,52px) clamp(16px,4vw,32px) 0" }}>

            {/* ── Profile row ── */}
            <div className="rc-profile-row" style={{ paddingBottom: 32 }}>

              {/* Avatar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                style={{ position: "relative", flexShrink: 0 }}
              >
                {/* Glow ring */}
                <div style={{
                  position: "absolute", inset: -6, borderRadius: 32,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))",
                  animation: "rc-glow 3s ease-in-out infinite",
                }} />

                <div style={{
                  position: "relative", width: 100, height: 100,
                  borderRadius: 28, overflow: "hidden",
                  background: "linear-gradient(135deg, #1a3354, #243f6a)",
                  border: "1.5px solid rgba(255,255,255,0.14)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}>
                  {profile.image
                    ? <Image src={profile.image} alt={profile.name ?? "User"}
                        width={100} height={100} style={{ objectFit: "cover" }} />
                    : <span style={{
                        fontFamily: "'Instrument Serif', serif",
                        fontSize: 44, color: "rgba(255,255,255,0.5)",
                        userSelect: "none", lineHeight: 1,
                      }}>
                        {initial}
                      </span>
                  }
                </div>

                {/* Online dot */}
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  style={{
                    position: "absolute", bottom: 6, right: 6,
                    width: 14, height: 14, borderRadius: "50%",
                    background: "#4ADE80",
                    border: "2.5px solid #0A1628",
                    boxShadow: "0 0 8px rgba(74,222,128,0.6)",
                  }}
                />
              </motion.div>

              {/* Name + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.45 }}
                  style={{ display: "flex", alignItems: "center", gap: 10,
                    flexWrap: "wrap", marginBottom: 10 }}
                >
                  <h1 style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
                    color: "white", margin: 0,
                    letterSpacing: "-0.03em", lineHeight: 1.1,
                  }}>
                    {profile.name || "Anonymous"}
                  </h1>
                  <RoleChip role={role} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.18 }}
                  style={{ display: "flex", flexWrap: "wrap", gap: "5px 16px" }}
                >
                  {[
                    { Icon: Mail,  text: profile.email },
                    ...(profile.phone ? [{ Icon: Phone, text: profile.phone }] : []),
                    { Icon: Clock, text: `Member since ${fmtDate(profile.createdAt)}` },
                  ].map(({ Icon, text }) => (
                    <span key={text} style={{
                      fontSize: 12, color: "rgba(255,255,255,0.38)",
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <Icon size={11} /> {text}
                    </span>
                  ))}
                </motion.div>
              </div>

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="rc-hero-actions"
              >
                {(isSeller || isAdmin) && (
                  <Link
                    href={isSeller ? "/dashboard/seller" : "/admin"}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "9px 18px", borderRadius: 12,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.13)",
                      color: "white", fontSize: 12, fontWeight: 700,
                      textDecoration: "none", transition: "background .18s",
                    }}
                  >
                    {isSeller ? <Zap size={13} /> : <Crown size={13} />}
                    {isSeller ? "My Studio" : "Console"}
                    <ArrowUpRight size={11} color="rgba(255,255,255,0.4)" />
                  </Link>
                )}
                <button
                  onClick={() => setTab("settings")}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Edit3 size={13} /> Edit Profile
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 38, height: 38, borderRadius: 11,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.28)", cursor: "pointer",
                  }}
                >
                  <LogOut size={14} />
                </button>
              </motion.div>
            </div>

            {/* ── Stats row ── */}
            <div style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              padding: "24px 0",
              marginBottom: 0,
            }}>
              <div className="rc-stats-row">
                {[
                  { value: profile.stats?.totalOrders ?? 0, label: "Orders",       Icon: ShoppingBag },
                  { value: profile.stats?.totalSpent   ?? 0, label: "₹ Spent",     Icon: IndianRupee },
                  { value: profile.stats?.likedReels   ?? 0, label: "Liked",       Icon: Heart       },
                  { value: profile.stats?.following    ?? 0, label: "Following",   Icon: Store       },
                ].map(({ value, label, Icon }, i) => (
                  <div key={label} style={{
                    padding: "16px 0",
                    borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                    paddingLeft: i > 0 ? 0 : 0,
                  }}>
                    <StatItem value={value} label={label} Icon={Icon} delay={0.22 + i * 0.06} />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Tab bar ── */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 16, paddingBottom: 2,
              gap: 12, flexWrap: "wrap",
            }}>
              <div className="rc-tabs">
                <TabBtn Icon={ShoppingBag} label="Orders"    active={tab === "orders"}
                  count={profile.stats?.totalOrders} onClick={() => fetchTab("orders")} />
                <TabBtn Icon={Heart}       label="Liked"     active={tab === "liked"}
                  count={profile.stats?.likedReels}  onClick={() => fetchTab("liked")} />
                <TabBtn Icon={Store}       label="Following" active={tab === "following"}
                  count={profile.stats?.following}   onClick={() => fetchTab("following")} />
                <TabBtn Icon={Settings}    label="Settings"  active={tab === "settings"}
                  onClick={() => setTab("settings")} />
              </div>

              {tab !== "settings" && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: 10,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 600,
                    cursor: refreshing ? "not-allowed" : "pointer",
                    opacity: refreshing ? 0.6 : 1,
                  }}
                >
                  <RefreshCw size={11}
                    style={{ animation: refreshing ? "rc-spin .7s linear infinite" : "none" }} />
                  {refreshing ? "Refreshing…" : "Refresh"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            TAB CONTENT
        ══════════════════════════════════════════ */}
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px clamp(16px,4vw,32px) 0" }}>

          {tabLoad ? (
            <div style={{
              height: 320, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 16,
            }}>
              <Loader2 size={34} color="#C4CDD8"
                style={{ animation: "rc-spin .8s linear infinite" }} />
              <p style={{
                fontSize: 10, fontWeight: 700, color: T.muted,
                textTransform: "uppercase", letterSpacing: "0.18em",
              }}>
                Loading…
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">

              {/* ── ORDERS ─────────────────────────────── */}
              {tab === "orders" && (
                <motion.div key="orders"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.26 }}>

                  {tabErrors.orders ? (
                    <div style={{ background: T.white, borderRadius: 20, border: `1.5px solid ${T.border}` }}>
                      <ErrorState message={tabErrors.orders} onRetry={() => fetchTab("orders", true)} />
                    </div>
                  ) : orders.length === 0 ? (
                    <div style={{ background: T.white, borderRadius: 20, border: `1.5px solid ${T.border}` }}>
                      <Empty Icon={ShoppingBag} title="No orders yet"
                        sub="Your purchase history will appear here once you place your first order."
                        href="/" cta="Start Shopping" />
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <SectionHead label="Orders" count={orders.length} />
                      {orders.map((order: any, i: number) => (
                        <motion.div
                          key={order._id}
                          className="rc-order-card"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          style={{
                            background: T.white, borderRadius: 18,
                            border: `1.5px solid ${T.border}`, overflow: "hidden",
                          }}
                        >
                          {/* Order header */}
                          <div style={{
                            padding: "16px 20px",
                            borderBottom: "1px solid #F1F5F9",
                            display: "flex", alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap", gap: 12,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                              <div style={{
                                width: 42, height: 42, borderRadius: 13,
                                background: T.surface, border: `1.5px solid ${T.border}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                              }}>
                                <Package size={18} color={T.navy} />
                              </div>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                  <span style={{
                                    fontSize: 13, fontWeight: 800, color: T.navy,
                                    letterSpacing: "0.04em",
                                  }}>
                                    #{order._id.slice(-8).toUpperCase()}
                                  </span>
                                  <StatusBadge status={order.status} />
                                </div>
                                <div style={{
                                  display: "flex", alignItems: "center", gap: 6,
                                  fontSize: 11, color: T.muted,
                                }}>
                                  <Store size={10} />
                                  {typeof order.storeId === "object" ? order.storeId?.name : "Store"}
                                  <span style={{ opacity: 0.35 }}>·</span>
                                  {fmtDate(order.createdAt)}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <span style={{
                                fontFamily: "'Instrument Serif', serif",
                                fontSize: 22, color: T.navy,
                                letterSpacing: "-0.02em",
                              }}>
                                {fmtRupee(order.totalAmount)}
                              </span>
                              <Link href={`/orders/${order._id}`}
                                style={{
                                  display: "flex", alignItems: "center", gap: 5,
                                  padding: "8px 14px", borderRadius: 11,
                                  background: T.surface, border: `1.5px solid ${T.border}`,
                                  color: T.navy, fontSize: 11, fontWeight: 700,
                                  textDecoration: "none",
                                }}
                              >
                                Track <ArrowUpRight size={11} />
                              </Link>
                            </div>
                          </div>

                          {/* Order items */}
                          <div style={{
                            padding: "12px 20px 16px",
                            display: "flex", gap: 8,
                            overflowX: "auto", scrollbarWidth: "none",
                          }}>
                            {(order.items ?? []).slice(0, 5).map((item: any, j: number) => (
                              <div key={j} style={{
                                display: "flex", alignItems: "center", gap: 10,
                                flexShrink: 0, padding: "8px 12px", borderRadius: 12,
                                background: T.surface, border: `1.5px solid ${T.border}`,
                              }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: 9,
                                  overflow: "hidden", background: "#E4E9F2", flexShrink: 0,
                                }}>
                                  {item.image && (
                                    <img src={item.image} alt={item.name}
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  )}
                                </div>
                                <div>
                                  <p style={{
                                    fontSize: 11, fontWeight: 700, color: T.navy,
                                    margin: 0, maxWidth: 110,
                                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                  }}>
                                    {item.name}
                                  </p>
                                  <p style={{ fontSize: 10, color: T.muted, margin: "2px 0 0" }}>
                                    ×{item.quantity} · {fmtRupee(item.priceAtPurchase)}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {(order.items ?? []).length > 5 && (
                              <div style={{
                                display: "flex", alignItems: "center",
                                padding: "8px 14px", borderRadius: 12,
                                background: T.surface, border: `1.5px solid ${T.border}`,
                                fontSize: 11, fontWeight: 700, color: T.muted, flexShrink: 0,
                              }}>
                                +{order.items.length - 5} more
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── LIKED REELS ─────────────────────────── */}
              {tab === "liked" && (
                <motion.div key="liked"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.26 }}>

                  {tabErrors.liked ? (
                    <div style={{ background: T.white, borderRadius: 20, border: `1.5px solid ${T.border}` }}>
                      <ErrorState message={tabErrors.liked} onRetry={() => fetchTab("liked", true)} />
                    </div>
                  ) : liked.length === 0 ? (
                    <div style={{ background: T.white, borderRadius: 20, border: `1.5px solid ${T.border}` }}>
                      <Empty Icon={Heart} title="No liked reels yet"
                        sub="Tap the heart icon on any reel and it'll appear here as your personal collection."
                        href="/" cta="Browse Reels" />
                    </div>
                  ) : (
                    <>
                      <SectionHead label="Liked Reels" count={liked.length} />
                      <div className="rc-reel-grid">
                        <AnimatePresence>
                          {liked.map((reel: any, i: number) => (
                            <motion.div
                              key={reel._id}
                              className="rc-reel-card"
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.85 }}
                              transition={{ delay: i * 0.035, duration: 0.28 }}
                              style={{
                                borderRadius: 16, border: `1.5px solid ${T.border}`,
                                overflow: "hidden", background: T.white,
                                position: "relative",
                                boxShadow: "0 2px 12px rgba(10,22,40,0.05)",
                              }}
                            >
                              {/* Thumbnail */}
                              <div style={{
                                position: "relative", overflow: "hidden",
                                background: T.navy, aspectRatio: "9/16",
                              }}>
                                {reel.thumbnailUrl
                                  ? <img
                                      className="rc-reel-thumb"
                                      src={reel.thumbnailUrl}
                                      alt={reel.title ?? "Reel"}
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                  : <div style={{
                                      width: "100%", height: "100%",
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                      <PlayCircle size={28} color="rgba(255,255,255,0.2)" />
                                    </div>
                                }

                                {/* Play overlay */}
                                <div
                                  className="rc-reel-play"
                                  style={{
                                    position: "absolute", inset: 0, opacity: 0,
                                    background: "rgba(10,22,40,0.42)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}
                                >
                                  <div style={{
                                    width: 42, height: 42, borderRadius: 14,
                                    background: "rgba(255,255,255,0.18)",
                                    backdropFilter: "blur(10px)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                  }}>
                                    <PlayCircle size={20} color="white" />
                                  </div>
                                </div>

                                {/* Stats bar */}
                                <div style={{
                                  position: "absolute", bottom: 0, left: 0, right: 0,
                                  padding: "22px 10px 8px",
                                  background: "linear-gradient(to top, rgba(10,22,40,0.88), transparent)",
                                }}>
                                  <div style={{ display: "flex", gap: 10 }}>
                                    {[
                                      { Icon: Eye,   v: reel.viewsCount  },
                                      { Icon: Heart, v: reel.likesCount  },
                                    ].map(({ Icon, v }) => (
                                      <span key={Icon.toString()} style={{
                                        display: "flex", alignItems: "center", gap: 3,
                                        fontSize: 9, fontWeight: 700,
                                        color: "rgba(255,255,255,0.65)",
                                      }}>
                                        <Icon size={8} /> {fmtNum(v ?? 0)}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Unlike button */}
                                <UnlikeButton
                                  reelId={reel._id.toString()}
                                  onUnlike={() => handleUnlike(reel._id.toString())}
                                />
                              </div>

                              {/* Info */}
                              <div style={{ padding: "10px 12px 12px" }}>
                                <p style={{
                                  fontSize: 12, fontWeight: 700, color: T.navy,
                                  margin: "0 0 3px", whiteSpace: "nowrap",
                                  overflow: "hidden", textOverflow: "ellipsis",
                                }}>
                                  {reel.title || "Untitled Reel"}
                                </p>
                                <p style={{
                                  fontSize: 10, color: T.muted, margin: 0,
                                  display: "flex", alignItems: "center", gap: 4,
                                }}>
                                  <Store size={9} />
                                  {typeof reel.storeId === "object" ? reel.storeId?.name : "Store"}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* ── FOLLOWING ──────────────────────────── */}
              {tab === "following" && (
                <motion.div key="following"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.26 }}>

                  {tabErrors.following ? (
                    <div style={{ background: T.white, borderRadius: 20, border: `1.5px solid ${T.border}` }}>
                      <ErrorState message={tabErrors.following} onRetry={() => fetchTab("following", true)} />
                    </div>
                  ) : following.length === 0 ? (
                    <div style={{ background: T.white, borderRadius: 20, border: `1.5px solid ${T.border}` }}>
                      <Empty Icon={Store} title="Not following any stores"
                        sub="Follow stores you love to see their latest reels and drops first."
                        href="/" cta="Discover Stores" />
                    </div>
                  ) : (
                    <>
                      <SectionHead label="Following" count={following.length} />
                      <div className="rc-store-grid">
                        <AnimatePresence>
                          {following.map((store: any, i: number) => (
                            <motion.div
                              key={store._id}
                              className="rc-store-card"
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.94 }}
                              transition={{ delay: i * 0.04, duration: 0.28 }}
                              style={{
                                background: T.white, borderRadius: 20,
                                border: `1.5px solid ${T.border}`,
                                overflow: "hidden",
                                boxShadow: "0 2px 12px rgba(10,22,40,0.04)",
                              }}
                            >
                              {/* Cover gradient */}
                              <div style={{
                                height: 80, position: "relative", overflow: "hidden",
                                background: `linear-gradient(135deg, ${T.navy} 0%, #1e3a6b 50%, #243f7a 100%)`,
                              }}>
                                <div style={{
                                  position: "absolute", inset: 0, opacity: 0.04,
                                  backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                                  backgroundSize: "16px 16px",
                                }} />
                                <div style={{
                                  position: "absolute", right: -28, top: -28,
                                  width: 130, height: 130, borderRadius: "50%",
                                  background: "rgba(255,255,255,0.03)",
                                }} />
                                {/* Follower count */}
                                <div style={{
                                  position: "absolute", top: 10, right: 12,
                                  display: "flex", alignItems: "center", gap: 5,
                                  padding: "4px 10px", borderRadius: 99,
                                  background: "rgba(255,255,255,0.1)",
                                  border: "1px solid rgba(255,255,255,0.12)",
                                }}>
                                  <UserCheck size={9} color="rgba(255,255,255,0.55)" />
                                  <span style={{
                                    fontSize: 9, fontWeight: 700,
                                    color: "rgba(255,255,255,0.55)",
                                  }}>
                                    {fmtNum(store.followerCount ?? 0)}
                                  </span>
                                </div>
                              </div>

                              {/* Content */}
                              <div style={{ padding: "0 16px 16px", marginTop: -22 }}>
                                {/* Logo */}
                                <div style={{
                                  width: 50, height: 50, borderRadius: 14,
                                  background: T.white, border: `2px solid ${T.white}`,
                                  overflow: "hidden",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  marginBottom: 10,
                                  boxShadow: "0 4px 16px rgba(10,22,40,0.12)",
                                }}>
                                  {store.logoUrl
                                    ? <img src={store.logoUrl} alt={store.name}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <Store size={18} color={T.navy} />
                                  }
                                </div>

                                <p style={{
                                  fontSize: 14, fontWeight: 800, color: T.navy,
                                  margin: "0 0 5px",
                                }}>
                                  {store.name}
                                </p>

                                <div style={{
                                  display: "flex", alignItems: "center",
                                  gap: 8, marginBottom: 14,
                                }}>
                                  {store.category && (
                                    <span style={{
                                      display: "flex", alignItems: "center", gap: 4,
                                      fontSize: 10, color: T.muted,
                                    }}>
                                      <Tag size={9} /> {store.category}
                                    </span>
                                  )}
                                  {store.productCount > 0 && (
                                    <span style={{ fontSize: 10, color: T.muted }}>
                                      · {fmtNum(store.productCount)} products
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: "flex", gap: 8 }}>
                                  <FollowButton
                                    storeId={store._id.toString()}
                                    onUnfollow={() => handleUnfollow(store._id.toString())}
                                  />
                                  <Link
                                    href={`/store/${store.handle ?? store._id}`}
                                    style={{
                                      flex: 1, display: "flex",
                                      alignItems: "center", justifyContent: "center", gap: 5,
                                      padding: "9px 10px", borderRadius: 11,
                                      background: T.surface, border: `1.5px solid ${T.border}`,
                                      color: T.navy, fontSize: 11, fontWeight: 700,
                                      textDecoration: "none",
                                    }}
                                  >
                                    Visit Store <ArrowUpRight size={11} />
                                  </Link>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* ── SETTINGS ───────────────────────────── */}
              {tab === "settings" && (
                <motion.div key="settings"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.26 }}>

                  <div className="rc-settings-grid">

                    {/* Left: edit form */}
                    <div style={{
                      background: T.white, borderRadius: 22,
                      border: `1.5px solid ${T.border}`, overflow: "hidden",
                    }}>
                      {/* Form header */}
                      <div style={{
                        padding: "28px 28px 24px",
                        background: `linear-gradient(135deg, ${T.navy} 0%, #152c52 100%)`,
                        position: "relative", overflow: "hidden",
                      }}>
                        <div style={{
                          position: "absolute", inset: 0,
                          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
                          backgroundSize: "18px 18px",
                        }} />
                        <p style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: "0.2em",
                          color: "rgba(255,255,255,0.3)", margin: "0 0 6px",
                          textTransform: "uppercase",
                        }}>
                          Account Settings
                        </p>
                        <h2 style={{
                          fontFamily: "'Instrument Serif', serif",
                          fontSize: 26, color: "white", margin: 0,
                          letterSpacing: "-0.025em",
                        }}>
                          Edit Profile
                        </h2>
                      </div>

                      <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: 22 }}>
                        {/* Avatar preview row */}
                        <div style={{
                          display: "flex", alignItems: "center", gap: 16,
                          padding: "16px 18px", borderRadius: 16,
                          background: T.surface, border: `1.5px solid ${T.border}`,
                        }}>
                          <div style={{
                            width: 56, height: 56, borderRadius: 18,
                            overflow: "hidden", background: T.navy,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}>
                            {profile.image
                              ? <Image src={profile.image} alt={profile.name ?? "User"}
                                  width={56} height={56} style={{ objectFit: "cover" }} />
                              : <span style={{
                                  fontFamily: "'Instrument Serif', serif",
                                  fontSize: 24, color: "rgba(255,255,255,0.5)", lineHeight: 1,
                                }}>
                                  {initial}
                                </span>
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontSize: 14, fontWeight: 700, color: T.navy,
                              margin: "0 0 4px", whiteSpace: "nowrap",
                              overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                              {profile.name || "Anonymous"}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <span style={{ fontSize: 11, color: T.muted }}>
                                via {profile.provider ?? "credentials"}
                              </span>
                              <RoleChip role={role} />
                            </div>
                          </div>
                        </div>

                        <FormField Icon={User}  label="Full Name"
                          value={editName} onChange={setEditName} />
                        <FormField Icon={Mail}  label="Email Address"
                          value={profile.email ?? ""} readOnly
                          hint="Your email is managed by your login provider and cannot be changed here." />
                        <FormField Icon={Phone} label="Phone Number"
                          value={editPhone} onChange={setEditPhone} type="tel" />

                        <motion.button
                          onClick={handleSave}
                          disabled={saving}
                          whileHover={{ scale: saving ? 1 : 1.01 }}
                          whileTap={{ scale: saving ? 1 : 0.98 }}
                          style={{
                            padding: "15px", borderRadius: 14,
                            background: T.navy, color: "white", border: "none",
                            fontSize: 13, fontWeight: 700,
                            cursor: saving ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center",
                            justifyContent: "center", gap: 8,
                            opacity: saving ? 0.7 : 1,
                            boxShadow: "0 6px 24px rgba(10,22,40,0.2)",
                          }}
                        >
                          {saving
                            ? <><Loader2 size={15}
                                style={{ animation: "rc-spin .7s linear infinite" }} /> Saving…</>
                            : <><Check size={14} strokeWidth={3} /> Save Changes</>
                          }
                        </motion.button>
                      </div>
                    </div>

                    {/* Right column */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                      {/* Preferences */}
                      <div style={{
                        background: T.white, borderRadius: 20,
                        border: `1.5px solid ${T.border}`, overflow: "hidden",
                      }}>
                        <div style={{
                          padding: "16px 20px", borderBottom: `1px solid ${T.border}`,
                          display: "flex", alignItems: "center", gap: 8,
                        }}>
                          <Sparkles size={13} color={T.muted} />
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            textTransform: "uppercase", letterSpacing: "0.18em",
                            color: T.muted,
                          }}>
                            Preferences
                          </span>
                        </div>
                        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                          <div>
                            <p style={{
                              fontSize: 10, fontWeight: 700, color: T.muted,
                              margin: "0 0 10px", textTransform: "uppercase",
                              letterSpacing: "0.12em",
                            }}>
                              Interests
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {(profile.interests ?? []).length === 0
                                ? <span style={{ fontSize: 12, color: T.muted, fontStyle: "italic" }}>
                                    None set yet
                                  </span>
                                : (profile.interests ?? []).map((int: string) => (
                                    <span key={int} style={{
                                      padding: "5px 12px", borderRadius: 99,
                                      background: T.surface,
                                      border: `1.5px solid ${T.border}`,
                                      fontSize: 11, fontWeight: 600, color: T.navy,
                                    }}>
                                      {int}
                                    </span>
                                  ))
                              }
                            </div>
                          </div>

                          <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", padding: "10px 14px",
                            borderRadius: 12, background: T.surface,
                            border: `1.5px solid ${T.border}`,
                          }}>
                            <span style={{ fontSize: 12, color: T.muted }}>Price range</span>
                            <span style={{
                              fontSize: 11, fontWeight: 800, color: T.navy,
                              textTransform: "capitalize",
                            }}>
                              {profile.pricePreference ?? "Mid"}
                            </span>
                          </div>

                          <Link href="/onboarding/buyer" style={{
                            display: "flex", alignItems: "center",
                            justifyContent: "center", gap: 5, padding: "11px",
                            borderRadius: 12, background: T.surface,
                            border: `1.5px solid ${T.border}`,
                            color: T.navy, fontSize: 11, fontWeight: 700,
                            textDecoration: "none",
                          }}>
                            Update Preferences <ChevronRight size={12} />
                          </Link>
                        </div>
                      </div>

                      {/* Account info */}
                      <div style={{
                        background: T.white, borderRadius: 20,
                        border: `1.5px solid ${T.border}`, overflow: "hidden",
                      }}>
                        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            textTransform: "uppercase", letterSpacing: "0.18em",
                            color: T.muted,
                          }}>
                            Account
                          </span>
                        </div>
                        {[
                          { Icon: Shield,     label: "Role",    val: role.charAt(0).toUpperCase() + role.slice(1) },
                          { Icon: Star,       label: "Joined",  val: fmtDate(profile.createdAt) },
                          { Icon: TrendingUp, label: "Orders",  val: String(profile.stats?.totalOrders ?? 0) },
                        ].map(({ Icon, label, val }, i, arr) => (
                          <div key={label} style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "13px 20px",
                            borderBottom: i < arr.length - 1 ? `1px solid #F1F5F9` : "none",
                          }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: 9,
                              background: T.surface, border: `1px solid ${T.border}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0,
                            }}>
                              <Icon size={13} color={T.muted} />
                            </div>
                            <span style={{ fontSize: 12, color: T.muted, flex: 1 }}>{label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{val}</span>
                          </div>
                        ))}
                      </div>

                      {/* Quick links */}
                      {(isSeller || isAdmin) && (
                        <div style={{
                          background: T.white, borderRadius: 20,
                          border: `1.5px solid ${T.border}`, overflow: "hidden",
                        }}>
                          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: "0.18em",
                              color: T.muted,
                            }}>
                              Quick Links
                            </span>
                          </div>
                          {[
                            ...(isSeller ? [
                              { href: "/dashboard/seller",          label: "Seller Dashboard", Icon: LayoutGrid },
                              { href: "/dashboard/seller/orders",   label: "Manage Orders",    Icon: Package    },
                              { href: "/dashboard/seller/settings", label: "Store Settings",   Icon: Settings   },
                            ] : []),
                            ...(isAdmin ? [
                              { href: "/admin",         label: "Admin Console",  Icon: Crown   },
                              { href: "/admin/users",   label: "Manage Users",   Icon: User    },
                              { href: "/admin/sellers", label: "Manage Sellers", Icon: Store   },
                            ] : []),
                          ].map(({ href, label, Icon }) => (
                            <Link key={href} href={href}
                              className="rc-quicklink"
                              style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "13px 20px",
                                borderBottom: `1px solid #F1F5F9`,
                                color: T.navy, textDecoration: "none",
                                fontSize: 12, fontWeight: 600,
                              }}
                            >
                              <div style={{
                                width: 30, height: 30, borderRadius: 9,
                                background: T.surface, border: `1px solid ${T.border}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                              }}>
                                <Icon size={13} color={T.muted} />
                              </div>
                              <span style={{ flex: 1 }}>{label}</span>
                              <ChevronRight size={13} color={T.muted} />
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Danger zone */}
                      <div style={{
                        background: T.white, borderRadius: 20,
                        border: "1.5px solid #FECDD3", overflow: "hidden",
                      }}>
                        <div style={{
                          padding: "14px 20px",
                          borderBottom: "1px solid #FFF1F2",
                          background: "#FFF8F9",
                        }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            textTransform: "uppercase", letterSpacing: "0.18em",
                            color: T.red,
                          }}>
                            Danger Zone
                          </span>
                        </div>
                        <div style={{ padding: "18px 20px" }}>
                          <p style={{
                            fontSize: 12, color: T.muted,
                            margin: "0 0 14px", lineHeight: 1.65,
                          }}>
                            Sign out ends your session on this device only. Your data is safe.
                          </p>
                          <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            style={{
                              width: "100%", padding: "12px", borderRadius: 13,
                              background: "#FFF1F2",
                              border: "1.5px solid #FECDD3",
                              color: T.red, fontSize: 12, fontWeight: 700,
                              cursor: "pointer",
                              display: "flex", alignItems: "center",
                              justifyContent: "center", gap: 8,
                              transition: "background .15s",
                            }}
                          >
                            <LogOut size={13} /> Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
    </>
  );
}