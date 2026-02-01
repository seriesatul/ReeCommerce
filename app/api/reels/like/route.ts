import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/connect";
import Reel from "@/models/Reel";
import Interaction from "@/models/Interaction";
import Store from "@/models/Store"; // Required for population
import { createNotification } from "@/lib/notifications"; // Our new utility

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reelId } = await req.json();
    if (!reelId) {
      return NextResponse.json({ error: "Reel ID is required" }, { status: 400 });
    }

    await connectDB();

    // 1. Check if interaction already exists
    const existingLike = await Interaction.findOne({
      userId: session.user.id,
      reelId,
      type: "like",
    });

    if (existingLike) {
      // --- UNLIKE LOGIC ---
      await Interaction.deleteOne({ _id: existingLike._id });
      await Reel.findByIdAndUpdate(reelId, { $inc: { likesCount: -1 } });
      
      return NextResponse.json({ liked: false });
    } else {
      // --- LIKE LOGIC ---
      
      // A. Create the interaction
      await Interaction.create({ 
        userId: session.user.id, 
        reelId, 
        type: "like" 
      });

      // B. Increment count on Reel
      // We use populate here to get the store owner's ID for the notification
      const updatedReel = await Reel.findByIdAndUpdate(
        reelId, 
        { $inc: { likesCount: 1 } },
        { new: true }
      ).populate({
        path: "storeId",
        model: Store,
        select: "ownerId name"
      });

      if (!updatedReel) {
        return NextResponse.json({ error: "Reel not found" }, { status: 404 });
      }

      // C. TRIGGER NOTIFICATION (Side Effect)
      // Industry practice: Don't notify if the user likes their own reel
      const sellerId = updatedReel.storeId.ownerId.toString();
      const likerId = session.user.id;

      if (sellerId !== likerId) {
        // We don't 'await' this so the response returns faster to the user
        createNotification({
          recipientId: sellerId,
          actorId: likerId,
          type: "LIKE",
          title: "New Interaction! ✨",
          message: `${session.user.name} liked your product reel for "${updatedReel.storeId.name}".`,
          link: `/?reelId=${reelId}`
        });
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error: any) {
    console.error("LIKE_API_ERROR:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}