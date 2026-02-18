"use client";

import { useEffect, useState } from "react";
import { 
  ShoppingBag, Truck, CheckCircle2, User, 
  ChevronRight, Loader2, Calendar, PackageCheck 
} from "lucide-react";
import { toast } from "sonner";

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
  const [filter, setFilter] = useState("all");

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/seller/orders");
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (err) {
      toast.error("Failed to sync orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/seller/orders", {
        method: "PATCH",
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Order marked as ${newStatus}`);
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const filteredOrders = orders.filter(o => filter === "all" || o.status === filter);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Fulfillment Studio</h1>
        <p className="text-slate-500 font-medium">Dispatch orders and track deliveries.</p>
      </div>

      {/* Dynamic Tabs */}
      <div className="flex gap-8 border-b border-slate-100">
        {['all', 'pending', 'processing', 'shipped', 'delivered'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setFilter(tab)}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${filter === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-100 rounded-4xl p-20 text-center">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No orders found in this category</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-xl hover:shadow-indigo-50/50 transition-all group">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                
                {/* ID & Customer */}
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-slate-200">
                    <User size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-900 uppercase">#{order._id.slice(-6)}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-tighter ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-500 mt-1">{order.buyerId?.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Ordered: {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Logistics Control */}
                <div className="flex flex-1 items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <Truck className="text-indigo-600" size={20} />
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Logistics Status</p>
                      <select 
                        value={order.status} 
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-900 outline-none w-full cursor-pointer"
                      >
                        <option value="pending">Pending Review</option>
                        <option value="processing">Start Processing</option>
                        <option value="shipped">Mark as Shipped</option>
                        <option value="delivered">Confirmed Delivered</option>
                      </select>
                   </div>
                </div>

                {/* Total & Action */}
                <div className="flex items-center gap-6">
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Value</p>
                      <p className="text-xl font-black text-indigo-600">₹{order.totalAmount}</p>
                   </div>
                   <button className="p-4 bg-slate-100 rounded-2xl text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                      <ChevronRight size={20} />
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