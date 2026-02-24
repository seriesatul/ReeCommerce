import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Reel from "@/models/Reel";
import Product from "@/models/Products"; 
import Store from "@/models/Store";
import Subscription from "@/models/Subscription";
import Interaction from "@/models/Interaction";

/**
 * INDUSTRY BEST PRACTICE: Timeline-Aware Feed Engine
 * This API performs "Deep Population" to fetch all products linked 
 * to specific timestamps (hotspots) within the video.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    await connectDB();

    // 1. Fetch Reels with Multi-Level Population
    const reels = await Reel.find({})
      .sort({ createdAt: -1 })
      // Populate the primary product (backward compatibility)
      .populate({ 
        path: "productId", 
        model: Product,
        select: "name price imageUrl description mrp stock" 
      })
      // Populate the store details
      .populate({ 
        path: "storeId", 
        model: Store,
        select: "name handle logoUrl ownerId" 
      })
      // NEW: Deep Populate the Hotspots timeline
      // This ensures all products in the video are available to the frontend instantly
      .populate({
        path: "hotspots.productId",
        model: Product,
        select: "name price imageUrl description mrp stock"
      })
      .lean();

    // 2. State Synchronization (The "Social" Layer)
    if (session?.user?.id) {
      const userId = session.user.id;

      // Parallel fetching for performance optimization
      const [subscriptions, likes] = await Promise.all([
        Subscription.find({ buyerId: userId }).select("sellerId").lean(),
        Interaction.find({ userId, type: "like" }).select("reelId").lean()
      ]);

      const followedStoreIds = new Set(subscriptions.map(s => s.sellerId.toString()));
      const likedReelIds = new Set(likes.map(l => l.reelId.toString()));

      // 3. Inject "isLiked", "isSubscribed" and Format Hotspots
      const enrichedReels = reels.map((reel: any) => ({
        ...reel,
        isSubscribed: followedStoreIds.has(reel.storeId?._id.toString()),
        isLiked: likedReelIds.has(reel._id.toString()),
      }));

      return NextResponse.json(enrichedReels);
    }

    // Return reels for guest users (with full hotspot product data)
    return NextResponse.json(reels || []);
  } catch (error: any) {
    console.error("FEED_ENGINE_METADATA_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load interactive discovery feed", details: error.message }, 
      { status: 500 }
    );
  }
}