import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Store from "@/models/Store";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(20).max(500),
  handle: z.string().min(3).regex(/^[a-z0-9-]+$/, "Invalid handle format"),
  logoUrl: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const store = await Store.findOne({ ownerId: session.user.id });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    return NextResponse.json(store);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = profileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    await connectDB();
    
    // 1. Check if the handle is being changed and if it's already taken
    const existingStoreWithHandle = await Store.findOne({ 
      handle: result.data.handle,
      ownerId: { $ne: session.user.id } // Not this user
    });

    if (existingStoreWithHandle) {
      return NextResponse.json({ error: "This handle is already taken" }, { status: 409 });
    }

    // 2. Update the store
    const updatedStore = await Store.findOneAndUpdate(
      { ownerId: session.user.id },
      { $set: result.data },
      { new: true }
    );

    return NextResponse.json(updatedStore);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}