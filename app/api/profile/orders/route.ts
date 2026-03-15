import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Order from "@/models/Order";

// GET /api/profile/orders
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const orders = await Order.find({ buyerId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("storeId", "name handle")
    .lean();

  return NextResponse.json({ orders });
}