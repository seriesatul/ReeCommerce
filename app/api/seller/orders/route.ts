import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Order from "@/models/Order";
import Store from "@/models/Store";
import User from "@/models/User";
import { createNotification } from "@/lib/notifications";
import { pusherServer } from "@/lib/pusher";

// GET: Fetch seller's orders
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const store = await Store.findOne({ ownerId: session.user.id });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const orders = await Order.find({ storeId: store._id })
      .sort({ createdAt: -1 })
      .populate({ path: "buyerId", model: User, select: "name email" });

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update Order Status (The Logistics Trigger)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, status } = await req.json();
    await connectDB();

    // 1. Verify this order belongs to the seller's store
    const store = await Store.findOne({ ownerId: session.user.id });
    const order = await Order.findOne({ _id: orderId, storeId: store?._id });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // 2. Update Status
    order.status = status;
    await order.save();

    // 3. Notify Buyer (Real-time & DB)
    const statusMessages: Record<string, string> = {
      shipped: "Your order has been handed over to our courier partner. 🚚",
      delivered: "Package delivered! Hope you love your new reel-find. ✨",
      processing: "We are preparing your items for shipment. 📦"
    };

    await createNotification({
      recipientId: order.buyerId.toString(),
      type: "SYSTEM",
      title: `Order Update: ${status.toUpperCase()}`,
      message: statusMessages[status] || `Your order status changed to ${status}`,
      link: `/orders/${order._id}` // Link to the Map Tracking page
    });

    // 4. Trigger WebSocket for instant UI update on buyer side
    await pusherServer.trigger(`user-${order.buyerId}`, "new-notification", {
      title: `Order ${status.toUpperCase()}`,
      message: statusMessages[status]
    });

    return NextResponse.json({ success: true, status: order.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}