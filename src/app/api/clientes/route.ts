import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and, or, ilike, isNull, desc, asc, sql, count, inArray } from "drizzle-orm";
import { z } from "zod";
import { registrarAuditoria } from "@/lib/auditoria";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const usuarioId = session.user.id;
  const esAdmin = (session.user as any).rol === "ADMIN";

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") || "";
  const estado = sp.get("estado") || "";
  const etapa = sp.get("etapa") || "";
  const temperatura = sp.get("temperatura") || "";
  const pagina = Math.max(1, parseInt(sp.get("pagina") || "1"));
  const porPagina = Math.min(100, parseInt(sp.get("por_pagina") || "25"));
  const orden = sp.get("orden") || "reciente";

  const conditions: any[] = [isNull(schema.clientes.eliminadoEn)];
  if (!esAdmin) conditions.push(eq(schema.clientes.vendedorId, usuarioId));
  if (estado === "OPERATIVOS") {
    conditions.push(inArray(schema.clientes.estado, ["ACTIVO", "GANADO"]));
  } else if (estado) {
    conditions.push(eq(schema.clientes.estado, estado));
  }
  if (etapa) conditions.push(eq(schema.clientes.etapa, etapa));
  if (temperatura) conditions.push(eq(schema.clientes.temperatura, temperatura));
  if (sp.get("zona")) conditions.push(eq(schema.clientes.zona, sp.get("zona")!));
  if (q) conditions.push(or(
    ilike(schema.clientes.nombre, `%${q}%`),
    ilike(schema.clientes.correo, `%${q}%`),
    ilike(schema.clientes.telefono, `%${q}%`),
    ilike(schema.clientes.propiedad, `%${q}%`),
  ));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [total] = await db.select({ cnt: count() }).from(schema.clientes).where(where);

  const orderBy = orden === "nombre" ? asc(schema.clientes.nombre)
    : orden === "valor" ? desc(schema.clientes.valorEstimado)
    : orden === "fecha" ? asc(schema.clientes.proximaAccionFecha)
    : desc(schema.clientes.creadoEn);

  const clientes = await db.select({
    id: schema.clientes.id,
    nombre: schema.clientes.nombre,
    telefono: schema.clientes.telefono,
    correo: schema.clientes.correo,
    origen: schema.clientes.origen,
    etapa: schema.clientes.etapa,
    estado: schema.clientes.estado,
    temperatura: schema.clientes.temperatura,
    objecion: schema.clientes.objecion,
    valorEstimado: schema.clientes.valorEstimado,
    proximaAccion: schema.clientes.proximaAccion,
    proximaAccionFecha: schema.clientes.proximaAccionFecha,
    ultimoContacto: schema.clientes.ultimoContacto,
    propiedad: schema.clientes.propiedad,
    zona: schema.clientes.zona,
    creadoEn: schema.clientes.creadoEn,
    vendedorId: schema.clientes.vendedorId,
  }).from(schema.clientes)
    .where(where)
    .orderBy(orderBy)
    .offset((pagina - 1) * porPagina)
    .limit(porPagina);

  return NextResponse.json({
    clientes,
    total: Number(total?.cnt || 0),
    paginas: Math.ceil(Number(total?.cnt || 0) / porPagina),
    pagina,
  });
}

const CreateSchema = z.object({
  nombre: z.string().min(1).max(200),
  telefono: z.string().optional(),
  correo: z.string().email().optional().or(z.literal("")),
  origen: z.string().optional(),
  etapa: z.string().optional(),
  temperatura: z.string().optional(),
  valorEstimado: z.coerce.number().min(0).optional(),
  objecion: z.string().optional(),
  notas: z.string().optional(),
  proximaAccion: z.string().optional(),
  proximaAccionFecha: z.string().optional(),
  titulo: z.string().optional(),
  propiedad: z.string().optional(),
  management: z.string().optional(),
  zona: z.string().optional(),
  puesto: z.string().optional(),
  vendedorId: z.string().optional(),
  utmCanal: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const usuarioId = session.user.id;
  const esAdmin = (session.user as any).rol === "ADMIN";

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const data = parsed.data;

  // Check duplicates
  if (data.telefono || (data.correo && data.correo !== "")) {
    const orConds: any[] = [];
    if (data.telefono) orConds.push(eq(schema.clientes.telefono, data.telefono));
    if (data.correo && data.correo !== "") orConds.push(eq(schema.clientes.correo, data.correo));
    const [dup] = await db.select({ id: schema.clientes.id, nombre: schema.clientes.nombre })
      .from(schema.clientes)
      .where(and(isNull(schema.clientes.eliminadoEn), or(...orConds)))
      .limit(1);
    if (dup) return NextResponse.json({ error: "duplicado", mensaje: `Ya tienes a ${dup.nombre} con este WhatsApp o correo.`, clienteId: dup.id }, { status: 409 });
  }

  const vendedorId = esAdmin && data.vendedorId ? data.vendedorId : usuarioId;
  const id = crypto.randomUUID();

  await db.insert(schema.clientes).values({
    id,
    nombre: data.nombre,
    telefono: data.telefono || null,
    correo: (data.correo && data.correo !== "") ? data.correo : null,
    origen: data.origen || null,
    utmCanal: data.utmCanal || null,
    etapa: data.etapa || "PROSPECTO",
    temperatura: data.temperatura || "TIBIO",
    valorEstimado: data.valorEstimado || null,
    objecion: data.objecion || null,
    notas: data.notas || null,
    proximaAccion: data.proximaAccion || "Initial contact",
    proximaAccionFecha: data.proximaAccionFecha ? new Date(data.proximaAccionFecha) : new Date(Date.now() + 86400000),
    titulo: data.titulo || null,
    propiedad: data.propiedad || null,
    management: data.management || null,
    zona: data.zona || null,
    puesto: data.puesto || null,
    vendedorId,
  });

  await db.insert(schema.notas).values({
    id: crypto.randomUUID(),
    clienteId: id,
    autorId: usuarioId,
    contenido: `Client created. Origin: ${data.origen || "Manual"}`,
    tipo: "NOTA",
  });

  await registrarAuditoria({ usuarioId, accion: "Creó", entidad: "Cliente", entidadId: id, detalle: `Creó al cliente ${data.nombre}` });

  // Save contactos if provided
  const contactos = body.contactos || [];
  for (const c of contactos) {
    if (!c.nombre?.trim()) continue;
    await db.insert(schema.contactos).values({
      id: crypto.randomUUID(),
      clienteId: id,
      nombre: c.nombre.trim(),
      cargo: c.cargo || null,
      telefono: c.telefono || null,
      correo: c.correo || null,
      notas: c.notas || null,
      principal: c.principal || false,
    });
  }

  return NextResponse.json({ id, ...data }, { status: 201 });
}

// Note: ciudadCluster, cantidadHabitaciones, direccionPropiedad, tipoPropiedad
// are handled via PATCH after creation or via direct DB insert
// The contactos are created separately via /api/clientes/[id]/contactos
