"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Pusher from "pusher-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Video, Package, ShoppingBag,
  BarChart3, Settings, LogOut, Bell, Menu, X,
  TrendingUp, Zap, ChevronRight, Store,
  ArrowUpRight, Circle,
} from "lucide-react";

// ─── Nav items ────────────────────────────────────────────────────
const MENU = [
  { name: "Overview",      icon: LayoutDashboard, href: "/dashboard/seller",            badge: null },
  { name: "Reels Studio",  icon: Video,           href: "/dashboard/seller/reels",       badge: "new" },
  { name: "Products",      icon: Package,         href: "/dashboard/seller/products",    badge: null },
  { name: "Orders",        icon: ShoppingBag,     href: "/dashboard/seller/orders",      badge: "orders" },
  { name: "Analytics",     icon: BarChart3,       href: "/dashboard/seller/analytics",   badge: null },
  { name: "Settings",      icon: Settings,        href: "/dashboard/seller/settings",    badge: null },
];

const SECTION_LABELS: Record<string, string> = {
  "/dashboard/seller":            "Overview",
  "/dashboard/seller/reels":      "Reels Studio",
  "/dashboard/seller/products":   "Products",
  "/dashboard/seller/orders":     "Orders",
  "/dashboard/seller/analytics":  "Analytics",
  "/dashboard/seller/settings":   "Settings",
};

// ─── Store health mock (replace with real API call) ───────────────
interface StoreHealth {
  score: number;           // 0–100
  label: string;
  color: string;
}
function getHealth(score: number): StoreHealth {
  if (score >= 80) return { score, label: "Excellent",  color: "#34D399" };
  if (score >= 60) return { score, label: "Good",       color: "#FBBF24" };
  if (score >= 40) return { score, label: "Fair",       color: "#FB923C" };
  return                   { score, label: "Needs work", color: "#F87171" };
}

