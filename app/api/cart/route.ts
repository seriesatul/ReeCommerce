import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Cart from "@/models/Cart";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ items: [] });

  await connectDB();
  // We populate the productId to get name, price, and image for the UI
  const cart = await Cart.findOne({ userId: session.user.id }).populate("items.productId");
  return NextResponse.json(cart || { items: [] });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // FIXED: Added 'quantity' to the destructuring
    const { productId, action, quantity } = await req.json();
    
    await connectDB();

    let cart = await Cart.findOne({ userId: session.user.id });

    if (!cart) {
      cart = await Cart.create({ userId: session.user.id, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (p: any) => p.productId.toString() === productId
    );

    if (action === "add") {
      if (itemIndex > -1) {
        // If it exists, increment by 1 (standard Reel "Add to Cart" behavior)
        cart.items[itemIndex].quantity += 1;
      } else {
        // If new, add to array
        cart.items.push({ productId, quantity: 1 });
      }
    } 
    
    else if (action === "update") {
      // Used by the Cart Page (+/- buttons)
      if (itemIndex > -1 && quantity > 0) {
        cart.items[itemIndex].quantity = quantity;
      }
    } 
    
    else if (action === "remove") {
      cart.items = cart.items.filter(
        (p: any) => p.productId.toString() !== productId
      );
    }

    await cart.save();
    
    // Return the updated cart so the frontend stays in sync
    return NextResponse.json(cart);

  } catch (error: any) {
    console.error("CART_API_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}