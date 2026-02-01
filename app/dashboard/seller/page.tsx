"use client";

import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  PlayCircle, 
  Plus, 
  ArrowUpRight, 
  AlertTriangle 
} from "lucide-react";
import Link from "next/link";

export default function SellerDashboardHome() {
  // Mock data for industry-style visualization
  const metrics = [
    { label: "Total Revenue", value: "$0.00", icon: DollarSign, trend: "+0%", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Orders Completed", value: "0", icon: ShoppingBag, trend: "0", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Reel Views", value: "0", icon: PlayCircle, trend: "0", color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Conversion", value: "0.0%", icon: TrendingUp, trend: "0%", color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 font-medium">Your business health at a glance.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/seller/upload" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Upload Reel
          </Link>
        </div>
      </div>

      {/* 2. Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${m.bg}`}>
                <m.icon className={`w-6 h-6 ${m.color}`} />
              </div>
              <div className="flex items-center text-xs font-bold text-emerald-600">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                {m.trend}
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900">{m.value}</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* 3. Main Analytics & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Performance Chart Placeholder */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-8 min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900">Revenue Trends</h3>
            <select className="bg-slate-50 border-none text-sm font-bold rounded-lg px-3 py-2 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-50 rounded-2xl">
            <p className="text-slate-400 font-medium italic">No sales data yet to visualize.</p>
          </div>
        </div>

        {/* Alerts & Tasks Section */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl shadow-indigo-100">
            <h3 className="text-xl font-bold mb-4">Seller Checklist</h3>
            <ul className="space-y-4">
              {[
                { task: "Upload first reel", done: true },
                { task: "Add product variants", done: false },
                { task: "Verify bank account", done: false },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${item.done ? 'bg-indigo-500 border-indigo-500' : 'border-slate-700'}`}>
                    {item.done && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className={`text-sm font-medium ${item.done ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                    {item.task}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex items-start gap-4">
            <div className="p-2 bg-orange-100 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-bold text-orange-900 text-sm">Account Pending</h4>
              <p className="text-orange-700 text-xs mt-1 leading-relaxed font-medium">
                Our team is reviewing your ID verification. You can upload reels, but payouts are disabled until verified.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}