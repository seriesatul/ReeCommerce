"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Truck,
  Loader2 // ADDED
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

// UTILITY FUNCTION: Load Razorpay Script
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  
  // FIXED: Define the state for loading
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    // Prevent checkout if user is not logged in
    if (!session) {
      router.push("/login");
      return;
    }

    setIsCheckingOut(true);
    try {
      // 1. Load Script
      const res = await loadRazorpay();
      if (!res) {
        alert("Razorpay SDK failed to load");
        setIsCheckingOut(false);
        return;
      }

      // 2. Create Order on Server
      const orderRes = await fetch("/api/checkout/create", { method: "POST" });
      const orderData = await orderRes.json();

      if (!orderRes.ok) throw new Error(orderData.error);

      // 3. Open Razorpay Options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ReeCommerce",
        description: "Transaction for Cart Items",
        order_id: orderData.id, // Connects to the backend order
        handler: async function (response: any) {
          // 4. Verify Payment on Server
          const verifyRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          
          if (verifyData.success) {
            router.push("/checkout/success"); // We will build this simple page next
          } else {
            alert("Payment Verification Failed");
          }
        },
        prefill: {
          name: session?.user?.name,
          email: session?.user?.email,
          contact: "9999999999", // Placeholder for MVP
        },
        theme: {
          color: "#4f46e5", // Your Indigo Brand Color
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error(error);
      alert("Checkout failed");
    } finally {
      // Note: We don't set false here immediately because if payment modal opens, 
      // we want the button to stay loading until they close it or pay.
      // But for MVP simplicity, we can reset it or let the redirect handle it.
      setIsCheckingOut(false); 
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6">
        <div className="p-8 bg-slate-50 rounded-full">
          <ShoppingBag className="w-16 h-16 text-slate-300" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-900">Your bag is empty</h1>
          <p className="text-slate-500 font-medium mt-2">Looks like you haven't added any reels to your cart yet.</p>
        </div>
        <Link href="/" className="btn-primary flex items-center gap-2">
          Start Shopping <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-black text-slate-900 mb-10 tracking-tight">
          Shopping Bag <span className="text-indigo-600">({cartCount})</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* 1. LEFT SIDE: ITEMS LIST */}
          <div className="lg:col-span-2 space-y-8">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-6 pb-8 border-b border-slate-100 group">
                {/* Image */}
                <div className="relative w-32 h-40 bg-slate-100 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                  <Image 
                    src={item.imageUrl} 
                    alt={item.name} 
                    fill 
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
                      <button 
                        onClick={() => removeFromCart(item.productId)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-indigo-600 mt-1 uppercase tracking-widest text-[10px]">In Stock</p>
                  </div>

                  <div className="flex justify-between items-end">
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-black text-slate-900">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-2xl font-black text-slate-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 2. RIGHT SIDE: ORDER SUMMARY */}
          <div className="lg:col-span-1">
            <div className="bg-slate-50 rounded-[2.5rem] p-8 sticky top-24 space-y-6">
              <h2 className="text-2xl font-black text-slate-900">Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal</span>
                  <span className="text-slate-900 font-bold">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Estimated Shipping</span>
                  <span className="text-emerald-600 font-bold uppercase text-xs">Free</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium pb-4 border-b border-slate-200">
                  <span>Tax</span>
                  <span className="text-slate-900 font-bold">$0.00</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-black text-slate-900">Total</span>
                  <span className="text-3xl font-black text-indigo-600">${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* FIXED: Replaced router.push with handleCheckout */}
              <button 
                onClick={()=>router.push("/checkout")}
                disabled={isCheckingOut}
                className="w-full btn-primary py-5 text-xl flex items-center justify-center gap-3 shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Checkout <ArrowRight className="w-6 h-6" /></>
                )}
              </button>

              {/* Trust Signals */}
              <div className="pt-6 space-y-4">
                <div className="flex items-center gap-3 text-slate-500">
                  <Truck className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Fast & Free Delivery</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Secure Payment Processing</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}