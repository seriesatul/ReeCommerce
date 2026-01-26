import mongoose, { Schema, model, models } from "mongoose";

export interface IProduct {
  _id?: string;
  storeId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string; // The fallback thumbnail
}

const ProductSchema = new Schema<IProduct>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { 
      type: String, 
      required: true, 
      index: true // Indexing for Amazon-style category browsing
    },
    stock: { type: Number, required: true, default: 0 },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

const Product = models?.Product || model<IProduct>("Product", ProductSchema);
export default Product;