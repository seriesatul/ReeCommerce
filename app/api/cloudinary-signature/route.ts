import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ENV } from "@/lib/env";

cloudinary.config({
  cloud_name: ENV.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: ENV.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { paramsToSign } = await req.json();
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      ENV.CLOUDINARY_API_SECRET
    );

    return NextResponse.json({ signature });
  } catch (error) {
    return NextResponse.json({ error: "Signature failed" }, { status: 500 });
  }
}