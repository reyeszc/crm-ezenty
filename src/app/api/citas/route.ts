import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and, gte, lte, isNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const esAdmin = (session.user as any).rol === "ADMIN";
  const uid = session.user.id;

  const sp = req.nextUrl.searchParams;
  const inicio = sp.get("inicio") ? new Date(sp.get("inicio")!) : new Date(Date.now() - 30 * 86400000);
  const fin = sp.get("fin") ? new Date(sp.get("fin")!) : new Date(Date.now() + 60 * 86400000);

  const citas = await db.select({
    id: schema.citas.id,
    titulo: schema.citas.titulo,
    inicio: schema.citas.inicio,
    fin: schema.citas.fin,
    estado: schema.citas.estado,
    notas: schema.citas.notas,
    googleMeetUrl: schema.citas.googleMeetUrl,
    clienteId: schema.citas.clienteId,
    clienteNombre: schema.clientes.nombre,
    vendedorId: schema.citas.vendedorId,
  }).from(schema.citas)
    .leftJoin(schema.clientes, eq(schema.citas.clienteId, schema.clientes.id))
    .where(and(
      isNull(schema.citas.eliminadoEn),
      gte(schema.citas.inicio, inicio),
      lte(schema.citas.inicio, fin),
      ...(esAdmin ? [] : [eq(schema.citas.vendedorId, uid)])
    ))
    .orderBy(schema.citas.inicio);

  return NextResponse.json({ citas });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.titulo || !body?.inicio || !body?.fin) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }
  const id = crypto.randomUUID();
  await db.insert(schema.citas).values({
    id,
    titulo: body.titulo,
    inicio: new Date(body.inicio),
    fin: new Date(body.fin),
    estado: body.estado || "PENDIENTE",
    notas: body.notas || null,
    clienteId: body.clienteId || null,
    vendedorId: session.user.id,
    creadoPorId: session.user.id,
  });
  return NextResponse.json({ id }, { status: 201 });
}
