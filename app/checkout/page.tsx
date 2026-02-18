"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  MapPin, Phone, User, Home, 
  ArrowLeft, ShieldCheck, Loader2, CreditCard 
} from "lucide-react";
import Image from "next/image";

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const { items, cartTotal, shippingAddress, setShippingAddress } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(shippingAddress || {
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: ""
  });

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Save address to context/localStorage
    setShippingAddress(address);

    try {
      const res = await loadRazorpay();
      if (!res) throw new Error("Razorpay failed to load");

      // 1. Create Order
      const orderRes = await fetch("/api/checkout/create", { method: "POST" });
      const orderData = await orderRes.json();

      // 2. Razorpay Options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ReeCommerce",
        description: "Order Payment",
        order_id: orderData.id,
        handler: async function (response: any) {
          // 3. Verify Payment WITH the actual address
          const verifyRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              address // Pass the real address here
            }),
          });

          if (verifyRes.ok) router.push("/checkout/success");
        },
        prefill: {
          name: address.fullName,
          contact: address.phone,
          email: session?.user?.email
        },
        theme: { color: "#4f46e5" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Payment initialization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-10">
        
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 font-bold mb-8 hover:text-slate-900 transition-colors">
          <ArrowLeft size={18} /> Back to Bag
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* 1. SHIPPING FORM */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><MapPin /></div>
              <h2 className="text-2xl font-black text-slate-900">Shipping Address</h2>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input required className="input-field pl-11" placeholder="Recipient Full Name" value={address.fullName} onChange={e => setAddress({...address, fullName: e.target.value})} />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input required className="input-field pl-11" placeholder="Phone Number" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} />
              </div>
              <div className="relative">
                <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input required className="input-field pl-11" placeholder="Flat, House no., Building, Street" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input required className="input-field" placeholder="City" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} />
                <input required className="input-field" placeholder="State" value={address.state} onChange={e => setAddress({...address, state: e.target.value})} />
              </div>
              <input required className="input-field" placeholder="Pincode" value={address.zipCode} onChange={e => setAddress({...address, zipCode: e.target.value})} />

              <div className="pt-6 border-t mt-8">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 shadow-indigo-200"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><CreditCard size={20} /> Proceed to Pay ₹{cartTotal}</>}
                </button>
              </div>
            </form>
          </div>

          {/* 2. ORDER SUMMARY */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 px-2 uppercase tracking-widest text-xs opacity-50">Order Summary</h2>
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 space-y-4 max-h-[500px] overflow-y-auto no-scrollbar shadow-sm">
               {items.map((item) => (
                 <div key={item.productId} className="flex gap-4 items-center">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 border shrink-0">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs font-bold text-indigo-600">{item.quantity} Unit(s) • ₹{item.price}</p>
                    </div>
                 </div>
               ))}
            </div>

            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100 space-y-4">
               <div className="flex justify-between items-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                  <span>Subtotal</span>
                  <span>₹{cartTotal}</span>
               </div>
               <div className="flex justify-between items-center text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-800 pb-4">
                  <span>Shipping</span>
                  <span className="text-emerald-400">FREE</span>
               </div>
               <div className="flex justify-between items-center pt-2">
                  <span className="text-xl font-bold">Total Amount</span>
                  <span className="text-3xl font-black text-indigo-400">₹{cartTotal}</span>
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 pt-4">
                 <ShieldCheck size={14} className="text-indigo-500" />
                 SECURE ENCRYPTED TRANSACTION
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}