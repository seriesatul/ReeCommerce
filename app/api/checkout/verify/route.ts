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
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      address // FIXED: Extracting the real address from the frontend request
    } = body;

    // 1. Cryptographic Signature Verification
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is missing in ENV");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // 2. Database Processing
    await connectDB();
    
    // Populate products to get prices and store IDs for routing the money
    const cart = await Cart.findOne({ userId: session.user.id }).populate({
        path: "items.productId",
        model: Product
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty or already processed" }, { status: 404 });
    }

    // MULTIVENDOR LOGIC: Group items by Store
    const storeGroups: Record<string, any[]> = {};
    cart.items.forEach((item: any) => {
      const storeId = item.productId.storeId.toString();
      if (!storeGroups[storeId]) storeGroups[storeId] = [];
      storeGroups[storeId].push(item);
    });

    // Create unique orders for each seller involved in the cart
    const orderPromises = Object.entries(storeGroups).map(async ([storeId, items]) => {
      const totalAmount = items.reduce((sum, item) => sum + (item.productId.price * item.quantity), 0);

      // Create the Order Document with the Real Address
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
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        shippingAddress: address // FIXED: Saving the actual address provided by user
      });

      // INVENTORY MANAGEMENT: Decrement Stock
      for (const item of items) {
        await Product.findByIdAndUpdate(item.productId._id, { $inc: { stock: -item.quantity } });
      }

      // NOTIFICATIONS & REAL-TIME UPDATES
      const store = await Store.findById(storeId).populate({
        path: "ownerId",
        model: User
      });

      if (store) {
        const sellerUserId = (store.ownerId as any)._id.toString();

        // Save to Database Notifications
        await createNotification({
          recipientId: sellerUserId,
          type: "PURCHASE",
          title: "New Order! 💰",
          message: `Order #${newOrder._id.toString().slice(-6)} received for ₹${totalAmount}`,
          link: "/dashboard/seller/orders"
        });

        // Trigger Real-Time WebSocket Event via Pusher
        await pusherServer.trigger(`user-${sellerUserId}`, "new-notification", {
            title: "New Sale! 💰",
            message: `You just made ₹${totalAmount}`,
            type: "PURCHASE",
            link: "/dashboard/seller/orders"
        });
      }

      return newOrder;
    });

    await Promise.all(orderPromises);

    // 3. Clear Cart after successful order generation
    cart.items = [];
    await cart.save();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("VERIFICATION_CRASH:", error);
    return NextResponse.json({ error: "Order fulfillment failed" }, { status: 500 });
  }
}