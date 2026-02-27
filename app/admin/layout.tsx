"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  BarChart3, ShieldCheck, Users, Video, Store,
  LogOut, ChevronRight, Bell, Menu, X, Zap,
  Circle, ChevronLeft, Settings, Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Design tokens ───────────────────────────────────────────────
const N  = "#0A1628";
const N2 = "#111E35";
const M  = "#9BA8C0";

// ─── Nav items ───────────────────────────────────────────────────
const ADMIN_MENU = [
  { name: "Overview",           icon: BarChart3,   href: "/admin/dashboard", description: "Platform analytics"   },
  { name: "Sellers Queue",      icon: Store,       href: "/admin/sellers",   description: "Pending approvals"    },
  { name: "Content Moderation", icon: Video,       href: "/admin/content",   description: "Review flagged reels" },
  { name: "User Directory",     icon: Users,       href: "/admin/users",     description: "Manage all accounts"  },
];

// ─── Live clock ──────────────────────────────────────────────────
function LiveClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "rgba(255,255,255,0.28)", letterSpacing: "0.1em" }}>{t}</span>;
}

// ─── Sidebar nav item ────────────────────────────────────────────
function NavItem({ item, active, collapsed, badge }: {
  item: typeof ADMIN_MENU[0]; active: boolean;
  collapsed: boolean; badge?: number;
}) {
  return (
    <Link href={item.href}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "11px 14px" : "11px 14px", borderRadius: 12, position: "relative", textDecoration: "none", transition: "background .18s, box-shadow .18s", justifyContent: collapsed ? "center" : undefined,
        background: active ? "rgba(255,255,255,0.08)" : "transparent",
        boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.09)" : "none",
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
      {/* Active indicator bar */}
      {active && (
        <motion.div layoutId="activeBar"
          style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, borderRadius: 99, background: "white" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }} />
      )}

      <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)", border: active ? "1px solid rgba(255,255,255,0.14)" : "1px solid transparent", transition: "all .18s" }}>
        <item.icon size={15} color={active ? "white" : "rgba(255,255,255,0.35)"} />
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }}
            style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: active ? "white" : "rgba(255,255,255,0.42)", margin: 0, lineHeight: 1.2, fontFamily: "DM Sans, sans-serif" }}>{item.name}</p>
            <p style={{ fontSize: 9, color: active ? "rgba(255,255,255,0.36)" : "rgba(255,255,255,0.2)", margin: 0, fontWeight: 600, fontFamily: "DM Sans, sans-serif" }}>{item.description}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {badge && badge > 0 && !collapsed && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}
          style={{ minWidth: 18, height: 18, borderRadius: 99, background: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: "white" }}>{badge > 99 ? "99+" : badge}</span>
        </motion.div>
      )}

      {badge && badge > 0 && collapsed && (
        <div style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: "#EF4444", border: "1.5px solid " + N }} />
      )}
    </Link>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle, pendingSellers, session: adminSession }: {
  collapsed: boolean; onToggle: () => void;
  pendingSellers: number; session: any;
}) {
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 256 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: N, height: "100vh", position: "sticky", top: 0, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, zIndex: 30, boxShadow: "4px 0 24px rgba(10,22,40,0.15)" }}>

      {/* Dot grid texture */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px", pointerEvents: "none" }} />
      {/* Glow blob */}
      <div style={{ position: "absolute", bottom: -60, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Logo row */}
      <div style={{ padding: collapsed ? "22px 17px" : "22px 18px", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative", zIndex: 1 }}>
        {!collapsed && (
          <Link href="/admin/dashboard" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.13)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={15} color="white" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 900, color: "white", margin: 0, letterSpacing: "-0.02em", fontFamily: "DM Sans, sans-serif" }}>Recommerce</p>
              <p style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.22)", margin: 0, textTransform: "uppercase", letterSpacing: "0.15em" }}>Admin Console</p>
            </div>
          </Link>
        )}
        {collapsed && (
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.13)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={15} color="white" />
          </div>
        )}

        {/* Collapse toggle */}
        <button onClick={onToggle}
          style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "background .15s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.11)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
          {collapsed ? <ChevronRight size={11} color="rgba(255,255,255,0.45)" /> : <ChevronLeft size={11} color="rgba(255,255,255,0.45)" />}
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 3, position: "relative", zIndex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {!collapsed && (
          <p style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.18)", textTransform: "uppercase", letterSpacing: "0.16em", padding: "4px 6px 10px", fontFamily: "DM Sans, sans-serif" }}>Navigation</p>
        )}
        {ADMIN_MENU.map(item => (
          <NavItem key={item.href} item={item} active={pathname === item.href} collapsed={collapsed}
            badge={item.href === "/admin/sellers" ? pendingSellers : undefined} />
        ))}
      </nav>

      {/* Bottom: system status + user + logout */}
      <div style={{ padding: "10px", borderTop: "1px solid rgba(255,255,255,0.06)", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        {/* System status */}
        {!collapsed && (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ADE80" }} />
              <div style={{ position: "absolute", inset: -2, borderRadius: "50%", background: "rgba(74,222,128,0.3)", animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: 0, fontFamily: "DM Sans, sans-serif" }}>All systems live</p>
              <LiveClock />
            </div>
            <Activity size={11} color="rgba(255,255,255,0.2)" />
          </div>
        )}

        {/* Admin user tile */}
        {!collapsed && adminSession?.user && (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.13)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "white" }}>
                {(adminSession.user.name || adminSession.user.email || "A")[0].toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "DM Sans, sans-serif" }}>
                {adminSession.user.name || "Admin"}
              </p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Super Admin</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button onClick={() => signOut({ callbackUrl: "/" })}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "11px 14px" : "11px 14px", borderRadius: 10, background: "transparent", border: "1px solid transparent", cursor: "pointer", width: "100%", transition: "background .15s, border-color .15s", justifyContent: collapsed ? "center" : undefined, fontFamily: "DM Sans, sans-serif" }}
          onMouseEnter={e => { (e.currentTarget.style.background = "rgba(239,68,68,0.08)"); (e.currentTarget.style.borderColor = "rgba(239,68,68,0.18)"); }}
          onMouseLeave={e => { (e.currentTarget.style.background = "transparent"); (e.currentTarget.style.borderColor = "transparent"); }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.12)", flexShrink: 0 }}>
            <LogOut size={14} color="#F87171" />
          </div>
          {!collapsed && <span style={{ fontSize: 13, fontWeight: 700, color: "#F87171" }}>Exit Console</span>}
        </button>
      </div>
    </motion.aside>
  );
}

