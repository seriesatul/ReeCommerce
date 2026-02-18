import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Cart from "@/models/Cart";
import Order from "@/models/Order";
import Product from "@/models/Products"; // Using your Products.ts
import Store from "@/models/Store";
import User from "@/models/User";
import { createNotification } from "@/lib/notifications";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { address } = await req.json();
    if (!address) return NextResponse.json({ error: "Shipping address is required" }, { status: 400 });

    await connectDB();

    // 1. Fetch and Validate Cart
    const cart = await Cart.findOne({ userId: session.user.id }).populate({
      path: "items.productId",
      model: Product
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    // 2. Multivendor Grouping & Stock Validation
    const storeGroups: Record<string, any[]> = {};
    
    for (const item of cart.items) {
      const product = item.productId;
      
      // Atomic Stock Check
      if (product.stock < item.quantity) {
        return NextResponse.json({ 
          error: `Insufficient stock for ${product.name}. Only ${product.stock} left.` 
        }, { status: 400 });
      }

      const storeId = product.storeId.toString();
      if (!storeGroups[storeId]) storeGroups[storeId] = [];
      storeGroups[storeId].push(item);
    }

    const createdOrders = [];

    // 3. Process Each Store as a Separate Order (Amazon Style)
    for (const [storeId, items] of Object.entries(storeGroups)) {
      const totalAmount = items.reduce((sum, i) => sum + (i.productId.price * i.quantity), 0);

      const newOrder = await Order.create({
        buyerId: session.user.id,
        storeId: storeId,
        items: items.map((i) => ({
          productId: i.productId._id,
          name: i.productId.name,
          quantity: i.quantity,
          priceAtPurchase: i.productId.price
        })),
        totalAmount,
        status: "processing", // COD starts at processing
        paymentStatus: "pending", // Payment happens at doorstep
        shippingAddress: address,
      });

      // 4. Update Inventory (Stock Management)
      for (const item of items) {
        await Product.findByIdAndUpdate(item.productId._id, {
          $inc: { stock: -item.quantity }
        });
      }

      // 5. Notifications & Real-time Alerts
      const store = await Store.findById(storeId).populate({
        path: "ownerId",
        model: User
      });

      if (store) {
        const sellerUserId = (store.ownerId as any)._id.toString();

        await createNotification({
          recipientId: sellerUserId,
          type: "PURCHASE",
          title: "New COD Order! 📦",
          message: `Order #${newOrder._id.toString().slice(-6)} received for ₹${totalAmount} (COD)`,
          link: "/dashboard/seller/orders"
        });

        // Live Dashboard Update
        await pusherServer.trigger(`user-${sellerUserId}`, "new-notification", {
          title: "New COD Sale! 📦",
          message: `Pending payment of ₹${totalAmount}`,
          type: "PURCHASE"
        });
      }

      createdOrders.push(newOrder._id);
    }

    // 6. Clear Cart after successful order generation
    cart.items = [];
    await cart.save();

    return NextResponse.json({ 
      success: true, 
      message: "COD Order placed successfully", 
      orderIds: createdOrders 
    }, { status: 201 });

  } catch (error: any) {
    console.error("COD_CHECKOUT_CRASH:", error);
    return NextResponse.json({ error: "Failed to process COD order" }, { status: 500 });
  }
}