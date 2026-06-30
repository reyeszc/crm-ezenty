import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { registrarAuditoria } from "@/lib/auditoria";

const PatchSchema = z.object({
  nombre: z.string().min(1).optional(),
  correo: z.string().email().optional(),
  rol: z.enum(["ADMIN","VENDEDOR","SOLO_LECTURA"]).optional(),
  metaMensual: z.coerce.number().min(0).optional(),
  activo: z.boolean().optional(),
  password: z.string().min(8).optional(),
  titulo: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).rol !== "ADMIN") {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const updateData: any = { actualizadoEn: new Date() };
  const { password, ...rest } = parsed.data;

  Object.assign(updateData, rest);

  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 12);
    updateData.intentosFallidos = 0;
    updateData.bloqueadoHasta = null;
  }

  await db.update(schema.usuarios).set(updateData).where(eq(schema.usuarios.id, id));

  const [updated] = await db.select({
    id: schema.usuarios.id, nombre: schema.usuarios.nombre,
    correo: schema.usuarios.correo, rol: schema.usuarios.rol,
    activo: schema.usuarios.activo, metaMensual: schema.usuarios.metaMensual,
    titulo: schema.usuarios.titulo,
    creadoEn: schema.usuarios.creadoEn,
  }).from(schema.usuarios).where(eq(schema.usuarios.id, id)).limit(1);

  await registrarAuditoria({ usuarioId: session.user.id, accion: "Editó usuario", entidad: "Usuario", entidadId: id, detalle: `Editó al usuario ${updated?.nombre}` });

  return NextResponse.json(updated);
}
