import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  
  // These MUST match your .env.local exactly
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  // This helps you see exactly which key is missing in the terminal
  console.error("❌ Invalid environment variables:", JSON.stringify(env.error.format(), null, 2));
  throw new Error("Invalid environment variables. Check your .env.local file.");
}

export const ENV = env.data;