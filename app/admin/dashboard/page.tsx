"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Users, 
  Play, 
  IndianRupee, 
  ArrowUpRight, 
  Activity,
  Loader2
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API to fetch global stats (We will build this next)
    fetch("/api/admin/global-stats")
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  const kpis = [
    { label: "Gross Revenue", value: `₹${stats?.totalRevenue || 0}`, icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Active Shoppers", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Global Reels", value: stats?.totalReels || 0, icon: Play, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Orders", value: stats?.totalOrders || 0, icon: Activity, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${kpi.bg}`}>
                <kpi.icon size={24} className={kpi.color} />
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+14%</span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{kpi.value}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* REVENUE GRAPH */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Platform Growth</h3>
            <p className="text-sm font-medium text-slate-400">Aggregated revenue across all stores.</p>
          </div>
          <div className="flex gap-2">
             <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Revenue</button>
             <button className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-xs font-bold">New Users</button>
          </div>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.chartData || []}>
              <defs>
                <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#cbd5e1'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#cbd5e1'}} />
              <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
              <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={4} fill="url(#adminRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}