import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Reel from "@/models/Reel";
import Store from "@/models/Store";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match?.[1] ?? null;
  } catch { return null; }
}

async function getOwnedReel(reelId: string, sellerId: string) {
  await connectDB();
  if (!reelId || !mongoose.Types.ObjectId.isValid(reelId)) {
    return { error: "Invalid reel ID", status: 400 };
  }
  const store = await Store.findOne({ ownerId: sellerId });
  if (!store) return { error: "Store not found", status: 404 };
  const reel  = await Reel.findOne({ _id: reelId, storeId: store._id });
  if (!reel)  return { error: "Reel not found or not yours", status: 404 };
  return { reel, store };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ reelId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ✅ Await params — required in Next.js 15
  const { reelId } = await params;

  const result = await getOwnedReel(reelId, session.user.id);
  if ("error" in result)
    return NextResponse.json({ error: result.error }, { status: result.status });

  try {
    const body = await req.json();
    const updates: Record<string, any> = {};
    ["productId", "isMultiProduct", "hotspots", "isPublished", "title", "description"]
      .forEach(f => { if (body[f] !== undefined) updates[f] = body[f]; });

    if (!Object.keys(updates).length)
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

    const updated = await Reel.findByIdAndUpdate(
      result.reel._id,
      { $set: updates },
      { new: true, strict: false }
    ).populate({ path: "productId", select: "name price stock imageUrl" });

    return NextResponse.json({ success: true, reel: updated });
  } catch (err: any) {
    console.error("[PATCH /api/seller/reels/:id]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ reelId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ✅ Await params — required in Next.js 15
  const { reelId } = await params;

  const result = await getOwnedReel(reelId, session.user.id);
  if ("error" in result)
    return NextResponse.json({ error: result.error }, { status: result.status });

  const { reel } = result;
  const cleaned: string[] = [];

  if (reel.videoUrl) {
    const pid = extractPublicId(reel.videoUrl);
    if (pid) {
      try {
        await cloudinary.uploader.destroy(pid, { resource_type: "video" });
        cleaned.push("video");
      } catch (e) {
        console.warn("[Cloudinary] Video delete failed:", e);
      }
    }
  }

  if (reel.thumbnailUrl) {
    const pid = extractPublicId(reel.thumbnailUrl);
    if (pid) {
      try {
        await cloudinary.uploader.destroy(pid, { resource_type: "image" });
        cleaned.push("thumbnail");
      } catch (e) {
        console.warn("[Cloudinary] Thumbnail delete failed:", e);
      }
    }
  }

  await Reel.findByIdAndDelete(reel._id);
  return NextResponse.json({ success: true, cleaned });
}