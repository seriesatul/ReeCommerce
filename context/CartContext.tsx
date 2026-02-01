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

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, newQuantity: number) => Promise<void>; // FIXED: Added this line
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);

  // 1. Load cart from DB on login
  useEffect(() => {
    if (session) {
      fetch("/api/cart")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.items) {
            // Map DB structure to our CartItem interface
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
    }
  }, [session]);

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    // Optimistic Update
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    );

    // Sync with DB
    if (session) {
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity: newQuantity, action: "update" }),
        });
      } catch (err) {
        console.error("Failed to sync quantity", err);
      }
    }
  };

  const addToCart = async (product: any) => {
    // Optimistic Update
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === (product._id || product.productId));
      if (existing) {
        return prev.map((i) =>
          i.productId === (product._id || product.productId) ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product._id || product.productId,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: 1,
        },
      ];
    });

    // Background Sync with DB
    if (session) {
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product._id || product.productId, action: "add" }),
        });
      } catch (err) {
        console.error("Failed to add to cart in DB", err);
      }
    }
  };

  const removeFromCart = async (productId: string) => {
    // Optimistic UI
    setItems((prev) => prev.filter((i) => i.productId !== productId));

    if (session) {
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, action: "remove" }),
        });
      } catch (err) {
        console.error("Failed to remove from cart in DB", err);
      }
    }
  };

  const clearCart = () => setItems([]);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity, // This now matches the interface
        clearCart,
        cartCount,
        cartTotal,
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