import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { registrarAuditoria } from "@/lib/auditoria";

const CreateSchema = z.object({
  nombre: z.string().min(1),
  correo: z.string().email(),
  rol: z.enum(["ADMIN","VENDEDOR","SOLO_LECTURA"]).default("VENDEDOR"),
  metaMensual: z.coerce.number().min(0).default(0),
  titulo: z.string().optional(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).rol !== "ADMIN") {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalle: parsed.error.flatten() }, { status: 400 });

  const { nombre, correo, rol, metaMensual, titulo, password } = parsed.data;

  // Check if email already exists
  const [existing] = await db.select({ id: schema.usuarios.id }).from(schema.usuarios).where(eq(schema.usuarios.correo, correo)).limit(1);
  if (existing) return NextResponse.json({ error: "Ya existe un usuario con ese correo" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const id = crypto.randomUUID();

  await db.insert(schema.usuarios).values({
    id, nombre, correo, passwordHash, rol, metaMensual, activo: true, titulo: titulo || null,
  });

  await registrarAuditoria({ usuarioId: session.user.id, accion: "Creó usuario", entidad: "Usuario", entidadId: id, detalle: `Creó al usuario ${nombre} (${rol})` });

  return NextResponse.json({ id, nombre, correo, rol, metaMensual, activo: true, creadoEn: new Date() }, { status: 201 });
}
