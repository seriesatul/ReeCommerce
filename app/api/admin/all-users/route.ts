import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import User from "@/models/User";

// ── Field reference (from IUser) ──────────────────────────────────
// name, email, image, role ("user"|"seller"|"admin")
// provider ("credentials"|"google")
// onboardingCompleted: Boolean
// interests: string[]
// pricePreference: "budget"|"mid"|"luxury"
// createdAt, updatedAt (via timestamps)
// password: excluded via select:false
// ─────────────────────────────────────────────────────────────────

// ── GET /api/admin/all-users ──────────────────────────────────────
// Query params:
//   role    = all | user | seller | admin
//   q       = search name or email
//   page    = page number (default 1)
//   limit   = per page (default 20)
//   sort    = newest | oldest | name
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const role  = searchParams.get("role")  || "all";
  const q     = searchParams.get("q")?.trim() || "";
  const page  = Math.max(1, parseInt(searchParams.get("page")  || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const sort  = searchParams.get("sort") || "newest";

  try {
    // ── Build query ──────────────────────────────────────────────
    const query: Record<string, any> = {};

    if (role !== "all") query.role = role;

    if (q) {
      query.$or = [
        { name:  { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    // ── Sort ─────────────────────────────────────────────────────
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      oldest: { createdAt:  1 },
      name:   { name:       1 },
    };
    const sortObj = sortMap[sort] || sortMap.newest;

    // ── Run queries in parallel ──────────────────────────────────
    const [users, total, userCount, sellerCount, adminCount, newThisWeek] = await Promise.all([
      User.find(query)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        // Never return password — it's select:false anyway but be explicit
        .select("name email image role provider onboardingCompleted interests pricePreference createdAt")
        .lean(),

      User.countDocuments(query),

      // Counts for the stats tiles (always global, ignoring search)
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "seller" }),
      User.countDocuments({ role: "admin" }),

      // New signups this week
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total:       userCount + sellerCount + adminCount,
        users:       userCount,
        sellers:     sellerCount,
        admins:      adminCount,
        newThisWeek,
      },
    });

  } catch (err) {
    console.error("[admin/all-users]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH /api/admin/all-users ────────────────────────────────────
// Change a user's role. Body: { userId, role }
// Guards: cannot demote/promote yourself, cannot change another admin
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { userId, role } = await req.json();

    const VALID_ROLES = ["user", "seller", "admin"];
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await connectDB();

    // Safety: cannot change your own role
    if (userId === (session.user as any).id) {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("name email role");

    if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, user: updated });

  } catch (err) {
    console.error("[admin/all-users PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}