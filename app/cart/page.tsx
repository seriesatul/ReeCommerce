"use client";

import { useCart } from "@/context/CartContext";
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Truck 
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const router = useRouter();

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

              <button 
                onClick={() => router.push("/checkout")}
                className="w-full btn-primary py-5 text-xl flex items-center justify-center gap-3 shadow-indigo-200"
              >
                Checkout <ArrowRight className="w-6 h-6" />
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