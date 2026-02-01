import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Order from "@/models/Order";
import Store from "@/models/Store";
import Reel from "@/models/Reel";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const store = await Store.findOne({ ownerId: session.user.id });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const storeId = store._id;

    // 1. Revenue Over Time (Last 7 Days)
    const revenueStats = await Order.aggregate([
      { $match: { storeId: storeId, paymentStatus: "completed" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 7 }
    ]);

    // 2. Total Engagement Signals
    const engagementStats = await Reel.aggregate([
      { $match: { storeId: storeId } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$viewsCount" },
          totalLikes: { $sum: "$likesCount" },
        }
      }
    ]);

    // 3. Top Products by Revenue
    const topProducts = await Order.aggregate([
      { $match: { storeId: storeId, paymentStatus: "completed" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          totalRevenue: { $sum: { $multiply: ["$items.priceAtPurchase", "$items.quantity"] } },
          totalSold: { $sum: "$items.quantity" }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    return NextResponse.json({
      revenueStats,
      engagement: engagementStats[0] || { totalViews: 0, totalLikes: 0 },
      topProducts
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}