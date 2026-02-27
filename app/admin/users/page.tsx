"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Users, UserCheck, ShieldCheck, Search,
  RefreshCw, ChevronLeft, ChevronRight,
  ArrowUpRight, TrendingUp, MoreHorizontal,
  CheckCircle2, X, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ─── Tokens ──────────────────────────────────────────────────────
const N = "#0A1628"; const M = "#9BA8C0"; const B = "1px solid #E4E9F2"; const S = "#F7F8FC";

// ─── Types ────────────────────────────────────────────────────────
type Role   = "all" | "user" | "seller" | "admin";
type SortBy = "newest" | "oldest" | "name";

interface UserDoc {
  _id:                 string;
  name:                string;
  email:               string;
  image?:              string;
  role:                "user" | "seller" | "admin";
  provider:            "credentials" | "google";
  onboardingCompleted: boolean;
  interests:           string[];
  pricePreference:     string;
  createdAt:           string;
}

// ─── Helpers ─────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const ago = (d: string) => {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30)  return `${days}d ago`;
  return fmtDate(d);
};

const ROLE_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  admin:  { color: "#DC2626", bg: "#FFF1F2", border: "#FECDD3", label: "Admin"  },
  seller: { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", label: "Seller" },
  user:   { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", label: "Buyer"  },
};

// ─── Skeleton ─────────────────────────────────────────────────────
const Sk = ({ h = 16, r = 8, w = "100%" }: { h?: number; r?: number; w?: string }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: "#E4E9F2", overflow: "hidden", position: "relative" }}>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#E4E9F2 0%,#F7F8FC 50%,#E4E9F2 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
  </div>
);

