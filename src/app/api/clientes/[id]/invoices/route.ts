import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { puedeAccederCliente } from "@/lib/permisos";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const invoices = await db.select().from(schema.invoices)
    .where(eq(schema.invoices.clienteId, id))
    .orderBy(desc(schema.invoices.creadoEn));
  return NextResponse.json({ invoices });
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

  // Generate unique invoice number
  const [last] = await db.select({ numero: schema.invoices.numero })
    .from(schema.invoices).orderBy(desc(schema.invoices.creadoEn)).limit(1);
  let nextNum = 1001;
  if (last?.numero) {
    const match = last.numero.match(/EZPC-I-(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  const numero = `EZPC-I-${String(nextNum).padStart(5, "0")}`;

  const invoiceId = crypto.randomUUID();
  await db.insert(schema.invoices).values({
    id: invoiceId, numero, estado: "BORRADOR",
    fechaServicio: body.fechaServicio ? new Date(body.fechaServicio) : null,
    fechaServicioFin: body.fechaServicioFin ? new Date(body.fechaServicioFin) : null,
    fechasServicio: body.fechasServicio ? JSON.stringify(body.fechasServicio) : null,
    terminosPago: body.terminosPago || "Net 30",
    subtotal: body.subtotal || 0, descuento: body.descuento || 0, total: body.total || 0,
    notas: body.notas || null,
    contactoNombre: body.contactoNombre || null, contactoPuesto: body.contactoPuesto || null,
    contactoCorreo: body.contactoCorreo || null, contactoTelefono: body.contactoTelefono || null,
    cotizacionId: body.cotizacionId || null,
    clienteId: id, vendedorId: session.user.id,
  });

  if (body.lineas?.length > 0) {
    for (const [i, l] of body.lineas.entries()) {
      await db.insert(schema.invoiceLineas).values({
        id: crypto.randomUUID(), invoiceId,
        descripcion: l.descripcion || "", tipo: l.tipo || null,
        unidad: l.unidad || "sqft", cantidad: l.cantidad || 1,
        precioUnitario: l.precioUnitario || 0, precioFinal: l.precioFinal || 0,
        subtotal: (l.precioFinal || 0) * (l.cantidad || 1),
        area: l.area || null, cotizacionLineaId: l.cotizacionLineaId || null, orden: i,
      });
    }
  }

  return NextResponse.json({ id: invoiceId, numero }, { status: 201 });
}
