import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and, or, ilike, isNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) return NextResponse.json({ clientes: [], citas: [] });

  const usuarioId = session.user.id;
  const esAdmin = (session.user as any).rol === "ADMIN";

  const conditions: any[] = [
    isNull(schema.clientes.eliminadoEn),
    or(ilike(schema.clientes.nombre, `%${q}%`), ilike(schema.clientes.telefono, `%${q}%`), ilike(schema.clientes.correo, `%${q}%`), ilike(schema.clientes.propiedad, `%${q}%`)),
  ];
  if (!esAdmin) conditions.push(eq(schema.clientes.vendedorId, usuarioId));

  const clientes = await db.select({
    id: schema.clientes.id, nombre: schema.clientes.nombre,
    etapa: schema.clientes.etapa, temperatura: schema.clientes.temperatura,
    propiedad: schema.clientes.propiedad,
  }).from(schema.clientes).where(and(...conditions)).limit(8);

  return NextResponse.json({ clientes, citas: [] });
}
