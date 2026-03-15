import mongoose, { Schema, model, models } from "mongoose";

export interface IStore {
  ownerId: mongoose.Types.ObjectId;

  // ── Phase 2: Identity ────────────────────────────────────────────
  name:        string;
  handle:      string;   // unique @username e.g. @techshop
  description: string;
  logoUrl?:    string;
  bannerUrl?:  string;   // future: store banner image
  category:    string;

  // ── Phase 3: Verification ────────────────────────────────────────
  verificationStatus: "pending" | "verified" | "rejected";
  businessType:       "individual" | "business";
  panNumber?:         string;  // select: false

  // ── Phase 4: Finance ─────────────────────────────────────────────
  bankDetails?: {
    accountNumber: string;  // select: false
    ifscCode:      string;  // select: false
    holderName:    string;
  };

  // ── Phase 5: Operations ──────────────────────────────────────────
  pickupAddress?:  string;
  shippingMethod:  "self" | "platform";

  // ── Social — SOURCE OF TRUTH ─────────────────────────────────────
  // followers: every user who follows this store.
  //   Query:   Store.find({ followers: userId })  ← always real-time
  //   Follow:  $addToSet: { followers: userId }   ← idempotent
  //   Unfollow: $pull:    { followers: userId }
  followers:      mongoose.Types.ObjectId[];
  followersCount: number;  // denormalised counter — keep in sync via $inc

  // ── Future fields ────────────────────────────────────────────────
  rating?:       number;   // aggregate seller rating
  reviewsCount?: number;
  tags?:         string[]; // searchable store tags
  socialLinks?: {
    instagram?: string;
    youtube?:   string;
    website?:   string;
  };

  isActive:   boolean;
  isFeatured: boolean;  // admin can feature a store on homepage
}

const StoreSchema = new Schema<IStore>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    // Identity
    name:        { type: String, required: true, trim: true },
    handle:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    logoUrl:     { type: String, default: "" },
    bannerUrl:   { type: String, default: "" },
    category:    { type: String, default: "General" },

    // Verification
    verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    businessType:       { type: String, enum: ["individual", "business"], default: "individual" },
    panNumber:          { type: String, select: false },

    // Finance
    bankDetails: {
      accountNumber: { type: String, select: false },
      ifscCode:      { type: String, select: false },
      holderName:    { type: String },
    },

    // Operations
    pickupAddress:  { type: String },
    shippingMethod: { type: String, enum: ["self", "platform"], default: "platform" },

    // ── Social ───────────────────────────────────────────────────────
    followers:      [{ type: Schema.Types.ObjectId, ref: "User" }],
    followersCount: { type: Number, default: 0, min: 0 },

    // Future
    rating:       { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
    tags:         { type: [String], default: [] },
    socialLinks: {
      instagram: { type: String, default: "" },
      youtube:   { type: String, default: "" },
      website:   { type: String, default: "" },
    },

    isActive:   { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
StoreSchema.index({ followers: 1 });          // ← profile following page
StoreSchema.index({ category: 1 });           // category browse
StoreSchema.index({ isFeatured: 1 });         // homepage featured stores
StoreSchema.index({ tags: 1 });               // tag search

const Store = models?.Store || model<IStore>("Store", StoreSchema);
export default Store;