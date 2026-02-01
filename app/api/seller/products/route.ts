import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Product from "@/models/Products"; // Fixed: Singular
import Store from "@/models/Store";
import Reel from "@/models/Reel";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // 1. Verify Role
    if (!session || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // 2. Identify the Store
    const store = await Store.findOne({ ownerId: session.user.id });
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // 3. Fetch Products linked to this Store
    // Using .lean() for faster read performance
    const products = await Product.find({ storeId: store._id })
      .sort({ createdAt: -1 })
      .lean();
    
    // 4. Enrich data with Reel Counts (Industry Pattern: Concurrent Mapping)
    const productsWithMeta = await Promise.all(
      products.map(async (product: any) => {
        const reelCount = await Reel.countDocuments({ productId: product._id });
        return {
          ...product,
          reelCount,
          // Optimization: Cloudinary Auto-format for the dashboard thumbnails
          imageUrl: product.imageUrl?.replace("/upload/", "/upload/w_200,f_auto,q_auto/")
        };
      })
    );

    return NextResponse.json(productsWithMeta);
  } catch (error: any) {
    console.error("DASHBOARD_PRODUCTS_GET_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}