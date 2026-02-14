import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Order from "@/models/Order";
import User from "@/models/User";
import Reel from "@/models/Reel";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    // Parallel Aggregation (Industry Pattern for Dashboard Speed)
    const [revenue, users, reels, orders] = await Promise.all([
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
      User.countDocuments(),
      Reel.countDocuments(),
      Order.countDocuments()
    ]);

    // Mock Chart Data for visualization
    const chartData = [
      { date: 'Feb 08', amount: 4000 },
      { date: 'Feb 09', amount: 3000 },
      { date: 'Feb 10', amount: 5000 },
      { date: 'Feb 11', amount: 2000 },
      { date: 'Feb 12', amount: 6000 },
      { date: 'Feb 13', amount: 8500 },
      { date: 'Feb 14', amount: (revenue[0]?.total || 0) },
    ];

    return NextResponse.json({
      totalRevenue: revenue[0]?.total || 0,
      totalUsers: users,
      totalReels: reels,
      totalOrders: orders,
      chartData
    });

  } catch (error) {
    return NextResponse.json({ error: "Aggregations failed" }, { status: 500 });
  }
}