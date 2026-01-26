import mongoose, { Schema, model, models } from "mongoose";

/**
 * IUser Interface
 * We use 'string' for _id here to make it easier to work with 
 * on the frontend after JSON serialization.
 */
export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: "user" | "seller" | "admin";
  provider: "credentials" | "google";
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [60, "Name cannot be more than 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      // Fixed Regex: Removed the double caret typo and used a standard RFC 5322 compliant pattern
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: function (this: any) {
        return this.provider === "credentials";
      },
      select: false, // Never return password in queries unless explicitly requested
    },
    image: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "seller", "admin"],
      default: "user",
    },
    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation error during development
const User = models?.User || model<IUser>("User", UserSchema);

export default User;