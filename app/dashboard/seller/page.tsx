"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  IndianRupee, ShoppingBag, TrendingUp, PlayCircle,
  Plus, ArrowUpRight, ArrowDownRight, AlertTriangle,
  Loader2, CheckCircle2, Eye, Heart, MoreHorizontal,
  RefreshCw, Zap, Users, Clock, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────
interface Stats {
  revenue:     number;
  orders:      number;
  views:       number;
  conversion:  number;
  prevRevenue: number;
  prevOrders:  number;
  prevViews:   number;
}

interface RevenuePoint { date: string; revenue: number; orders: number; }
interface TopReel {
  _id: string;
  title:        string;
  thumbnailUrl: string;
  views:        number;
  likes:        number;
  revenue:      number;
  convRate:     number;
  createdAt:    string;
}

// ─── Helpers ──────────────────────────────────────────────────────
const pct = (curr: number, prev: number) => {
  if (!prev) return null;
  const d = ((curr - prev) / prev) * 100;
  return { value: Math.abs(d).toFixed(1), up: d >= 0 };
};
const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(1)}K`
  : n.toString();

// ─── Custom tooltip for charts ───────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2.5 rounded-xl text-xs"
      style={{
        background: "#0A1628",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 24px rgba(10,22,40,0.18)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <p className="font-bold text-white/50 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>
          {p.name === "revenue" ? `₹${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Animated counter ─────────────────────────────────────────────
function AnimatedNumber({ value, prefix = "", suffix = "" }: {
  value: number; prefix?: string; suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const start = ref.current;
    const end   = value;
    if (start === end) return;
    const diff  = end - start;
    const steps = 40;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplay(Math.round(start + (diff * (i / steps))));
      if (i >= steps) { clearInterval(timer); ref.current = end; }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

// ─────────────────────────────────────────────────────────────────
export default function SellerDashboardHome() {
  const { data: session } = useSession();

  const [stats, setStats]         = useState<Stats>({
    revenue: 0, orders: 0, views: 0, conversion: 0,
    prevRevenue: 0, prevOrders: 0, prevViews: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [topReels,    setTopReels]    = useState<TopReel[]>([]);
  const [checklist,   setChecklist]   = useState({
    verified: true, reel: false, firstSale: false, reviews: false,
  });
  const [loading,   setLoading]   = useState(true);
  const [chartView, setChartView] = useState<"revenue" | "orders">("revenue");
  const [range,     setRange]     = useState<"7d" | "30d" | "90d">("30d");
  const [refreshing, setRefreshing] = useState(false);

  // ── Data fetch — useCallback so range is never stale ───────────
// ── Drop-in replacement for the fetchAll function in SellerDashboardHome ──
  // Replace the entire fetchAll = useCallback(async (silent = false) => { ... }, [range])
  // block with this version.

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const analyticsRes  = await fetch(`/api/seller/analytics?range=${range}`);
      const analyticsData = await analyticsRes.json();

      console.log("[dashboard] analytics response:", {
        ok:           analyticsRes.ok,
        status:       analyticsRes.status,
        debug:        analyticsData._debug,
        totalRevenue: analyticsData.totalRevenue,
        totalOrders:  analyticsData.totalOrders,
        chartPoints:  analyticsData.revenueStats?.length,
        engagement:   analyticsData.engagement,
      });

      if (!analyticsRes.ok) {
        console.error("[dashboard] API error:", analyticsData.error);
        return;
      }

      // ── Chart time-series ────────────────────────────────────────
      const points: RevenuePoint[] = (analyticsData.revenueStats || []).map((p: any) => ({
        date:    String(p.date    ?? ""),
        revenue: Number(p.revenue ?? 0),
        orders:  Number(p.orders  ?? 0),
      }));

      // ── KPI values — read directly from API, not from chart sum ──
      // The API now returns totalRevenue / totalOrders as dedicated fields.
      // Computing them by summing revenueStats was wrong because:
      //   (a) revenueStats is scoped to the chart date range
      //   (b) COD orders with paymentStatus:"pending" were excluded by old PAID_FILTER
      const totalRev   = Number(analyticsData.totalRevenue ?? 0);
      const totalOrd   = Number(analyticsData.totalOrders  ?? 0);
      const totalViews = Number(analyticsData.engagement?.totalViews ?? 0);

      console.log("[dashboard] KPI values:", { totalRev, totalOrd, totalViews });

      setStats({
        revenue:     totalRev,
        orders:      totalOrd,
        views:       totalViews,
        conversion:  totalOrd > 0 && totalViews > 0
                       ? +((totalOrd / totalViews) * 100).toFixed(2)
                       : 0,
        prevRevenue: Number(analyticsData.prevRevenue ?? 0),
        prevOrders:  Number(analyticsData.prevOrders  ?? 0),
        prevViews:   Number(analyticsData.prevViews   ?? 0),
      });

      setRevenueData(points);

      const reels: TopReel[] = (analyticsData.topReels || []).map((r: any) => ({
        _id:          String(r._id),
        title:        String(r.title        ?? "Untitled"),
        thumbnailUrl: String(r.thumbnailUrl ?? ""),
        views:        Number(r.views        ?? 0),
        likes:        Number(r.likes        ?? 0),
        revenue:      Number(r.revenue      ?? 0),
        convRate:     Number(r.convRate     ?? 0),
        createdAt:    String(r.createdAt    ?? ""),
      }));
      setTopReels(reels);
      setChecklist(c => ({
        ...c,
        firstSale: totalOrd > 0,
        reel:      reels.length > 0,
      }));

    } catch (err) {
      console.error("[dashboard] fetch exception:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Pusher real-time ─────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id) return;
    const pc = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    // Fix 4: your checkout/verify route fires on `user-{id}`, not `seller-{id}`
    // Match the channel name your Pusher server actually triggers
    const ch = pc.subscribe(`user-${session.user.id}`);

    // Fix 4b: your checkout/verify fires "new-notification" with data.type === "PURCHASE"
    // "new-order" was never triggered — this is why real-time was completely silent
    ch.bind("new-notification", (data: any) => {
      if (data.type !== "PURCHASE") return; // only handle purchase events here
      setStats(p => ({
        ...p,
        revenue:    p.revenue + (data.amount || 0),
        orders:     p.orders + 1,
        conversion: p.views > 0 ? +((((p.orders + 1) / p.views) * 100).toFixed(2)) : 0,
      }));
      // Append to chart data for today
      setRevenueData(prev => {
        const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        const last  = prev[prev.length - 1];
        if (last?.date === today) {
          return [...prev.slice(0, -1), { ...last, revenue: last.revenue + (data.amount || 0), orders: last.orders + 1 }];
        }
        return [...prev, { date: today, revenue: data.amount || 0, orders: 1 }];
      });
      setChecklist(c => ({ ...c, firstSale: true }));
      toast.success("New sale! 🎉", {
        description: `₹${data.amount?.toLocaleString()} from ${data.buyerName || "a buyer"}`,
        duration: 5000,
      });
    });

    ch.bind("reel-view", () => {
      setStats(p => ({ ...p, views: p.views + 1 }));
    });

    return () => pc.unsubscribe(`user-${session.user.id}`);
  }, [session?.user?.id]);

  // ── KPI card data ────────────────────────────────────────────────
  const revTrend  = pct(stats.revenue, stats.prevRevenue);
  const ordTrend  = pct(stats.orders,  stats.prevOrders);
  const viewTrend = pct(stats.views,   stats.prevViews);

  const KPI_CARDS = [
    {
      label:   "Total Revenue",
      value:   stats.revenue,
      prefix:  "₹",
      icon:    IndianRupee,
      trend:   revTrend,
      sub:     `vs last period`,
      href:    "/dashboard/seller/analytics",
    },
    {
      label:   "Orders",
      value:   stats.orders,
      prefix:  "",
      icon:    ShoppingBag,
      trend:   ordTrend,
      sub:     "completed",
      href:    "/dashboard/seller/orders",
    },
    {
      label:   "Reel Views",
      value:   stats.views,
      prefix:  "",
      icon:    Eye,
      trend:   viewTrend,
      sub:     "total impressions",
      href:    "/dashboard/seller/analytics",
    },
    {
      label:   "Conversion",
      value:   stats.conversion,
      prefix:  "",
      suffix:  "%",
      icon:    TrendingUp,
      trend:   null,
      sub:     "views → orders",
      href:    "/dashboard/seller/analytics",
    },
  ];

  const CHECKLIST = [
    { key: "verified", task: "Identity verified",   done: checklist.verified },
    { key: "reel",     task: "Upload first reel",    done: checklist.reel     },
    { key: "firstSale",task: "Make your first sale", done: checklist.firstSale},
    { key: "reviews",  task: "Get 5 reviews",        done: checklist.reviews  },
  ];
  const checklistDone = CHECKLIST.filter(c => c.done).length;

  // ── Loading skeleton ──────────────────────────────────────────────
  if (loading) return (
    <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-2 border-[#0A1628] border-t-transparent rounded-full animate-spin" />
      <p
        className="text-[11px] font-bold uppercase tracking-widest"
        style={{ color: "#9BA8C0", fontFamily: "'DM Sans', sans-serif" }}
      >
        Loading your studio…
      </p>
    </div>
  );

  return (
    <div
      className="space-y-7"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`}</style>

      {/* ══ HEADER ════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="leading-tight tracking-tight"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(1.6rem, 2.5vw, 2.1rem)",
              color: "#0A1628",
              letterSpacing: "-0.02em",
            }}
          >
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
            <em className="italic font-light" style={{ opacity: 0.45 }}>
              {session?.user?.name?.split(" ")[0]}
            </em>
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#9BA8C0" }}>
            Here's how your store is performing today
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Range selector */}
          <div
            className="flex items-center p-1 rounded-xl gap-0.5"
            style={{ border: "1px solid #E4E9F2", background: "#F7F8FC" }}
          >
            {(["7d", "30d", "90d"] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150"
                style={{
                  background: range === r ? "white" : "transparent",
                  color:      range === r ? "#0A1628" : "#9BA8C0",
                  boxShadow:  range === r ? "0 1px 4px rgba(10,22,40,0.08)" : "none",
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchAll(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-[#F4F6FB]"
            style={{ border: "1px solid #E4E9F2" }}
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              style={{ color: "#6B7A99" }}
            />
          </button>

          {/* Upload reel CTA */}
          <Link
            href="/dashboard/seller/reels"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "#0A1628", boxShadow: "0 4px 16px rgba(10,22,40,0.14)" }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">New Reel</span>
          </Link>
        </div>
      </div>

      {/* ══ KPI CARDS ═════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map(({ label, value, prefix, suffix, icon: Icon, trend, sub, href }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href={href}
              className="block group rounded-2xl p-5 bg-white transition-all duration-200 hover:shadow-md"
              style={{ border: "1px solid #E4E9F2" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#F4F6FB", border: "1px solid #E4E9F2" }}
                >
                  <Icon className="w-4 h-4" style={{ color: "#0A1628" }} />
                </div>

                {/* Trend badge */}
                {trend && (
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                    style={{
                      background: trend.up ? "#F0FDF4" : "#FFF1F2",
                      color:      trend.up ? "#059669" : "#F87171",
                      border:     `1px solid ${trend.up ? "#BBF7D0" : "#FECDD3"}`,
                    }}
                  >
                    {trend.up
                      ? <ArrowUpRight   className="w-3 h-3" />
                      : <ArrowDownRight className="w-3 h-3" />
                    }
                    {trend.value}%
                  </div>
                )}
              </div>

              <p
                className="font-black leading-none mb-1.5"
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "clamp(1.5rem, 2.5vw, 1.9rem)",
                  color: "#0A1628",
                }}
              >
                <AnimatedNumber value={value} prefix={prefix} suffix={suffix ?? ""} />
              </p>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#9BA8C0" }}>
                {label}
              </p>
              <p className="text-[10px] mt-1 font-medium" style={{ color: "#C4CDD8" }}>{sub}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ══ CHART + RIGHT COLUMN ══════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

        {/* ── Revenue / Orders Chart ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white rounded-2xl p-6"
          style={{ border: "1px solid #E4E9F2" }}
        >
          {/* Chart header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold" style={{ color: "#0A1628" }}>
                {chartView === "revenue" ? "Revenue" : "Orders"} over time
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: "#9BA8C0" }}>
                {range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : "Last 90 days"}
              </p>
            </div>
            <div
              className="flex items-center p-1 rounded-xl gap-0.5"
              style={{ border: "1px solid #E4E9F2", background: "#F7F8FC" }}
            >
              <button
                onClick={() => setChartView("revenue")}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: chartView === "revenue" ? "white" : "transparent",
                  color:      chartView === "revenue" ? "#0A1628" : "#9BA8C0",
                  boxShadow:  chartView === "revenue" ? "0 1px 4px rgba(10,22,40,0.08)" : "none",
                }}
              >
                Revenue
              </button>
              <button
                onClick={() => setChartView("orders")}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: chartView === "orders" ? "white" : "transparent",
                  color:      chartView === "orders" ? "#0A1628" : "#9BA8C0",
                  boxShadow:  chartView === "orders" ? "0 1px 4px rgba(10,22,40,0.08)" : "none",
                }}
              >
                Orders
              </button>
            </div>
          </div>

          {/* Chart body */}
          {revenueData.length === 0 ? (
            <div className="h-[260px] flex flex-col items-center justify-center gap-3 rounded-xl"
              style={{ background: "#F7F8FC", border: "1px dashed #E4E9F2" }}>
              <TrendingUp className="w-8 h-8" style={{ color: "#E4E9F2" }} />
              <p className="text-xs font-semibold" style={{ color: "#C4CDD8" }}>
                No data for this period yet
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#0A1628" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#0A1628" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#0A1628" stopOpacity={0.10} />
                    <stop offset="100%" stopColor="#0A1628" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F6FB" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#9BA8C0", fontFamily: "'DM Sans', sans-serif" }}
                  axisLine={false} tickLine={false}
                  interval={range === "7d" ? 0 : Math.floor(revenueData.length / 6)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9BA8C0", fontFamily: "'DM Sans', sans-serif" }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => chartView === "revenue" ? `₹${fmt(v)}` : fmt(v)}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey={chartView}
                  stroke="#0A1628" strokeWidth={2}
                  fill={`url(#${chartView === "revenue" ? "revenueGrad" : "ordersGrad"})`}
                  dot={false}
                  activeDot={{ r: 5, fill: "#0A1628", stroke: "white", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* ── Right column ─────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Seller Checklist */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl p-5"
            style={{ border: "1px solid #E4E9F2" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0A1628" }}>
                Seller checklist
              </h3>
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-lg"
                style={{ background: "#F4F6FB", color: "#9BA8C0" }}
              >
                {checklistDone}/{CHECKLIST.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: "#E4E9F2" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(checklistDone / CHECKLIST.length) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: "#0A1628" }}
              />
            </div>

            <ul className="space-y-3">
              {CHECKLIST.map((item, i) => (
                <motion.li
                  key={item.key}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.07 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: item.done ? "#0A1628" : "#F4F6FB",
                      border:     item.done ? "none"    : "1px solid #E4E9F2",
                    }}
                  >
                    {item.done
                      ? <CheckCircle2 className="w-3 h-3 text-white" />
                      : <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#C4CDD8" }} />
                    }
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{
                      color:           item.done ? "#C4CDD8" : "#0A1628",
                      textDecoration:  item.done ? "line-through" : "none",
                    }}
                  >
                    {item.task}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Payout notice */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
            className="rounded-2xl p-4"
            style={{ background: "#F7F8FC", border: "1px solid #E4E9F2" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "white", border: "1px solid #E4E9F2" }}
              >
                <Zap className="w-3.5 h-3.5" style={{ color: "#0A1628" }} />
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: "#0A1628" }}>Payout scheduled</p>
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#9BA8C0" }}>
                  Payouts are processed every{" "}
                  <span className="font-bold" style={{ color: "#0A1628" }}>Friday</span>.
                  Ensure your bank details are set in{" "}
                  <Link href="/dashboard/seller/settings" className="underline underline-offset-2 font-semibold hover:opacity-70" style={{ color: "#0A1628" }}>
                    settings
                  </Link>.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid #E4E9F2" }}
          >
            {[
              { label: "View all orders",   href: "/dashboard/seller/orders",   icon: ShoppingBag },
              { label: "Analytics deep-dive", href: "/dashboard/seller/analytics", icon: TrendingUp },
              { label: "Upload new reel",   href: "/dashboard/seller/reels",    icon: PlayCircle  },
            ].map(({ label, href, icon: Icon }, i, arr) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors group"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid #F4F6FB" : "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#F7F8FC")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "#9BA8C0" }} />
                <span className="text-sm font-medium flex-1" style={{ color: "#0A1628" }}>{label}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#9BA8C0" }} />
              </Link>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ══ TOP REELS TABLE ════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: "1px solid #E4E9F2" }}
      >
        {/* Table header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #E4E9F2" }}
        >
          <div>
            <h2 className="text-sm font-bold" style={{ color: "#0A1628" }}>Top performing reels</h2>
            <p className="text-[11px] mt-0.5" style={{ color: "#9BA8C0" }}>Sorted by views · {range}</p>
          </div>
          <Link
            href="/dashboard/seller/reels"
            className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-60"
            style={{ color: "#0A1628" }}
          >
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {topReels.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <PlayCircle className="w-10 h-10" style={{ color: "#E4E9F2" }} />
            <p className="text-sm font-semibold" style={{ color: "#C4CDD8" }}>No reels uploaded yet</p>
            <Link
              href="/dashboard/seller/reels"
              className="text-xs font-bold underline underline-offset-2 transition-opacity hover:opacity-60"
              style={{ color: "#0A1628" }}
            >
              Upload your first reel →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #F4F6FB" }}>
                  {["Reel", "Views", "Likes", "Revenue", "Conv. Rate", "Published"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest ${i === 0 ? "" : "hidden sm:table-cell"}`}
                      style={{ color: "#9BA8C0" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topReels.map((reel, i) => (
                  <motion.tr
                    key={reel._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 + i * 0.06 }}
                    className="group transition-colors"
                    style={{ borderBottom: i < topReels.length - 1 ? "1px solid #F7F8FC" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FAFBFF")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Reel thumbnail + title */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-14 rounded-xl overflow-hidden flex-shrink-0"
                          style={{ background: "#F4F6FB", border: "1px solid #E4E9F2" }}
                        >
                          {reel.thumbnailUrl && (
                            <img src={reel.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <p className="text-sm font-semibold max-w-[180px] truncate" style={{ color: "#0A1628" }}>
                          {reel.title || "Untitled Reel"}
                        </p>
                      </div>
                    </td>

                    {/* Views */}
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9BA8C0" }} />
                        <span className="text-sm font-semibold" style={{ color: "#0A1628" }}>
                          {fmt(reel.views)}
                        </span>
                      </div>
                    </td>

                    {/* Likes */}
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9BA8C0" }} />
                        <span className="text-sm font-semibold" style={{ color: "#0A1628" }}>
                          {fmt(reel.likes)}
                        </span>
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span
                        className="font-black text-sm"
                        style={{ fontFamily: "'Instrument Serif', serif", color: "#0A1628" }}
                      >
                        ₹{reel.revenue.toLocaleString()}
                      </span>
                    </td>

                    {/* Conversion */}
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <div
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                        style={{
                          background: reel.convRate >= 3 ? "#F0FDF4" : "#F7F8FC",
                          color:      reel.convRate >= 3 ? "#059669"  : "#9BA8C0",
                          border:     `1px solid ${reel.convRate >= 3 ? "#BBF7D0" : "#E4E9F2"}`,
                        }}
                      >
                        {reel.convRate}%
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="text-xs font-medium" style={{ color: "#9BA8C0" }}>
                        {new Date(reel.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "2-digit",
                        })}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

    </div>
  );
}