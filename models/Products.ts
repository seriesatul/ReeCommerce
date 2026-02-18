import mongoose, { Schema, model, models } from "mongoose";

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
  
  // Pricing
  mrp: number;
  price: number;
  discount: number;
  
  // Inventory
  stock: number;
  lowStockThreshold: number;
  
  // Bug #5: Logistics & Volumetric Data
  weight: number; // Physical weight in kg
  dimensions: {
    length: number; // in cm
    width: number;  // in cm
    height: number; // in cm
  };
  volumetricWeight: number; // Computed: (L*W*H)/5000
  
  // Bug #6: Advanced Return Policy
  returnPolicy: {
    isEligible: boolean;
    returnWindow: number; // Days (e.g., 7, 10, 30)
    policyDetails?: string;
  };
  
  shippingMethod: "platform" | "self";
  dispatchTime: string;
  warranty?: string;
  origin?: string;
  taxDetails?: string;
  isAuthentic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    subCategory: { type: String },
    brand: { type: String },
    sku: { type: String, unique: true, required: true },
    imageUrl: { type: String, required: true }, 
    images: { type: [String], default: [] },    
    mrp: { type: Number, required: true },
    price: { type: Number, required: true }, 
    discount: { type: Number, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },

    weight: { type: Number, required: true },
    dimensions: {
      length: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    },
    volumetricWeight: { type: Number },

    returnPolicy: {
      isEligible: { type: Boolean, default: true },
      returnWindow: { type: Number, default: 7 },
      policyDetails: { type: String, default: "Standard 7-day return policy applies." }
    },

    shippingMethod: { type: String, enum: ["platform", "self"], default: "platform" },
    dispatchTime: { type: String, default: "2-3 days" },
    warranty: { type: String },
    origin: { type: String, default: "India" },
    taxDetails: { type: String }, 
    isAuthentic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/**
 * FIXED: Industry Standard Async Middleware
 * We use an async function and do not call 'next()'.
 * Returning a promise (or simply being async) tells Mongoose to wait.
 */
ProductSchema.pre("save", async function () {
  if (this.dimensions) {
    const { length, width, height } = this.dimensions;
    // Standard Formula for Domestic Shipping: (L * W * H) / 5000
    this.volumetricWeight = parseFloat(((length * width * height) / 5000).toFixed(2));
  }
});

ProductSchema.index({ name: "text", brand: "text", category: "text" });

const Product = models?.Product || model<IProduct>("Product", ProductSchema);
export default Product;