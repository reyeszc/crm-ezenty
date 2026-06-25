import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const LeadSchema = z.object({
  nombre: z.string().min(1).max(200),
  telefono: z.string().min(5),
  correo: z.string().email().optional().or(z.literal("")),
  fecha: z.string().optional(),
  mensaje: z.string().optional(),
  utmCanal: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const data = parsed.data;
  const [admin] = await db.select({ id: schema.usuarios.id }).from(schema.usuarios).where(eq(schema.usuarios.rol, "ADMIN")).limit(1);
  if (!admin) return NextResponse.json({ error: "No hay usuarios" }, { status: 500 });

  const id = crypto.randomUUID();
  const manana = new Date(Date.now() + 86400000);

  await db.insert(schema.clientes).values({
    id, nombre: data.nombre, telefono: data.telefono,
    correo: (data.correo && data.correo !== "") ? data.correo : null,
    origen: "Landing", utmCanal: data.utmCanal || null,
    etapa: "PROSPECTO", estado: "ACTIVO", temperatura: "TIBIO",
    proximaAccion: "Contact within 24 hours — from landing page",
    proximaAccionFecha: manana, vendedorId: admin.id,
  });

  if (data.fecha || data.mensaje) {
    await db.insert(schema.notas).values({
      id: crypto.randomUUID(), clienteId: id, autorId: admin.id,
      contenido: `Lead from landing page.${data.fecha ? ` Date requested: ${data.fecha}.` : ""}${data.mensaje ? ` Note: ${data.mensaje}` : ""}`,
      tipo: "NOTA",
    });
  }

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
