import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Product from "@/models/Products"; // FIXED: Singular 'Product'
import Reel from "@/models/Reel";
import Store from "@/models/Store";

export async function POST(req: Request) {
  try {
    // 1. Fetch the session
    const session = await getServerSession(authOptions);

    /**
     * DEBUGGING LOGS
     * Check your VS Code terminal after clicking Publish.
     * If 'role' says 'user', you MUST log out and log back in.
     */
    console.log("API_AUTH_CHECK:", {
      user: session?.user?.email,
      role: session?.user?.role,
    });

    // 2. Strict Authorization Check
    if (!session || session.user.role !== "seller") {
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          details: `Current role: ${session?.user?.role || "Not logged in"}. Seller role required.` 
        }, 
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, description, price, category, stock, videoUrl, thumbnailUrl } = body;

    await connectDB();

    // 3. Find the associated store
    const store = await Store.findOne({ ownerId: session.user.id });
    if (!store) {
      return NextResponse.json(
        { error: "Store not found. Please register as a seller first." }, 
        { status: 404 }
      );
    }

    // 4. Create Product & Reel (Industry Standard: Use a transaction or sequential creation)
    const product = await Product.create({
      storeId: store._id,
      name,
      description,
      price: Number(price),
      category,
      stock: Number(stock),
      imageUrl: thumbnailUrl,
    });

    const reel = await Reel.create({
      storeId: store._id,
      productId: product._id,
      videoUrl,
      thumbnailUrl,
    });

    return NextResponse.json(
      { 
        message: "Product and Reel published successfully",
        product, 
        reel 
      }, 
      { status: 201 }
    );

  } catch (error: any) {
    console.error("PRODUCT_POST_ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create product" }, 
      { status: 500 }
    );
  }
}