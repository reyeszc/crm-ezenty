import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  
  return NextResponse.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ? "✅ SET" : "❌ NOT SET",
    apiKey: process.env.CLOUDINARY_API_KEY ? "✅ SET" : "❌ NOT SET", 
    apiSecret: process.env.CLOUDINARY_API_SECRET ? "✅ SET" : "❌ NOT SET",
  });
}
