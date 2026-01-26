import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import User from "@/models/User";
import Store from "@/models/Store";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // 1. Check if user is logged in
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();

    if (!name || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    // 2. Check if the user already has a store
    const existingStore = await Store.findOne({ ownerId: session.user.id });
    if (existingStore) {
      return NextResponse.json(
        { error: "A store already exists for this account" },
        { status: 400 }
      );
    }

    // 3. Create the Store
    const newStore = await Store.create({
      ownerId: session.user.id,
      name,
      description,
    });

    // 4. Update the User's role to 'seller'
    await User.findByIdAndUpdate(session.user.id, { role: "seller" });

    return NextResponse.json(
      { message: "Store created successfully", store: newStore },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("SELLER_REGISTRATION_ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}