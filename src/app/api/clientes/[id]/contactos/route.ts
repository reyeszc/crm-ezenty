import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { puedeAccederCliente } from "@/lib/permisos";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const contactos = await db.select().from(schema.contactos)
    .where(eq(schema.contactos.clienteId, id))
    .orderBy(desc(schema.contactos.principal));
  return NextResponse.json({ contactos });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.nombre) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  const contactoId = crypto.randomUUID();
  await db.insert(schema.contactos).values({
    id: contactoId, clienteId: id,
    nombre: body.nombre, cargo: body.cargo || null,
    telefono: body.telefono || null, correo: body.correo || null,
    notas: body.notas || null, principal: body.principal || false,
  });
  return NextResponse.json({ id: contactoId }, { status: 201 });
}
