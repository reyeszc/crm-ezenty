import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and, isNull, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const esAdmin = (session.user as any).rol === "ADMIN";
  const uid = session.user.id;

  const cotizaciones = await db.select({
    id: schema.cotizaciones.id,
    numero: schema.cotizaciones.numero,
    estado: schema.cotizaciones.estado,
    total: schema.cotizaciones.total,
    descuento: schema.cotizaciones.descuento,
    validezDias: schema.cotizaciones.validezDias,
    creadoEn: schema.cotizaciones.creadoEn,
    clienteId: schema.cotizaciones.clienteId,
    clienteNombre: schema.clientes.nombre,
  }).from(schema.cotizaciones)
    .leftJoin(schema.clientes, eq(schema.cotizaciones.clienteId, schema.clientes.id))
    .where(and(
      isNull(schema.cotizaciones.eliminadoEn),
      ...(esAdmin ? [] : [eq(schema.cotizaciones.vendedorId, uid)])
    ))
    .orderBy(desc(schema.cotizaciones.creadoEn))
    .limit(100);

  return NextResponse.json({ cotizaciones });
}
