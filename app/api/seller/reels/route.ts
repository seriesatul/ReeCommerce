import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Reel from "@/models/Reel";
import Store from "@/models/Store";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find the store belonging to this seller
    const store = await Store.findOne({ ownerId: session.user.id }).lean();
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Fetch all reels for this store, populate linked product
    const reels = await Reel.find({ storeId: store._id })
      .populate("productId", "name price stock imageUrl")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ reels }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/seller/reels]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}