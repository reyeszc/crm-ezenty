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

  const data: any = { actualizadoEn: new Date() };
  const allowed = ["estado", "notas", "validezDias", "descuento", "total", "subtotal"];
  for (const k of allowed) { if (k in body) data[k] = body[k]; }
  await db.update(schema.cotizaciones).set(data).where(eq(schema.cotizaciones.id, cotId));

  // If lineas are included, replace them all
  if (body.lineas && Array.isArray(body.lineas)) {
    await db.delete(schema.cotizacionLineas).where(eq(schema.cotizacionLineas.cotizacionId, cotId));
    for (const [i, linea] of body.lineas.entries()) {
      await db.insert(schema.cotizacionLineas).values({
        id: crypto.randomUUID(),
        cotizacionId: cotId,
        descripcion: linea.descripcion || "",
        tipo: linea.tipo || "Servicio",
        unidad: linea.unidad || "sqft",
        cantidad: linea.cantidad || 1,
        precioUnitario: linea.precioUnitario || linea.precioFinal || 0,
        precioFinal: linea.precioFinal || linea.precioUnitario || 0,
        subtotal: (linea.precioFinal || 0) * (linea.cantidad || 1),
        area: linea.area || null,
        orden: i,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
