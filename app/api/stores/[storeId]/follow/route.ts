import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Store from "@/models/Store";
import User from "@/models/User";
import mongoose from "mongoose";

// POST   /api/stores/[storeId]/follow  → follow
// DELETE /api/stores/[storeId]/follow  → unfollow
//
// BUG 5 FIX: Next.js 15 makes route params a Promise — must await before use.
//
// Both Store.followers and User.following are updated atomically in parallel
// so both arrays stay in sync. Store.followersCount is kept in sync via $inc.

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ storeId: string }> }  // ← BUG 5 FIX: Promise<>
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // BUG 5 FIX: await params before destructuring
  const { storeId: storeIdStr } = await params;

  await connectDB();

  const storeId = new mongoose.Types.ObjectId(storeIdStr);
  const userId  = new mongoose.Types.ObjectId(session.user.id);

  const store = await Store.findById(storeId)
    .select("_id followers followersCount ownerId")
    .lean() as any;
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  // Prevent self-follow
  if (store.ownerId?.toString() === session.user.id)
    return NextResponse.json({ error: "Cannot follow your own store" }, { status: 400 });

  // Idempotent — already following
  const alreadyFollowing = (store.followers ?? []).some(
    (id: any) => id.toString() === session.user.id
  );
  if (alreadyFollowing) {
    return NextResponse.json({ following: true, followerCount: store.followers?.length ?? 0 });
  }

  await Promise.all([
    Store.findByIdAndUpdate(storeId, {
      $addToSet: { followers: userId },
      $inc:      { followersCount: 1 },
    }),
    User.findByIdAndUpdate(userId, {
      $addToSet: { following: storeId },
    }),
  ]);

  return NextResponse.json({
    following:     true,
    followerCount: (store.followers?.length ?? 0) + 1,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ storeId: string }> }  // ← BUG 5 FIX: Promise<>
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // BUG 5 FIX: await params before destructuring
  const { storeId: storeIdStr } = await params;

  await connectDB();

  const storeId = new mongoose.Types.ObjectId(storeIdStr);
  const userId  = new mongoose.Types.ObjectId(session.user.id);

  const store = await Store.findById(storeId)
    .select("_id followers followersCount")
    .lean() as any;
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  await Promise.all([
    Store.findByIdAndUpdate(storeId, {
      $pull: { followers: userId },
      $inc:  { followersCount: -1 },
    }),
    User.findByIdAndUpdate(userId, {
      $pull: { following: storeId },
    }),
  ]);

  return NextResponse.json({
    following:     false,
    followerCount: Math.max(0, (store.followers?.length ?? 1) - 1),
  });
}