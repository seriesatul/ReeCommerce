import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Store from "@/models/Store";

// ── GET /api/admin/pending-stores?status=pending|verified|rejected ──
// Also returns counts for all three buckets for the tab badges.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending"; // default pending

  // Validate status value
  const VALID = ["pending", "verified", "rejected"];
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    // Run store fetch + all three counts in parallel
    const [stores, pendingCount, verifiedCount, rejectedCount] = await Promise.all([
      Store.find({ verificationStatus: status })
        .sort({ createdAt: -1 })
        // Populate owner name + email from User
        // ownerId refs "User" per Store schema
        .populate("ownerId", "name email image")
        .lean(),

      Store.countDocuments({ verificationStatus: "pending" }),
      Store.countDocuments({ verificationStatus: "verified" }),
      Store.countDocuments({ verificationStatus: "rejected" }),
    ]);

    return NextResponse.json({
      stores,
      counts: { pending: pendingCount, verified: verifiedCount, rejected: rejectedCount },
    });
  } catch (err) {
    console.error("[admin/pending-stores]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}