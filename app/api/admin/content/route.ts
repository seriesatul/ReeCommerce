import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Reel from "@/models/Reel";

// ── Field reference (from IReel) ──────────────────────────────────
// isPublished: Boolean — true = live, false = taken down (soft delete)
// title, description — optional text fields
// storeId → ref "Store"
// likesCount, viewsCount, score — engagement metrics
// No "flagged" field — moderation is handled via isPublished only
// ─────────────────────────────────────────────────────────────────

// ── GET /api/admin/content?filter=all|live|taken-down&page=1&q= ──
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "all";   // all | live | taken-down
  const page   = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const q      = searchParams.get("q")?.trim() || "";
  const limit  = 30;

  // Build query
  const query: Record<string, any> = {};
  if (filter === "live")       query.isPublished = true;
  if (filter === "taken-down") query.isPublished = false;

  try {
    const [reels, total, liveCount, takenDownCount] = await Promise.all([
      Reel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("storeId", "name handle logoUrl")   // for store name in card
        .populate("productId", "name imageUrl price")  // for product context
        .select("title description thumbnailUrl videoUrl isPublished likesCount viewsCount score isMultiProduct createdAt storeId productId hotspots")
        .lean(),

      Reel.countDocuments(query),
      Reel.countDocuments({ isPublished: true }),
      Reel.countDocuments({ isPublished: false }),
    ]);

    // Apply in-memory title/store search after populate
    // (MongoDB text search would require a text index — keeping it simple for now)
    const searched = q
      ? reels.filter((r: any) =>
          r.title?.toLowerCase().includes(q.toLowerCase()) ||
          (r.storeId as any)?.name?.toLowerCase().includes(q.toLowerCase()) ||
          (r.storeId as any)?.handle?.toLowerCase().includes(q.toLowerCase())
        )
      : reels;

    return NextResponse.json({
      reels: searched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      counts: {
        all:       total,
        live:      liveCount,
        takenDown: takenDownCount,
      },
    });

  } catch (err) {
    console.error("[admin/content GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}