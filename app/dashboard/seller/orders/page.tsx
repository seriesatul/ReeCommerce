"use client";

import { useEffect, useState } from "react";
import { 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  Clock, 
  User, 
  ChevronRight,
  Loader2,
  Calendar
} from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-orange-50 text-orange-600 border-orange-100",
  processing: "bg-blue-50 text-blue-600 border-blue-100",
  shipped: "bg-indigo-50 text-indigo-600 border-indigo-100",
  delivered: "bg-emerald-50 text-emerald-600 border-emerald-100",
  cancelled: "bg-rose-50 text-rose-600 border-rose-100",
};

export default function SellerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/seller/orders");
        const data = await res.json();
        if (Array.isArray(data)) setOrders(data);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Orders</h1>
        <p className="text-slate-500 font-medium">Track and fulfill your customer purchases.</p>
      </div>

      {/* Tabs / Filter Summary */}
      <div className="flex gap-4 border-b border-slate-100 pb-1">
        {['All Orders', 'Pending', 'Shipped', 'Completed'].map((tab, i) => (
          <button key={tab} className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${i === 0 ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-20 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No orders yet</h3>
          <p className="text-slate-500">When customers buy via your reels, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-lg hover:shadow-slate-100 transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Order ID & Buyer */}
                <div className="flex gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-center h-14 w-14">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">Order #{order._id.slice(-6).toUpperCase()}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 mt-1">{order.buyerId?.name || "Anonymous Buyer"}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 font-bold">
                      <Calendar className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="flex-1 px-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Items</p>
                  <p className="text-sm font-medium text-slate-700 truncate max-w-xs">
                    {order.items.map((item: any) => `${item.quantity}x ${item.name}`).join(", ")}
                  </p>
                </div>

                {/* Total & Action */}
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue</p>
                    <p className="text-lg font-black text-indigo-600">${order.totalAmount.toFixed(2)}</p>
                  </div>
                  <button className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}