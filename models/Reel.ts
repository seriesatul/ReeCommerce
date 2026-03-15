import mongoose, { Schema, model, models } from "mongoose";

export interface IHotspot {
  productId: mongoose.Types.ObjectId;
  startTime: number;
  endTime:   number;
  x?:        number;
  y?:        number;
  label?:    string;
}

export interface IReel {
  _id?:           string;
  storeId:        mongoose.Types.ObjectId;
  productId:      mongoose.Types.ObjectId;
  videoUrl:       string;
  thumbnailUrl:   string;
  isMultiProduct: boolean;
  hotspots:       IHotspot[];

  // Soft metadata (written via PATCH route)
  title?:       string;
  description?: string;
  isPublished?: boolean;
  tags?:        string[];
  aspectRatio?: "9:16" | "1:1" | "16:9";

  // ── Engagement counters ──────────────────────────────────────────
  // Always update with $inc — never $set directly
  likesCount:    number;
  viewsCount:    number;
  sharesCount:   number;   // future
  commentsCount: number;   // future
  score:         number;

  // ── Social arrays — SOURCE OF TRUTH ─────────────────────────────
  // likedBy: every user who liked this reel.
  //   Query:  Reel.find({ likedBy: userId })   ← always real-time
  //   Like:   $addToSet: { likedBy: userId }   ← idempotent
  //   Unlike: $pull:     { likedBy: userId }
  likedBy: mongoose.Types.ObjectId[];

  // savedBy: bookmarks (future feature)
  savedBy: mongoose.Types.ObjectId[];

  createdAt?: Date;
  updatedAt?: Date;
}

const HotspotSchema = new Schema<IHotspot>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  startTime: { type: Number, required: true, min: 0 },
  endTime:   { type: Number, required: true },
  x:         { type: Number, min: 0, max: 100, default: 50 },
  y:         { type: Number, min: 0, max: 100, default: 50 },
  label:     { type: String, trim: true },
});

const ReelSchema = new Schema<IReel>(
  {
    storeId:        { type: Schema.Types.ObjectId, ref: "Store",   required: true, index: true },
    productId:      { type: Schema.Types.ObjectId, ref: "Product", required: true },
    videoUrl:       { type: String, required: true },
    thumbnailUrl:   { type: String, required: true },
    isMultiProduct: { type: Boolean, default: false },
    hotspots:       { type: [HotspotSchema], default: [] },

    // Soft metadata
    title:       { type: String,  default: "" },
    description: { type: String,  default: "" },
    isPublished: { type: Boolean, default: true },
    tags:        { type: [String], default: [] },
    aspectRatio: { type: String, enum: ["9:16", "1:1", "16:9"], default: "9:16" },

    // Counters — $inc only
    likesCount:    { type: Number, default: 0, min: 0 },
    viewsCount:    { type: Number, default: 0, min: 0 },
    sharesCount:   { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
    score:         { type: Number, default: 0, index: true },

    // Social arrays
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    savedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Indexes for every common access pattern
ReelSchema.index({ likedBy: 1 });                  // ← profile liked-reels page
ReelSchema.index({ savedBy: 1 });                  // future bookmarks page
ReelSchema.index({ storeId: 1, createdAt: -1 });   // store reel feed
ReelSchema.index({ isPublished: 1, score: -1 });   // discovery / home feed
ReelSchema.index({ tags: 1 });                     // hashtag search
ReelSchema.index({ "hotspots.startTime": 1 });

const Reel = models?.Reel || model<IReel>("Reel", ReelSchema);
export default Reel;