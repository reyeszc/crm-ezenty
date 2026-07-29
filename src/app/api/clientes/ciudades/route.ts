import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { isNull } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await db.select({ ciudadCluster: schema.clientes.ciudadCluster })
    .from(schema.clientes).where(isNull(schema.clientes.eliminadoEn));
  const ciudades = Array.from(new Set(rows.map(r => r.ciudadCluster).filter(Boolean))).sort();
  return NextResponse.json({ ciudades });
}
