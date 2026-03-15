import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Interaction from "@/models/Interaction";
import Reel from "@/models/Reel";
import mongoose from "mongoose";

// POST   /api/reels/[reelId]/like  → like
// DELETE /api/reels/[reelId]/like  → unlike
//
// Source of truth: interactions collection { userId, reelId, type:"like" }
// Also keeps Reel.likesCount in sync via $inc for display purposes.

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ reelId: string }> }   // ← reelId, not storeId
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reelId: reelIdStr } = await params;

  await connectDB();

  const reelId = new mongoose.Types.ObjectId(reelIdStr);
  const userId = new mongoose.Types.ObjectId(session.user.id);

  const reel = await Reel.findById(reelId).select("_id likesCount").lean() as any;
  if (!reel)
    return NextResponse.json({ error: "Reel not found" }, { status: 404 });

  // Idempotent — already liked
  const existing = await Interaction.findOne({ userId, reelId, type: "like" }).lean();
  if (existing)
    return NextResponse.json({ liked: true, likesCount: reel.likesCount ?? 0 });

  // Write to interactions + update counter
  await Promise.all([
    Interaction.create({ userId, reelId, type: "like" }),
    Reel.findByIdAndUpdate(reelId, { $inc: { likesCount: 1 } }),
  ]);

  return NextResponse.json({
    liked:      true,
    likesCount: (reel.likesCount ?? 0) + 1,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ reelId: string }> }   // ← reelId, not storeId
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reelId: reelIdStr } = await params;

  await connectDB();

  const reelId = new mongoose.Types.ObjectId(reelIdStr);
  const userId = new mongoose.Types.ObjectId(session.user.id);

  const reel = await Reel.findById(reelId).select("_id likesCount").lean() as any;
  if (!reel)
    return NextResponse.json({ error: "Reel not found" }, { status: 404 });

  const deleted = await Interaction.deleteOne({ userId, reelId, type: "like" });

  if (deleted.deletedCount > 0)
    await Reel.findByIdAndUpdate(reelId, { $inc: { likesCount: -1 } });

  return NextResponse.json({
    liked:      false,
    likesCount: Math.max(0, (reel.likesCount ?? 1) - 1),
  });
}