import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Reel from "@/models/Reel";
import Store from "@/models/Store";
import Product from "@/models/Products"; // Ensure this is imported for populate

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // 1. Find the store owned by this user
    const store = await Store.findOne({ ownerId: session.user.id });

    if (!store) {
      return NextResponse.json({ error: "No store found for this account" }, { status: 404 });
    }

    // 2. Fetch reels linked specifically to this storeId
    const reels = await Reel.find({ storeId: store._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "productId",
        model: Product,
        select: "name price stock imageUrl"
      });

    console.log(`Found ${reels.length} reels for store: ${store.name}`);

    return NextResponse.json(reels);
  } catch (error: any) {
    console.error("DASHBOARD_REELS_ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard reels" }, { status: 500 });
  }
}