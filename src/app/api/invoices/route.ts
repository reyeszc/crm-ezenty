import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, desc, isNull } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const esAdmin = (session.user as any).rol === "ADMIN";
  const uid = session.user.id;

  const invoices = await db.select({
    id: schema.invoices.id,
    numero: schema.invoices.numero,
    estado: schema.invoices.estado,
    fechaServicio: schema.invoices.fechaServicio,
    terminosPago: schema.invoices.terminosPago,
    total: schema.invoices.total,
    clienteId: schema.invoices.clienteId,
    clienteNombre: schema.clientes.nombre,
    creadoEn: schema.invoices.creadoEn,
  })
    .from(schema.invoices)
    .leftJoin(schema.clientes, eq(schema.invoices.clienteId, schema.clientes.id))
    .where(esAdmin ? isNull(schema.invoices.eliminadoEn) : eq(schema.invoices.vendedorId, uid))
    .orderBy(desc(schema.invoices.creadoEn));

  return NextResponse.json({ invoices });
}
