import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Store from "@/models/Store";

// ─── GET /api/seller/profile ────────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const store = await Store.findOne({ ownerId: session.user.id })
      // Explicitly select secure fields so they come back for the owner
      .select("+panNumber +bankDetails.accountNumber +bankDetails.ifscCode")
      .lean();

    if (!store)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    return NextResponse.json(store);
  } catch (err) {
    console.error("[GET /api/seller/profile]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH /api/seller/profile ──────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const store = await Store.findOne({ ownerId: session.user.id });
    if (!store)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const body = await req.json();

    // ── Allowed fields per section ────────────────────────────────────────
    // Branding
    if (body.name        !== undefined) store.name        = String(body.name).trim();
    if (body.description !== undefined) store.description = String(body.description).slice(0, 300);
    if (body.logoUrl     !== undefined) store.logoUrl     = body.logoUrl;
    if (body.category    !== undefined) store.category    = body.category;

    // Handle uniqueness check
    if (body.handle !== undefined) {
      const normalized = String(body.handle).toLowerCase().replace(/[^a-z0-9-_]/g, "");
      if (normalized !== store.handle) {
        const conflict = await Store.findOne({ handle: normalized, _id: { $ne: store._id } });
        if (conflict)
          return NextResponse.json({ error: "Handle already taken" }, { status: 409 });
        store.handle = normalized;
      }
    }

    // Verification
    if (body.businessType !== undefined) store.businessType = body.businessType;
    if (body.panNumber    !== undefined) store.panNumber    = body.panNumber.toUpperCase().trim();

    // Finance — merge nested bankDetails
    if (body.bankDetails) {
      if (!store.bankDetails) store.bankDetails = {} as any;
      if (body.bankDetails.holderName    !== undefined) store.bankDetails.holderName    = body.bankDetails.holderName.trim();
      if (body.bankDetails.accountNumber !== undefined) store.bankDetails.accountNumber = body.bankDetails.accountNumber.replace(/\D/g, "");
      if (body.bankDetails.ifscCode      !== undefined) store.bankDetails.ifscCode      = body.bankDetails.ifscCode.toUpperCase().trim();
    }

    // Operations
    if (body.pickupAddress  !== undefined) store.pickupAddress  = body.pickupAddress.trim();
    if (body.shippingMethod !== undefined) store.shippingMethod = body.shippingMethod;
    if (body.isActive       !== undefined) store.isActive       = Boolean(body.isActive);

    await store.save();

    // Return without secure fields
    const updated = await Store.findById(store._id).lean();
    return NextResponse.json({ success: true, store: updated });
  } catch (err: any) {
    console.error("[PATCH /api/seller/profile]", err);
    // Duplicate key (handle race condition)
    if (err.code === 11000)
      return NextResponse.json({ error: "Handle already taken" }, { status: 409 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}