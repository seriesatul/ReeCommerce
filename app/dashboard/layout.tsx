"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Video, Package, ShoppingBag, BarChart3, Settings, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const MENU = [
  { name: "Overview", icon: LayoutDashboard, href: "/dashboard/seller" },
  { name: "Reels Studio", icon: Video, href: "/dashboard/seller/reels" },
  { name: "Products", icon: Package, href: "/dashboard/seller/products" },
  { name: "Orders", icon: ShoppingBag, href: "/dashboard/seller/orders" },
  { name: "Analytics", icon: BarChart3, href: "/dashboard/seller/analytics" },
  { name: "Settings", icon: Settings, href: "/dashboard/seller/settings" },
];

export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-black tracking-tight">Ree<span className="text-indigo-600">Commerce</span></h1>
          <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md mt-1 inline-block">SELLER CENTRAL</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {MENU.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8">
        {children}
      </main>
    </div>
  );
}