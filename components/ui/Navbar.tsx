"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { 
  ShoppingBag, User, LayoutDashboard, PlusSquare, LogOut, ChevronDown, Store, 
  Bell, Heart, Package, Zap, Search, ShieldCheck, X, Loader2, ArrowUpRight
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { usePathname } from "next/navigation";
import Pusher from "pusher-js";
import { toast } from "sonner";

export default function Navbar() {
  const { data: session } = useSession();
  const { cartCount } = useCart();
  const pathname = usePathname();
  
  // UI States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Notification States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const userRole = session?.user?.role;

  // 1. Real-time Notifications Logic
  const fetchNotifications = async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Notif error", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusherClient.subscribe(`user-${session.user.id}`);
    channel.bind("new-notification", (data: any) => {
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => [data, ...prev]);
      toast(data.title, {
        description: data.message,
        icon: data.type === 'LIKE' ? <Heart className="w-4 h-4 text-rose-500" /> : <Zap className="w-4 h-4 text-indigo-500" />,
        action: { label: "View", onClick: () => window.location.href = data.link || "#" },
      });
    });
    return () => { pusherClient.unsubscribe(`user-${session.user.id}`); };
  }, [session?.user?.id]);

  // 2. Fuzzy Search Logic
  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length > 2) {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${val}`);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const markAsRead = async () => {
    setIsNotifOpen(!isNotifOpen);
    if (unreadCount > 0) {
      setUnreadCount(0);
      await fetch("/api/notifications", { method: "PATCH" });
    }
  };

  // Hide Navbar on heavy dashboard/admin pages
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding/seller") || pathname.startsWith("/admin")) return null;

  return (
    <nav className="sticky top-0 z-[100] w-full bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-4">
          
          {/* 1. BRAND LOGO */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 hidden md:block">
              Ree<span className="text-indigo-600">Commerce</span>
            </span>
          </Link>

          {/* 2. NAVIGATION FLOWS (FIXED: Added High-Value Actions here) */}
          <div className="hidden lg:flex items-center gap-6">
            <Link href="/" className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
              Marketplace
            </Link>

            {/* Dynamic Role-Based Buttons in the main bar */}
            {session && (
              <>
                {userRole === "user" && (
                  <Link 
                    href="/onboarding/seller" 
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all"
                  >
                    <Store className="w-4 h-4" /> Become a Seller
                  </Link>
                )}
                {userRole === "seller" && (
                  <Link 
                    href="/dashboard/seller" 
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4" /> My Studio
                  </Link>
                )}
                {userRole === "admin" && (
                  <Link 
                    href="/admin/dashboard" 
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <ShieldCheck className="w-4 h-4" /> Admin Console
                  </Link>
                )}
              </>
            )}
          </div>

          {/* 3. FUZZY SEARCH (Middle) */}
          <div className="relative flex-1 max-w-sm hidden md:block">
            <div className="relative group">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchQuery ? 'text-indigo-600' : 'text-slate-400'}`} />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-indigo-600 outline-none font-medium transition-all" 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => {setSearchQuery(""); setSearchResults([]);}} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Instant Results Overlay */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-[110] animate-in fade-in zoom-in-95 duration-200">
                <div className="max-h-80 overflow-y-auto no-scrollbar">
                  {searchResults.map((item) => (
                    <Link 
                      key={item._id} 
                      href={`/product/${item._id}`}
                      onClick={() => setSearchResults([])}
                      className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all group"
                    >
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                        <img src={item.imageUrl} className="object-cover w-full h-full group-hover:scale-110 transition-transform" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[10px] font-black text-indigo-600 uppercase">₹{item.price} • {item.store?.name}</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-600 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. ACTIONS (Right) */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            
            {/* NOTIFICATIONS BELL */}
            {session && (
              <div className="relative">
                <button onClick={markAsRead} className="p-2.5 hover:bg-slate-50 rounded-xl transition-all relative group">
                  <Bell className={`w-6 h-6 ${isNotifOpen ? 'text-indigo-600' : 'text-slate-600 group-hover:text-indigo-600'}`} />
                  {unreadCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Activity Center</span>
                      {unreadCount > 0 && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">New</span>}
                    </div>
                    <div className="max-h-96 overflow-y-auto no-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 text-xs font-bold italic">All caught up</div>
                      ) : (
                        notifications.map((notif, i) => (
                          <Link key={i} href={notif.link || "#"} onClick={() => setIsNotifOpen(false)} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-colors group">
                            <div className={`p-2 rounded-xl shrink-0 ${notif.type === 'LIKE' ? 'bg-rose-50 text-rose-500' : notif.type === 'PURCHASE' ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-500'}`}>
                              {notif.type === 'LIKE' ? <Heart className="w-4 h-4 fill-current" /> : notif.type === 'PURCHASE' ? <Package className="w-4 h-4" /> : <Zap className="w-4 h-4 fill-current" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-900 line-clamp-1">{notif.title}</p>
                              <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5 line-clamp-2">{notif.message}</p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CART ICON */}
            <Link href="/cart" className="relative p-2.5 hover:bg-slate-50 rounded-xl group transition-all">
              <ShoppingBag className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" />
              {cartCount > 0 && (
                <span className="absolute top-2 right-2 bg-indigo-600 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* USER PROFILE DROPDOWN */}
            {!session ? (
              <div className="flex items-center gap-2 pl-2">
                <Link href="/login" className="px-4 py-2 text-sm font-bold text-slate-900 hover:text-indigo-600">Sign In</Link>
                <Link href="/register" className="btn-primary py-2 px-5 text-sm">Join</Link>
              </div>
            ) : (
              <div className="relative pl-2 border-l border-slate-100">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 p-1 pr-2 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-xs uppercase">
                    {session.user?.name?.[0]}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-50 mb-2">
                       <p className="text-xs font-black text-slate-900 truncate">{session.user?.name}</p>
                       <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{userRole}</p>
                    </div>
                    
                    {userRole === "admin" && (
                      <Link href="/admin/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 text-sm font-bold text-slate-900"><ShieldCheck className="w-4 h-4 text-indigo-600" /> Admin Console</Link>
                    )}
                    {userRole === "seller" && (
                      <Link href="/dashboard/seller" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 text-sm font-bold text-slate-900"><LayoutDashboard className="w-4 h-4 text-indigo-600" /> Dashboard</Link>
                    )}
                    <Link href="/onboarding/buyer" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 text-sm font-bold text-slate-900"><User className="w-4 h-4 text-indigo-600" /> Preferences</Link>

                    <div className="my-2 border-t border-slate-50" />
                    <button onClick={() => signOut()} className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl hover:bg-rose-50 text-sm font-bold text-rose-600 transition-colors"><LogOut className="w-4 h-4" /> Sign Out</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}