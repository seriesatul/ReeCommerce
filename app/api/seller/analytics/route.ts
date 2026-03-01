import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Order from "@/models/Order";
import Store from "@/models/Store";
import Reel from "@/models/Reel";
import mongoose from "mongoose";

// ─── Order filter ─────────────────────────────────────────────────
// Includes COD (paymentStatus: "pending") and paid online orders.
// Only excludes explicitly failed or cancelled orders.
const ACTIVE_FILTER = {
  paymentStatus: { $nin: ["failed", "refunded"] },
  status:        { $nin: ["cancelled"] },
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const store = await Store.findOne({ ownerId: session.user.id });
    if (!store)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const storeId = new mongoose.Types.ObjectId(store._id.toString());

    // ─── Parse range ──────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") ?? "30d";
    const days  = range === "7d" ? 7 : range === "90d" ? 90 : 30;

    const now         = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - days);
    const prevStart   = new Date(periodStart);
    prevStart.setDate(periodStart.getDate() - days);

    // ─── Debug ────────────────────────────────────────────────────
    const totalOrders  = await Order.countDocuments({ storeId });
    const activeOrders = await Order.countDocuments({ storeId, ...ACTIVE_FILTER });
    console.log(`[analytics] storeId=${storeId} total=${totalOrders} active=${activeOrders} range=${range}`);

    // ─── 1. KPI totals — current period ──────────────────────────
    // These are the source of truth for the 4 KPI cards.
    // Computed independently from the chart time-series.
    const kpiAgg = await Order.aggregate([
      {
        $match: {
          storeId,
          ...ACTIVE_FILTER,
          createdAt: { $gte: periodStart, $lte: now },
        },
      },
      {
        $group: {
          _id:     null,
          revenue: { $sum: { $toDouble: "$totalAmount" } },
          orders:  { $sum: 1 },
        },
      },
    ]);
    const kpi = kpiAgg[0] ?? { revenue: 0, orders: 0 };

    // ─── 2. Revenue chart time-series — current period ────────────
    const revenueStatsRaw = await Order.aggregate([
      {
        $match: {
          storeId,
          ...ACTIVE_FILTER,
          createdAt: { $gte: periodStart, $lte: now },
        },
      },
      {
        $group: {
          _id:     { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: { $toDouble: "$totalAmount" } },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueStats = revenueStatsRaw.map((d: any) => ({
      date:    new Date(d._id).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      revenue: Number(d.revenue) || 0,
      orders:  Number(d.orders)  || 0,
    }));

    // ─── 3. Previous period totals (for trend % badges) ──────────
    const prevAgg = await Order.aggregate([
      {
        $match: {
          storeId,
          ...ACTIVE_FILTER,
          createdAt: { $gte: prevStart, $lt: periodStart },
        },
      },
      {
        $group: {
          _id:     null,
          revenue: { $sum: { $toDouble: "$totalAmount" } },
          orders:  { $sum: 1 },
        },
      },
    ]);
    const prev = prevAgg[0] ?? { revenue: 0, orders: 0 };

    // ─── 4. Engagement ────────────────────────────────────────────
    const engAgg = await Reel.aggregate([
      { $match: { storeId } },
      {
        $group: {
          _id:        null,
          totalViews: { $sum: { $ifNull: ["$viewsCount", 0] } },
          totalLikes: { $sum: { $ifNull: ["$likesCount", 0] } },
        },
      },
    ]);
    const engagement = engAgg[0] ?? { totalViews: 0, totalLikes: 0 };

    const prevReelsAgg = await Reel.aggregate([
      { $match: { storeId, createdAt: { $lt: periodStart } } },
      { $group: { _id: null, totalViews: { $sum: { $ifNull: ["$viewsCount", 0] } } } },
    ]);

    // ─── 5. Top products ──────────────────────────────────────────
    const topProducts = await Order.aggregate([
      { $match: { storeId, ...ACTIVE_FILTER } },
      { $unwind: "$items" },
      {
        $group: {
          _id:          "$items.productId",
          name:         { $first: "$items.name" },
          totalRevenue: {
            $sum: {
              $multiply: [
                { $toDouble: { $ifNull: ["$items.priceAtPurchase", 0] } },
                { $ifNull: ["$items.quantity", 1] },
              ],
            },
          },
          totalSold: { $sum: { $ifNull: ["$items.quantity", 1] } },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
    ]);

    // ─── 6. Top reels ─────────────────────────────────────────────
    const topReelsRaw = await Reel.find({ storeId })
      .sort({ viewsCount: -1 })
      .limit(5)
      .populate({ path: "productId", select: "name price imageUrl" })
      .lean();

    const topReels = topReelsRaw.map((r: any) => ({
      _id:          r._id,
      title:        r.title || (r.productId as any)?.name || "Untitled",
      thumbnailUrl: r.thumbnailUrl ?? "",
      views:        Number(r.viewsCount) || 0,
      likes:        Number(r.likesCount) || 0,
      revenue:      0,
      convRate:     0,
      createdAt:    r.createdAt,
    }));

    return NextResponse.json({
      // KPI totals — frontend reads these directly for cards
      totalRevenue: Number(kpi.revenue) || 0,
      totalOrders:  Number(kpi.orders)  || 0,

      // Chart time-series
      revenueStats,

      // Engagement
      engagement: {
        totalViews: Number(engagement.totalViews) || 0,
        totalLikes: Number(engagement.totalLikes) || 0,
      },

      // Previous period for trend badges
      prevRevenue: Number(prev.revenue) || 0,
      prevOrders:  Number(prev.orders)  || 0,
      prevViews:   Number(prevReelsAgg[0]?.totalViews) || 0,

      topProducts,
      topReels,

      _debug: {
        totalOrders, activeOrders,
        kpiRevenue: kpi.revenue,
        kpiOrders:  kpi.orders,
        storeId:    storeId.toString(),
        range,
      },
    });

  } catch (error: any) {
    console.error("[analytics] ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}