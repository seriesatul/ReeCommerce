import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Reel from "@/models/Reel";

type Params = { params: Promise<{ id: string }> };

// ── DELETE /api/admin/content/[id] ───────────────────────────────
// Soft takedown: sets isPublished = false instead of hard delete.
// Hard deletes are irreversible and destroy analytics — industry
// practice is to soft-delete so content can be restored or audited.
export async function DELETE(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const reel = await Reel.findByIdAndUpdate(
      id,
      { isPublished: false },
      { new: true }
    );

    if (!reel) return NextResponse.json({ error: "Reel not found" }, { status: 404 });

    return NextResponse.json({ success: true, isPublished: false });
  } catch (err) {
    console.error("[admin/content DELETE]", err);
    return NextResponse.json({ error: "Takedown failed" }, { status: 500 });
  }
}

// ── PATCH /api/admin/content/[id] ───────────────────────────────
// Restore: sets isPublished = true (undo takedown).
export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const reel = await Reel.findByIdAndUpdate(
      id,
      { isPublished: true },
      { new: true }
    );

    if (!reel) return NextResponse.json({ error: "Reel not found" }, { status: 404 });

    return NextResponse.json({ success: true, isPublished: true });
  } catch (err) {
    console.error("[admin/content PATCH]", err);
    return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  }
}