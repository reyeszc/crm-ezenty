import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { isNull } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await db.select({ management: schema.clientes.management })
    .from(schema.clientes).where(isNull(schema.clientes.eliminadoEn));
  const managements = Array.from(new Set(rows.map(r => r.management).filter(Boolean))).sort();
  return NextResponse.json({ managements });
}
