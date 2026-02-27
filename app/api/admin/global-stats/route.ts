import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db/connect";
import User from "@/models/User";
import Store from "@/models/Store";
import Reel from "@/models/Reel";
import Order from "@/models/Order";
import Product from "@/models/Products";

// ── Field reference (from actual models) ─────────────────────────
//
// Order:  buyerId, storeId, totalAmount, status, paymentStatus
//   status:        "pending"|"processing"|"shipped"|"delivered"|"cancelled"
//   paymentStatus: "pending"|"completed"|"failed"|"refunded"
//   ✓ A paid order = paymentStatus "completed"
//   ✓ A fulfilled order = status "delivered"
//
// Store:  ownerId, verificationStatus ("pending"|"verified"|"rejected"), isActive
//   ✗ NO "status" field — use verificationStatus
//   ✗ NO "userId" field — use ownerId
//
// User:   role ("user"|"seller"|"admin"), no sellerStatus field
//
// ── GET /api/admin/global-stats ──────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const d7  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);

    // ── All queries in parallel ──────────────────────────────────
    const [
      totalUsers,   prevUsers,
      totalReels,   prevReels,
      totalOrders,  prevOrders,
      totalStores,
      pendingStores,
      totalProducts,
      revenueAgg,   prevRevenueAgg,
      dailyAgg,
      topStoresAgg,
      recentDocs,
      flaggedCount,
      newUsersWeek,
    ] = await Promise.all([

      // Users created in window
      User.countDocuments({ createdAt: { $gte: d30 } }),
      User.countDocuments({ createdAt: { $gte: d60, $lt: d30 } }),

      // Reels created in window
      Reel.countDocuments({ createdAt: { $gte: d30 } }),
      Reel.countDocuments({ createdAt: { $gte: d60, $lt: d30 } }),

      // All orders in window (total volume)
      Order.countDocuments({ createdAt: { $gte: d30 } }),
      Order.countDocuments({ createdAt: { $gte: d60, $lt: d30 } }),

      // Store counts — using correct field: verificationStatus
      Store.countDocuments(),
      Store.countDocuments({ verificationStatus: "pending" }),

      Product.countDocuments(),

      // Revenue = sum of totalAmount where paymentStatus is "completed"
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: d30 },
            paymentStatus: "completed", // ← correct field from IOrder
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" }, // ← correct field from IOrder
            count: { $sum: 1 },
          },
        },
      ]),

      // Prior period revenue for % change
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: d60, $lt: d30 },
            paymentStatus: "completed",
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),

      // Daily chart: revenue (paid orders) + total orders per day
      Order.aggregate([
        { $match: { createdAt: { $gte: d30 } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            // revenue only from completed payments
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ["$paymentStatus", "completed"] },
                  "$totalAmount",
                  0,
                ],
              },
            },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top 5 stores by GMV (paid orders only)
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: d30 },
            paymentStatus: "completed",
          },
        },
        {
          $group: {
            _id: "$storeId",
            gmv:    { $sum: "$totalAmount" }, // ← totalAmount
            orders: { $sum: 1 },
          },
        },
        { $sort: { gmv: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "stores",
            localField: "_id",
            foreignField: "_id",
            as: "store",
            pipeline: [{ $project: { name: 1, handle: 1, logoUrl: 1 } }],
          },
        },
        { $unwind: { path: "$store", preserveNullAndEmptyArrays: true } },
      ]),

      // Recent 6 orders — populate buyerId (not userId) and storeId
      Order.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("buyerId",  "name email") // ← buyerId from IOrder
        .populate("storeId",  "name handle")
        .select("totalAmount status paymentStatus createdAt buyerId storeId")
        .lean(),

      // Flagged reels
      Reel.countDocuments({ flagged: true, flagReviewed: { $ne: true } }),

      // New signups last 7 days
      User.countDocuments({ createdAt: { $gte: d7 } }),
    ]);

    // ── Derived values ───────────────────────────────────────────
    const pct = (c: number, p: number) =>
      p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 100);

    const totalRevenue  = revenueAgg[0]?.total ?? 0;
    const prevRevenue   = prevRevenueAgg[0]?.total ?? 0;
    const paidCount     = revenueAgg[0]?.count ?? 0;
    const avgOrderValue = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;

    // ── Fill chart gaps (every day in 30d window) ────────────────
    const chartMap: Record<string, { revenue: number; orders: number }> = {};
    for (const d of dailyAgg) {
      chartMap[d._id] = { revenue: d.revenue, orders: d.orders };
    }
    const chartData = Array.from({ length: 30 }, (_, i) => {
      const d   = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      return {
        date:    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        revenue: chartMap[key]?.revenue ?? 0,
        orders:  chartMap[key]?.orders  ?? 0,
      };
    });

    // ── Format top stores ────────────────────────────────────────
    const topStores = topStoresAgg.map((s: any) => ({
      _id:    String(s._id),
      name:   s.store?.name    ?? "Unknown",
      handle: s.store?.handle  ?? "",
      logo:   s.store?.logoUrl ?? null,
      gmv:    s.gmv,
      orders: s.orders,
    }));

    // ── Format recent orders ─────────────────────────────────────
    // buyerId is populated (IOrder has buyerId ref User)
    const recentOrders = (recentDocs as any[]).map(o => ({
      _id:           String(o._id),
      amount:        o.totalAmount,           // ← totalAmount
      status:        o.status,
      paymentStatus: o.paymentStatus,
      createdAt:     o.createdAt,
      buyer:         o.buyerId?.name  || o.buyerId?.email  || "Unknown", // ← buyerId
      store:         o.storeId?.name  || o.storeId?.handle || "Unknown",
    }));

    // ── Response ─────────────────────────────────────────────────
    return NextResponse.json({
      kpis: {
        totalRevenue,
        totalOrders:    totalOrders,
        totalUsers,
        totalReels,
        totalStores,
        pendingSellers: pendingStores,  // stores with verificationStatus "pending"
        totalProducts,
        avgOrderValue,
        newUsersWeek,
        flaggedReels:   flaggedCount,
      },
      changes: {
        revenue: pct(totalRevenue, prevRevenue),
        orders:  pct(totalOrders,  prevOrders),
        users:   pct(totalUsers,   prevUsers),
        reels:   pct(totalReels,   prevReels),
      },
      chartData,
      topStores,
      recentOrders,
    });

  } catch (err) {
    console.error("[admin/global-stats] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}