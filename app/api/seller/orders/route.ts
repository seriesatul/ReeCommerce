import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Order from "@/models/Order";
import Store from "@/models/Store";
import User from "@/models/User"; // Ensure registered

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