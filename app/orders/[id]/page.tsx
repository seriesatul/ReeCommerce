"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Package, Truck, MapPin, CheckCircle2, 
  ChevronLeft, Loader2, Clock, ShieldCheck, 
  ExternalLink, Navigation,
  ChevronRight,
  StoreIcon
} from "lucide-react";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";

// Industry Note: Dynamic import for Leaflet because it uses 'window' which isn't available during SSR
import dynamic from 'next/dynamic';
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

const STEPS = [
  { status: "pending", label: "Order Placed", icon: Clock },
  { status: "processing", label: "Processing", icon: Package },
  { status: "shipped", label: "In Transit", icon: Truck },
  { status: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export default function OrderTrackingPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    const res = await fetch(`/api/orders/${id}`);
    const data = await res.json();
    if (res.ok) setOrder(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();

    // REAL-TIME UPDATES: Listen for seller status changes
    if (session?.user?.id) {
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });
      const channel = pusher.subscribe(`user-${session.user.id}`);
      channel.bind("new-notification", () => {
        fetchOrder(); // Re-fetch data when a status update notification arrives
      });
      return () => pusher.unsubscribe(`user-${session.user.id}`);
    }
  }, [id, session]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  const currentStepIndex = STEPS.findIndex(s => s.status === order.status);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <nav className="p-6 bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-all">
            <ChevronLeft size={20} /> Back to Home
          </button>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live Delivery Tracker</span>
          <div className="w-10" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: PROGRESS & MAP */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. PROGRESS STEPPER */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
               <div className="flex justify-between items-center mb-10">
                  {STEPS.map((step, idx) => {
                    const isDone = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    return (
                      <div key={step.status} className="flex flex-col items-center gap-3 relative flex-1">
                        {/* Connecting Line */}
                        {idx !== 0 && (
                          <div className={`absolute right-1/2 top-5 w-full h-0.5 -translate-y-1/2 -z-0 ${isDone ? 'bg-indigo-600' : 'bg-slate-100'}`} />
                        )}
                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-700 ${isDone ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-300'}`}>
                          <step.icon size={18} />
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-tighter ${isCurrent ? 'text-indigo-600' : isDone ? 'text-slate-900' : 'text-slate-300'}`}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
               </div>
            </div>

            {/* 2. LIVE MAP (Simulated) */}
            <div className="bg-white p-4 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden aspect-video relative">
               <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center text-center p-10">
                  <Navigation className="text-indigo-600 animate-bounce mb-4" size={40} />
                  <h3 className="text-xl font-black text-slate-900 uppercase">Map Integration Ready</h3>
                  <p className="text-sm text-slate-500 font-medium max-w-xs mt-2">
                    Visualizing route from <span className="text-indigo-600 font-bold">{order.storeId.name}</span> to your location in <span className="text-indigo-600 font-bold">{order.shippingAddress.city}</span>.
                  </p>
                  <div className="mt-6 px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Awaiting Courier GPS Handshake...
                  </div>
               </div>
               {/* Integration Hook: This is where the react-leaflet components would render if real coords provided */}
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div className="space-y-6">
             <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-100 space-y-6">
                <div className="flex items-center gap-3 pb-6 border-b border-white/10">
                   <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <ShieldCheck className="text-indigo-400" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order ID</p>
                      <p className="text-sm font-bold uppercase">#{order._id.slice(-8)}</p>
                   </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Shipping To</p>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">{order.shippingAddress.fullName}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {order.shippingAddress.street}, {order.shippingAddress.city}<br />
                      {order.shippingAddress.state} - {order.shippingAddress.zipCode}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 space-y-4">
                   {order.items.map((item: any, i: number) => (
                     <div key={i} className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-medium">{item.quantity}x {item.name}</span>
                        <span className="text-xs font-bold text-white">₹{item.priceAtPurchase}</span>
                     </div>
                   ))}
                   <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <span className="text-sm font-black text-indigo-400 uppercase">Paid Total</span>
                      <span className="text-2xl font-black text-white">₹{order.totalAmount}</span>
                   </div>
                </div>
             </div>

             <div className="p-6 bg-white rounded-3xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <StoreIcon size={18} />
                   </div>
                   <span className="text-xs font-bold text-slate-700">Contact {order.storeId.name}</span>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}