export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname        = usePathname();
  const { data: session } = useSession();
  const router          = useRouter();

  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [storeHealth,   setStoreHealth]   = useState<StoreHealth>(getHealth(82));
  const [liveViewers,   setLiveViewers]   = useState(0);
  const notifRef        = useRef<HTMLDivElement>(null);

  const pageTitle = SECTION_LABELS[pathname] ?? "Dashboard";

  // ── Fetch notifications ──────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    const fetchNotifs = async () => {
      try {
        const r = await fetch("/api/notifications?role=seller");
        const d = await r.json();
        setNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      } catch {}
    };
    fetchNotifs();
    const t = setInterval(fetchNotifs, 45_000);
    return () => clearInterval(t);
  }, [session]);

  // ── Fetch pending orders count ───────────────────────────────────
  useEffect(() => {
    if (!session) return;
    const fetchOrders = async () => {
      try {
        const r = await fetch("/api/seller/orders?status=pending&count=true");
        const d = await r.json();
        setPendingOrders(d.count || 0);
      } catch {}
    };
    fetchOrders();
    const t = setInterval(fetchOrders, 60_000);
    return () => clearInterval(t);
  }, [session]);

  // ── Pusher real-time ─────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id) return;
    const pc = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    // Seller channel — orders, notifications
    const sellerCh = pc.subscribe(`seller-${session.user.id}`);
    sellerCh.bind("new-order", (data: any) => {
      setPendingOrders(p => p + 1);
      setUnreadCount(p => p + 1);
      setNotifications(p => [{
        type: "ORDER",
        title: "New order received",
        message: `₹${data.amount} from ${data.buyerName || "a buyer"}`,
        createdAt: new Date().toISOString(),
      }, ...p]);
    });
    sellerCh.bind("new-notification", (data: any) => {
      setUnreadCount(p => p + 1);
      setNotifications(p => [data, ...p]);
    });

    // Live viewers on reels
    const reelsCh = pc.subscribe(`store-${session.user.id}-live`);
    reelsCh.bind("viewer-count", (data: any) => {
      setLiveViewers(data.count || 0);
    });

    return () => {
      pc.unsubscribe(`seller-${session.user.id}`);
      pc.unsubscribe(`store-${session.user.id}-live`);
    };
  }, [session?.user?.id]);

  // ── Close notif panel on outside click ──────────────────────────
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Lock body scroll when mobile drawer open ─────────────────────
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const markRead = async () => {
    setNotifOpen(v => !v);
    if (unreadCount > 0) {
      setUnreadCount(0);
      try { await fetch("/api/notifications", { method: "PATCH" }); } catch {}
    }
  };

  const health = storeHealth;

  // ── Sidebar inner content ─────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / store identity */}
      <div className="px-5 py-5 flex-shrink-0" style={{ borderBottom: "1px solid #E4E9F2" }}>
        <Link href="/" className="flex items-center gap-2.5 group mb-4">
          <div
            className="w-8 h-8 rounded-[8px] flex items-center justify-center"
            style={{ background: "#0A1628" }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span
            className="font-bold leading-none tracking-tight"
            style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.15rem", color: "#0A1628" }}
          >
            Re<em className="italic font-light">commerce</em>
          </span>
        </Link>

        {/* Store identity row */}
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: "#F4F6FB", border: "1px solid #E4E9F2" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "#0A1628" }}
          >
            <Store className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-xs font-bold truncate"
              style={{ color: "#0A1628", fontFamily: "'DM Sans', sans-serif" }}
            >
              {session?.user?.name?.split(" ")[0]}'s Store
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: health.color }} />
              <span
                className="text-[10px] font-semibold"
                style={{ color: health.color, fontFamily: "'DM Sans', sans-serif" }}
              >
                {health.label}
              </span>
            </div>
          </div>
          <span
            className="text-xs font-black flex-shrink-0"
            style={{ fontFamily: "'Instrument Serif', serif", color: "#0A1628" }}
          >
            {health.score}
          </span>
        </div>

        {/* Store health bar */}
        <div className="mt-2 px-1">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "#E4E9F2" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${health.score}%` }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: health.color }}
            />
          </div>
        </div>
      </div>

      {/* Live viewers pill */}
      {liveViewers > 0 && (
        <div className="px-5 pt-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span
              className="text-[11px] font-bold text-emerald-700"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {liveViewers} watching your reels now
            </span>
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p
          className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "#C4CDD8", fontFamily: "'DM Sans', sans-serif" }}
        >
          Studio
        </p>
        {MENU.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard/seller" && pathname.startsWith(item.href));
          const badgeCount = item.badge === "orders" ? pendingOrders : 0;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative"
              style={{
                background:  isActive ? "#0A1628" : "transparent",
                color:       isActive ? "white"   : "#6B7A99",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.875rem",
                fontWeight: isActive ? 700 : 500,
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = "#F4F6FB";
                if (!isActive) e.currentTarget.style.color = "#0A1628";
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = "transparent";
                if (!isActive) e.currentTarget.style.color = "#6B7A99";
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "#0A1628", zIndex: -1 }}
                  transition={{ type: "spring" as const, stiffness: 380, damping: 36 }}
                />
              )}

              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.name}</span>

              {/* Badge: pending orders count */}
              {badgeCount > 0 && (
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: isActive ? "rgba(255,255,255,0.18)" : "#0A1628",
                    color: "white",
                    minWidth: 18,
                    textAlign: "center",
                  }}
                >
                  {badgeCount}
                </span>
              )}

              {/* Badge: "new" label */}
              {item.badge === "new" && (
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0 uppercase tracking-wide"
                  style={{
                    background: isActive ? "rgba(255,255,255,0.18)" : "#F4F6FB",
                    color:      isActive ? "white" : "#9BA8C0",
                    border:     isActive ? "none"  : "1px solid #E4E9F2",
                  }}
                >
                  New
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: quick links + sign out */}
      <div className="px-3 pb-5 flex-shrink-0 space-y-1" style={{ borderTop: "1px solid #E4E9F2", paddingTop: 12 }}>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ color: "#9BA8C0", fontFamily: "'DM Sans', sans-serif" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#F4F6FB"; e.currentTarget.style.color = "#0A1628"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9BA8C0"; }}
        >
          <ArrowUpRight className="w-4 h-4" />
          View your store
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left"
          style={{ color: "#9BA8C0", fontFamily: "'DM Sans', sans-serif" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#FFF1F2"; e.currentTarget.style.color = "#F87171"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9BA8C0"; }}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
      `}</style>

      <div
        className="flex min-h-screen"
        style={{ background: "#F7F8FC", fontFamily: "'DM Sans', sans-serif" }}
      >

        {/* ══ DESKTOP SIDEBAR ══════════════════════════════════════ */}
        <aside
          className="fixed left-0 top-0 h-screen w-[220px] hidden md:flex flex-col bg-white z-40"
          style={{ borderRight: "1px solid #E4E9F2" }}
        >
          <SidebarContent />
        </aside>

        {/* ══ MOBILE DRAWER ════════════════════════════════════════ */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.32 }}
                className="fixed top-0 left-0 bottom-0 w-[260px] bg-white z-50 md:hidden"
                style={{ borderRight: "1px solid #E4E9F2" }}
              >
                {/* Close button */}
                <button
                  onClick={() => setMobileOpen(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "#F4F6FB", border: "1px solid #E4E9F2" }}
                >
                  <X className="w-4 h-4" style={{ color: "#6B7A99" }} />
                </button>
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ══ MAIN AREA ════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col md:ml-[220px] min-w-0">

          {/* ── TOP HEADER ─────────────────────────────────────── */}
          <header
            className="sticky top-0 z-30 flex items-center justify-between px-5 sm:px-7 h-[60px] bg-white flex-shrink-0"
            style={{ borderBottom: "1px solid #E4E9F2" }}
          >
            {/* Left: hamburger (mobile) + page title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[#F4F6FB]"
                style={{ border: "1px solid #E4E9F2" }}
              >
                <Menu className="w-4 h-4" style={{ color: "#0A1628" }} />
              </button>

              {/* Breadcrumb */}
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{ color: "#9BA8C0" }}
                >
                  Seller Studio
                </span>
                <ChevronRight className="w-3.5 h-3.5 hidden sm:block" style={{ color: "#C4CDD8" }} />
                <span
                  className="text-sm font-bold"
                  style={{ color: "#0A1628" }}
                >
                  {pageTitle}
                </span>
              </div>
            </div>

            {/* Right: live indicator + notifications + avatar */}
            <div className="flex items-center gap-2">

              {/* Live viewers dot — only shown if > 0 */}
              <AnimatePresence>
                {liveViewers > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold text-emerald-700">
                      {liveViewers} live
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={markRead}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[#F4F6FB] relative"
                  style={{ border: "1px solid #E4E9F2" }}
                >
                  <Bell className="w-4 h-4" style={{ color: "#6B7A99" }} />
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 w-[17px] h-[17px] text-white text-[9px] font-black flex items-center justify-center rounded-full"
                        style={{ background: "#0A1628", boxShadow: "0 0 0 2px white" }}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                {/* Notifications panel */}
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.2 }}
                      className="absolute top-[calc(100%+10px)] right-0 bg-white rounded-2xl overflow-hidden z-50"
                      style={{
                        width: 320,
                        maxWidth: "calc(100vw - 1.5rem)",
                        border: "1px solid #E4E9F2",
                        boxShadow: "0 8px 40px rgba(10,22,40,0.10)",
                      }}
                    >
                      <div
                        className="px-4 py-3 flex items-center justify-between"
                        style={{ borderBottom: "1px solid #E4E9F2" }}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#9BA8C0" }}>
                          Notifications
                        </span>
                        {unreadCount === 0 && (
                          <span className="text-[10px] font-semibold" style={{ color: "#0A1628" }}>
                            All caught up ✓
                          </span>
                        )}
                      </div>
                      <div className="max-h-[min(360px,65vh)] overflow-y-auto p-2">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center text-[11px] font-medium" style={{ color: "#C4CDD8" }}>
                            No notifications yet
                          </div>
                        ) : notifications.map((n, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#F4F6FB")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{
                                background: n.type === "ORDER" ? "#F0FDF4" : "#F4F6FB",
                                border: "1px solid #E4E9F2",
                              }}
                            >
                              {n.type === "ORDER"
                                ? <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                                : <Zap className="w-3.5 h-3.5" style={{ color: "#0A1628" }} />
                              }
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate" style={{ color: "#0A1628" }}>
                                {n.title}
                              </p>
                              <p className="text-[11px] mt-0.5 line-clamp-2 leading-relaxed" style={{ color: "#9BA8C0" }}>
                                {n.message}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black uppercase flex-shrink-0 cursor-pointer select-none"
                style={{ background: "#0A1628" }}
                title={session?.user?.name || ""}
              >
                {session?.user?.name?.[0] ?? "S"}
              </div>
            </div>
          </header>

          {/* ── PAGE CONTENT ───────────────────────────────────── */}
          <main className="flex-1 px-5 sm:px-7 py-7 min-w-0">
            {children}
          </main>

          {/* ── FOOTER ─────────────────────────────────────────── */}
          <footer
            className="px-7 py-4 flex items-center justify-between flex-shrink-0"
            style={{ borderTop: "1px solid #E4E9F2" }}
          >
            <p className="text-[11px] font-medium" style={{ color: "#C4CDD8" }}>
              Recommerce Seller Studio · {new Date().getFullYear()}
            </p>
            <div className="flex items-center gap-1.5">
              <Circle className="w-1.5 h-1.5 fill-emerald-400 text-emerald-400" />
              <span className="text-[11px] font-medium" style={{ color: "#C4CDD8" }}>
                All systems operational
              </span>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}