import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Interaction from "@/models/Interaction";
import Reel from "@/models/Reel";
import "@/models/Store";   // register Store schema so populate("storeId") works
import mongoose from "mongoose";

// GET /api/profile/liked-reels
//
// Source of truth: interactions collection { userId, reelId, type:"like" }
// This is where the like/unlike route has always been writing to.

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const userId = new mongoose.Types.ObjectId(session.user.id);

  // Step 1: get all reelIds this user has liked from interactions
  const interactions = await Interaction.find({ userId, type: "like" })
    .select("reelId")
    .sort({ createdAt: -1 })
    .lean() as any[];

  if (interactions.length === 0) {
    return NextResponse.json({ reels: [], total: 0 });
  }

  const reelIds = interactions.map((i: any) => i.reelId);

  // Step 2: fetch the actual reel documents in the same order
  const reels = await Reel.find({ _id: { $in: reelIds } })
    .populate("storeId", "name handle logoUrl")
    .select("title thumbnailUrl videoUrl viewsCount likesCount storeId createdAt tags")
    .lean() as any[];

  // Step 3: restore the liked order (newest liked first)
  const reelMap = new Map(reels.map((r: any) => [r._id.toString(), r]));
  const ordered = reelIds
    .map((id: any) => reelMap.get(id.toString()))
    .filter(Boolean);

  return NextResponse.json({ reels: ordered, total: ordered.length });
}