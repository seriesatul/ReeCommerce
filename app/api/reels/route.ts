import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Reel from "@/models/Reel";
import Product from "@/models/Products"; // Crucial import for populate to work

export async function GET(req: Request) {
  try {
    await connectDB();

    // Explicitly define the model in populate to prevent Next.js registration issues
    const reels = await Reel.find({})
      .sort({ createdAt: -1 })
      .populate({
        path: "productId",
        model: Product
      });

    return NextResponse.json(reels || []);
  } catch (error: any) {
    console.error("REEL_FETCH_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch reels", details: error.message }, 
      { status: 500 }
    );
  }
}