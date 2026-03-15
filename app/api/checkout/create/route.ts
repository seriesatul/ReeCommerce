import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Cart from "@/models/Cart";
import Razorpay from "razorpay";

// ── Server-only env vars — never NEXT_PUBLIC_ on a server route ───
const razorpay = new Razorpay({
  key_id:     process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // ── Populate product details for server-side price calculation ─
    const cart = await Cart.findOne({ userId: session.user.id }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // ── Guard: skip items whose product was deleted after cart add ─
    const validItems = cart.items.filter((item: any) => item.productId != null);
    if (validItems.length === 0) {
      return NextResponse.json(
        { error: "All products in your cart are no longer available" },
        { status: 400 }
      );
    }

    // ── Stock validation — reject before charging if any item OOS ─
    const outOfStock = validItems.filter(
      (item: any) => typeof item.productId.stock === "number"
        && item.productId.stock < item.quantity
    );
    if (outOfStock.length > 0) {
      const names = outOfStock.map((i: any) => i.productId.name).join(", ");
      return NextResponse.json(
        { error: `Insufficient stock for: ${names}` },
        { status: 400 }
      );
    }

    // ── Recalculate total server-side (never trust client prices) ─
    const totalAmount = validItems.reduce((acc: number, item: any) => {
      return acc + item.productId.price * item.quantity;
    }, 0);

    if (totalAmount <= 0) {
      return NextResponse.json({ error: "Invalid cart total" }, { status: 400 });
    }

    // ── Create Razorpay order (amount in paise) ────────────────────
    const order = await razorpay.orders.create({
      amount:   Math.round(totalAmount * 100),
      currency: "INR",
      receipt:  `rcpt_${session.user.id.slice(-6)}_${Date.now()}`,
      notes: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      id:       order.id,
      currency: order.currency,
      amount:   order.amount,
    });

  } catch (error: any) {
    console.error("[checkout/create] ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}