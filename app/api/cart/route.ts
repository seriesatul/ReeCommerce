import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Cart from "@/models/Cart";
import Product from "@/models/Products"; // 1. CRITICAL: Import the model to register the schema

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ items: [] });

    await connectDB();

    /**
     * 2. INDUSTRY BEST PRACTICE: Explicit Model Registration
     * In serverless environments, we must tell Mongoose exactly 
     * which model to use for population to avoid MissingSchemaError.
     */
    const cart = await Cart.findOne({ userId: session.user.id })
      .populate({
        path: "items.productId",
        model: Product, // Explicitly reference the imported model
      })
      .lean(); // 3. Use lean() for 3x faster performance on Vercel

    return NextResponse.json(cart || { items: [] });
  } catch (error: any) {
    // This will appear in your Vercel Logs
    console.error("CART_GET_CRASH:", error.message);
    return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
        cart.items[itemIndex].quantity += 1;
      } else {
        cart.items.push({ productId, quantity: 1 });
      }
    } 
    else if (action === "update") {
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
    return NextResponse.json(cart);

  } catch (error: any) {
    console.error("CART_POST_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}