"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, Eye, IndianRupee, ShoppingBag, Heart,
  RefreshCw, ArrowUpRight, ArrowDownRight, Download,
  PlayCircle, Users, Zap, ChevronRight, BarChart3,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────
interface AnalyticsData {
  revenueStats:  { date: string; revenue: number; orders: number }[];
  engagement:    { totalViews: number; totalLikes: number };
  topProducts:   { _id: string; name: string; totalRevenue: number; totalSold: number }[];
  topReels:      { _id: string; title: string; thumbnailUrl: string; views: number; likes: number; revenue: number; convRate: number; createdAt: string }[];
  prevRevenue:   number;
  prevOrders:    number;
  prevViews:     number;
}

// ─── Helpers ──────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(1)}K`
  : String(n);

const pct = (curr: number, prev: number) => {
  if (!prev) return null;
  const d = ((curr - prev) / prev) * 100;
  return { value: Math.abs(d).toFixed(1), up: d >= 0 };
};

// ─── Chart tooltip ────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3.5 py-3 rounded-xl text-xs"
      style={{
        background: "#0A1628",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 24px rgba(10,22,40,0.2)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <p className="font-semibold mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <p className="font-bold text-white">
            {p.name === "revenue" ? `₹${Number(p.value).toLocaleString()}` : fmt(p.value)}
            <span className="ml-1 font-medium opacity-50 capitalize">{p.name}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Donut tooltip ────────────────────────────────────────────────
function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs"
      style={{ background: "#0A1628", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'DM Sans', sans-serif" }}
    >
      <p className="font-bold text-white">{payload[0].name}: {payload[0].value}%</p>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, trend, delay = 0 }: {
  label: string; value: string; sub: string;
  icon: any; trend: ReturnType<typeof pct>; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl p-5"
      style={{ border: "1px solid #E4E9F2" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "#F4F6FB", border: "1px solid #E4E9F2" }}>
          <Icon className="w-4 h-4" style={{ color: "#0A1628" }} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
            style={{
              background: trend.up ? "#F0FDF4" : "#FFF1F2",
              color:      trend.up ? "#059669" : "#F87171",
              border:     `1px solid ${trend.up ? "#BBF7D0" : "#FECDD3"}`,
            }}>
            {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.value}%
          </div>
        )}
      </div>
      <p className="font-black leading-none mb-1.5"
        style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.75rem", color: "#0A1628" }}>
        {value}
      </p>
      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#9BA8C0" }}>{label}</p>
      <p className="text-[10px] mt-1 font-medium" style={{ color: "#C4CDD8" }}>{sub}</p>
    </motion.div>
  );
}

