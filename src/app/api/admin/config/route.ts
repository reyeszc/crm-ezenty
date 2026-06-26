import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { registrarAuditoria } from "@/lib/auditoria";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).rol !== "ADMIN") {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const allowed = ["nombreNegocio","colorMarca","moneda","husoHorario","horarioInicio","horarioFin","duracionCita","mensajeWhatsapp","metaMensual","umbralEstancado","whatsappNegocio"];
  const data: any = { actualizadoEn: new Date() };
  for (const k of allowed) { if (k in body) data[k] = body[k]; }
  const existing = await db.select({ id: schema.configNegocio.id }).from(schema.configNegocio).where(eq(schema.configNegocio.id, "singleton")).limit(1);
  if (existing.length > 0) {
    await db.update(schema.configNegocio).set(data).where(eq(schema.configNegocio.id, "singleton"));
  } else {
    await db.insert(schema.configNegocio).values({ id: "singleton", ...data });
  }
  await registrarAuditoria({ usuarioId: session.user.id, accion: "Editó configuración", entidad: "ConfigNegocio" });
  return NextResponse.json({ ok: true });
}
