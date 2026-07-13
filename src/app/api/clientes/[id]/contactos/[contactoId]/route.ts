import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { puedeAccederCliente } from "@/lib/permisos";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; contactoId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id, contactoId } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Inválido" }, { status: 400 });

  // If setting as principal, unset all others first
  if (body.principal) {
    await db.update(schema.contactos)
      .set({ principal: false })
      .where(eq(schema.contactos.clienteId, id));
  }

  await db.update(schema.contactos).set({
    ...(body.nombre !== undefined && { nombre: body.nombre }),
    ...(body.cargo !== undefined && { cargo: body.cargo }),
    ...(body.telefono !== undefined && { telefono: body.telefono }),
    ...(body.correo !== undefined && { correo: body.correo }),
    ...(body.notas !== undefined && { notas: body.notas }),
    ...(body.principal !== undefined && { principal: body.principal }),
  }).where(and(
    eq(schema.contactos.id, contactoId),
    eq(schema.contactos.clienteId, id)
  ));

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; contactoId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id, contactoId } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  await db.delete(schema.contactos).where(and(
    eq(schema.contactos.id, contactoId),
    eq(schema.contactos.clienteId, id)
  ));

  return NextResponse.json({ ok: true });
}
