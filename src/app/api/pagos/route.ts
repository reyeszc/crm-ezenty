import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and, isNull, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const esAdmin = (session.user as any).rol === "ADMIN";
  const uid = session.user.id;

  const pagosList = await db.select({
    id: schema.pagos.id, monto: schema.pagos.monto, metodo: schema.pagos.metodo,
    estatus: schema.pagos.estatus, concepto: schema.pagos.concepto, folio: schema.pagos.folio,
    fechaPago: schema.pagos.fechaPago, fechaVencimiento: schema.pagos.fechaVencimiento,
    clienteId: schema.pagos.clienteId, clienteNombre: schema.clientes.nombre,
    creadoEn: schema.pagos.creadoEn,
  }).from(schema.pagos)
    .leftJoin(schema.clientes, eq(schema.pagos.clienteId, schema.clientes.id))
    .where(and(
      isNull(schema.pagos.eliminadoEn),
      ...(esAdmin ? [] : [eq(schema.pagos.vendedorId, uid)])
    ))
    .orderBy(desc(schema.pagos.creadoEn))
    .limit(100);

  return NextResponse.json({ pagos: pagosList });
}
