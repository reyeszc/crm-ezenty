import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and, isNull } from "drizzle-orm";
import { puedeAccederCliente } from "@/lib/permisos";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; cotId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id, cotId } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const [cot] = await db.select().from(schema.cotizaciones)
    .where(and(eq(schema.cotizaciones.id, cotId), eq(schema.cotizaciones.clienteId, id))).limit(1);
  if (!cot) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  const lineas = await db.select().from(schema.cotizacionLineas)
    .where(eq(schema.cotizacionLineas.cotizacionId, cotId))
    .orderBy(schema.cotizacionLineas.orden);
  return NextResponse.json({ cotizacion: cot, lineas });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; cotId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id, cotId } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const allowed = ["estado", "notas", "validezDias", "descuento"];
  const data: any = { actualizadoEn: new Date() };
  for (const k of allowed) { if (k in body) data[k] = body[k]; }
  await db.update(schema.cotizaciones).set(data).where(eq(schema.cotizaciones.id, cotId));
  return NextResponse.json({ ok: true });
}
