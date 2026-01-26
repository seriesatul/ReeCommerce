import mongoose from "mongoose";
import { ENV } from "../env";

/**
 * Industry Best Practice: Singleton Pattern for Mongoose in Next.js
 * 
 * Why? Next.js uses Hot Module Replacement (HMR). Without this, every time you 
 * save a file, a new database connection would be opened, quickly exhausting 
 * MongoDB's connection limit.
 */

interface MongooseCache {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

// 1. Properly type the global object to include our mongoose cache
const globalWithMongoose = global as typeof globalThis & {
  mongoose: MongooseCache;
};

// 2. Initialize the cache if it doesn't exist
let cached = globalWithMongoose.mongoose;

if (!cached) {
  cached = globalWithMongoose.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // 3. If we have an active connection, return it immediately
  if (cached.conn) {
    return cached.conn;
  }

  // 4. If no promise exists, create a new one
  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
      maxPoolSize: 10, // Industry standard: limits simultaneous sockets to 10
    };

    cached.promise = mongoose
      .connect(ENV.MONGODB_URI, opts)
      .then((mongooseInstance) => {
        return mongooseInstance.connection;
      })
      .catch((error) => {
        console.error("❌ MongoDB Connection Error:", error);
        throw error;
      });
  }

  try {
    // 5. Await the promise to resolve the connection
    cached.conn = await cached.promise;
  } catch (e) {
    // 6. If it fails, clear the promise so the next request can retry
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;