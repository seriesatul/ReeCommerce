import mongoose, { Schema, model, models } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  },
  { timestamps: true }
);

// Indexing: "Is this buyer following this seller?" (Unique prevents double following)
SubscriptionSchema.index({ buyerId: 1, sellerId: 1 }, { unique: true });

const Subscription = models?.Subscription || model("Subscription", SubscriptionSchema);
export default Subscription;