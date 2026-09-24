import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { puedeAccederCliente } from "@/lib/permisos";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; invoiceId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id, invoiceId } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Inválido" }, { status: 400 });

  const allowed = ["estado", "notas", "terminosPago", "fechaServicio", "total", "subtotal"];
  const update: any = { actualizadoEn: new Date() };
  for (const key of allowed) {
    if (key in body) {
      if (key === "fechaServicio") update[key] = body[key] ? new Date(body[key]) : null;
      else update[key] = body[key];
    }
  }

  await db.update(schema.invoices).set(update).where(eq(schema.invoices.id, invoiceId));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; invoiceId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { invoiceId } = await params;
  await db.delete(schema.invoiceLineas).where(eq(schema.invoiceLineas.invoiceId, invoiceId));
  await db.delete(schema.invoices).where(eq(schema.invoices.id, invoiceId));
  return NextResponse.json({ ok: true });
}
