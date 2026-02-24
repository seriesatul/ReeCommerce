import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Order from "@/models/Order";
import Store from "@/models/Store";
import Reel from "@/models/Reel";
import mongoose from "mongoose";

// ─── All possible values your checkout/verify might set ──────────
// Common values: "completed" | "paid" | "success" | "PAID"
const PAID_STATUSES = ["completed", "paid", "success", "PAID", "COMPLETED"];

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const store = await Store.findOne({ ownerId: session.user.id });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    // ─── Always cast to ObjectId — prevents type mismatch silently killing $match ──
    const storeId = new mongoose.Types.ObjectId(store._id.toString());

    // ─── Parse range ──────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") ?? "30d";
    const days  = range === "7d" ? 7 : range === "90d" ? 90 : 30;

    const now          = new Date();
    const periodStart  = new Date(now);
    periodStart.setDate(now.getDate() - days);
    const prevStart    = new Date(periodStart);
    prevStart.setDate(periodStart.getDate() - days);

    // ── DEBUG: log how many orders exist for this store at all ───
    const totalOrderCount = await Order.countDocuments({ storeId });
    const paidOrderCount  = await Order.countDocuments({
      storeId,
      paymentStatus: { $in: PAID_STATUSES },
    });
    console.log(`[analytics] storeId=${storeId} total_orders=${totalOrderCount} paid_orders=${paidOrderCount} range=${range}`);

    // If seller has orders but none matched — log the actual paymentStatus values
    if (totalOrderCount > 0 && paidOrderCount === 0) {
      const sample = await Order.find({ storeId }).limit(3).select("paymentStatus totalAmount").lean();
      console.warn("[analytics] paymentStatus values found in DB:", sample.map((o: any) => o.paymentStatus));
    }

    // ─── 1. Revenue over time (current period) ────────────────────
    const revenueStatsRaw = await Order.aggregate([
      {
        $match: {
          storeId,
          paymentStatus: { $in: PAID_STATUSES },
          createdAt: { $gte: periodStart, $lte: now },
        },
      },
      {
        $group: {
          _id:     { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: { $toDouble: "$totalAmount" } },   // $toDouble guards against string amounts
          orders:  { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ─── Map _id → human date label for chart XAxis ───────────────
    const revenueStats = revenueStatsRaw.map((d: any) => ({
      date:    new Date(d._id).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      revenue: Number(d.revenue) || 0,
      orders:  Number(d.orders)  || 0,
    }));

    // ─── 2. Previous period totals for trend badges ───────────────
    const prevAgg = await Order.aggregate([
      {
        $match: {
          storeId,
          paymentStatus: { $in: PAID_STATUSES },
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

    // ─── 3. Engagement ────────────────────────────────────────────
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

    // Prev views proxy (reels created before period as a snapshot estimate)
    const prevReelsAgg = await Reel.aggregate([
      { $match: { storeId, createdAt: { $lt: periodStart } } },
      { $group: { _id: null, totalViews: { $sum: { $ifNull: ["$viewsCount", 0] } } } },
    ]);

    // ─── 4. Top products by revenue ───────────────────────────────
    const topProducts = await Order.aggregate([
      { $match: { storeId, paymentStatus: { $in: PAID_STATUSES } } },
      { $unwind: "$items" },
      {
        $group: {
          _id:          "$items.productId",
          name:         { $first: "$items.name" },
          totalRevenue: { $sum: { $multiply: [{ $toDouble: "$items.priceAtPurchase" }, "$items.quantity"] } },
          totalSold:    { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
    ]);

    // ─── 5. Top reels for dashboard table ─────────────────────────
    const topReelsRaw = await Reel.find({ storeId })
      .sort({ viewsCount: -1 })
      .limit(5)
      .populate({ path: "productId", select: "name price imageUrl" })
      .lean();

    const topReels = topReelsRaw.map((r: any) => ({
      _id:          r._id,
      title:        r.productId?.name ?? r.title ?? "Untitled",
      thumbnailUrl: r.thumbnailUrl ?? "",
      views:        Number(r.viewsCount) || 0,
      likes:        Number(r.likesCount) || 0,
      revenue:      0,   // TODO: enrich from Order aggregate if needed
      convRate:     0,
      createdAt:    r.createdAt,
    }));

    return NextResponse.json({
      revenueStats,
      engagement: {
        totalViews: Number(engagement.totalViews) || 0,
        totalLikes: Number(engagement.totalLikes) || 0,
      },
      topProducts,
      topReels,
      prevRevenue: Number(prev.revenue) || 0,
      prevOrders:  Number(prev.orders)  || 0,
      prevViews:   Number(prevReelsAgg[0]?.totalViews) || 0,
      // Debug info — remove after confirming data flows correctly
      _debug: {
        totalOrderCount,
        paidOrderCount,
        storeId: storeId.toString(),
        range,
        periodStart,
      },
    });
  } catch (error: any) {
    console.error("[analytics] ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}