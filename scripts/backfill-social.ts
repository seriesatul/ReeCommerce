/**
 * ONE-TIME BACKFILL SCRIPT
 * ─────────────────────────────────────────────────────────────────
 * Run once after deploying the new Reel (likedBy) and Store (followers)
 * model fields. Reads existing User.likedReels and User.following data
 * and writes it back into Reel.likedBy and Store.followers.
 *
 * Usage (from project root):
 *   npx ts-node --project tsconfig.json -e "require('./scripts/backfill-social.ts')"
 *
 * Or add to package.json scripts:
 *   "backfill": "npx ts-node scripts/backfill-social.ts"
 *
 * Safe to run multiple times — uses $addToSet so no duplicates.
 * ─────────────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// ── inline minimal schemas so the script is self-contained ────────
const UserSchema = new mongoose.Schema({
  likedReels: [{ type: mongoose.Schema.Types.ObjectId }],
  following:  [{ type: mongoose.Schema.Types.ObjectId }],
});
const ReelSchema  = new mongoose.Schema({
  likedBy: [{ type: mongoose.Schema.Types.ObjectId }],
});
const StoreSchema = new mongoose.Schema({
  followers: [{ type: mongoose.Schema.Types.ObjectId }],
});

const User  = mongoose.models.User  || mongoose.model("User",  UserSchema);
const Reel  = mongoose.models.Reel  || mongoose.model("Reel",  ReelSchema);
const Store = mongoose.models.Store || mongoose.model("Store", StoreSchema);

async function backfill() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not found in .env.local");

  await mongoose.connect(uri);
  console.log("✓ Connected to MongoDB\n");

  // ── 1. Backfill Reel.likedBy from User.likedReels ───────────────
  console.log("→ Backfilling Reel.likedBy …");
  const usersWithLikes = await User.find(
    { likedReels: { $exists: true, $ne: [] } },
    { _id: 1, likedReels: 1 }
  ).lean() as any[];

  let reelOps = 0;
  for (const user of usersWithLikes) {
    for (const reelId of user.likedReels) {
      await Reel.findByIdAndUpdate(reelId, {
        $addToSet: { likedBy: user._id },
      });
      reelOps++;
    }
  }
  console.log(`  ✓ ${reelOps} reel-like entries backfilled across ${usersWithLikes.length} users\n`);

  // ── 2. Backfill Store.followers from User.following ──────────────
  console.log("→ Backfilling Store.followers …");
  const usersWithFollows = await User.find(
    { following: { $exists: true, $ne: [] } },
    { _id: 1, following: 1 }
  ).lean() as any[];

  let storeOps = 0;
  for (const user of usersWithFollows) {
    for (const storeId of user.following) {
      await Store.findByIdAndUpdate(storeId, {
        $addToSet: { followers: user._id },
      });
      storeOps++;
    }
  }
  console.log(`  ✓ ${storeOps} store-follow entries backfilled across ${usersWithFollows.length} users\n`);

  // ── 3. Sync followersCount to match actual array lengths ─────────
  console.log("→ Syncing Store.followersCount …");
  const stores = await Store.find({}, { _id: 1, followers: 1 }).lean() as any[];
  for (const store of stores) {
    await Store.findByIdAndUpdate(store._id, {
      $set: { followersCount: store.followers?.length ?? 0 },
    });
  }
  console.log(`  ✓ followersCount synced for ${stores.length} stores\n`);

  // ── 4. Sync likesCount to match actual likedBy array lengths ─────
  console.log("→ Syncing Reel.likesCount …");
  const reels = await Reel.find({}, { _id: 1, likedBy: 1 }).lean() as any[];
  for (const reel of reels) {
    await Reel.findByIdAndUpdate(reel._id, {
      $set: { likesCount: reel.likedBy?.length ?? 0 },
    });
  }
  console.log(`  ✓ likesCount synced for ${reels.length} reels\n`);

  console.log("✅ Backfill complete. You can delete this script.");
  await mongoose.disconnect();
}

backfill().catch(err => {
  console.error("✗ Backfill failed:", err.message);
  process.exit(1);
});