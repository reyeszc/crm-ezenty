import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.fotoUrl) return NextResponse.json({ error: "URL requerida" }, { status: 400 });

  await db.update(schema.usuarios)
    .set({ avatarUrl: body.fotoUrl, actualizadoEn: new Date() })
    .where(eq(schema.usuarios.id, session.user.id));

  return NextResponse.json({ ok: true });
}
