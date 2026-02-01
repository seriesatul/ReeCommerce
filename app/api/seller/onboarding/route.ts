import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import User from "@/models/User";
import Store from "@/models/Store";
import { z } from "zod";

// 1. Validation Schema matching our 4-step wizard
const onboardingSchema = z.object({
  shopName: z.string().min(3, "Shop name is too short"),
  shopHandle: z.string().min(3, "Handle must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Invalid handle format"),
  shopDescription: z.string().min(20, "Description must be at least 20 characters"),
  businessType: z.enum(["individual", "business"]),
  legalName: z.string().min(2, "Legal name is required"),
  panNumber: z.string().length(10, "Invalid PAN/Tax ID format").toUpperCase(),
  accountHolderName: z.string().min(2, "Account holder name is required"),
  accountNumber: z.string().min(8, "Invalid account number"),
  ifscCode: z.string().min(4, "Invalid IFSC/Routing code").toUpperCase(),
});

export async function POST(req: Request) {
  try {
    // A. Auth Check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // B. Data Validation
    const body = await req.json();
    const result = onboardingSchema.safeParse(body);
    
    if (!result.success) {
      const errorMsg = result.error.issues.map(i => i.message).join(", ");
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const data = result.data;
    await connectDB();

    // C. Uniqueness Checks
    // 1. Check if user already has a store
    const existingStore = await Store.findOne({ ownerId: session.user.id });
    if (existingStore) {
      return NextResponse.json({ error: "Store already exists for this user" }, { status: 400 });
    }

    // 2. Check if handle is taken by another seller
    const handleTaken = await Store.findOne({ handle: data.shopHandle });
    if (handleTaken) {
      return NextResponse.json({ error: "This handle is already taken" }, { status: 409 });
    }

    // D. Atomic Operations (The "Industry" Way)
    /** 
     * In a production environment with high traffic, we would use Mongoose Sessions/Transactions.
     * For this MVP, we perform sequential updates with error handling.
     */
    
    // 1. Create the Store Document
    const store = await Store.create({
      ownerId: session.user.id,
      name: data.shopName,
      handle: data.shopHandle,
      description: data.shopDescription,
      businessType: data.businessType,
      verificationStatus: "pending", // Default
      bankDetails: {
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        holderName: data.accountHolderName,
      },
    });

    // 2. Upgrade User Role to 'seller'
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { role: "seller" },
      { new: true }
    );

    if (!updatedUser) {
      // If user update fails, we should ideally roll back (delete) the store
      await Store.findByIdAndDelete(store._id);
      throw new Error("Failed to upgrade user role");
    }

    return NextResponse.json({ 
      message: "Onboarding completed successfully", 
      store: { id: store._id, handle: store.handle } 
    }, { status: 201 });

  } catch (error: any) {
    console.error("SELLER_ONBOARDING_API_ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}