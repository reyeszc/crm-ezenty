import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { isNull, and, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const esAdmin = (session.user as any).rol === "ADMIN";

  const rows = await db.select({ zona: schema.clientes.zona }).from(schema.clientes)
    .where(and(
      isNull(schema.clientes.eliminadoEn),
      ...(esAdmin ? [] : [eq(schema.clientes.vendedorId, session.user.id)])
    ));

  const zonas = Array.from(new Set(rows.map(r => r.zona).filter(Boolean))).sort();
  return NextResponse.json({ zonas });
}
