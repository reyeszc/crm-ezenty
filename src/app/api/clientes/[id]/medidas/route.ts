import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { puedeAccederCliente } from "@/lib/permisos";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const medidas = await db.select().from(schema.medidasPropiedad)
    .where(eq(schema.medidasPropiedad.clienteId, id))
    .orderBy(desc(schema.medidasPropiedad.creadoEn));
  return NextResponse.json({ medidas });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Inválido" }, { status: 400 });

  const medidaId = crypto.randomUUID();
  await db.insert(schema.medidasPropiedad).values({
    id: medidaId, clienteId: id, usuarioId: session.user.id,
    notas: body.notas || null, sqFtTotal: body.sqFtTotal || 0, flatFeeTotal: body.flatFeeTotal || 0,
  });

  for (const [i, area] of (body.areas || []).entries()) {
    const areaId = crypto.randomUUID();
    await db.insert(schema.medidasAreas).values({
      id: areaId, medidaId, area: area.area,
      tipoPiso: area.tipoPiso || null,
      flatFee: area.flatFee || 0,
      fotoUrl: area.fotoUrl || null,
      esTipoHabitacion: area.esTipoHabitacion || false,
      esTipoBano: area.esTipoBano || false,
      extras: area.extras || null,
      subtotalSqFt: area.subtotalSqFt || 0,
      orden: i,
    });
    for (const [j, linea] of (area.lineas || []).entries()) {
      await db.insert(schema.medidasLineas).values({
        id: crypto.randomUUID(), areaId,
        descripcion: linea.descripcion || null,
        ancho: linea.ancho, largo: linea.largo, sqFt: linea.sqFt, orden: j,
      });
    }
  }

  await db.insert(schema.notas).values({
    id: crypto.randomUUID(), clienteId: id, autorId: session.user.id,
    contenido: `Measurements recorded: ${(body.sqFtTotal || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })} sq ft total across ${(body.areas || []).length} area(s)`,
    tipo: "NOTA",
  });

  return NextResponse.json({ ok: true, id: medidaId }, { status: 201 });
}
