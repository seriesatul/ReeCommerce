import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Subscription from "@/models/Subscription";
import Store from "@/models/Store";
import Product from "@/models/Products";
import mongoose from "mongoose";

// GET /api/profile/following
//
// Source of truth: subscriptions collection { buyerId, sellerId }
// sellerId in subscriptions = Store._id

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const userId = new mongoose.Types.ObjectId(session.user.id);

  // Step 1: get all storeIds this user follows from subscriptions
  const subs = await Subscription.find({ buyerId: userId })
    .select("sellerId")
    .sort({ createdAt: -1 })
    .lean() as any[];

  if (subs.length === 0) {
    return NextResponse.json({ stores: [], total: 0 });
  }

  const storeIds = subs.map((s: any) => s.sellerId);

  // Step 2: fetch store documents
  const stores = await Store.find({ _id: { $in: storeIds } })
    .select("name handle logoUrl category followersCount createdAt")
    .lean() as any[];

  // Step 3: enrich with live product count
  const productCounts = await Product.aggregate([
    { $match: { storeId: { $in: storeIds } } },
    { $group: { _id: "$storeId", count: { $sum: 1 } } },
  ]);

  const countMap: Record<string, number> = {};
  productCounts.forEach((p: any) => { countMap[p._id.toString()] = p.count; });

  // Step 4: get follower count per store from subscriptions
  const followerCounts = await Subscription.aggregate([
    { $match: { sellerId: { $in: storeIds } } },
    { $group: { _id: "$sellerId", count: { $sum: 1 } } },
  ]);

  const followerMap: Record<string, number> = {};
  followerCounts.forEach((f: any) => { followerMap[f._id.toString()] = f.count; });

  // Step 5: restore followed order (newest first) and enrich
  const storeMap = new Map(stores.map((s: any) => [s._id.toString(), s]));
  const enriched = storeIds
    .map((id: any) => {
      const s = storeMap.get(id.toString());
      if (!s) return null;
      return {
        _id:          s._id,
        name:         s.name,
        handle:       s.handle,
        logoUrl:      s.logoUrl      ?? "",
        category:     s.category     ?? "General",
        followerCount: followerMap[s._id.toString()] ?? s.followersCount ?? 0,
        productCount:  countMap[s._id.toString()]    ?? 0,
        createdAt:    s.createdAt,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ stores: enriched, total: enriched.length });
}