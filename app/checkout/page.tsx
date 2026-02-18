"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  MapPin, Phone, User, Home, 
  ArrowLeft, ShieldCheck, Loader2, CreditCard,
  Banknote, CheckCircle2, Zap
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
  const { items, cartTotal, shippingAddress, setShippingAddress, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [address, setAddress] = useState(shippingAddress || {
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: ""
  });

  const handleProcessOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Save current address to context/localStorage
    setShippingAddress(address);

    try {
      if (paymentMethod === "cod") {
        // --- CASH ON DELIVERY FLOW ---
        const res = await fetch("/api/checkout/cod", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });

        if (res.ok) {
          clearCart();
          router.push("/checkout/success?method=cod");
        } else {
          const data = await res.json();
          throw new Error(data.error || "COD Order failed");
        }
      } else {
        // --- ONLINE PAYMENT FLOW (RAZORPAY) ---
        const sdkLoaded = await loadRazorpay();
        if (!sdkLoaded) throw new Error("Razorpay failed to load");

        // A. Create Order on Server
        const orderRes = await fetch("/api/checkout/create", { method: "POST" });
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.error);

        // B. Configure Razorpay
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "ReeCommerce",
          description: "Order Payment",
          order_id: orderData.id,
          handler: async function (response: any) {
            const verifyRes = await fetch("/api/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                address 
              }),
            });

            if (verifyRes.ok) {
              clearCart();
              router.push("/checkout/success?method=online");
            }
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
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Checkout failed. Please try again.");
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          <div className="space-y-8">
            {/* 1. SHIPPING FORM */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><MapPin /></div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">1. Delivery Address</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input required className="input-field pl-11" placeholder="Full Name" value={address.fullName} onChange={e => setAddress({...address, fullName: e.target.value})} />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input required className="input-field pl-11" placeholder="Phone Number" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} />
                </div>
                <div className="relative">
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input required className="input-field pl-11" placeholder="Flat / Street / Area" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input required className="input-field" placeholder="City" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} />
                  <input required className="input-field" placeholder="State" value={address.state} onChange={e => setAddress({...address, state: e.target.value})} />
                </div>
                <input required className="input-field" placeholder="Pincode" value={address.zipCode} onChange={e => setAddress({...address, zipCode: e.target.value})} />
              </div>
            </div>

            {/* 2. PAYMENT METHOD SELECTOR */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><CreditCard /></div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">2. Payment Method</h2>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Online Option */}
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod("online")}
                    className={`relative flex items-start gap-4 p-6 rounded-3xl border-2 transition-all text-left ${paymentMethod === 'online' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className={`p-2 rounded-xl ${paymentMethod === 'online' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Pay Online</p>
                      <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-widest">UPI, Cards, Wallet</p>
                    </div>
                    {paymentMethod === 'online' && <CheckCircle2 className="absolute top-4 right-4 text-indigo-600" size={18} />}
                  </button>

                  {/* COD Option */}
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`relative flex items-start gap-4 p-6 rounded-3xl border-2 transition-all text-left ${paymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className={`p-2 rounded-xl ${paymentMethod === 'cod' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Banknote size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Cash on Delivery</p>
                      <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-widest">Pay at your doorstep</p>
                    </div>
                    {paymentMethod === 'cod' && <CheckCircle2 className="absolute top-4 right-4 text-indigo-600" size={18} />}
                  </button>
               </div>
            </div>
          </div>

          {/* 3. ORDER SUMMARY & TOTAL */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl shadow-indigo-200 space-y-6">
               <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Order Totals</h3>
               
               <div className="space-y-4 border-b border-white/10 pb-6">
                  <div className="flex justify-between text-slate-400 font-bold text-xs uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>₹{cartTotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-bold text-xs uppercase tracking-widest">
                    <span>Delivery</span>
                    <span className="text-emerald-400">FREE</span>
                  </div>
                  {paymentMethod === 'cod' && (
                    <div className="flex justify-between text-slate-400 font-bold text-xs uppercase tracking-widest animate-in fade-in">
                      <span>COD Convenience Fee</span>
                      <span>₹0</span>
                    </div>
                  )}
               </div>

               <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Payable Amount</span>
                  <span className="text-4xl font-black text-indigo-400 tracking-tighter">₹{cartTotal}</span>
               </div>

               <button 
                onClick={handleProcessOrder}
                disabled={loading}
                className="w-full bg-white text-slate-900 py-6 rounded-[2rem] font-black text-xl hover:bg-indigo-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  paymentMethod === 'online' ? "Pay & Complete Order" : "Place COD Order"
                )}
              </button>

               <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 pt-4 uppercase tracking-[0.2em]">
                 <ShieldCheck size={14} className="text-indigo-500" />
                 100% Secure Transaction
               </div>
            </div>

            {/* Item Previews */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 space-y-4 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Cart Preview</p>
               {items.map((item) => (
                 <div key={item.productId} className="flex gap-4 items-center bg-slate-50/50 p-2 rounded-2xl">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white border shrink-0">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[10px] font-bold text-indigo-600">{item.quantity} × ₹{item.price}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}