// ─── Stat tile ────────────────────────────────────────────────────
function StatTile({ icon: Icon, value, label, iColor, iBg, iBorder, active, onClick }: {
  icon: React.ElementType; value: number; label: string;
  iColor: string; iBg: string; iBorder: string;
  active?: boolean; onClick?: () => void;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} onClick={onClick}
      style={{ background: active ? N : "white", border: active ? "none" : B, borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, cursor: onClick ? "pointer" : "default", boxShadow: active ? "0 8px 24px rgba(10,22,40,0.18)" : "none", transition: "background .2s, box-shadow .2s" }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: active ? "rgba(255,255,255,0.12)" : iBg, border: `1px solid ${active ? "rgba(255,255,255,0.15)" : iBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} color={active ? "white" : iColor} />
      </div>
      <div>
        <p style={{ fontFamily: "Instrument Serif, serif", fontSize: 22, color: active ? "white" : N, margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>{value.toLocaleString()}</p>
        <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: active ? "rgba(255,255,255,0.5)" : M, margin: "3px 0 0" }}>{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Role change dropdown ─────────────────────────────────────────
function RoleDropdown({ user, onRoleChange, isSelf }: {
  user: UserDoc; onRoleChange: (userId: string, role: string) => Promise<void>; isSelf: boolean;
}) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const rs = ROLE_STYLE[user.role];

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => !isSelf && setOpen(v => !v)} disabled={isSelf}
        style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 8px 3px 7px", borderRadius: 8, background: rs.bg, border: `1px solid ${rs.border}`, cursor: isSelf ? "not-allowed" : "pointer", opacity: isSelf ? 0.6 : 1, transition: "all .15s" }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: rs.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{rs.label}</span>
        {!isSelf && <ChevronDown size={9} color={rs.color} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }} transition={{ duration: 0.14 }}
            style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "white", border: B, borderRadius: 14, boxShadow: "0 12px 36px rgba(10,22,40,0.14)", zIndex: 50, overflow: "hidden", minWidth: 140 }}>
            <div style={{ padding: "6px" }}>
              {(["user", "seller", "admin"] as const).map(role => {
                const s = ROLE_STYLE[role];
                const isCurrent = user.role === role;
                return (
                  <button key={role} onClick={async () => {
                    if (isCurrent) { setOpen(false); return; }
                    setLoading(true); setOpen(false);
                    await onRoleChange(user._id, role);
                    setLoading(false);
                  }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "9px 12px", borderRadius: 10, border: "none", background: isCurrent ? s.bg : "transparent", cursor: "pointer", fontFamily: "DM Sans, sans-serif", transition: "background .12s" }}
                    onMouseEnter={e => { if (!isCurrent) (e.currentTarget.style.background = S); }}
                    onMouseLeave={e => { if (!isCurrent) (e.currentTarget.style.background = "transparent"); }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isCurrent ? s.color : "#6B7A99" }}>{s.label}</span>
                    {isCurrent && <CheckCircle2 size={12} color={s.color} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── User avatar ──────────────────────────────────────────────────
function Avatar({ user }: { user: UserDoc }) {
  const colors: Record<string, string> = { admin: "#DC2626", seller: "#7C3AED", user: "#2563EB" };
  const initial = (user.name || user.email || "?")[0].toUpperCase();
  return (
    <div style={{ width: 36, height: 36, borderRadius: 10, background: user.image ? "transparent" : N, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: B }}>
      {user.image
        ? <img src={user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: 13, fontWeight: 800, color: "white" }}>{initial}</span>}
    </div>
  );
}

// ─── Filter/sort button ───────────────────────────────────────────
function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ padding: "7px 14px", borderRadius: 10, border: active ? "none" : B, background: active ? N : "white", color: active ? "white" : M, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "DM Sans, sans-serif", transition: "all .15s", boxShadow: active ? "0 4px 12px rgba(10,22,40,0.15)" : "none" }}>
      {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function UserDirectory() {
  const [users,      setUsers]      = useState<UserDoc[]>([]);
  const [stats,      setStats]      = useState({ total: 0, users: 0, sellers: 0, admins: 0, newThisWeek: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [roleFilter, setRoleFilter] = useState<Role>("all");
  const [sortBy,     setSortBy]     = useState<SortBy>("newest");
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selfId,     setSelfId]     = useState<string>("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get self id from session for role-change guard
  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json())
      .then(s => setSelfId(s?.user?.id || s?.user?.email || ""))
      .catch(() => {});
  }, []);

  const load = useCallback(async (opts: { role?: Role; sort?: SortBy; page?: number; q?: string; isRefresh?: boolean } = {}) => {
    const r = opts.role  ?? roleFilter;
    const s = opts.sort  ?? sortBy;
    const p = opts.page  ?? 1;
    const q = opts.q     ?? search;
    if (opts.isRefresh) setRefreshing(true); else setLoading(true);

    try {
      const params = new URLSearchParams({ role: r, sort: s, page: String(p), q });
      const res    = await fetch(`/api/admin/all-users?${params}`);
      const data   = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setUsers(data.users ?? []);
      setStats(data.stats ?? { total: 0, users: 0, sellers: 0, admins: 0, newThisWeek: 0 });
      setPagination(data.pagination ?? { page: 1, pages: 1, total: 0 });
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [roleFilter, sortBy, search]);

  useEffect(() => { load({ role: roleFilter, sort: sortBy, page: 1, q: "" }); }, [roleFilter, sortBy]);

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load({ page: 1, q: search }), 380);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const res = await fetch("/api/admin/all-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to change role"); return; }
      toast.success(`Role updated to ${role}`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: role as any } : u));
      // Update stats counts
      setStats(prev => {
        const old = users.find(u => u._id === userId)?.role;
        if (!old || old === role) return prev;
        const next = { ...prev };
        if (old   === "user")   next.users--;
        if (old   === "seller") next.sellers--;
        if (old   === "admin")  next.admins--;
        if (role  === "user")   next.users++;
        if (role  === "seller") next.sellers++;
        if (role  === "admin")  next.admins++;
        return next;
      });
    } catch {
      toast.error("Network error");
    }
  };

  const SORT_OPTIONS: { id: SortBy; label: string }[] = [
    { id: "newest", label: "Newest"   },
    { id: "oldest", label: "Oldest"   },
    { id: "name",   label: "Name A–Z" },
  ];

  return (
    <>
      <style>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 22, fontFamily: "DM Sans, sans-serif" }}>

        {/* ── Header ───────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: M, margin: "0 0 4px" }}>
              {pagination.total.toLocaleString()} total accounts
            </p>
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: 28, color: N, margin: 0, letterSpacing: "-0.025em" }}>User Directory</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <Search size={13} color={M} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input type="text" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding: "9px 14px 9px 34px", borderRadius: 11, border: B, background: "white", fontSize: 12, fontFamily: "DM Sans, sans-serif", color: N, outline: "none", width: 240, transition: "border-color .15s" }}
                onFocus={e => (e.target.style.borderColor = N)} onBlur={e => (e.target.style.borderColor = "#E4E9F2")} />
            </div>
            <button onClick={() => load({ isRefresh: true })} disabled={refreshing}
              style={{ width: 38, height: 38, borderRadius: 11, border: B, background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <RefreshCw size={13} color={refreshing ? M : N} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>
        </div>

        {/* ── Stat tiles ───────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12 }}>
          <StatTile icon={Users}      value={stats.total}       label="All Users"     iColor={N}        iBg={S}        iBorder="#E4E9F2" active={roleFilter === "all"}    onClick={() => { setRoleFilter("all");    setSearch(""); }} />
          <StatTile icon={Users}      value={stats.users}       label="Buyers"        iColor="#2563EB"  iBg="#EFF6FF"  iBorder="#BFDBFE" active={roleFilter === "user"}   onClick={() => { setRoleFilter("user");   setSearch(""); }} />
          <StatTile icon={UserCheck}  value={stats.sellers}     label="Sellers"       iColor="#7C3AED"  iBg="#F5F3FF"  iBorder="#DDD6FE" active={roleFilter === "seller"} onClick={() => { setRoleFilter("seller"); setSearch(""); }} />
          <StatTile icon={ShieldCheck}value={stats.admins}      label="Admins"        iColor="#DC2626"  iBg="#FFF1F2"  iBorder="#FECDD3" active={roleFilter === "admin"}  onClick={() => { setRoleFilter("admin");  setSearch(""); }} />
          <StatTile icon={TrendingUp} value={stats.newThisWeek} label="New this week" iColor="#059669"  iBg="#F0FDF4"  iBorder="#BBF7D0" />
        </div>

        {/* ── Sort row ─────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 7 }}>
            {SORT_OPTIONS.map(o => (
              <FilterBtn key={o.id} label={o.label} active={sortBy === o.id} onClick={() => setSortBy(o.id)} />
            ))}
          </div>
          {search && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: M }}>Results for "<strong style={{ color: N }}>{search}</strong>"</span>
              <button onClick={() => setSearch("")}
                style={{ width: 20, height: 20, borderRadius: "50%", border: B, background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={9} color={M} />
              </button>
            </div>
          )}
        </div>

        {/* ── Table ────────────────────────────────────────────── */}
        <div style={{ background: "white", border: B, borderRadius: 20, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "12px" }}>
              {Array(8).fill(0).map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 8px", borderBottom: i < 7 ? B : "none" }}>
                  <Sk h={36} w="36px" r={10} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                    <Sk h={12} w="35%" r={6} />
                    <Sk h={10} w="50%" r={6} />
                  </div>
                  <Sk h={24} w="60px" r={8} />
                  <Sk h={12} w="80px" r={6} />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
              <Users size={40} color="#C4CDD8" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, fontWeight: 800, color: N, margin: "0 0 4px" }}>No users found</p>
              <p style={{ fontSize: 12, color: M, margin: 0 }}>
                {search ? "Try a different search term." : `No ${roleFilter === "all" ? "" : roleFilter + " "}accounts yet.`}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: S }}>
                    {["User", "Role", "Provider", "Onboarding", "Joined", ""].map((h, i) => (
                      <th key={i} style={{ padding: "11px 20px", textAlign: i === 5 ? "right" : "left", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: M, borderBottom: B, whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {users.map((u, i) => {
                      const isSelf = selfId === u._id || selfId === u.email;
                      return (
                        <motion.tr key={u._id}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.25 }}
                          style={{ borderBottom: i < users.length - 1 ? B : "none", transition: "background .12s" }}
                          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = S)}
                          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}>

                          {/* User details */}
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <Avatar user={u} />
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <p style={{ fontSize: 13, fontWeight: 700, color: N, margin: 0 }}>{u.name || "—"}</p>
                                  {isSelf && (
                                    <span style={{ fontSize: 8, fontWeight: 800, padding: "1px 6px", borderRadius: 5, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#059669", textTransform: "uppercase", letterSpacing: "0.1em" }}>You</span>
                                  )}
                                </div>
                                <p style={{ fontSize: 11, color: M, margin: 0 }}>{u.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role (clickable dropdown) */}
                          <td style={{ padding: "14px 20px" }}>
                            <RoleDropdown user={u} onRoleChange={handleRoleChange} isSelf={isSelf} />
                          </td>

                          {/* Provider */}
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {u.provider === "google" ? (
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 7, background: "#FFF7ED", border: "1px solid #FED7AA", color: "#C2410C" }}>Google</span>
                              ) : (
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 7, background: S, border: B, color: M }}>Email</span>
                              )}
                            </div>
                          </td>

                          {/* Onboarding */}
                          <td style={{ padding: "14px 20px" }}>
                            {u.onboardingCompleted ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <CheckCircle2 size={13} color="#059669" />
                                <span style={{ fontSize: 11, fontWeight: 600, color: "#059669" }}>Complete</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 11, fontWeight: 600, color: M }}>Pending</span>
                            )}
                          </td>

                          {/* Joined */}
                          <td style={{ padding: "14px 20px" }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: N, margin: 0 }}>{fmtDate(u.createdAt)}</p>
                            <p style={{ fontSize: 10, color: M, margin: 0 }}>{ago(u.createdAt)}</p>
                          </td>

                          {/* Interests preview */}
                          <td style={{ padding: "14px 20px", textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5 }}>
                              {u.interests?.slice(0, 2).map((tag, j) => (
                                <span key={j} style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: S, border: B, color: M, whiteSpace: "nowrap" }}>{tag}</span>
                              ))}
                              {(u.interests?.length || 0) > 2 && (
                                <span style={{ fontSize: 9, fontWeight: 700, color: M }}>+{u.interests.length - 2}</span>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ───────────────────────────────────────── */}
        {pagination.pages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: M, fontWeight: 600 }}>
              Showing {((pagination.page - 1) * 20) + 1}–{Math.min(pagination.page * 20, pagination.total)} of {pagination.total.toLocaleString()}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => load({ page: pagination.page - 1 })} disabled={pagination.page <= 1}
                style={{ width: 36, height: 36, borderRadius: 10, border: B, background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: pagination.page <= 1 ? "not-allowed" : "pointer", opacity: pagination.page <= 1 ? 0.4 : 1 }}>
                <ChevronLeft size={14} color={N} />
              </button>
              <span style={{ fontSize: 12, fontWeight: 700, color: N, padding: "0 4px" }}>
                {pagination.page} / {pagination.pages}
              </span>
              <button onClick={() => load({ page: pagination.page + 1 })} disabled={pagination.page >= pagination.pages}
                style={{ width: 36, height: 36, borderRadius: 10, border: B, background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: pagination.page >= pagination.pages ? "not-allowed" : "pointer", opacity: pagination.page >= pagination.pages ? 0.4 : 1 }}>
                <ChevronRight size={14} color={N} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}