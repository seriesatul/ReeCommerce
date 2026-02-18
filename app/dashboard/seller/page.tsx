"use client";

import { useEffect, useState } from "react";
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  PlayCircle, 
  Plus, 
  ArrowUpRight, 
  AlertTriangle,
  Loader2,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";
import { toast } from "sonner";

export default function SellerDashboardHome() {
  const { data: session } = useSession();
  
  // --- 1. DYNAMIC STATE MANAGEMENT ---
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    views: 0,
    conversion: 0
  });
  const [loading, setLoading] = useState(true);

  // --- 2. INITIAL DATA FETCH ---
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/seller/analytics");
        const data = await res.json();
        if (res.ok) {
          // Aggregate total revenue and orders from the analytics payload
          const totalRev = data.revenueStats?.reduce((a: any, b: any) => a + b.revenue, 0) || 0;
          const totalOrd = data.revenueStats?.reduce((a: any, b: any) => a + b.orders, 0) || 0;
          
          setStats({
            revenue: totalRev,
            orders: totalOrd,
            views: data.engagement?.totalViews || 0,
            conversion: 3.4 // Placeholder for formula (Orders/Views)*100
          });
        }
      } catch (err) {
        console.error("Analytics fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // --- 3. REAL-TIME WEBSOCKET LISTENER (Bug #8 Fix) ---
  useEffect(() => {
    if (!session?.user?.id) return;

    // Initialize Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`user-${session.user.id}`);

    // Listen for the 'new-notification' event triggered by checkout/verify
    channel.bind("new-notification", (data: any) => {
      if (data.type === "PURCHASE") {
        // Play success sound logic can be added here
        
        // Update stats instantly without refresh
        setStats(prev => ({
          ...prev,
          revenue: prev.revenue + (data.metadata?.amount || 0),
          orders: prev.orders + 1
        }));

        toast.success("New Sale! 💰", {
          description: data.message || "An order was just placed in your shop.",
          duration: 5000,
        });
      }
    });

    return () => {
      pusher.unsubscribe(`user-${session.user.id}`);
    };
  }, [session?.user?.id]);

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Compiling Live Data</p>
    </div>
  );

  // Mapping state to UI metrics
  const metrics = [
    { label: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, trend: "+12%", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Orders Completed", value: stats.orders.toString(), icon: ShoppingBag, trend: "+2", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Reel Views", value: stats.views.toLocaleString(), icon: PlayCircle, trend: "Live", color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Conversion", value: `${stats.conversion}%`, icon: TrendingUp, trend: "Optimal", color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Studio Overview</h1>
          <p className="text-slate-500 font-medium">Monitoring your shop's performance in real-time.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/seller/upload" className="btn-primary flex items-center gap-2 shadow-indigo-100">
            <Plus className="w-5 h-5" />
            Upload New Reel
          </Link>
        </div>
      </div>

      {/* 2. Metrics Grid (Now Data-Driven) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${m.bg}`}>
                <m.icon className={`w-6 h-6 ${m.color}`} />
              </div>
              <div className="flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                {m.trend}
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{m.value}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* 3. Main Analytics & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Performance Chart Placeholder */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] p-10 min-h-[450px] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Revenue Growth</h3>
              <p className="text-xs font-bold text-slate-400 mt-1">Daily aggregated sales trends</p>
            </div>
            <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl">
              <button className="px-4 py-2 bg-white text-slate-900 text-[10px] font-black rounded-lg shadow-sm">Sales</button>
              <button className="px-4 py-2 text-slate-400 text-[10px] font-black hover:text-slate-600 transition-colors">Traffic</button>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-50 rounded-3xl">
            <TrendingUp size={40} className="text-slate-100 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Real-time Visualization Active</p>
          </div>
        </div>

        {/* Alerts & Tasks Section */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-100">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-6 text-indigo-400">Merchant Checklist</h3>
            <ul className="space-y-5">
              {[
                { task: "Identity Verification", done: true },
                { task: "Upload Product Reel", done: true },
                { task: "First Sale Goal", done: stats.orders > 0 },
                { task: "Customer Reviews", done: false },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all ${item.done ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50' : 'bg-slate-800 text-slate-600'}`}>
                    {item.done ? <CheckCircle2 size={14} /> : <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />}
                  </div>
                  <span className={`text-xs font-bold ${item.done ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                    {item.task}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 space-y-4">
             <div className="flex items-center gap-3 text-orange-600">
                <AlertTriangle size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Platform Notice</span>
             </div>
             <p className="text-xs font-medium text-slate-500 leading-relaxed">
               Welcome to the v2 Studio. Your payouts are scheduled for <span className="text-slate-900 font-bold">Every Friday</span>. Ensure your bank details are current in settings.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}