import connectDB from "./db/connect";
import Notification from "@/models/Notification";
import { pusherServer } from "@/lib/pusher"; // Import the server-side emitter

export async function createNotification(data: {
  recipientId: string;
  actorId?: string;
  type: "LIKE" | "PURCHASE" | "NEW_REEL" | "STOCK_ALERT" | "SYSTEM";
  title: string;
  message: string;
  link?: string;
}) {
  try {
    await connectDB();

    // 1. Save to Database (Persistent History)
    // We await this first to ensure we have a valid _id and createdAt timestamp
    const notification = await Notification.create({
      ...data,
      isRead: false,
    });

    // 2. Trigger Real-Time Event (Ephemeral Alert)
    // Channel Name: 'user-{userId}' (Ensures privacy - only this user listens to this channel)
    // Event Name: 'new-notification'
    await pusherServer.trigger(`user-${data.recipientId}`, "new-notification", {
      _id: notification._id,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
      createdAt: notification.createdAt,
    });

    return true;
  } catch (error) {
    // In a real production app, we would log this to Sentry/Datadog
    console.error("Failed to create/send notification:", error);
    return false;
  }
}