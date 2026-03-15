import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Store from "@/models/Store";
import Reel from "@/models/Reel";
import Product from "@/models/Products";
import mongoose from "mongoose";

// GET /api/store/[handle]
//
// BUG 2 FIX: removed Subscription model import — it does not exist in this project.
// This project uses Store.followers[] array as the source of truth for follow state.
// followerCount and isFollowing are now derived from that array.

export async function GET(
  req: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const session    = await getServerSession(authOptions);

    await connectDB();

    const store = await Store.findOne({ handle }).lean() as any;
    if (!store)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const userId = session?.user?.id
      ? new mongoose.Types.ObjectId(session.user.id)
      : null;

    const [reels, products] = await Promise.all([
      Reel.find({ storeId: store._id, isPublished: true })
        .sort({ score: -1, createdAt: -1 })
        .populate({ path: "productId", model: Product, select: "name price imageUrl" })
        .lean(),
      Product.find({ storeId: store._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    // BUG 2 FIX: followerCount and isFollowing come from Store.followers[] — the
    // single source of truth. No separate collection needed.
    const followers: mongoose.Types.ObjectId[] = store.followers ?? [];
    const followerCount = followers.length;
    const isFollowing   = userId
      ? followers.some((id: any) => id.toString() === userId.toString())
      : false;

    return NextResponse.json({
      store,
      reels,
      products,
      followerCount,
      isFollowing,
    });

  } catch (error: any) {
    console.error("[store/handle] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}