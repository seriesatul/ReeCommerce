import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Store from "@/models/Store";
import Reel from "@/models/Reel";
import Product from "@/models/Products"; // Singular model from Products.ts
import Subscription from "@/models/Subscription";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const session = await getServerSession(authOptions);
    
    await connectDB();

    // 1. Find the store by its unique slug/handle
    const store = await Store.findOne({ handle }).lean();
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // 2. Parallel Fetch: Reels, Products, and Follower Count
    // Industry Practice: Grouping queries to reduce "Waterfall" latency
    const [reels, products, followerCount, isFollowing] = await Promise.all([
      Reel.find({ storeId: store._id })
        .sort({ createdAt: -1 })
        .populate({ path: "productId", model: Product, select: "name price imageUrl" })
        .lean(),
      Product.find({ storeId: store._id }).sort({ createdAt: -1 }).limit(10).lean(),
      Subscription.countDocuments({ sellerId: store._id }),
      session?.user?.id 
        ? Subscription.exists({ buyerId: session.user.id, sellerId: store._id })
        : null
    ]);

    return NextResponse.json({
      store,
      reels,
      products,
      followerCount,
      isFollowing: !!isFollowing
    });

  } catch (error: any) {
    console.error("STORE_PROFILE_API_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}