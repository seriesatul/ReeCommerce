import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Order from "@/models/Order";
import "@/models/Store"; // register Store schema so populate("storeId") never throws

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // BUG 1 FIX: await params first, then use destructured `id` everywhere.
  // Previously the code did `const { id } = await params` but then called
  // `Order.findById(params.id)` — params is a Promise so params.id === undefined,
  // which caused every single order lookup to return null / 404.
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const order = await Order.findById(id)          // ← id, not params.id
      .populate("storeId", "name handle logoUrl")
      .populate("buyerId", "name email")
      .lean();

    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const buyerId = order.buyerId?._id?.toString() ?? (order.buyerId as any)?.toString();
    const isOwner  = buyerId === session.user.id;
    const isSeller = session.user.role === "seller";
    const isAdmin  = session.user.role === "admin";

    if (!isOwner && !isSeller && !isAdmin)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json(order);

  } catch (error: any) {
    console.error("[orders/id] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── PATCH: seller updates order status ──────────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }  // BUG 2 FIX: was { id: string } — not a Promise
) {
  // BUG 2 FIX: await before use
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "seller")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { status } = await request.json();

    const VALID_TRANSITIONS: Record<string, string[]> = {
      pending:    ["processing", "cancelled"],
      processing: ["shipped",    "cancelled"],
      shipped:    ["delivered"],
      delivered:  [],
      cancelled:  [],
    };

    const order = await Order.findById(id).lean();  // ← id, not params.id
    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status))
      return NextResponse.json(
        { error: `Cannot transition from ${order.status} to ${status}` },
        { status: 400 }
      );

    const updated = await Order.findByIdAndUpdate(
      id,                                           // ← id, not params.id
      { status, updatedAt: new Date() },
      { new: true }
    )
      .populate("storeId", "name handle logoUrl")
      .populate("buyerId", "name email")
      .lean();

    return NextResponse.json(updated);

  } catch (error: any) {
    console.error("[orders/id] PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}