import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { puedeAccederCliente } from "@/lib/permisos";
import { z } from "zod";

const NoteSchema = z.object({
  contenido: z.string().min(1).max(5000),
  tipo: z.string().default("NOTA"),
  fecha: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = NoteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const fechaNota = parsed.data.fecha ? new Date(parsed.data.fecha) : new Date();
  const notaId = crypto.randomUUID();

  await db.insert(schema.notas).values({
    id: notaId, clienteId: id, autorId: session.user.id,
    contenido: parsed.data.contenido, tipo: parsed.data.tipo, fecha: fechaNota,
  });
  await db.update(schema.clientes).set({ ultimoContacto: fechaNota }).where(eq(schema.clientes.id, id));

  const [nota] = await db.select().from(schema.notas).where(eq(schema.notas.id, notaId)).limit(1);
  const [autor] = await db.select({ id: schema.usuarios.id, nombre: schema.usuarios.nombre })
    .from(schema.usuarios).where(eq(schema.usuarios.id, session.user.id)).limit(1);

  return NextResponse.json({ ...nota, autor }, { status: 201 });
}