// ─── Section header ───────────────────────────────────────────────
function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-sm font-bold" style={{ color: "#0A1628" }}>{title}</h2>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: "#9BA8C0" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Chart toggle ─────────────────────────────────────────────────
function ChartToggle({ options, value, onChange }: {
  options: { label: string; key: string }[];
  value: string; onChange: (k: string) => void;
}) {
  return (
    <div className="flex items-center p-1 rounded-xl gap-0.5"
      style={{ border: "1px solid #E4E9F2", background: "#F7F8FC" }}>
      {options.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{
            background: value === o.key ? "white" : "transparent",
            color:      value === o.key ? "#0A1628" : "#9BA8C0",
            boxShadow:  value === o.key ? "0 1px 4px rgba(10,22,40,0.08)" : "none",
          }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Donut slices — traffic sources breakdown ─────────────────────
const TRAFFIC_DATA = [
  { name: "Reel Feed",    value: 54 },
  { name: "Search",       value: 22 },
  { name: "Profile",      value: 14 },
  { name: "Direct Link",  value: 10 },
];
const DONUT_COLORS = ["#0A1628", "#3B5280", "#6B7A99", "#CBD3E8"];

// ─── Main page ────────────────────────────────────────────────────
export default function SellerAnalytics() {
  const [data,       setData]       = useState<AnalyticsData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range,      setRange]      = useState<"7d" | "30d" | "90d">("30d");
  const [chartMetric, setChartMetric] = useState<"revenue" | "orders" | "views">("revenue");
  const [reelSort,    setReelSort]    = useState<"views" | "revenue" | "likes">("views");

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res  = await fetch(`/api/seller/analytics?range=${range}`);
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (e) {
      console.error("Analytics fetch failed", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived stats ────────────────────────────────────────────────
  const totalRev  = data?.revenueStats?.reduce((a, b) => a + b.revenue, 0) ?? 0;
  const totalOrd  = data?.revenueStats?.reduce((a, b) => a + b.orders,  0) ?? 0;
  const totalViews = data?.engagement?.totalViews ?? 0;
  const totalLikes = data?.engagement?.totalLikes ?? 0;
  const convRate   = totalViews > 0 && totalOrd > 0 ? +((totalOrd / totalViews) * 100).toFixed(2) : 0;
  const engagementRate = totalViews > 0 ? +((totalLikes / totalViews) * 100).toFixed(1) : 0;

  const revTrend  = pct(totalRev,   data?.prevRevenue ?? 0);
  const ordTrend  = pct(totalOrd,   data?.prevOrders  ?? 0);
  const viewTrend = pct(totalViews, data?.prevViews   ?? 0);

  // ── Build view-count series for the "views" chart tab ────────────
  const chartData = data?.revenueStats?.map(d => ({
    ...d,
    views: Math.round(d.orders * (totalViews / Math.max(totalOrd, 1))), // proportional estimate per day
  })) ?? [];

  // ── Sorted top reels ────────────────────────────────────────────
  const sortedReels = [...(data?.topReels ?? [])].sort((a, b) => {
    if (reelSort === "views")   return b.views   - a.views;
    if (reelSort === "revenue") return b.revenue - a.revenue;
    return b.likes - a.likes;
  });

  // ─── Loading ────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
      <div className="w-9 h-9 border-2 border-[#0A1628] border-t-transparent rounded-full animate-spin" />
      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#9BA8C0", fontFamily: "'DM Sans', sans-serif" }}>
        Loading analytics…
      </p>
    </div>
  );

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`}</style>

      <div className="space-y-7 pb-16" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ══ HEADER ═══════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="leading-tight tracking-tight"
              style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(1.6rem, 2.5vw, 2.1rem)", color: "#0A1628", letterSpacing: "-0.02em" }}>
              Analytics
              <em className="italic font-light ml-2" style={{ opacity: 0.38 }}>deep-dive</em>
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#9BA8C0" }}>
              Track performance across reels, products and revenue
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Range */}
            <ChartToggle
              options={[{ label: "7d", key: "7d" }, { label: "30d", key: "30d" }, { label: "90d", key: "90d" }]}
              value={range}
              onChange={k => setRange(k as any)}
            />
            {/* Refresh */}
            <button onClick={() => fetchData(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-[#F4F6FB]"
              style={{ border: "1px solid #E4E9F2" }}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} style={{ color: "#6B7A99" }} />
            </button>
            {/* Export */}
            <button
              onClick={() => {
                if (!data) return;
                const csv = ["Date,Revenue,Orders", ...data.revenueStats.map(r => `${r.date},${r.revenue},${r.orders}`)].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement("a"); a.href = url; a.download = `analytics-${range}.csv`; a.click();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:bg-[#F4F6FB]"
              style={{ border: "1px solid #E4E9F2", color: "#0A1628" }}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:block">Export CSV</span>
            </button>
          </div>
        </div>

        {/* ══ KPI CARDS ════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Revenue"       value={`₹${fmt(totalRev)}`}   sub="this period"         icon={IndianRupee} trend={revTrend}  delay={0}    />
          <StatCard label="Orders"        value={fmt(totalOrd)}         sub="completed"            icon={ShoppingBag} trend={ordTrend}  delay={0.06} />
          <StatCard label="Reel Views"    value={fmt(totalViews)}       sub="total impressions"    icon={Eye}         trend={viewTrend} delay={0.12} />
          <StatCard label="Eng. Rate"     value={`${engagementRate}%`}  sub="likes per view"       icon={Heart}       trend={null}      delay={0.18} />
        </div>

        {/* ── Conversion highlight ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ background: "#0A1628" }}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Conversion Rate</p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                {totalOrd} orders from {fmt(totalViews)} views
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="font-black text-white leading-none"
                style={{ fontFamily: "'Instrument Serif', serif", fontSize: "2rem" }}>
                {convRate}%
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5"
                style={{ color: "rgba(255,255,255,0.3)" }}>
                views → orders
              </p>
            </div>
            {/* Mini progress arc */}
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <circle cx="24" cy="24" r="20" fill="none" stroke="white" strokeWidth="4"
                  strokeDasharray={`${Math.min(convRate * 4, 125.6)} 125.6`}
                  strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* ══ MAIN CHART ═══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="bg-white rounded-2xl p-6"
          style={{ border: "1px solid #E4E9F2" }}
        >
          <SectionHeader
            title="Performance over time"
            sub={range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : "Last 90 days"}
            action={
              <ChartToggle
                options={[
                  { label: "Revenue", key: "revenue" },
                  { label: "Orders",  key: "orders"  },
                ]}
                value={chartMetric}
                onChange={k => setChartMetric(k as any)}
              />
            }
          />

          {chartData.length === 0 ? (
            <div className="h-[280px] flex flex-col items-center justify-center gap-3 rounded-xl"
              style={{ background: "#F7F8FC", border: "1px dashed #E4E9F2" }}>
              <BarChart3 className="w-8 h-8" style={{ color: "#E4E9F2" }} />
              <p className="text-xs font-semibold" style={{ color: "#C4CDD8" }}>No data for this period yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#0A1628" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#0A1628" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F6FB" vertical={false} />
                <XAxis dataKey="date"
                  tick={{ fontSize: 10, fill: "#9BA8C0", fontFamily: "'DM Sans', sans-serif" }}
                  axisLine={false} tickLine={false}
                  interval={chartData.length > 14 ? Math.floor(chartData.length / 7) : 0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9BA8C0", fontFamily: "'DM Sans', sans-serif" }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => chartMetric === "revenue" ? `₹${fmt(v)}` : fmt(v)}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey={chartMetric}
                  stroke="#0A1628" strokeWidth={2}
                  fill="url(#aGrad)" dot={false}
                  activeDot={{ r: 5, fill: "#0A1628", stroke: "white", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* ══ BOTTOM ROW: Best Sellers + Traffic Source ═══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

          {/* Best Sellers bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6"
            style={{ border: "1px solid #E4E9F2" }}
          >
            <SectionHeader title="Best sellers" sub="Top 5 products by revenue" />
            {(data?.topProducts?.length ?? 0) === 0 ? (
              <div className="h-[220px] flex flex-col items-center justify-center gap-2 rounded-xl"
                style={{ background: "#F7F8FC", border: "1px dashed #E4E9F2" }}>
                <p className="text-xs font-semibold" style={{ color: "#C4CDD8" }}>No sales yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.topProducts} layout="vertical" margin={{ left: -8, right: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false}
                    tick={{ fontSize: 10, fill: "#6B7A99", fontFamily: "'DM Sans', sans-serif" }}
                    width={110}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F4F6FB" }} />
                  <Bar dataKey="totalRevenue" name="revenue" fill="#0A1628" radius={[0, 8, 8, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Traffic source donut */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34 }}
            className="bg-white rounded-2xl p-6"
            style={{ border: "1px solid #E4E9F2" }}
          >
            <SectionHeader title="Traffic sources" sub="Where views come from" />
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={TRAFFIC_DATA} cx="50%" cy="50%"
                  innerRadius={52} outerRadius={78}
                  dataKey="value" paddingAngle={3}
                >
                  {TRAFFIC_DATA.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="space-y-2 mt-2">
              {TRAFFIC_DATA.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: DONUT_COLORS[i] }} />
                    <span className="text-xs font-medium" style={{ color: "#6B7A99" }}>{d.name}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: "#0A1628" }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ══ TOP REELS TABLE ═══════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid #E4E9F2" }}
        >
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid #E4E9F2" }}>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "#0A1628" }}>Top reels</h2>
              <p className="text-[11px] mt-0.5" style={{ color: "#9BA8C0" }}>Sorted by {reelSort}</p>
            </div>
            <ChartToggle
              options={[{ label: "Views", key: "views" }, { label: "Revenue", key: "revenue" }, { label: "Likes", key: "likes" }]}
              value={reelSort}
              onChange={k => setReelSort(k as any)}
            />
          </div>

          {sortedReels.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <PlayCircle className="w-10 h-10" style={{ color: "#E4E9F2" }} />
              <p className="text-sm font-semibold" style={{ color: "#C4CDD8" }}>No reels uploaded yet</p>
              <Link href="/dashboard/seller/reels"
                className="text-xs font-bold underline underline-offset-2 hover:opacity-60 transition-opacity"
                style={{ color: "#0A1628" }}>
                Upload your first reel →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #F4F6FB" }}>
                    {["Reel", "Views", "Likes", "Revenue", "Conv.", "Published"].map((h, i) => (
                      <th key={h}
                        className={`px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest ${i > 0 ? "hidden sm:table-cell" : ""}`}
                        style={{ color: "#9BA8C0" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedReels.map((reel, i) => (
                    <motion.tr key={reel._id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: 0.42 + i * 0.05 }}
                      className="group transition-colors"
                      style={{ borderBottom: i < sortedReels.length - 1 ? "1px solid #F7F8FC" : "none" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFBFF")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 rounded-xl overflow-hidden flex-shrink-0"
                            style={{ background: "#F4F6FB", border: "1px solid #E4E9F2" }}>
                            {reel.thumbnailUrl && (
                              <img src={reel.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate max-w-[160px]" style={{ color: "#0A1628" }}>
                              {reel.title || "Untitled Reel"}
                            </p>
                            {/* Bar showing relative rank */}
                            <div className="h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: "#E4E9F2", width: 80 }}>
                              <div className="h-full rounded-full" style={{
                                background: "#0A1628",
                                width: `${Math.min((reel[reelSort] / Math.max(...sortedReels.map(r => r[reelSort]), 1)) * 100, 100)}%`
                              }} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-sm font-semibold" style={{ color: "#0A1628" }}>{fmt(reel.views)}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-sm font-semibold" style={{ color: "#0A1628" }}>{fmt(reel.likes)}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="font-black text-sm"
                          style={{ fontFamily: "'Instrument Serif', serif", color: "#0A1628" }}>
                          ₹{reel.revenue.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <div className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold"
                          style={{
                            background: reel.convRate >= 3 ? "#F0FDF4" : "#F7F8FC",
                            color:      reel.convRate >= 3 ? "#059669"  : "#9BA8C0",
                            border:     `1px solid ${reel.convRate >= 3 ? "#BBF7D0" : "#E4E9F2"}`,
                          }}>
                          {reel.convRate}%
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-xs font-medium" style={{ color: "#9BA8C0" }}>
                          {new Date(reel.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* ══ ENGAGEMENT BREAKDOWN ════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { label: "Avg. views per reel", value: sortedReels.length > 0 ? fmt(Math.round(totalViews / sortedReels.length)) : "—", sub: "across all reels",       icon: Eye      },
            { label: "Avg. likes per reel", value: sortedReels.length > 0 ? fmt(Math.round(totalLikes / sortedReels.length)) : "—", sub: "across all reels",       icon: Heart    },
            { label: "Avg. revenue per order", value: totalOrd > 0 ? `₹${Math.round(totalRev / totalOrd).toLocaleString()}` : "—", sub: "order value",             icon: IndianRupee },
          ].map(({ label, value, sub, icon: Icon }, i) => (
            <div key={label} className="bg-white rounded-2xl p-5 flex items-center gap-4"
              style={{ border: "1px solid #E4E9F2" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#F4F6FB", border: "1px solid #E4E9F2" }}>
                <Icon className="w-4 h-4" style={{ color: "#0A1628" }} />
              </div>
              <div>
                <p className="font-black leading-none"
                  style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.3rem", color: "#0A1628" }}>
                  {value}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-widest mt-1" style={{ color: "#9BA8C0" }}>{label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#C4CDD8" }}>{sub}</p>
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </>
  );
}