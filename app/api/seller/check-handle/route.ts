import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Store from "@/models/Store";

// GET /api/seller/check-handle?handle=my-store
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const handle = req.nextUrl.searchParams.get("handle")?.toLowerCase().trim();

    if (!handle || handle.length < 3)
      return NextResponse.json({ available: false, reason: "Too short" });

    if (!/^[a-z0-9-_]+$/.test(handle))
      return NextResponse.json({ available: false, reason: "Invalid characters" });

    await connectDB();

    // Find the current seller's store so we don't flag their own handle
    const myStore   = await Store.findOne({ ownerId: session.user.id }).select("_id").lean();
    const conflict  = await Store.findOne({
      handle,
      ...(myStore ? { _id: { $ne: myStore._id } } : {}),
    }).select("_id").lean();

    return NextResponse.json({ available: !conflict });
  } catch (err) {
    console.error("[GET /api/seller/check-handle]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}