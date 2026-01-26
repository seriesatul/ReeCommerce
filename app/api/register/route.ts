import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

// 1. Enhanced Validation Schema with custom error messages
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    // A. Parse and validate request body
    const body = await req.json();
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      // Industry standard: Return specific field errors
      const errorDetails = result.error.issues
        .map((issue) => issue.message)
        .join(", ");

      return NextResponse.json(
        { error: `Validation failed: ${errorDetails}` }, 
        { status: 400 }
      );
    }
    
    const { name, email, password } = result.data;

    // B. Database Connection
    await connectDB();

    // C. Conflict Check (Semantic HTTP 409)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered. Please login." }, 
        { status: 409 } // 409 Conflict is more accurate than 400 for duplicates
      );
    }

    // D. Password Security
    // Use salt rounds = 10 (Standard industry balance of security vs performance)
    const hashedPassword = await bcrypt.hash(password, 10);

    // E. Data Persistence
    await User.create({
      name,
      email,
      password: hashedPassword,
      provider: "credentials", // Explicitly setting the provider
      role: "user",
    });

    return NextResponse.json(
      { message: "Account created successfully" }, 
      { status: 201 }
    );

  } catch (error: any) {
    // Structured logging for debugging
    console.error("Critical Registration Error:", {
      message: error.message,
      stack: error.stack,
    }); 
    
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" }, 
      { status: 500 }
    );
  }
}