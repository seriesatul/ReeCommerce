import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: "user" | "seller" | "admin";
  provider: "credentials" | "google";

  // Onboarding
  onboardingCompleted: boolean;
  interests: string[];
  pricePreference: "budget" | "mid" | "luxury";

  // Social / activity
  likedReels: mongoose.Types.ObjectId[];  // reels the user has liked
  following:  mongoose.Types.ObjectId[];  // store IDs the user follows

  // Optional contact
  phone?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false },
    image:    { type: String, default: "" },
    role:     { type: String, enum: ["user", "seller", "admin"], default: "user" },
    provider: { type: String, default: "credentials" },

    // Onboarding
    onboardingCompleted: { type: Boolean,   default: false },
    interests:           { type: [String],  default: []    },
    pricePreference:     { type: String, enum: ["budget", "mid", "luxury"], default: "mid" },

    // Social
    likedReels: [{ type: Schema.Types.ObjectId, ref: "Reel"  }],
    following:  [{ type: Schema.Types.ObjectId, ref: "Store" }],

    // Contact
    phone: { type: String, default: "" },
  },
  { timestamps: true }
);

const User = models?.User || model<IUser>("User", UserSchema);
export default User;