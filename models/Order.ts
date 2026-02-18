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
  // Structured address for Bug #3 and #7 (Map integration)
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
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
      priceAtPurchase: { type: Number, required: true },
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
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
  },
  { timestamps: true }
);

const Order = models?.Order || model<IOrder>("Order", OrderSchema);
export default Order;