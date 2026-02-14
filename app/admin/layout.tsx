"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  ShieldCheck, 
  Users, 
  Video, 
  Store, 
  Settings, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { signOut } from "next-auth/react";

const ADMIN_MENU = [
  { name: "Overview", icon: BarChart3, href: "/admin/dashboard" },
  { name: "Sellers Queue", icon: Store, href: "/admin/sellers" },
  { name: "Content Moderation", icon: Video, href: "/admin/content" },
  { name: "User Directory", icon: Users, href: "/admin/users" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-white">
      {/* 1. ADMIN SIDEBAR */}
      <aside className="w-72 border-r border-slate-100 flex flex-col sticky top-0 h-screen bg-white">
        <div className="p-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <ShieldCheck size={20} />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">Ree<span className="text-indigo-600">Admin</span></span>
          </Link>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-[10px] font-black text-white uppercase tracking-widest">
            System Authority
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {ADMIN_MENU.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-5 py-4 rounded-2xl font-bold transition-all ${
                  isActive 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.02]" 
                  : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  <span className="text-sm">{item.name}</span>
                </div>
                {isActive && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-50">
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 w-full px-5 py-4 rounded-2xl text-rose-500 font-bold hover:bg-rose-50 transition-colors text-sm"
          >
            <LogOut size={20} /> Exit Console
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONSOLE AREA */}
      <main className="flex-1 bg-slate-50/30">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-50 flex items-center justify-between px-10 sticky top-0 z-40">
           <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
             Command Center / {pathname.split('/').pop()}
           </h2>
           <div className="flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-xs font-black text-slate-900">Super Admin</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">Live Connection</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200" />
           </div>
        </header>
        <div className="p-10">
          {children}
        </div>
      </main>
    </div>
  );
}