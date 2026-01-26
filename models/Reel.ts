import mongoose, { Schema, model, models } from "mongoose";

export interface IReel {
  _id?: string;
  storeId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  videoUrl: string;
  thumbnailUrl: string;
  likesCount: number;
  viewsCount: number;
  score: number; // For the Feed Algorithm
}

const ReelSchema = new Schema<IReel>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    likesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    score: { 
      type: Number, 
      default: 0, 
      index: true // Crucial for high-speed feed sorting
    },
  },
  { timestamps: true }
);

const Reel = models?.Reel || model<IReel>("Reel", ReelSchema);
export default Reel;