import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db/connect";
import User from "@/models/User";
import Store from "@/models/Store";
import Reel from "@/models/Reel";

// ── GET /api/admin/notifications ─────────────────────────────────
// User schema has NO sellerStatus field.
// Role transitions directly: "user" → "seller" (after onboarding).
// Pending approval state lives on the Store document (status: "pending").
//
// Notification sources:
//   1. Store docs with status "pending"    → seller approval queue
//   2. Reels with flagged true             → content moderation queue
//   3. Users created in last 24h          → growth signal (pre-read)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [pendingStores, flaggedReels, newUsers] = await Promise.all([

      // Stores awaiting admin approval
      Store.find({ status: "pending" })
        .sort({ createdAt: -1 })
        .limit(10)
        // Populate owner name/email from the User document
        // Adjust the ref field to match your Store schema (userId / owner / sellerId)
        .populate("userId", "name email")
        .select("name handle status createdAt userId")
        .lean(),

      // Flagged reels not yet reviewed
      Reel.find({ flagged: true, flagReviewed: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("caption flagReason createdAt")
        .lean(),

      // New user signups in the last 24 h
      User.find({ createdAt: { $gte: yesterday } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email createdAt role")
        .lean(),
    ]);

    const notifications: {
      id:        string;
      type:      string;
      title:     string;
      message:   string;
      read:      boolean;
      href:      string;
      createdAt: Date;
    }[] = [];

    // ── Pending store approvals (unread — action required) ────────
    for (const s of pendingStores) {
      const store  = s as any;
      // owner could be populated object or just an id
      const owner  = store.userId;
      const ownerName =
        typeof owner === "object"
          ? owner?.name || owner?.email || "Unknown"
          : "A seller";

      notifications.push({
        id:        String(store._id),
        type:      "seller_pending",
        title:     "New seller application",
        message:   `${ownerName} applied with store "${store.name || store.handle}"`,
        read:      false,
        href:      "/admin/sellers",
        createdAt: store.createdAt,
      });
    }

    // ── Flagged reels (unread — action required) ──────────────────
    for (const r of flaggedReels) {
      const reel   = r as any;
      const caption = reel.caption?.slice(0, 40) || "Untitled reel";
      notifications.push({
        id:        String(reel._id),
        type:      "flagged_content",
        title:     "Content flagged for review",
        message:   `"${caption}" — ${reel.flagReason || "reported by user"}`,
        read:      false,
        href:      "/admin/content",
        createdAt: reel.createdAt,
      });
    }

    // ── New signups (pre-read — informational) ────────────────────
    for (const u of newUsers) {
      const user = u as any;
      notifications.push({
        id:        String(user._id),
        type:      "new_user",
        title:     "New user joined",
        message:   `${user.name || user.email} signed up as ${user.role}`,
        read:      true,
        href:      "/admin/users",
        createdAt: user.createdAt,
      });
    }

    // Newest first
    notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      notifications,
      count:       notifications.length,
      unreadCount: notifications.filter(n => !n.read).length,
    });

  } catch (err) {
    console.error("[admin/notifications] Error:", err);
    return NextResponse.json({ notifications: [], count: 0, unreadCount: 0 });
  }
}