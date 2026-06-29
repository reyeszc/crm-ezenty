import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ cotId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { cotId } = await params;

  const [cot] = await db.select().from(schema.cotizaciones).where(eq(schema.cotizaciones.id, cotId)).limit(1);
  if (!cot) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const [cliente] = await db.select({
    nombre: schema.clientes.nombre, telefono: schema.clientes.telefono,
    correo: schema.clientes.correo, management: schema.clientes.management,
    direccionPropiedad: schema.clientes.direccionPropiedad,
    zona: schema.clientes.zona, tipoPropiedad: schema.clientes.tipoPropiedad,
  }).from(schema.clientes).where(eq(schema.clientes.id, cot.clienteId)).limit(1);

  const lineas = await db.select().from(schema.cotizacionLineas)
    .where(eq(schema.cotizacionLineas.cotizacionId, cotId))
    .orderBy(schema.cotizacionLineas.orden);

  const [vendedor] = await db.select({ nombre: schema.usuarios.nombre, correo: schema.usuarios.correo })
    .from(schema.usuarios).where(eq(schema.usuarios.id, cot.vendedorId)).limit(1);

  // Return data for client-side PDF generation
  return NextResponse.json({
    cotizacion: cot, cliente, lineas, vendedor,
    fechaCreacion: cot.creadoEn,
    fechaValidez: new Date(new Date(cot.creadoEn).getTime() + (cot.validezDias || 30) * 86400000),
  });
}
