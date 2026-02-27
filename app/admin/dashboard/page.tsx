"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users, Play, IndianRupee, ShoppingBag, Store,
  Package, AlertTriangle, Clock, ArrowUpRight,
  ArrowDownRight, RefreshCw, ChevronRight, TrendingUp,
  CheckCircle2, XCircle, Truck,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

// ─── Design tokens ────────────────────────────────────────────────
const N = "#0A1628"; const M = "#9BA8C0"; const B = "1px solid #E4E9F2"; const S = "#F7F8FC";

// ─── Formatters ───────────────────────────────────────────────────
const fmtRupee = (n: number) => {
  if (!n || isNaN(n)) return "₹0";
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)       return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n}`;
};
const fmtNum = (n: number) => {
  if (!n || isNaN(n)) return "0";
  if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)    return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};
const fmtDate = (d: string | Date) => {
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
};

// Order status → chip style
// IOrder.status: "pending"|"processing"|"shipped"|"delivered"|"cancelled"
// IOrder.paymentStatus: "pending"|"completed"|"failed"|"refunded"
const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  delivered:  { color: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
  shipped:    { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  processing: { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  pending:    { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  cancelled:  { color: "#DC2626", bg: "#FFF1F2", border: "#FECDD3" },
};
const PAYMENT_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  completed: { color: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
  pending:   { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  failed:    { color: "#DC2626", bg: "#FFF1F2", border: "#FECDD3" },
  refunded:  { color: "#6B7A99", bg: "#F7F8FC", border: "#E4E9F2" },
};

// ─── Skeleton block ───────────────────────────────────────────────
const Sk = ({ h = 16, r = 8, w = "100%" }: { h?: number; r?: number; w?: string }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: "#E4E9F2", overflow: "hidden", position: "relative", flexShrink: 0 }}>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#E4E9F2 0%,#F7F8FC 50%,#E4E9F2 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
  </div>
);

// ─── KPI card ─────────────────────────────────────────────────────
function KpiCard({ label, raw, fmt, icon: Icon, change, iColor, iBg, iBorder, delay }: {
  label: string; raw: number; fmt: (n: number) => string;
  icon: React.ElementType; change: number;
  iColor: string; iBg: string; iBorder: string; delay: number;
}) {
  const up = change >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: "white", border: B, borderRadius: 18, padding: "20px 20px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iBg, border: `1px solid ${iBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={iColor} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 7px", borderRadius: 7,
          background: up ? "#F0FDF4" : "#FFF1F2",
          border: `1px solid ${up ? "#BBF7D0" : "#FECDD3"}` }}>
          {up ? <ArrowUpRight size={10} color="#059669" /> : <ArrowDownRight size={10} color="#DC2626" />}
          <span style={{ fontSize: 10, fontWeight: 800, color: up ? "#059669" : "#DC2626" }}>
            {Math.abs(change)}%
          </span>
        </div>
      </div>
      <div>
        <p style={{ fontFamily: "Instrument Serif, serif", fontSize: 24, color: N, margin: 0, letterSpacing: "-0.025em", lineHeight: 1 }}>
          {fmt(raw ?? 0)}
        </p>
        <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: M, margin: "5px 0 0" }}>
          {label}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Chart tab ────────────────────────────────────────────────────
function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ padding: "5px 13px", borderRadius: 8, border: active ? "none" : B, background: active ? N : "white", color: active ? "white" : M, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "DM Sans, sans-serif", transition: "all .15s" }}>
      {label}
    </button>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────
const CTip = ({ active, payload, label, metric }: any) => {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value ?? 0;
  return (
    <div style={{ background: N, borderRadius: 12, padding: "9px 13px", boxShadow: "0 8px 24px rgba(10,22,40,0.25)" }}>
      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", margin: "0 0 4px", fontWeight: 700 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 800, color: "white", margin: 0 }}>
        {metric === "revenue" ? fmtRupee(v) : fmtNum(v)}
      </p>
    </div>
  );
};

// ─── Section card wrapper ─────────────────────────────────────────
const SCard = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "white", border: B, borderRadius: 20, overflow: "hidden" }}>
    {children}
  </div>
);

