import mongoose, { Schema, model, models, Document } from "mongoose";

// 1. Define the TypeScript Interface for full type safety across the app
export interface IProduct {
  _id: string;
  storeId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  category: string;
  subCategory?: string;
  brand?: string;
  sku: string;
  imageUrl: string;
  images: string[];
  mrp: number;
  price: number;
  discount: number;
  stock: number;
  lowStockThreshold: number;
  variants: {
    type: string;
    value: string;
    priceModifier: number;
  }[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  shippingMethod: "platform" | "self";
  dispatchTime: string;
  returnEligible: boolean;
  warranty?: string;
  origin?: string;
  taxDetails?: string;
  isAuthentic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    // storeId is indexed because we filter by seller frequently
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    subCategory: { type: String },
    brand: { type: String },
    sku: { type: String, unique: true, required: true },
    
    // Media
    imageUrl: { type: String, required: true }, 
    images: { type: [String], default: [] },    
    
    // Pricing
    mrp: { type: Number, required: true },
    price: { type: Number, required: true }, 
    discount: { type: Number, default: 0 },
    
    // Inventory
    stock: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    variants: [
      {
        type: { type: String }, 
        value: { type: String },
        priceModifier: { type: Number, default: 0 }
      }
    ],

    // Logistics & Compliance
    weight: { type: Number }, 
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number }
    },
    shippingMethod: { type: String, enum: ["platform", "self"], default: "platform" },
    dispatchTime: { type: String, default: "2-3 days" },
    returnEligible: { type: Boolean, default: true },
    warranty: { type: String },
    origin: { type: String },
    taxDetails: { type: String }, 
    
    isAuthentic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Add a Text Index for Global Search (Industry Standard)
// This allows buyers to search by Name, Brand, or Category efficiently
ProductSchema.index({ name: "text", brand: "text", category: "text" });

const Product = models?.Product || model<IProduct>("Product", ProductSchema);
export default Product;