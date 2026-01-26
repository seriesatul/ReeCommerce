import mongoose, { Schema, model, models } from "mongoose";

export interface IStore {
  _id?: string;
  ownerId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  logoUrl?: string;
  isActive: boolean;
}

const StoreSchema = new Schema<IStore>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One user = One store
    },
    name: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    logoUrl: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Store = models?.Store || model<IStore>("Store", StoreSchema);
export default Store;