// ─── Status chip ──────────────────────────────────────────────────
function Chip({ label, style }: { label: string; style: { color: string; bg: string; border: string } }) {
  const icons: Record<string, React.ReactNode> = {
    delivered:  <CheckCircle2 size={9} />,
    completed:  <CheckCircle2 size={9} />,
    shipped:    <Truck size={9} />,
    cancelled:  <XCircle size={9} />,
    failed:     <XCircle size={9} />,
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 7,
      background: style.bg, border: `1px solid ${style.border}`,
      fontSize: 10, fontWeight: 800, color: style.color, textTransform: "capitalize" }}>
      {icons[label] ?? <Clock size={9} />}
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [stats,      setStats]      = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [metric,     setMetric]     = useState<"revenue" | "orders">("revenue");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const res  = await fetch("/api/admin/global-stats");
      const data = await res.json();

      // Guard: API returned an error object instead of stats
      if (data.error || !data.kpis) {
        setError(data.error || "Failed to load stats");
        setStats(null);
        return;
      }
      setStats(data);
    } catch (e) {
      setError("Network error — could not reach the server.");
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Skeleton ────────────────────────────────────────────────────
  if (loading) return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 12 }}>
          {Array(8).fill(0).map((_, i) => <Sk key={i} h={112} r={18} />)}
        </div>
        <Sk h={360} r={20} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <Sk h={300} r={18} /><Sk h={300} r={18} />
        </div>
        <Sk h={260} r={18} />
      </div>
    </>
  );

  // ── Error state ──────────────────────────────────────────────────
  if (error || !stats) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 360, gap: 14, fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: "#FFF1F2", border: "1px solid #FECDD3", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <AlertTriangle size={22} color="#DC2626" />
      </div>
      <p style={{ fontSize: 15, fontWeight: 800, color: N, margin: 0 }}>Failed to load dashboard</p>
      <p style={{ fontSize: 12, color: M, margin: 0 }}>{error}</p>
      <button onClick={() => load(true)} style={{ padding: "9px 20px", borderRadius: 11, background: N, color: "white", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 13 }}>
        Try again
      </button>
    </div>
  );

  // ── Safe destructure with defaults ──────────────────────────────
  const kpis         = stats.kpis         ?? {};
  const changes      = stats.changes       ?? {};
  const chartData    = stats.chartData     ?? [];
  const topStores    = stats.topStores     ?? [];
  const recentOrders = stats.recentOrders  ?? [];

  const KPI_ROWS = [
    { label: "Gross Revenue",   raw: kpis.totalRevenue   ?? 0, fmt: fmtRupee, icon: IndianRupee, change: changes.revenue ?? 0, iColor: "#059669", iBg: "#F0FDF4", iBorder: "#BBF7D0" },
    { label: "Total Orders",    raw: kpis.totalOrders    ?? 0, fmt: fmtNum,   icon: ShoppingBag, change: changes.orders  ?? 0, iColor: "#2563EB", iBg: "#EFF6FF", iBorder: "#BFDBFE" },
    { label: "Active Buyers",   raw: kpis.totalUsers     ?? 0, fmt: fmtNum,   icon: Users,       change: changes.users   ?? 0, iColor: "#7C3AED", iBg: "#F5F3FF", iBorder: "#DDD6FE" },
    { label: "Published Reels", raw: kpis.totalReels     ?? 0, fmt: fmtNum,   icon: Play,        change: changes.reels   ?? 0, iColor: "#D97706", iBg: "#FFFBEB", iBorder: "#FDE68A" },
    { label: "Avg Order Value", raw: kpis.avgOrderValue  ?? 0, fmt: fmtRupee, icon: TrendingUp,  change: 0,                   iColor: "#0891B2", iBg: "#ECFEFF", iBorder: "#A5F3FC" },
    { label: "Active Stores",   raw: kpis.totalStores    ?? 0, fmt: fmtNum,   icon: Store,       change: 0,                   iColor: "#DC2626", iBg: "#FFF1F2", iBorder: "#FECDD3" },
    { label: "Products Listed", raw: kpis.totalProducts  ?? 0, fmt: fmtNum,   icon: Package,     change: 0,                   iColor: "#059669", iBg: "#F0FDF4", iBorder: "#BBF7D0" },
    { label: "New Users (7d)",  raw: kpis.newUsersWeek   ?? 0, fmt: fmtNum,   icon: Users,       change: 0,                   iColor: "#7C3AED", iBg: "#F5F3FF", iBorder: "#DDD6FE" },
  ];

  return (
    <>
      <style>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 22, fontFamily: "DM Sans, sans-serif" }}>

        {/* ── Page header ──────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: M, margin: "0 0 4px" }}>Last 30 days</p>
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: 28, color: N, margin: 0, letterSpacing: "-0.025em" }}>Platform Overview</h1>
          </div>
          <button onClick={() => load(true)} disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 11, border: B, background: "white", cursor: refreshing ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700, color: refreshing ? M : N, fontFamily: "DM Sans, sans-serif" }}>
            <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* ── Alert banners ─────────────────────────────────────── */}
        {((kpis.pendingSellers ?? 0) > 0 || (kpis.flaggedReels ?? 0) > 0) && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {(kpis.pendingSellers ?? 0) > 0 && (
              <Link href="/admin/sellers" style={{ textDecoration: "none", flex: 1, minWidth: 220 }}>
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 14, cursor: "pointer" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: "#FEF3C7", border: "1px solid #FDE68A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Clock size={14} color="#D97706" />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 800, color: "#92400E", margin: 0 }}>
                      {kpis.pendingSellers} store{kpis.pendingSellers > 1 ? "s" : ""} awaiting verification
                    </p>
                    <p style={{ fontSize: 10, color: "#D97706", margin: 0 }}>Review applications →</p>
                  </div>
                </motion.div>
              </Link>
            )}
            {(kpis.flaggedReels ?? 0) > 0 && (
              <Link href="/admin/content" style={{ textDecoration: "none", flex: 1, minWidth: 220 }}>
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 14, cursor: "pointer" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: "#FFE4E6", border: "1px solid #FECDD3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <AlertTriangle size={14} color="#DC2626" />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 800, color: "#991B1B", margin: 0 }}>
                      {kpis.flaggedReels} reel{kpis.flaggedReels > 1 ? "s" : ""} flagged for moderation
                    </p>
                    <p style={{ fontSize: 10, color: "#DC2626", margin: 0 }}>Review content →</p>
                  </div>
                </motion.div>
              </Link>
            )}
          </div>
        )}

        {/* ── KPI grid ─────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 12 }}>
          {KPI_ROWS.map((k, i) => <KpiCard key={k.label} {...k} delay={i * 0.05} />)}
        </div>

        {/* ── Area chart ───────────────────────────────────────── */}
        <SCard>
          <div style={{ padding: "22px 24px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: B }}>
            <div>
              <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: 20, color: N, margin: 0, letterSpacing: "-0.02em" }}>Platform Growth</h2>
              <p style={{ fontSize: 11, color: M, margin: "2px 0 0", fontWeight: 500 }}>
                30-day {metric === "revenue" ? "revenue (paid orders)" : "total order volume"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Tab label="Revenue" active={metric === "revenue"} onClick={() => setMetric("revenue")} />
              <Tab label="Orders"  active={metric === "orders"}  onClick={() => setMetric("orders")}  />
            </div>
          </div>
          <div style={{ padding: "20px 12px 16px", height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={N} stopOpacity={0.16} />
                    <stop offset="95%" stopColor={N} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E9F2" />
                <XAxis dataKey="date" axisLine={false} tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 700, fill: "#C4CDD8" }} interval={4} />
                <YAxis axisLine={false} tickLine={false} width={52}
                  tick={{ fontSize: 9, fontWeight: 700, fill: "#C4CDD8" }}
                  tickFormatter={v => metric === "revenue" ? fmtRupee(v) : fmtNum(v)} />
                <Tooltip content={<CTip metric={metric} />} />
                <Area type="monotone" dataKey={metric} stroke={N} strokeWidth={2.5}
                  fill="url(#grad)" dot={false}
                  activeDot={{ r: 5, fill: N, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SCard>

        {/* ── Two-col: top stores + bar chart ──────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

          {/* Top stores */}
          <SCard>
            <div style={{ padding: "18px 20px 14px", borderBottom: B, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: 17, color: N, margin: 0 }}>Top Stores</h2>
                <p style={{ fontSize: 10, color: M, margin: "1px 0 0", fontWeight: 500 }}>By GMV · paid orders · 30d</p>
              </div>
              <Link href="/admin/sellers" style={{ fontSize: 11, fontWeight: 700, color: N, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                All <ChevronRight size={11} />
              </Link>
            </div>
            <div>
              {topStores.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center" }}>
                  <Store size={22} color="#C4CDD8" style={{ margin: "0 auto 8px" }} />
                  <p style={{ fontSize: 12, color: M, margin: 0 }}>No paid orders yet</p>
                </div>
              ) : topStores.map((s: any, i: number) => (
                <div key={s._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: i < topStores.length - 1 ? B : "none" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: i === 0 ? "#D97706" : M, width: 18, flexShrink: 0 }}>#{i + 1}</span>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: N, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                    {s.logo
                      ? <img src={s.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 13, fontWeight: 800, color: "white" }}>{s.name?.[0] ?? "?"}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: N, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                    <p style={{ fontSize: 10, color: M, margin: 0 }}>{s.orders} orders</p>
                  </div>
                  <p style={{ fontFamily: "Instrument Serif, serif", fontSize: 15, color: N, margin: 0, flexShrink: 0 }}>{fmtRupee(s.gmv)}</p>
                </div>
              ))}
            </div>
          </SCard>

          {/* Daily orders bar chart */}
          <SCard>
            <div style={{ padding: "18px 20px 14px", borderBottom: B }}>
              <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: 17, color: N, margin: 0 }}>Daily Order Volume</h2>
              <p style={{ fontSize: 10, color: M, margin: "1px 0 0", fontWeight: 500 }}>All orders · 30 days</p>
            </div>
            <div style={{ padding: "16px 10px 12px", height: 238 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barSize={6}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E9F2" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false}
                    tick={{ fontSize: 8, fill: "#C4CDD8", fontWeight: 700 }} interval={6} />
                  <YAxis axisLine={false} tickLine={false}
                    tick={{ fontSize: 9, fill: "#C4CDD8", fontWeight: 700 }} width={24} />
                  <Tooltip content={<CTip metric="orders" />} />
                  <Bar dataKey="orders" fill={N} radius={[4, 4, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SCard>
        </div>

        {/* ── Recent orders table ───────────────────────────────── */}
        <SCard>
          <div style={{ padding: "18px 20px 14px", borderBottom: B }}>
            <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: 17, color: N, margin: 0 }}>Recent Orders</h2>
            <p style={{ fontSize: 10, color: M, margin: "1px 0 0", fontWeight: 500 }}>Latest 6 transactions — all stores</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            {recentOrders.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <ShoppingBag size={22} color="#C4CDD8" style={{ margin: "0 auto 8px" }} />
                <p style={{ fontSize: 12, color: M, margin: 0 }}>No orders yet</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: S }}>
                    {["Order", "Buyer", "Store", "Amount", "Fulfilment", "Payment", "Date"].map(h => (
                      <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: M, borderBottom: B, whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o: any, i: number) => (
                    <tr key={o._id}
                      style={{ borderBottom: i < recentOrders.length - 1 ? B : "none", transition: "background .12s" }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = S)}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: N, fontWeight: 600 }}>
                          #{String(o._id).slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: N, margin: 0 }}>{o.buyer}</p>
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: M, margin: 0 }}>{o.store}</p>
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <p style={{ fontFamily: "Instrument Serif, serif", fontSize: 15, color: N, margin: 0 }}>
                          {fmtRupee(o.amount)}
                        </p>
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <Chip label={o.status} style={STATUS_STYLE[o.status] ?? STATUS_STYLE.pending} />
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <Chip label={o.paymentStatus} style={PAYMENT_STYLE[o.paymentStatus] ?? PAYMENT_STYLE.pending} />
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <p style={{ fontSize: 11, color: M, margin: 0, fontWeight: 500, whiteSpace: "nowrap" }}>
                          {fmtDate(o.createdAt)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </SCard>

      </div>
    </>
  );
}