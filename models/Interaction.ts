import mongoose, { Schema, model, models } from "mongoose";

// ── Interaction ──────────────────────────────────────────────────────────────
// Stores user interactions (likes) with reels.
// Source of truth for: did this user like this reel?
// Collection: interactions
//
// To check:  Interaction.findOne({ userId, reelId, type: "like" })
// To like:   Interaction.create({ userId, reelId, type: "like" })
// To unlike: Interaction.deleteOne({ userId, reelId, type: "like" })

export interface IInteraction {
  userId:    mongoose.Types.ObjectId;
  reelId:    mongoose.Types.ObjectId;
  type:      "like" | "view" | "share";
  createdAt?: Date;
  updatedAt?: Date;
}

const InteractionSchema = new Schema<IInteraction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User",  required: true, index: true },
    reelId: { type: Schema.Types.ObjectId, ref: "Reel",  required: true, index: true },
    type:   { type: String, enum: ["like", "view", "share"], required: true },
  },
  { timestamps: true }
);

// Compound unique index — one like per user per reel (idempotent)
InteractionSchema.index({ userId: 1, reelId: 1, type: 1 }, { unique: true });

const Interaction = models?.Interaction || model<IInteraction>("Interaction", InteractionSchema);
export default Interaction;