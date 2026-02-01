import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Reel from "@/models/Reel";
import Product from "@/models/Products"; // Use singular
import Store from "@/models/Store";
import Subscription from "@/models/Subscription";
import Interaction from "@/models/Interaction";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    await connectDB();

    // 1. Fetch Reels
    const reels = await Reel.find({})
      .sort({ createdAt: -1 })
      .populate({ path: "productId", model: Product })
      .populate({ path: "storeId", model: Store })
      .lean();

    // 2. If user is logged in, fetch their interactions to sync UI state
    if (session?.user?.id) {
      const userId = session.user.id;

      // Get all stores this user follows
      const subscriptions = await Subscription.find({ buyerId: userId }).select("sellerId");
      const followedStoreIds = new Set(subscriptions.map(s => s.sellerId.toString()));

      // Get all reels this user has liked
      const likes = await Interaction.find({ userId, type: "like" }).select("reelId");
      const likedReelIds = new Set(likes.map(l => l.reelId.toString()));

      // 3. Inject state into the reel objects
      const enrichedReels = reels.map((reel: any) => ({
        ...reel,
        isSubscribed: followedStoreIds.has(reel.storeId?._id.toString()),
        isLiked: likedReelIds.has(reel._id.toString()),
      }));

      return NextResponse.json(enrichedReels);
    }

    return NextResponse.json(reels);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}