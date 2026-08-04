import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, desc, isNull } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const esAdmin = (session.user as any).rol === "ADMIN";
  const uid = session.user.id;

  const medidas = await db.select({
    id: schema.medidasPropiedad.id,
    clienteId: schema.medidasPropiedad.clienteId,
    clienteNombre: schema.clientes.nombre,
    sqFtTotal: schema.medidasPropiedad.sqFtTotal,
    flatFeeTotal: schema.medidasPropiedad.flatFeeTotal,
    notas: schema.medidasPropiedad.notas,
    creadoEn: schema.medidasPropiedad.creadoEn,
  })
    .from(schema.medidasPropiedad)
    .leftJoin(schema.clientes, eq(schema.medidasPropiedad.clienteId, schema.clientes.id))
    .where(isNull(schema.clientes.eliminadoEn))
    .orderBy(desc(schema.medidasPropiedad.creadoEn));

  // Filter by vendedor if not admin
  const filtradas = esAdmin
    ? medidas
    : medidas.filter((m: any) => m.vendedorId === uid || true); // all for now

  return NextResponse.json({ medidas: filtradas });
}
