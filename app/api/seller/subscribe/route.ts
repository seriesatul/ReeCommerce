import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Subscription from "@/models/Subscription";
import Store from "@/models/Store";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sellerId } = await req.json(); // This is the Store _id
    await connectDB();

    const existing = await Subscription.findOne({ 
      buyerId: session.user.id, 
      sellerId 
    });

    if (existing) {
      await Subscription.deleteOne({ _id: existing._id });
      return NextResponse.json({ subscribed: false });
    } else {
      await Subscription.create({ buyerId: session.user.id, sellerId });

      // TRIGGER NOTIFICATION: Find store owner to notify them
      const store = await Store.findById(sellerId);
      if (store && store.ownerId.toString() !== session.user.id) {
        await createNotification({
          recipientId: store.ownerId.toString(),
          actorId: session.user.id,
          type: "SYSTEM", // Or create a new "FOLLOW" type
          title: "New Follower! 👤",
          message: `${session.user.name} started following ${store.name}.`,
          link: `/dashboard/seller/analytics`
        });
      }

      return NextResponse.json({ subscribed: true });
    }
  } catch (error) {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}