import connectDB from "./db/connect";
import Notification from "@/models/Notification";

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
    await Notification.create(data);
    return true;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return false;
  }
}