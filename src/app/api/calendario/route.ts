import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, gte, lte, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const esAdmin = (session.user as any).rol === "ADMIN";
  const uid = session.user.id;

  const sp = req.nextUrl.searchParams;
  const inicio = sp.get("inicio") ? new Date(sp.get("inicio")!) : new Date(Date.now() - 30 * 86400000);
  const fin = sp.get("fin") ? new Date(sp.get("fin")!) : new Date(Date.now() + 60 * 86400000);

  const [citas, demos, servicios] = await Promise.all([
    // Citas = proxima_accion_fecha from clientes
    db.select({
      id: schema.clientes.id,
      fecha: schema.clientes.proximaAccionFecha,
      clienteNombre: schema.clientes.nombre,
      clienteId: schema.clientes.id,
      proximaAccion: schema.clientes.proximaAccion,
      zona: schema.clientes.zona,
    }).from(schema.clientes)
      .where(and(
        gte(schema.clientes.proximaAccionFecha, inicio),
        lte(schema.clientes.proximaAccionFecha, fin),
        ...(esAdmin ? [] : [eq(schema.clientes.vendedorId, uid)])
      )),

    db.select({
      id: schema.demos.id, fecha: schema.demos.fecha,
      estado: schema.demos.estado, notas: schema.demos.notas,
      clienteNombre: schema.clientes.nombre,
      clienteId: schema.demos.clienteId,
    }).from(schema.demos)
      .leftJoin(schema.clientes, eq(schema.demos.clienteId, schema.clientes.id))
      .where(and(
        gte(schema.demos.fecha, inicio), lte(schema.demos.fecha, fin),
        ...(esAdmin ? [] : [eq(schema.demos.usuarioId, uid)])
      )),

    db.select({
      id: schema.servicios.id, fecha: schema.servicios.fecha,
      tipo: schema.servicios.tipo, estado: schema.servicios.estado,
      sqFtTotal: schema.servicios.sqFtTotal, monto: schema.servicios.monto,
      clienteNombre: schema.clientes.nombre,
      clienteId: schema.servicios.clienteId,
    }).from(schema.servicios)
      .leftJoin(schema.clientes, eq(schema.servicios.clienteId, schema.clientes.id))
      .where(and(
        gte(schema.servicios.fecha, inicio), lte(schema.servicios.fecha, fin),
        ...(esAdmin ? [] : [eq(schema.servicios.usuarioId, uid)])
      )),
  ]);

  return NextResponse.json({ citas, demos, servicios });
}
