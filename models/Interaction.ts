import mongoose, { Schema, model, models } from "mongoose";

export interface IInteraction {
  userId: mongoose.Types.ObjectId;
  reelId: mongoose.Types.ObjectId;
  type: "like" | "view";
}

const InteractionSchema = new Schema<IInteraction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reelId: { type: Schema.Types.ObjectId, ref: "Reel", required: true },
    type: { type: String, enum: ["like", "view"], required: true },
  },
  { timestamps: true }
);

// Indexing for fast lookups: "Did this user like this reel?"
InteractionSchema.index({ userId: 1, reelId: 1, type: 1 }, { unique: true });

const Interaction = models?.Interaction || model<IInteraction>("Interaction", InteractionSchema);
export default Interaction;