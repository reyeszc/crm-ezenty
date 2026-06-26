import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const Schema = z.object({
  actual: z.string().min(1),
  nueva: z.string().min(8),
  confirmar: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  if (parsed.data.nueva !== parsed.data.confirmar) return NextResponse.json({ error: "No coinciden" }, { status: 400 });

  const [user] = await db.select({ passwordHash: schema.usuarios.passwordHash }).from(schema.usuarios).where(eq(schema.usuarios.id, session.user.id)).limit(1);
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const valid = await bcrypt.compare(parsed.data.actual, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });

  const newHash = await bcrypt.hash(parsed.data.nueva, 12);
  await db.update(schema.usuarios).set({ passwordHash: newHash }).where(eq(schema.usuarios.id, session.user.id));
  return NextResponse.json({ ok: true });
}
