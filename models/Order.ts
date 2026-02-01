import mongoose, { Schema, model, models } from "mongoose";

export interface IOrder {
  _id?: string;
  buyerId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  items: {
    productId: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    priceAtPurchase: number;
  }[];
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  shippingAddress: string;
  createdAt?: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    items: [{
      productId: { type: Schema.Types.ObjectId, ref: "Product" },
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      priceAtPurchase: { type: Number, required: true }, // Snapshot price
    }],
    totalAmount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending" 
    },
    paymentStatus: { 
      type: String, 
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending" 
    },
    shippingAddress: { type: String, required: true },
  },
  { timestamps: true }
);

const Order = models?.Order || model<IOrder>("Order", OrderSchema);
export default Order;