import mongoose, { Schema, model, models } from "mongoose";

const NotificationSchema = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // The user receiving the alert
    actorId: { type: Schema.Types.ObjectId, ref: "User" }, // The user who triggered the alert (e.g. the liker)
    type: { 
      type: String, 
      enum: ["LIKE", "PURCHASE", "NEW_REEL", "STOCK_ALERT", "SYSTEM"], 
      required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // e.g. /?reelId=...
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, createdAt: -1 });

const Notification = models?.Notification || model("Notification", NotificationSchema);
export default Notification;