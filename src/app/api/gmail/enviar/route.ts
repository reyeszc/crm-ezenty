import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const accessToken = (session.user as any).accessToken;
  if (!accessToken) {
    // Graceful fallback — no Gmail connected yet
    return NextResponse.json({ fallback: true,
      mensaje: "Conecta tu Google para enviar desde el CRM. Por ahora usa el botón de correo normal." });
  }

  const body = await req.json().catch(() => null);
  const { para, asunto, cuerpo } = body || {};
  if (!para || !asunto || !cuerpo) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  const from = (session.user as any).googleEmail || "zreyes@ezentyprocare.com";
  const emailContent = [
    `From: Zugheily Reyes <${from}>`,
    `To: ${para}`,
    `Subject: ${asunto}`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    cuerpo,
  ].join("\r\n");

  const encoded = Buffer.from(emailContent).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  try {
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: encoded }),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message); }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ fallback: true, error: err.message });
  }
}
