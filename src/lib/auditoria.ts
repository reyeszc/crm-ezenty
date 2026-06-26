import { db, schema } from "@/lib/db";

export async function registrarAuditoria({
  usuarioId, accion, entidad, entidadId, detalle, ip,
}: {
  usuarioId: string; accion: string; entidad: string;
  entidadId?: string; detalle?: string; ip?: string;
}) {
  try {
    await db.insert(schema.registroAuditoria).values({
      id: crypto.randomUUID(),
      usuarioId, accion, entidad,
      entidadId: entidadId || null,
      detalle: detalle || null,
      ip: ip || null,
    });
  } catch (error) {
    console.error("[Auditoría] Error:", error);
  }
}
