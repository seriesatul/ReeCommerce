import mongoose, { Schema, model, models } from "mongoose";

// ── Subscription ─────────────────────────────────────────────────────────────
// Stores follow relationships between buyers and stores.
// Source of truth for: is this user following this store?
// Collection: subscriptions
//
// To check:   Subscription.findOne({ buyerId, sellerId })
// To follow:  Subscription.create({ buyerId, sellerId })
// To unfollow: Subscription.deleteOne({ buyerId, sellerId })

export interface ISubscription {
  buyerId:   mongoose.Types.ObjectId;   // the user who follows
  sellerId:  mongoose.Types.ObjectId;   // the store being followed (Store._id)
  createdAt?: Date;
  updatedAt?: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    buyerId:  { type: Schema.Types.ObjectId, ref: "User",  required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  },
  { timestamps: true }
);

// Compound unique index — one follow per user per store (idempotent)
SubscriptionSchema.index({ buyerId: 1, sellerId: 1 }, { unique: true });

const Subscription = models?.Subscription || model<ISubscription>("Subscription", SubscriptionSchema);
export default Subscription;