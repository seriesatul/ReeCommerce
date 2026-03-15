import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import User from "@/models/User";
import Order from "@/models/Order";
import Interaction from "@/models/Interaction";     // ← real source of truth for likes
import Subscription from "@/models/Subscription";  // ← real source of truth for follows
import mongoose from "mongoose";

// GET /api/profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const user = await User.findById(session.user.id)
    .select("name email image phone role provider createdAt interests pricePreference onboardingCompleted")
    .lean() as any;

  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const userId = new mongoose.Types.ObjectId(session.user.id);

  const [totalOrders, spentAgg, likedReelsCount, followingCount] = await Promise.all([
    Order.countDocuments({ buyerId: userId, status: { $nin: ["cancelled"] } }),
    Order.aggregate([
      { $match: { buyerId: userId, status: { $nin: ["cancelled"] } } },
      { $group: { _id: null, total: { $sum: { $toDouble: "$totalAmount" } } } },
    ]),
    // ← count from interactions collection, not Reel.likedBy[]
    Interaction.countDocuments({ userId, type: "like" }),
    // ← count from subscriptions collection, not Store.followers[]
    Subscription.countDocuments({ buyerId: userId }),
  ]);

  return NextResponse.json({
    _id:                 user._id,
    name:                user.name                ?? "",
    email:               user.email,
    image:               user.image               ?? "",
    phone:               user.phone               ?? "",
    role:                user.role,
    provider:            user.provider            ?? "credentials",
    createdAt:           user.createdAt,
    interests:           user.interests           ?? [],
    pricePreference:     user.pricePreference      ?? "mid",
    onboardingCompleted: user.onboardingCompleted  ?? false,
    stats: {
      totalOrders,
      totalSpent:  spentAgg[0]?.total ?? 0,
      likedReels:  likedReelsCount,
      following:   followingCount,
    },
  });
}

// PATCH /api/profile — update name and/or phone
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, phone } = await req.json();

  if (name !== undefined && (typeof name !== "string" || name.trim().length < 2))
    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });

  await connectDB();

  const update: Record<string, string> = {};
  if (name  !== undefined) update.name  = name.trim();
  if (phone !== undefined) update.phone = phone.trim();

  if (!Object.keys(update).length)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  await User.findByIdAndUpdate(session.user.id, { $set: update });
  return NextResponse.json({ success: true });
}