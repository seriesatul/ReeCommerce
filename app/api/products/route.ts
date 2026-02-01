import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Product from "@/models/Products"; 
import Reel from "@/models/Reel";
import Store from "@/models/Store";
import Subscription from "@/models/Subscription";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Destructuring all fields from our high-end Listing Studio
    const { 
      name, description, category, mrp, price, stock, 
      videoUrl, thumbnailUrl, brand, sku, weight, taxDetails,
      images, returnEligible, origin // ADDED: These support the 'Show Details' gallery
    } = body;

    await connectDB();

    const store = await Store.findOne({ ownerId: session.user.id });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    // 1. Create the Product with Gallery Support
    const product = await Product.create({
      storeId: store._id,
      name,
      description,
      category,
      brand,
      sku: sku || `SKU-${Date.now()}`,
      mrp: Number(mrp),
      price: Number(price),
      stock: Number(stock),
      weight: Number(weight) || 0,
      taxDetails,
      origin: origin || "India",
      returnEligible: returnEligible ?? true,
      imageUrl: thumbnailUrl, // Default cover
      images: images || [],   // FIXED: Saving the gallery array for the detail page
    });

    // 2. Create the linked Reel
    const reel = await Reel.create({
      storeId: store._id,
      productId: product._id,
      videoUrl,
      thumbnailUrl,
    });

    // 3. Subscription Broadcast (Side-effect)
    try {
      const followers = await Subscription.find({ sellerId: store._id });
      // Optimized Broadcast: Send all notifications in parallel
      await Promise.all(
        followers.map((f) =>
          createNotification({
            recipientId: f.buyerId.toString(),
            type: "NEW_REEL",
            title: `New from ${store.name}! 🔥`,
            message: `${store.name} just dropped a new product: ${name}`,
            link: `/?reelId=${reel._id}`,
          })
        )
      );
    } catch (err) {
      console.error("Non-critical: Notification broadcast failed", err);
    }

    return NextResponse.json({ 
      message: "Listing published to marketplace",
      product, 
      reel 
    }, { status: 201 });

  } catch (error: any) {
    console.error("PRODUCT_CREATION_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}