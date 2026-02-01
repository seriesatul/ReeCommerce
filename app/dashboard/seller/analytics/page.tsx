"use client";

import { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area 
} from "recharts";
import { TrendingUp, Users, Play, DollarSign, Loader2, ArrowUpRight } from "lucide-react";

export default function SellerAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/seller/analytics")
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Analytics</h1>
        <p className="text-slate-500 font-medium">Deep dive into your shop's performance data.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-indigo-600">
            <Play className="w-5 h-5 fill-indigo-600" />
            <span className="text-xs font-black uppercase tracking-widest">Visibility</span>
          </div>
          <h3 className="text-4xl font-black text-slate-900">{data?.engagement?.totalViews.toLocaleString()}</h3>
          <p className="text-sm font-bold text-slate-400 mt-1">Total Reel Views</p>
        </div>
        
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-emerald-600">
            <DollarSign className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Earnings</span>
          </div>
          <h3 className="text-4xl font-black text-slate-900">
            ${data?.revenueStats?.reduce((acc: any, curr: any) => acc + curr.revenue, 0).toFixed(2)}
          </h3>
          <p className="text-sm font-bold text-slate-400 mt-1">Revenue (Last 7 Days)</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-orange-600">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Conversion</span>
          </div>
          <h3 className="text-4xl font-black text-slate-900">3.4%</h3>
          <p className="text-sm font-bold text-slate-400 mt-1">Views to Orders</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Revenue Area Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-6">Revenue Growth</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.revenueStats}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-6">Best Sellers</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topProducts} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} width={100} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="totalRevenue" fill="#0f172a" radius={[0, 10, 10, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}