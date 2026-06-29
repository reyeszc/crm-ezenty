import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { registrarAuditoria } from "@/lib/auditoria";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ cotId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if ((session.user as any).rol !== "ADMIN") return NextResponse.json({ error: "Solo admin" }, { status: 403 });

  const { cotId } = await params;

  const [cot] = await db.select({ id: schema.cotizaciones.id, numero: schema.cotizaciones.numero })
    .from(schema.cotizaciones).where(eq(schema.cotizaciones.id, cotId)).limit(1);
  if (!cot) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  // Soft delete
  await db.update(schema.cotizaciones)
    .set({ eliminadoEn: new Date() })
    .where(eq(schema.cotizaciones.id, cotId));

  await registrarAuditoria({
    usuarioId: session.user.id,
    accion: "Eliminó cotización",
    entidad: "Cotizacion",
    entidadId: cotId,
    detalle: `Eliminó cotización ${cot.numero}`,
  });

  return NextResponse.json({ ok: true });
}
