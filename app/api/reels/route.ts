import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Reel from "@/models/Reel";
import Product from "@/models/Products"; // Singular model name from plural file
import Store from "@/models/Store";
import Subscription from "@/models/Subscription";
import Interaction from "@/models/Interaction";

/**
 * INDUSTRY BEST PRACTICE: Smart Feed Engine
 * This API not only fetches reels but "enriches" them with the 
 * current user's interaction state (Liked/Followed).
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    await connectDB();

    // 1. Fetch Reels with optimized population
    // We only select fields necessary for the feed to reduce payload size
    const reels = await Reel.find({})
      .sort({ createdAt: -1 })
      .populate({ 
        path: "productId", 
        model: Product,
        select: "name price imageUrl description mrp stock" 
      })
      .populate({ 
        path: "storeId", 
        model: Store,
        // CRITICAL for Bug #4: Explicitly include handle and logoUrl for the profile link
        select: "name handle logoUrl ownerId" 
      })
      .lean();

    // 2. State Synchronization (The "Social" Layer)
    if (session?.user?.id) {
      const userId = session.user.id;

      // Parallel fetching for performance
      const [subscriptions, likes] = await Promise.all([
        Subscription.find({ buyerId: userId }).select("sellerId").lean(),
        Interaction.find({ userId, type: "like" }).select("reelId").lean()
      ]);

      const followedStoreIds = new Set(subscriptions.map(s => s.sellerId.toString()));
      const likedReelIds = new Set(likes.map(l => l.reelId.toString()));

      // 3. Inject "isLiked" and "isSubscribed" flags
      const enrichedReels = reels.map((reel: any) => ({
        ...reel,
        // Check if current user follows the store of this reel
        isSubscribed: followedStoreIds.has(reel.storeId?._id.toString()),
        // Check if current user liked this specific reel
        isLiked: likedReelIds.has(reel._id.toString()),
      }));

      return NextResponse.json(enrichedReels);
    }

    // Return plain reels for guest users
    return NextResponse.json(reels);
  } catch (error: any) {
    console.error("FEED_ENGINE_ERROR:", error);
    return NextResponse.json({ error: "Failed to load discovery feed" }, { status: 500 });
  }
}