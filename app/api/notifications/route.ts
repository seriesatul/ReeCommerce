import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Notification from "@/models/Notification";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ notifications: [], unreadCount: 0 });

    await connectDB();
    const notifications = await Notification.find({ recipientId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const unreadCount = await Notification.countDocuments({ 
      recipientId: session.user.id, 
      isRead: false 
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    await Notification.updateMany(
      { recipientId: session.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}