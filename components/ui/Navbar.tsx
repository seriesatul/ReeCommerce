"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  ShoppingBag, User, LayoutDashboard, LogOut, ChevronDown,
  Bell, Heart, Package, Zap, Search, X, ArrowUpRight,
  Menu, ShieldCheck,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { usePathname } from "next/navigation";
import Pusher from "pusher-js";
import { toast } from "sonner";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";

export default function Navbar() {
  const { data: session } = useSession();
  const { cartCount }     = useCart();
  const pathname          = usePathname();

  const [isMenuOpen,    setIsMenuOpen]    = useState(false);
  const [isNotifOpen,   setIsNotifOpen]   = useState(false);
  const [isSearchOpen,  setIsSearchOpen]  = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching,   setIsSearching]   = useState(false);

  // ── hide / show on scroll ────────────────────────────────
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();
  const lastY = useRef(0);
  useMotionValueEvent(scrollY, "change", (y) => {
    const delta = y - lastY.current;
    if (Math.abs(delta) < 5) return;
    setHidden(delta > 0 && y > 72);   // hide on scroll-down past 72px
    lastY.current = y;
  });
  // ─────────────────────────────────────────────────────────

  const searchRef = useRef<HTMLInputElement>(null);
  const userRole  = session?.user?.role;

  // keyboard shortcuts
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false); setMobileNavOpen(false);
        setIsNotifOpen(false);  setIsMenuOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setIsSearchOpen(true); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // close dropdowns on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-dd]")) {
        setIsMenuOpen(false); setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // lock scroll when overlay open
  useEffect(() => {
    document.body.style.overflow = (mobileNavOpen || isSearchOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileNavOpen, isSearchOpen]);

  // focus search input
  useEffect(() => {
    if (isSearchOpen) setTimeout(() => searchRef.current?.focus(), 60);
  }, [isSearchOpen]);

  // notifications polling
  const fetchNotifs = async () => {
    if (!session) return;
    try {
      const r = await fetch("/api/notifications");
      const d = await r.json();
      setNotifications(d.notifications || []);
      setUnreadCount(d.unreadCount || 0);
    } catch {}
  };
  useEffect(() => {
    fetchNotifs();
    const t = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(t);
  }, [session]);

  // pusher real-time
  useEffect(() => {
    if (!session?.user?.id) return;
    const pc = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
    const ch = pc.subscribe(`user-${session.user.id}`);
    ch.bind("new-notification", (data: any) => {
      setUnreadCount(p => p + 1);
      setNotifications(p => [data, ...p]);
      toast(data.title, { description: data.message, icon: <Zap className="w-4 h-4 text-[#0A1628]" /> });
    });
    return () => pc.unsubscribe(`user-${session.user.id}`);
  }, [session?.user?.id]);

  // fuzzy search
  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length > 2) {
      setIsSearching(true);
      try { setSearchResults(await (await fetch(`/api/search?q=${val}`)).json()); }
      catch {} finally { setIsSearching(false); }
    } else setSearchResults([]);
  };

  const markAsRead = async () => {
    setIsNotifOpen(v => !v); setIsMenuOpen(false);
    if (unreadCount > 0) { setUnreadCount(0); fetch("/api/notifications", { method: "PATCH" }); }
  };

  // route guard
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding/seller") ||
    pathname.startsWith("/admin")
  ) return null;

  const NIcon = ({ type }: { type: string }) =>
    type === "LIKE"     ? <Heart   className="w-3.5 h-3.5 fill-current" /> :
    type === "PURCHASE" ? <Package className="w-3.5 h-3.5" /> :
                          <Zap     className="w-3.5 h-3.5 fill-current" />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
      `}</style>

      {/* ══════════════════════════════════════════
          SEARCH OVERLAY
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[400] flex flex-col items-center px-4 pt-[13vh] sm:pt-[18vh]"
            style={{ background: "rgba(10,22,40,0.52)", backdropFilter: "blur(18px)" }}
            onClick={e => e.target === e.currentTarget && setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.28 }}
              className="w-full max-w-[600px]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {/* search box */}
              <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 shadow-[0_32px_80px_rgba(10,22,40,0.22),0_0_0_1px_rgba(10,22,40,0.06)]">
                <Search className={`w-5 h-5 flex-shrink-0 transition-colors ${searchQuery ? "text-[#0A1628]" : "text-[#BDBDBD]"}`} />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search products, brands, reels…"
                  className="flex-1 bg-transparent text-[#0A1628] text-base font-medium outline-none placeholder:text-[#BDBDBD]"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
                <div className="flex items-center gap-2">
                  {isSearching && <div className="w-4 h-4 border-2 border-[#0A1628] border-t-transparent rounded-full animate-spin" />}
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(""); setSearchResults([]); searchRef.current?.focus(); }}
                      className="w-7 h-7 rounded-full bg-[#F4F6FB] hover:bg-[#E4E9F2] flex items-center justify-center transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-[#6B7A99]" />
                    </button>
                  )}
                  <button
                    onClick={() => { setIsSearchOpen(false); setSearchQuery(""); setSearchResults([]); }}
                    className="w-8 h-8 rounded-xl bg-[#F4F6FB] hover:bg-[#E4E9F2] border border-[#E4E9F2] flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-[#6B7A99]" />
                  </button>
                </div>
              </div>

              {/* results */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-2 bg-white rounded-2xl overflow-hidden shadow-[0_16px_48px_rgba(10,22,40,0.14),0_0_0_1px_rgba(10,22,40,0.05)]"
                  >
                    <div className="p-2 max-h-[min(340px,55vh)] overflow-y-auto">
                      {searchResults.map(item => (
                        <Link
                          key={item._id} href={`/product/${item._id}`}
                          onClick={() => { setIsSearchOpen(false); setSearchQuery(""); setSearchResults([]); }}
                          className="flex items-center gap-4 p-3 hover:bg-[#F4F6FB] rounded-xl transition-all group"
                        >
                          <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border border-[#E4E9F2] bg-[#F4F6FB]">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0A1628] truncate">{item.name}</p>
                            <p className="text-[11px] font-medium text-[#9BA8C0] mt-0.5">₹{item.price} · {item.store?.name}</p>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-[#DEDEDE] group-hover:text-[#0A1628] flex-shrink-0 transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-center text-white/30 text-[11px] mt-5">
                Press{" "}
                <kbd className="bg-white/10 border border-white/20 text-white/30 px-1.5 py-0.5 rounded text-[10px] font-mono">Esc</kbd>
                {" "}to close
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          MOBILE DRAWER (slides from left)
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
              className="fixed top-0 left-0 bottom-0 w-[min(296px,85vw)] z-[210] bg-white flex flex-col"
              style={{ boxShadow: "24px 0 80px rgba(10,22,40,0.10)", fontFamily: "'DM Sans', sans-serif" }}
            >
              {/* drawer header */}
              <div className="flex items-center justify-between px-5 h-[64px] border-b border-[#E4E9F2] flex-shrink-0">
                <span
                  className="tracking-tight leading-none"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.2rem", color: "#0A1628", fontWeight: 700 }}
                >
                  Re- Commerce
                </span>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="w-8 h-8 rounded-xl bg-[#F4F6FB] hover:bg-[#E4E9F2] flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-[#6B7A99]" />
                </button>
              </div>

              {/* drawer links */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                <DLink href="/" onClick={() => setMobileNavOpen(false)}>Marketplace</DLink>
                <DLink href="/cart" onClick={() => setMobileNavOpen(false)}>
                  Cart
                  {cartCount > 0 && (
                    <span className="ml-auto text-[10px] font-bold bg-[#0A1628] text-white px-2 py-0.5 rounded-full">{cartCount}</span>
                  )}
                </DLink>

                {session && userRole === "user" && (
                  <DLink href="/onboarding/seller" onClick={() => setMobileNavOpen(false)} accent>Become a Seller</DLink>
                )}
                {session && userRole === "seller" && (
                  <DLink href="/dashboard/seller" onClick={() => setMobileNavOpen(false)} accent>My Studio</DLink>
                )}
                {session && userRole === "admin" && (
                  <DLink href="/admin/dashboard" onClick={() => setMobileNavOpen(false)} admin>Admin Console</DLink>
                )}

                {session && (
                  <>
                    <div className="pt-5 pb-1.5 px-3">
                      <p className="text-[10px] font-bold text-[#9BA8C0] uppercase tracking-widest">Account</p>
                    </div>
                    <DLink href="/onboarding/buyer" onClick={() => setMobileNavOpen(false)}>Preferences</DLink>
                    {userRole === "seller" && (
                      <DLink href="/dashboard/seller" onClick={() => setMobileNavOpen(false)}>Dashboard</DLink>
                    )}
                  </>
                )}
              </nav>

              {/* drawer footer */}
              <div className="px-3 py-4 border-t border-[#E4E9F2] flex-shrink-0 space-y-2">
                {!session ? (
                  <>
                    <Link
                      href="/login" onClick={() => setMobileNavOpen(false)}
                      className="flex items-center justify-center w-full h-11 rounded-xl border border-[#E4E9F2] text-sm font-semibold text-[#0A1628] hover:bg-[#F4F6FB] transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register" onClick={() => setMobileNavOpen(false)}
                      className="flex items-center justify-center w-full h-11 rounded-xl bg-[#0A1628] hover:bg-black text-white text-sm font-bold transition-colors"
                    >
                      Join Recommerce
                    </Link>
                  </>
                ) : (
                  <>
                    {session.user && (
                      <div className="flex items-center gap-3 px-3 py-2 mb-1">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black uppercase flex-shrink-0 bg-[#0A1628]">
                          {session.user.name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#0A1628] truncate">{session.user.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9BA8C0]">{userRole}</p>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-3 w-full h-11 px-4 rounded-xl hover:bg-rose-50 text-sm font-semibold text-rose-500 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          MAIN NAVBAR
          - white bg, 1px border-bottom
          - slides up on scroll-down, back on scroll-up
          - 3-col grid: links | logo | actions
      ══════════════════════════════════════════ */}
      <motion.nav
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-[100] bg-white"
        style={{
          borderBottom: "1px solid #E4E9F2",
          boxShadow: "0 2px 20px rgba(10,22,40,0.04)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-5 lg:px-8 xl:px-10">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center h-[64px] gap-2 sm:gap-4">

            {/* ── COL 1: hamburger / nav links ── */}
            <div className="flex items-center gap-1 sm:gap-4 justify-start">
              {/* hamburger — mobile/tablet */}
              <button
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#F4F6FB] transition-colors text-[#0A1628]"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* desktop links */}
              <div className="hidden lg:flex items-center gap-0.5">
                <NLink href="/" active={pathname === "/"}>Marketplace</NLink>

                {session && userRole === "user" && (
                  <NLink href="/onboarding/seller" accent>Become a Seller</NLink>
                )}
                {session && userRole === "seller" && (
                  <NLink href="/dashboard/seller" accent>My Studio</NLink>
                )}
                {session && userRole === "admin" && (
                  <NLink href="/admin/dashboard" admin>Admin</NLink>
                )}
              </div>
            </div>

            {/* ── COL 2: logo (center) ── */}
            <Link href="/" className="flex items-center justify-center group select-none">
              <span
                className="tracking-tight leading-none transition-opacity duration-150 group-hover:opacity-60"
                style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: "clamp(1.15rem, 2.2vw, 1.45rem)",
                  color: "#0A1628",
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                }}
              >
                Re - Commerce
              </span>
            </Link>

            {/* ── COL 3: actions (right) ── */}
            <div className="flex items-center justify-end gap-0.5 sm:gap-1">

              {/* Search trigger — desktop */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E4E9F2] hover:border-[#CBD3E8] hover:bg-[#F4F6FB] transition-all duration-150 group text-[#BDBDBD] hover:text-[#0A1628] mr-1 flex-shrink-0"
              >
                <Search className="w-4 h-4 flex-shrink-0 transition-colors" />
                <span className="text-sm font-medium hidden lg:block" style={{ minWidth: 64 }}>Search…</span>
                <kbd className="text-[10px] border border-[#E4E9F2] rounded px-1.5 py-0.5 font-mono hidden xl:block text-[#BDBDBD]">⌘K</kbd>
              </button>

              {/* Search icon — mobile */}
              <IBtn onClick={() => setIsSearchOpen(true)} className="md:hidden">
                <Search className="w-[18px] h-[18px]" />
              </IBtn>

              {/* ── CART (first) ── */}
              <Link href="/cart" className="relative">
                <IBtn as="span">
                  <ShoppingBag className="w-[18px] h-[18px]" />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 w-[17px] h-[17px] text-white text-[9px] font-black flex items-center justify-center rounded-full"
                        style={{ background: "#0A1628", boxShadow: "0 0 0 2px white" }}
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </IBtn>
              </Link>

              {/* ── BELL (second) ── */}
              {session && (
                <div className="relative" data-dd>
                  <IBtn onClick={markAsRead} active={isNotifOpen} className="relative">
                    <Bell className="w-[18px] h-[18px]" />
                    <AnimatePresence>
                      {unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                          className="absolute top-[7px] right-[7px] w-[7px] h-[7px] rounded-full bg-[#0A1628]"
                          style={{ boxShadow: "0 0 0 2px white" }}
                        />
                      )}
                    </AnimatePresence>
                  </IBtn>

                  <AnimatePresence>
                    {isNotifOpen && (
                      <FPanel side="right" w={308}>
                        <div className="px-4 py-3 border-b border-[#E4E9F2] flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#9BA8C0] uppercase tracking-widest">Notifications</span>
                          {unreadCount === 0 && (
                            <span className="text-[10px] font-semibold text-[#0A1628]">All caught up ✓</span>
                          )}
                        </div>
                        <div className="max-h-[min(360px,65vh)] overflow-y-auto p-2">
                          {notifications.length === 0
                            ? <div className="py-10 text-center text-[#BDBDBD] text-xs font-medium">No notifications yet</div>
                            : notifications.map((n, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-3 p-3 hover:bg-[#F4F6FB] rounded-xl transition-colors cursor-pointer"
                              >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                  n.type === "LIKE"     ? "bg-rose-50 text-rose-500"
                                  : n.type === "PURCHASE" ? "bg-[#F4F6FB] text-[#0A1628]"
                                  : "bg-amber-50 text-amber-500"
                                }`}>
                                  <NIcon type={n.type} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-[#0A1628] line-clamp-1">{n.title}</p>
                                  <p className="text-[11px] text-[#9BA8C0] mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      </FPanel>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* divider */}
              <div className="w-px h-5 bg-[#E4E9F2] mx-1 hidden sm:block flex-shrink-0" />

              {/* ── AUTH ── */}
              {!session ? (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/login"
                    className="hidden sm:block px-3 py-2 text-sm font-semibold text-[#6B7A99] hover:text-[#0A1628] hover:bg-[#F4F6FB] rounded-xl transition-all duration-150"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center justify-center px-4 h-9 rounded-xl bg-[#0A1628] hover:bg-black text-white text-sm font-bold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
                  >
                    Join
                  </Link>
                </div>
              ) : (
                <div className="relative" data-dd>
                  <button
                    onClick={() => { setIsMenuOpen(v => !v); setIsNotifOpen(false); }}
                    className={`flex items-center gap-1.5 px-1.5 py-1.5 rounded-xl transition-all duration-150 hover:bg-[#F4F6FB] ${isMenuOpen ? "bg-[#F4F6FB]" : ""}`}
                  >
                    <div
                      className="w-8 h-8 rounded-[9px] flex items-center justify-center text-white text-xs font-black uppercase flex-shrink-0 bg-[#0A1628]"
                    >
                      {session.user?.name?.[0]}
                    </div>
                    <span className="hidden md:block text-sm font-semibold text-[#0A1628] max-w-[80px] truncate">
                      {session.user?.name?.split(" ")[0]}
                    </span>
                    <ChevronDown
                      className={`hidden md:block w-3.5 h-3.5 text-[#9BA8C0] transition-transform duration-200 flex-shrink-0 ${isMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isMenuOpen && (
                      <FPanel side="right" w={220}>
                        <div className="px-4 py-3.5 border-b border-[#E4E9F2]">
                          <p className="text-sm font-bold text-[#0A1628] truncate">{session.user?.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9BA8C0] mt-0.5">{userRole}</p>
                        </div>
                        <div className="p-2 space-y-0.5">
                          {userRole === "admin" && (
                            <MRow href="/admin/dashboard" icon={<ShieldCheck className="w-4 h-4 text-amber-500" />} onClick={() => setIsMenuOpen(false)}>
                              Admin Console
                            </MRow>
                          )}
                          {userRole === "seller" && (
                            <MRow href="/dashboard/seller" icon={<LayoutDashboard className="w-4 h-4 text-[#0A1628]" />} onClick={() => setIsMenuOpen(false)}>
                              Dashboard
                            </MRow>
                          )}
                          <MRow href="/onboarding/buyer" icon={<User className="w-4 h-4 text-[#9BA8C0]" />} onClick={() => setIsMenuOpen(false)}>
                            Preferences
                          </MRow>
                        </div>
                        <div className="p-2 border-t border-[#E4E9F2]">
                          <button
                            onClick={() => signOut()}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-rose-50 text-sm font-semibold text-rose-500 transition-colors"
                          >
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </FPanel>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

          </div>
        </div>
      </motion.nav>

      {/* spacer — keeps page content below fixed navbar */}
      <div style={{ height: 64 }} />
    </>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────

/** Icon button */
function IBtn({ children, onClick, active, as: Tag = "button", className = "" }: {
  children: React.ReactNode; onClick?: () => void;
  active?: boolean; as?: any; className?: string;
}) {
  return (
    <Tag
      onClick={onClick}
      className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 flex-shrink-0
        ${active ? "bg-[#F4F6FB] text-[#0A1628]" : "text-[#6B7A99] hover:bg-[#F4F6FB] hover:text-[#0A1628]"}
        ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Desktop nav pill */
function NLink({ href, children, accent, admin, active }: {
  href: string; children: React.ReactNode;
  accent?: boolean; admin?: boolean; active?: boolean;
}) {
  const base = "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap";
  if (admin)  return <Link href={href} className={`${base} bg-amber-50 text-amber-600 hover:bg-amber-100`}>{children}</Link>;
  if (accent) return <Link href={href} className={`${base} text-[#0A1628] hover:bg-[#F4F6FB]`}>{children}</Link>;
  if (active) return <Link href={href} className={`${base} bg-[#F4F6FB] text-[#0A1628]`}>{children}</Link>;
  return <Link href={href} className={`${base} text-[#6B7A99] hover:text-[#0A1628] hover:bg-[#F4F6FB]`}>{children}</Link>;
}

/** Mobile drawer link */
function DLink({ href, children, onClick, accent, admin }: {
  href: string; children: React.ReactNode;
  onClick?: () => void; accent?: boolean; admin?: boolean;
}) {
  const base = "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors w-full";
  if (admin)  return <Link href={href} onClick={onClick} className={`${base} bg-amber-50 text-amber-600`}>{children}</Link>;
  if (accent) return <Link href={href} onClick={onClick} className={`${base} bg-[#F4F6FB] text-[#0A1628]`}>{children}</Link>;
  return <Link href={href} onClick={onClick} className={`${base} text-[#0A1628] hover:bg-[#F4F6FB]`}>{children}</Link>;
}

/** Animated floating panel */
function FPanel({ children, side, w }: { children: React.ReactNode; side: "left" | "right"; w: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.2 }}
      style={{
        width: w,
        maxWidth: "calc(100vw - 1.5rem)",
        [side === "right" ? "right" : "left"]: 0,
        fontFamily: "'DM Sans', sans-serif",
      }}
      className="absolute top-[calc(100%+8px)] z-[150] bg-white rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(10,22,40,0.12),0_0_0_1px_rgba(10,22,40,0.06)]"
    >
      {children}
    </motion.div>
  );
}

/** Dropdown menu row */
function MRow({ href, icon, children, onClick }: {
  href: string; icon: React.ReactNode; children: React.ReactNode; onClick?: () => void;
}) {
  return (
    <Link
      href={href} onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F4F6FB] text-sm font-semibold text-[#6B7A99] hover:text-[#0A1628] transition-all group"
    >
      {icon}
      {children}
      <ArrowUpRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-25 transition-opacity" />
    </Link>
  );
}