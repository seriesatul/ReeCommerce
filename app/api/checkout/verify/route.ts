import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Cart from "@/models/Cart";
import Order from "@/models/Order";
import Product from "@/models/Products";
import Store from "@/models/Store";
import { createNotification } from "@/lib/notifications";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = await req.json();

    // 1. Verify Signature (Cryptography Check)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return NextResponse.json({ error: "Invalid Payment Signature" }, { status: 400 });
    }

    // 2. Payment Verified! Now Process the Order
    await connectDB();
    const cart = await Cart.findOne({ userId: session.user.id }).populate("items.productId");

    if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

    // Group items by Store (Since ReeCommerce is a multi-seller platform)
    // We create one Order per Store (Amazon style split-order)
    const storeGroups: any = {};
    
    for (const item of cart.items) {
      const storeId = item.productId.storeId.toString();
      if (!storeGroups[storeId]) storeGroups[storeId] = [];
      storeGroups[storeId].push(item);
    }

    const createdOrders = [];

    // Create Order for each Store
    for (const storeId in storeGroups) {
      const items = storeGroups[storeId];
      const totalAmount = items.reduce((acc: number, i: any) => acc + (i.productId.price * i.quantity), 0);

      const newOrder = await Order.create({
        buyerId: session.user.id,
        storeId: storeId,
        items: items.map((i: any) => ({
          productId: i.productId._id,
          name: i.productId.name,
          quantity: i.quantity,
          priceAtPurchase: i.productId.price
        })),
        totalAmount,
        status: "processing",
        paymentStatus: "completed",
        shippingAddress: "Default Address (MVP)", // In Phase 5 we add Address Book
      });

      createdOrders.push(newOrder);

      // Decrement Stock
      for (const item of items) {
        await Product.findByIdAndUpdate(item.productId._id, {
          $inc: { stock: -item.quantity }
        });
      }

      // NOTIFY SELLER (Real-time!)
      const store = await Store.findById(storeId);
      if (store) {
        await createNotification({
          recipientId: store.ownerId.toString(),
          type: "PURCHASE",
          title: "New Order Received! 💰",
          message: `You sold items worth ₹${totalAmount}`,
          link: `/dashboard/seller/orders`
        });
        
        // Trigger Live Revenue Update on Dashboard
        await pusherServer.trigger(`seller-${store.ownerId}`, "new-sale", {
           revenue: totalAmount,
           orderId: newOrder._id
        });
      }
    }

    // 3. Clear Cart
    cart.items = [];
    await cart.save();

    // 4. Notify Buyer
    await createNotification({
      recipientId: session.user.id,
      type: "SYSTEM",
      title: "Order Placed Successfully! 🎉",
      message: `Your payment for ₹${createdOrders.reduce((a,b) => a+b.totalAmount, 0)} was successful.`,
      link: `/orders` // We will build this page later
    });

    return NextResponse.json({ success: true, orderIds: createdOrders.map(o => o._id) });

  } catch (error: any) {
    console.error("PAYMENT_VERIFY_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}