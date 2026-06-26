import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!["CLARO","OSCURO","AUTOMATICO"].includes(body.tema)) return NextResponse.json({ ok: false }, { status: 400 });
  await db.update(schema.usuarios).set({ tema: body.tema }).where(eq(schema.usuarios.id, session.user.id));
  return NextResponse.json({ ok: true });
}
