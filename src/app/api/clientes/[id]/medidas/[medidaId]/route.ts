import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { puedeAccederCliente } from "@/lib/permisos";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; medidaId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id, medidaId } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const [medida] = await db.select().from(schema.medidasPropiedad).where(eq(schema.medidasPropiedad.id, medidaId)).limit(1);
  if (!medida) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const areas = await db.select().from(schema.medidasAreas)
    .where(eq(schema.medidasAreas.medidaId, medidaId)).orderBy(asc(schema.medidasAreas.orden));

  const areasConLineas = await Promise.all(areas.map(async (a) => {
    const lineas = await db.select().from(schema.medidasLineas)
      .where(eq(schema.medidasLineas.areaId, a.id)).orderBy(asc(schema.medidasLineas.orden));
    return { ...a, lineas };
  }));

  return NextResponse.json({ medida, areas: areasConLineas });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; medidaId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id, medidaId } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Inválido" }, { status: 400 });

  await db.update(schema.medidasPropiedad).set({
    notas: body.notas ?? undefined,
    sqFtTotal: body.sqFtTotal ?? undefined,
    flatFeeTotal: body.flatFeeTotal ?? undefined,
  }).where(eq(schema.medidasPropiedad.id, medidaId));

  // Replace all areas/lineas with the updated set
  if (body.areas) {
    const existingAreas = await db.select({ id: schema.medidasAreas.id }).from(schema.medidasAreas).where(eq(schema.medidasAreas.medidaId, medidaId));
    for (const a of existingAreas) {
      await db.delete(schema.medidasLineas).where(eq(schema.medidasLineas.areaId, a.id));
    }
    await db.delete(schema.medidasAreas).where(eq(schema.medidasAreas.medidaId, medidaId));

    for (const [i, area] of body.areas.entries()) {
      const areaId = crypto.randomUUID();
      await db.insert(schema.medidasAreas).values({
        id: areaId, medidaId, area: area.area,
        tipoPiso: area.tipoPiso || null, flatFee: area.flatFee || 0,
        fotoUrl: area.fotoUrl || null,
        esTipoHabitacion: area.esTipoHabitacion || false,
        esTipoBano: area.esTipoBano || false,
        extras: area.extras || null,
        subtotalSqFt: area.subtotalSqFt || 0, orden: i,
      });
      for (const [j, linea] of (area.lineas || []).entries()) {
        await db.insert(schema.medidasLineas).values({
          id: crypto.randomUUID(), areaId,
          descripcion: linea.descripcion || null,
          ancho: linea.ancho, largo: linea.largo, sqFt: linea.sqFt, orden: j,
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; medidaId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id, medidaId } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const areas = await db.select({ id: schema.medidasAreas.id }).from(schema.medidasAreas).where(eq(schema.medidasAreas.medidaId, medidaId));
  for (const a of areas) {
    await db.delete(schema.medidasLineas).where(eq(schema.medidasLineas.areaId, a.id));
  }
  await db.delete(schema.medidasAreas).where(eq(schema.medidasAreas.medidaId, medidaId));
  await db.delete(schema.medidasPropiedad).where(eq(schema.medidasPropiedad.id, medidaId));

  return NextResponse.json({ ok: true });
}
