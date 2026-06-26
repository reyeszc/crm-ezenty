import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { isNull } from "drizzle-orm";
import { registrarAuditoria } from "@/lib/auditoria";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).rol !== "ADMIN") {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }
  const [clientes, pagos, citas] = await Promise.all([
    db.select().from(schema.clientes).where(isNull(schema.clientes.eliminadoEn)),
    db.select().from(schema.pagos).where(isNull(schema.pagos.eliminadoEn)),
    db.select().from(schema.citas).where(isNull(schema.citas.eliminadoEn)),
  ]);
  await registrarAuditoria({ usuarioId: session.user.id, accion: "Exportó datos", entidad: "Sistema" });
  const exportData = { exportadoEn: new Date().toISOString(), clientes, pagos, citas };
  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="ezenty-backup-${new Date().toISOString().slice(0,10)}.json"` },
  });
}
