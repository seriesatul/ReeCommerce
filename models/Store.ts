import mongoose, { Schema, model, models } from "mongoose";

export interface IStore {
  ownerId: mongoose.Types.ObjectId;
  
  // Phase 2: Identity
  name: string;
  handle: string; // Unique username e.g. @techshop
  description: string;
  logoUrl?: string;
  category: string;
  
  // Phase 3: Verification (Simplified for MVP)
  verificationStatus: "pending" | "verified" | "rejected";
  businessType: "individual" | "business";
  panNumber?: string;
  
  // Phase 4: Finance
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    holderName: string;
  };
  
  // Phase 5: Operations
  pickupAddress?: string;
  shippingMethod: "self" | "platform";
  
  isActive: boolean;
}

const StoreSchema = new Schema<IStore>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    
    // Identity
    name: { type: String, required: true, trim: true },
    handle: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    category: { type: String, default: "General" },
    
    // Verification
    verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    businessType: { type: String, enum: ["individual", "business"], default: "individual" },
    panNumber: { type: String, select: false }, // Secure field
    
    // Finance (Nested Object)
    bankDetails: {
      accountNumber: { type: String, select: false },
      ifscCode: { type: String, select: false },
      holderName: { type: String },
    },
    
    // Operations
    pickupAddress: { type: String },
    shippingMethod: { type: String, enum: ["self", "platform"], default: "platform" },
    
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Store = models?.Store || model<IStore>("Store", StoreSchema);
export default Store;