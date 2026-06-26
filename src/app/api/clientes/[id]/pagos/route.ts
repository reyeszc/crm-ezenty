import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { puedeAccederCliente } from "@/lib/permisos";
import { count } from "drizzle-orm";
import { z } from "zod";

const PagoSchema = z.object({
  monto: z.coerce.number().positive(),
  metodo: z.enum(["TRANSFERENCIA","MESES_SIN_INTERESES","DEPOSITO_ANTICIPO"]),
  estatus: z.enum(["PENDIENTE","PAGADO","VENCIDO"]).default("PENDIENTE"),
  concepto: z.string().optional(),
  fechaPago: z.string().optional().nullable(),
  fechaVencimiento: z.string().optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = PagoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const data = parsed.data;
  const [cnt] = await db.select({ n: count() }).from(schema.pagos);
  const folio = `EP-${String(Number(cnt?.n || 0) + 1).padStart(3, "0")}`;
  const pagoId = crypto.randomUUID();
  await db.insert(schema.pagos).values({
    id: pagoId, clienteId: id, vendedorId: session.user.id,
    monto: data.monto, metodo: data.metodo, estatus: data.estatus,
    concepto: data.concepto || null, folio,
    fechaPago: data.fechaPago ? new Date(data.fechaPago) : (data.estatus === "PAGADO" ? new Date() : null),
    fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
  });
  await db.insert(schema.notas).values({
    id: crypto.randomUUID(), clienteId: id, autorId: session.user.id,
    contenido: `Payment: ${data.estatus === "PAGADO" ? "✓ Paid" : "Pending"} — $${data.monto} (${data.metodo})`,
    tipo: "PAGO",
  });
  return NextResponse.json({ id: pagoId, folio, ...data }, { status: 201 });
}
