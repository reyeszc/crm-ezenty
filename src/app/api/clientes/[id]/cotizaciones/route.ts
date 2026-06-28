import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { puedeAccederCliente } from "@/lib/permisos";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const cotizaciones = await db.select().from(schema.cotizaciones)
    .where(and(eq(schema.cotizaciones.clienteId, id), isNull(schema.cotizaciones.eliminadoEn)))
    .orderBy(desc(schema.cotizaciones.creadoEn));
  return NextResponse.json({ cotizaciones });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Inválido" }, { status: 400 });

  // Generate quote number
  const count = await db.select().from(schema.cotizaciones).where(eq(schema.cotizaciones.clienteId, id));
  const numero = `EZPC-Q-${String(43000 + count.length + 1).padStart(5, "0")}`;

  const cotizacionId = crypto.randomUUID();
  await db.insert(schema.cotizaciones).values({
    id: cotizacionId,
    numero,
    estado: "BORRADOR",
    subtotal: body.subtotal || 0,
    descuento: body.descuento || 0,
    total: body.total || 0,
    notas: body.notas || null,
    validezDias: body.validezDias || 30,
    medidaId: body.medidaId || null,
    clienteId: id,
    vendedorId: session.user.id,
  });

  // Insert lines
  for (const linea of (body.lineas || [])) {
    await db.insert(schema.cotizacionLineas).values({
      id: crypto.randomUUID(),
      descripcion: linea.descripcion,
      tipo: linea.tipo,
      unidad: linea.unidad,
      cantidad: linea.cantidad || 0,
      precioUnitario: linea.precioUnitario || 0,
      precioFinal: linea.precioFinal || 0,
      subtotal: linea.subtotal || 0,
      area: linea.area || null,
      orden: linea.orden || 0,
      cotizacionId,
    });
  }

  // Log in timeline
  await db.insert(schema.notas).values({
    id: crypto.randomUUID(),
    clienteId: id,
    autorId: session.user.id,
    contenido: `Quote ${numero} created — Total: $${(body.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    tipo: "NOTA",
  });

  return NextResponse.json({ id: cotizacionId, numero }, { status: 201 });
}
