import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Store from "@/models/Store";
import User from "@/models/User";
import { createNotification } from "@/lib/notifications";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 1. ROLE GATE: Only the Super Admin can verify
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { storeId, status, note } = await req.json(); // status: "verified" or "rejected"
    await connectDB();

    const store = await Store.findByIdAndUpdate(
      storeId,
      { verificationStatus: status },
      { new: true }
    ).populate("ownerId");

    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    // 2. TRIGGER NOTIFICATION TO SELLER
    await createNotification({
      recipientId: store.ownerId._id.toString(),
      type: "SYSTEM",
      title: status === "verified" ? "Shop Approved! 🚀" : "Update Required ⚠️",
      message: status === "verified" 
        ? `Congratulations! "${store.name}" is now live on ReeCommerce.`
        : `Your shop request was rejected: ${note || "Please check your documents."}`,
      link: "/dashboard/seller"
    });

    return NextResponse.json({ success: true, status: store.verificationStatus });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}