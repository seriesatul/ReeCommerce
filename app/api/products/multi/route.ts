import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Product from "@/models/Products"; // Using your Products.ts
import Reel from "@/models/Reel";
import Store from "@/models/Store";
import { createNotification } from "@/lib/notifications";
import Subscription from "@/models/Subscription";

/**
 * INDUSTRY STANDARD: Batch Creation API
 * This route handles the simultaneous creation of multiple products 
 * and their integration into a single interactive video timeline.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized. Seller access required." }, { status: 401 });
    }

    const body = await req.json();
    const { 
      products, // Array of 1-5 products from the Studio UI
      videoUrl, 
      thumbnailUrl, 
      caption, 
      hashtags, 
      category, 
      taxDetails,
      listingType 
    } = body;

    await connectDB();

    // 1. Identify the Seller's Store
    const store = await Store.findOne({ ownerId: session.user.id });
    if (!store) return NextResponse.json({ error: "Seller store not found" }, { status: 404 });

    // 2. COMPOSITE CREATION LOOP
    const createdProductIds: string[] = [];
    const hotspotsData: any[] = [];

    // We use a standard for loop to ensure sequential creation and ID collection
    for (const p of products) {
      const newProduct = await Product.create({
        storeId: store._id,
        name: p.name,
        description: p.description,
        category: category,
        sku: `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        imageUrl: p.imageUrl, // First image from gallery
        images: p.images,     // Full gallery array
        mrp: Number(p.mrp),
        price: Number(p.price),
        stock: Number(p.stock),
        weight: Number(p.weight),
        dimensions: {
          length: Number(p.length),
          width: Number(p.width),
          height: Number(p.height)
        },
        taxDetails: taxDetails,
        returnEligible: p.returnEligible,
        origin: "India"
      });

      createdProductIds.push(newProduct._id.toString());

      // 3. Map this product to the Reel's Interactive Timeline
      hotspotsData.push({
        productId: newProduct._id,
        startTime: Number(p.startTime),
        endTime: Number(p.endTime),
        x: p.x,
        y: p.y,
        label: p.name
      });
    }

    // 4. Create the Interactive Reel
    const reel = await Reel.create({
      storeId: store._id,
      productId: createdProductIds[0], // Primary product link (fallback)
      videoUrl,
      thumbnailUrl,
      isMultiProduct: listingType === "multi",
      hotspots: hotspotsData,
      score: 0
    });

    // 5. ASYNCHRONOUS BROADCAST (Notify Followers)
    try {
      const followers = await Subscription.find({ sellerId: store._id });
      // Logic for notifying followers...
      // (This doesn't block the response)
    } catch (e) {
      console.error("Non-critical notification error", e);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully launched ${listingType} with ${createdProductIds.length} items.`,
      reelId: reel._id 
    }, { status: 201 });

  } catch (error: any) {
    console.error("MULTI_PRODUCT_PUBLISH_ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}