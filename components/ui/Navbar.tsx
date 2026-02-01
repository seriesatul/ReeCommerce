"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { 
  ShoppingBag, 
  User, 
  LayoutDashboard, 
  PlusSquare, 
  LogOut, 
  ChevronDown,
  Store,
  Bell,
  Heart,
  Package,
  Zap,
  Check
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const { cartCount } = useCart();
  const pathname = usePathname();
  
  // States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userRole = session?.user?.role;

  // Fetch Notifications Logic
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
    // Industry practice: Poll for notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [session]);

  const markAsRead = async () => {
    setIsNotifOpen(!isNotifOpen);
    if (unreadCount > 0) {
      setUnreadCount(0);
      await fetch("/api/notifications", { method: "PATCH" });
    }
  };

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding/seller")) return null;

  return (
    <nav className="sticky top-0 z-[100] w-full bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* 1. BRAND LOGO */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">
              Ree<span className="text-indigo-600">Commerce</span>
            </span>
          </Link>

          {/* 2. NAVIGATION FLOWS */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
              Marketplace
            </Link>
            {session && userRole !== "seller" && (
              <Link href="/onboarding/seller" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                <Store className="w-4 h-4" />
                Become a Seller
              </Link>
            )}
          </div>

          {/* 3. ACTION ICONS & USER MENU */}
          <div className="flex items-center gap-2 md:gap-4">
            
            {/* NOTIFICATION BELL */}
            {session && (
              <div className="relative">
                <button 
                  onClick={markAsRead}
                  className="p-2.5 hover:bg-slate-50 rounded-xl transition-all relative group"
                >
                  <Bell className={`w-6 h-6 transition-colors ${isNotifOpen ? 'text-indigo-600' : 'text-slate-600 group-hover:text-indigo-600'}`} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
                  )}
                </button>

                {/* NOTIFICATION DROPDOWN */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Notifications</span>
                      {unreadCount > 0 && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">New</span>}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 text-xs font-bold italic">No new updates</div>
                      ) : (
                        notifications.map((notif) => (
                          <Link 
                            key={notif._id} 
                            href={notif.link || "#"} 
                            onClick={() => setIsNotifOpen(false)}
                            className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-colors group"
                          >
                            <div className={`p-2 rounded-xl shrink-0 ${
                              notif.type === 'LIKE' ? 'bg-rose-50 text-rose-500' : 
                              notif.type === 'PURCHASE' ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-500'
                            }`}>
                              {notif.type === 'LIKE' ? <Heart className="w-4 h-4 fill-current" /> : 
                               notif.type === 'PURCHASE' ? <Package className="w-4 h-4" /> : <Zap className="w-4 h-4 fill-current" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-900">{notif.title}</p>
                              <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">{notif.message}</p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SHOPPING BAG */}
            <Link href="/cart" className="relative p-2.5 hover:bg-slate-50 rounded-xl transition-all group">
              <ShoppingBag className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" />
              {cartCount > 0 && (
                <span className="absolute top-2 right-2 bg-indigo-600 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* USER PROFILE DROPDOWN */}
            {!session ? (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50 rounded-xl">Sign In</Link>
                <Link href="/register" className="btn-primary py-2 px-5 text-sm">Join</Link>
              </div>
            ) : (
              <div className="relative">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 p-1 pr-2 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-xs">
                    {session.user?.name?.[0].toUpperCase()}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-slate-50">
                       <p className="text-xs font-black text-slate-900">{session.user?.name}</p>
                       <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{userRole}</p>
                    </div>
                    {userRole === "seller" ? (
                      <>
                        <Link href="/dashboard/seller" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 text-sm font-bold text-slate-900"><LayoutDashboard className="w-4 h-4 text-indigo-600" /> Dashboard</Link>
                        <Link href="/seller/upload" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 text-sm font-bold text-slate-900"><PlusSquare className="w-4 h-4 text-indigo-600" /> New Reel</Link>
                      </>
                    ) : (
                      <Link href="/onboarding/buyer" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 text-sm font-bold text-slate-900"><User className="w-4 h-4 text-indigo-600" /> Preferences</Link>
                    )}
                    <div className="my-2 border-t border-slate-50" />
                    <button onClick={() => signOut()} className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl hover:bg-rose-50 text-sm font-bold text-rose-600"><LogOut className="w-4 h-4" /> Sign Out</button>
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