// ─── Page title map ───────────────────────────────────────────────
const PAGE_META: Record<string, { title: string; desc: string }> = {
  dashboard:  { title: "Overview",           desc: "Platform-wide analytics & health" },
  sellers:    { title: "Sellers Queue",      desc: "Review and approve pending sellers" },
  content:    { title: "Content Moderation", desc: "Flag, review and remove reels" },
  users:      { title: "User Directory",     desc: "Browse and manage all accounts" },
};

// ═══════════════════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════════════════
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname           = usePathname();
  const { data: session }  = useSession();
  const [collapsed,        setCollapsed]        = useState(false);
  const [mobileSidebarOpen,setMobileSidebarOpen] = useState(false);
  const [pendingSellers,   setPendingSellers]    = useState(0);
  const [notifications,    setNotifications]    = useState<any[]>([]);
  const [notifOpen,        setNotifOpen]        = useState(false);

  const segment = pathname.split("/").pop() || "dashboard";
  const meta    = PAGE_META[segment] || { title: segment, desc: "" };

  // Fetch pending seller count for badge
  useEffect(() => {
    fetch("/api/admin/sellers?status=pending&count=true")
      .then(r => r.json())
      .then(d => setPendingSellers(d.count || 0))
      .catch(() => {});
  }, [pathname]);

  // Fetch recent notifications
  useEffect(() => {
    fetch("/api/admin/notifications")
      .then(r => r.json())
      .then(d => setNotifications(d.notifications || []))
      .catch(() => {});
  }, []);

  const unreadNotifs = notifications.filter(n => !n.read).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&display=swap');
        @keyframes ping { 75%,100% { transform: scale(2); opacity: 0; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; margin: 0; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#F7F8FC" }}>

        {/* ── Desktop sidebar ───────────────────────────────────── */}
        <div style={{ display: "none" }} className="admin-sidebar-desktop">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)}
            pendingSellers={pendingSellers} session={session} />
        </div>
        <div style={{ display: "flex", flexShrink: 0 }}>
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)}
            pendingSellers={pendingSellers} session={session} />
        </div>

        {/* ── Mobile sidebar overlay ────────────────────────────── */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
                style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.6)", zIndex: 50, backdropFilter: "blur(4px)" }} />
              <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 51 }}>
                <Sidebar collapsed={false} onToggle={() => setMobileSidebarOpen(false)}
                  pendingSellers={pendingSellers} session={session} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Main area ─────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Top header */}
          <header style={{ height: 60, background: "rgba(247,248,252,0.95)", backdropFilter: "blur(14px)", borderBottom: "1px solid #E4E9F2", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", position: "sticky", top: 0, zIndex: 40, flexShrink: 0 }}>
            {/* Left: mobile menu + breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button onClick={() => setMobileSidebarOpen(true)}
                style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #E4E9F2", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Menu size={15} color="#6B7A99" />
              </button>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: M }}>Admin</span>
                  <span style={{ fontSize: 9, color: "#C4CDD8" }}>/</span>
                  <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "#0A1628" }}>{segment}</span>
                </div>
                <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: 18, color: "#0A1628", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{meta.title}</h1>
              </div>
            </div>

            {/* Right: notif bell + admin chip */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Notification bell */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setNotifOpen(v => !v)}
                  style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #E4E9F2", background: notifOpen ? "#0A1628" : "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s", position: "relative" }}>
                  <Bell size={14} color={notifOpen ? "white" : "#6B7A99"} />
                  {unreadNotifs > 0 && (
                    <div style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: "#EF4444", border: "1.5px solid white" }} />
                  )}
                </button>

                {/* Notification dropdown */}
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18 }}
                      style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 300, background: "white", border: "1px solid #E4E9F2", borderRadius: 16, boxShadow: "0 16px 48px rgba(10,22,40,0.14)", overflow: "hidden", zIndex: 60 }}>
                      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #E4E9F2", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#0A1628" }}>Notifications</span>
                        {unreadNotifs > 0 && <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 6, background: "#FFF1F2", border: "1px solid #FECDD3", color: "#DC2626" }}>{unreadNotifs} unread</span>}
                      </div>
                      <div style={{ maxHeight: 280, overflowY: "auto" }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: "24px 16px", textAlign: "center" }}>
                            <Bell size={20} color="#C4CDD8" style={{ margin: "0 auto 8px" }} />
                            <p style={{ fontSize: 12, color: M, margin: 0 }}>No notifications</p>
                          </div>
                        ) : notifications.slice(0, 8).map((n, i) => (
                          <div key={i} style={{ padding: "12px 16px", display: "flex", gap: 10, borderBottom: "1px solid #F7F8FC", background: n.read ? "transparent" : "#FAFBFF" }}>
                            {!n.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6", flexShrink: 0, marginTop: 5 }} />}
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 12, fontWeight: 600, color: "#0A1628", margin: "0 0 2px" }}>{n.title}</p>
                              <p style={{ fontSize: 10, color: M, margin: 0 }}>{n.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: "10px 16px", borderTop: "1px solid #E4E9F2" }}>
                        <Link href="/admin/notifications" onClick={() => setNotifOpen(false)}
                          style={{ fontSize: 11, fontWeight: 700, color: "#0A1628", textDecoration: "none" }}>
                          View all notifications →
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Admin session chip */}
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 12px 6px 8px", borderRadius: 10, border: "1px solid #E4E9F2", background: "white", boxShadow: "0 1px 4px rgba(10,22,40,0.05)" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: "white" }}>
                    {(session?.user?.name || session?.user?.email || "A")[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "#0A1628", margin: 0, lineHeight: 1 }}>
                    {session?.user?.name || "Admin"}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ADE80" }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: M, textTransform: "uppercase", letterSpacing: "0.08em" }}>Live</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page description bar */}
          {meta.desc && (
            <div style={{ padding: "10px 28px", background: "white", borderBottom: "1px solid #E4E9F2", display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={11} color={M} />
              <span style={{ fontSize: 11, color: M, fontWeight: 500 }}>{meta.desc}</span>
            </div>
          )}

          {/* Content */}
          <main style={{ flex: 1, padding: "28px", overflowY: "auto" }}>
            <AnimatePresence mode="wait">
              <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
}