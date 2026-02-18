"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

// Structured Address Type
export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, newQuantity: number) => Promise<void>;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  // Bug #3: New State for Checkout flow
  shippingAddress: ShippingAddress | null;
  setShippingAddress: (address: ShippingAddress) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [shippingAddress, setAddressState] = useState<ShippingAddress | null>(null);

  useEffect(() => {
    if (session) {
      fetch("/api/cart")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.items) {
            const formattedItems = data.items.map((item: any) => ({
              productId: item.productId._id || item.productId,
              name: item.productId.name,
              price: item.productId.price,
              imageUrl: item.productId.imageUrl,
              quantity: item.quantity,
            }));
            setItems(formattedItems);
          }
        })
        .catch((err) => console.error("Failed to load cart", err));
        
      // Load saved address if any
      const savedAddress = localStorage.getItem("ree_shipping_address");
      if (savedAddress) setAddressState(JSON.parse(savedAddress));
    }
  }, [session]);

  const setShippingAddress = (address: ShippingAddress) => {
    setAddressState(address);
    localStorage.setItem("ree_shipping_address", JSON.stringify(address));
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    );
    if (session) {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: newQuantity, action: "update" }),
      });
    }
  };

  const addToCart = async (product: any) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === (product._id || product.productId));
      if (existing) {
        return prev.map((i) =>
          i.productId === (product._id || product.productId) ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, {
          productId: product._id || product.productId,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: 1,
      }];
    });

    if (session) {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id || product.productId, action: "add" }),
      });
    }
  };

  const removeFromCart = async (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    if (session) {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action: "remove" }),
      });
    }
  };

  const clearCart = () => {
    setItems([]);
    if (session) fetch("/api/cart", { method: "DELETE" }); // Optional: Add a clear route
  };

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        shippingAddress,
        setShippingAddress
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};