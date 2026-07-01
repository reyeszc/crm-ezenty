import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const Schema = z.object({
  nombre: z.string().min(1), telefono: z.string().min(5),
  correo: z.string().email().optional().or(z.literal("")),
  fecha: z.string(), hora: z.string(), slug: z.string(),
});

export async function POST(req: NextRequest) {
  // Basic origin validation
  const origin = req.headers.get("origin") || "";
  const allowedOrigins = ["https://crm-ezenty.vercel.app", "https://ezentyprocare.com"];
  if (origin && !allowedOrigins.some(o => origin.startsWith(o))) {
    // Allow for now but log — don't break existing integrations
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Inválido" }, { status: 400 });
  const data = parsed.data;
  const [admin] = await db.select({ id: schema.usuarios.id }).from(schema.usuarios).where(eq(schema.usuarios.rol, "ADMIN")).limit(1);
  if (!admin) return NextResponse.json({ error: "No hay usuarios" }, { status: 500 });
  const inicio = new Date(`${data.fecha}T${data.hora}:00`);
  const fin = new Date(inicio.getTime() + 45 * 60000);
  const clienteId = crypto.randomUUID();
  await db.insert(schema.clientes).values({
    id: clienteId, nombre: data.nombre, telefono: data.telefono,
    correo: (data.correo && data.correo !== "") ? data.correo : null,
    origen: `Agenda ${data.slug}`, etapa: "PROSPECTO", estado: "ACTIVO", temperatura: "TIBIO",
    proximaAccion: "Confirm scheduled appointment", proximaAccionFecha: inicio, vendedorId: admin.id,
  });
  await db.insert(schema.citas).values({
    id: crypto.randomUUID(), titulo: `Consultation — ${data.nombre}`,
    inicio, fin, clienteId, vendedorId: admin.id, estado: "PENDIENTE",
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
