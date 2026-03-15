import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Cart from "@/models/Cart";
import Order from "@/models/Order";
import Product from "@/models/Products";
import Store from "@/models/Store";
import User from "@/models/User";
import { createNotification } from "@/lib/notifications";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      address,
    } = body;

    // ── 1. Validate address before doing anything else ─────────────
    if (
      !address?.fullName ||
      !address?.street   ||
      !address?.city     ||
      !address?.state    ||
      !address?.zipCode
    ) {
      return NextResponse.json({ error: "Shipping address is incomplete" }, { status: 400 });
    }

    // ── 2. Cryptographic signature verification ────────────────────
    const secret = process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("[verify] RAZORPAY_KEY_SECRET missing in ENV");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    await connectDB();

    // ── 3. Idempotency guard — prevent duplicate orders ────────────
    // If this Razorpay order ID was already processed (e.g. double-tap,
    // webhook retry), return the existing order instead of creating again.
    const existingOrder = await Order.findOne({ razorpayOrderId: razorpay_order_id }).lean();
    if (existingOrder) {
      console.warn("[verify] duplicate call for", razorpay_order_id);
      return NextResponse.json({
        success: true,
        orderId: (existingOrder as any)._id.toString(),
      });
    }

    // ── 4. Load cart ───────────────────────────────────────────────
    const cart = await Cart.findOne({ userId: session.user.id }).populate({
      path:  "items.productId",
      model: Product,
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty or already processed" }, { status: 404 });
    }

    // Skip items whose product was deleted after it was carted
    const validItems = cart.items.filter((item: any) => item.productId != null);
    if (validItems.length === 0) {
      return NextResponse.json({ error: "All cart products are no longer available" }, { status: 400 });
    }

    // ── 5. Atomic stock decrement (prevents overselling) ──────────
    // Only decrements if current stock >= requested quantity.
    // On failure, rolls back already-decremented items.
    for (let idx = 0; idx < validItems.length; idx++) {
      const item   = validItems[idx];
      const result = await Product.updateOne(
        { _id: item.productId._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );

      if (result.matchedCount === 0) {
        // Roll back items decremented before this one
        await Promise.all(
          validItems.slice(0, idx).map((prev: any) =>
            Product.updateOne(
              { _id: prev.productId._id },
              { $inc: { stock: prev.quantity } }
            )
          )
        );
        return NextResponse.json(
          {
            error: `"${item.productId.name}" just went out of stock. Please update your cart.`,
          },
          { status: 409 }
        );
      }
    }

    // ── 6. Group cart items by store (multivendor) ─────────────────
    const storeGroups: Record<string, any[]> = {};
    for (const item of validItems) {
      const storeId = item.productId.storeId.toString();
      if (!storeGroups[storeId]) storeGroups[storeId] = [];
      storeGroups[storeId].push(item);
    }

    // ── 7. Create one Order document per store ─────────────────────
    const createdOrders: any[] = [];

    for (const [storeId, items] of Object.entries(storeGroups)) {
      const totalAmount = items.reduce(
        (sum, item) => sum + item.productId.price * item.quantity,
        0
      );

      const newOrder = await Order.create({
        buyerId:   session.user.id,
        storeId,
        items: items.map((i: any) => ({
          productId:       i.productId._id,
          name:            i.productId.name,
          image:           i.productId.imageUrl ?? i.productId.images?.[0] ?? "",
          quantity:        i.quantity,
          priceAtPurchase: i.productId.price,
        })),
        totalAmount,
        status:            "processing",
        paymentStatus:     "completed",
        paymentMethod:     "online",
        razorpayOrderId:   razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        shippingAddress:   address,
      });

      createdOrders.push(newOrder);

      // ── 8. Notify seller ──────────────────────────────────────────
      try {
        const store = await Store.findById(storeId).populate({
          path:   "ownerId",
          model:  User,
          select: "_id name",
        });

        const sellerId  = (store?.ownerId as any)?._id?.toString();
        if (!sellerId) {
          console.warn("[verify] cannot resolve sellerId for store", storeId);
          continue;
        }

        const buyerName = session.user.name ?? "A buyer";
        const shortId   = newOrder._id.toString().slice(-6).toUpperCase();

        await createNotification({
          recipientId: sellerId,
          type:    "PURCHASE",
          title:   "New Order! 💰",
          message: `Order #${shortId} · ₹${totalAmount.toLocaleString()} from ${buyerName}`,
          link:    `/dashboard/seller/orders`,
        });

        // All fields consumed by connected listeners:
        //   seller dashboard → data.amount, data.buyerName (KPI + toast)
        //   order tracking   → data.orderId (selective re-fetch)
        await pusherServer.trigger(`user-${sellerId}`, "new-notification", {
          type:      "PURCHASE",
          title:     "New Sale! 💰",
          message:   `₹${totalAmount.toLocaleString()} from ${buyerName}`,
          amount:    totalAmount,
          buyerName,
          orderId:   newOrder._id.toString(),
          link:      `/dashboard/seller/orders`,
        });

      } catch (notifyErr) {
        // Notification failure must never roll back the order
        console.error("[verify] notification error store", storeId, notifyErr);
      }
    }

    // ── 9. Clear cart ──────────────────────────────────────────────
    cart.items = [];
    await cart.save();

    // Return primary order ID for the success page → /orders/[id]
    const primaryOrderId = createdOrders[0]?._id?.toString();
    return NextResponse.json({ success: true, orderId: primaryOrderId });

  } catch (error: any) {
    console.error("[checkout/verify] CRASH:", error);
    return NextResponse.json({ error: "Order fulfillment failed" }, { status: 500 });
  }
}