"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, XCircle, Store, BadgeCheck, Loader2, Landmark } from "lucide-react";
import { toast } from "sonner";

export default function AdminSellersQueue() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    const res = await fetch("/api/admin/pending-stores");
    const data = await res.json();
    setStores(data);
    setLoading(false);
  };

  useEffect(() => { fetchQueue(); }, []);

  const handleAction = async (storeId: string, status: "verified" | "rejected") => {
    const res = await fetch("/api/admin/verify-store", {
      method: "PATCH",
      body: JSON.stringify({ storeId, status })
    });
    if (res.ok) {
      toast.success(status === "verified" ? "Store Approved" : "Store Rejected");
      setStores(prev => prev.filter(s => s._id !== storeId));
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 gap-6">
        {stores.length === 0 ? (
          <div className="p-20 text-center bg-slate-50 rounded-4xl border-2 border-dashed border-slate-200">
             <BadgeCheck className="mx-auto mb-4 text-slate-300" size={48} />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No pending applications</p>
          </div>
        ) : (
          stores.map((store) => (
            <div key={store._id} className="bg-white border border-slate-100 p-8 rounded-4xl shadow-sm flex flex-col md:flex-row justify-between gap-8">
              <div className="flex gap-6">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shrink-0">
                  <Store size={30} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">{store.name} <span className="text-indigo-600">@{store.handle}</span></h3>
                  <p className="text-slate-500 text-sm max-w-md">{store.description}</p>
                  <div className="flex gap-4 pt-2">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 uppercase">
                      <Landmark size={12} /> {store.bankDetails?.ifscCode || "IFSC Pending"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => handleAction(store._id, "rejected")} className="p-4 text-slate-300 hover:text-rose-500 transition-all"><XCircle size={28} /></button>
                <button onClick={() => handleAction(store._id, "verified")} className="btn-primary px-8 flex items-center gap-2">
                  <ShieldCheck size={18} /> Approve Merchant
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}