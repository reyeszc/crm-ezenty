import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary no configurado" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No hay archivo" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64Data}`;

    const timestamp = Math.round(Date.now() / 1000);
    const folder = "ezenty-crm";

    // Cloudinary requires alphabetical order for signature
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto.createHash("sha256")
      .update(paramsToSign + apiSecret)
      .digest("hex");

    // Use URLSearchParams for proper form encoding
    const params = new URLSearchParams();
    params.append("file", dataUri);
    params.append("api_key", apiKey);
    params.append("timestamp", String(timestamp));
    params.append("signature", signature);
    params.append("folder", folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Cloudinary error:", data);
      throw new Error(data.error?.message || "Upload failed");
    }

    return NextResponse.json({ url: data.secure_url, publicId: data.public_id });
  } catch (err: any) {
    console.error("Upload error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
