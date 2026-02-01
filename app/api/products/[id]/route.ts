import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Product from "@/models/Products"; 
import Store from "@/models/Store";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Updated for Next.js 15+
) {
  try {
    // 1. Await params (Mandatory in latest Next.js versions)
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Invalid Product ID" }, { status: 400 });
    }

    await connectDB();

    // 2. Fetch & Join: We specifically select ownerId to verify ownership in the UI
    const product = await Product.findById(id)
      .populate({
        path: "storeId",
        model: Store,
        select: "name logoUrl handle ownerId description"
      })
      .lean();

    if (!product) {
      return NextResponse.json(
        { error: "Product not found. It may have been unlisted." }, 
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("PRODUCT_BY_ID_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}