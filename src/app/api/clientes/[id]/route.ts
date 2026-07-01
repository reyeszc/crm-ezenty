import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and, isNull } from "drizzle-orm";
import { puedeAccederCliente } from "@/lib/permisos";
import { registrarAuditoria } from "@/lib/auditoria";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const [cliente] = await db.select().from(schema.clientes)
    .where(and(eq(schema.clientes.id, id), isNull(schema.clientes.eliminadoEn))).limit(1);

  if (!cliente) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const [empresa, vendedor, notasList, citasList, pagosList, etiquetasList] = await Promise.all([
    cliente.empresaId ? db.select().from(schema.empresas).where(eq(schema.empresas.id, cliente.empresaId)).limit(1) : Promise.resolve([]),
    db.select({ id: schema.usuarios.id, nombre: schema.usuarios.nombre, correo: schema.usuarios.correo }).from(schema.usuarios).where(eq(schema.usuarios.id, cliente.vendedorId)).limit(1),
    db.select({ id: schema.notas.id, contenido: schema.notas.contenido, tipo: schema.notas.tipo, fecha: schema.notas.fecha, autorId: schema.notas.autorId, autorNombre: schema.usuarios.nombre })
      .from(schema.notas).leftJoin(schema.usuarios, eq(schema.notas.autorId, schema.usuarios.id))
      .where(and(eq(schema.notas.clienteId, id), isNull(schema.notas.eliminadoEn)))
      .orderBy(),
    db.select().from(schema.citas).where(and(eq(schema.citas.clienteId, id), isNull(schema.citas.eliminadoEn))).limit(10),
    db.select().from(schema.pagos).where(and(eq(schema.pagos.clienteId, id), isNull(schema.pagos.eliminadoEn))),
    db.select({ clienteId: schema.clienteEtiquetas.clienteId, etiquetaId: schema.clienteEtiquetas.etiquetaId, nombre: schema.etiquetas.nombre, color: schema.etiquetas.color })
      .from(schema.clienteEtiquetas).leftJoin(schema.etiquetas, eq(schema.clienteEtiquetas.etiquetaId, schema.etiquetas.id))
      .where(eq(schema.clienteEtiquetas.clienteId, id)),
  ]);

  return NextResponse.json({
    ...cliente,
    empresa: empresa[0] || null,
    vendedor: vendedor[0] || null,
    notas_rel: notasList.map(n => ({ ...n, autor: { id: n.autorId, nombre: n.autorNombre } })),
    citas: citasList,
    pagos: pagosList,
    etiquetas: etiquetasList.map(e => ({ etiquetaId: e.etiquetaId, etiqueta: { nombre: e.nombre, color: e.color } })),
    archivos: [],
    tareas: [],
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const updateData: any = { actualizadoEn: new Date() };

  const fields = ["nombre","telefono","correo","origen","etapa","estado","temperatura","valorEstimado","objecion","notas","proximaAccion","motivoPerdida","titulo","propiedad","management","zona","puesto","vendedorId","ganado","perdido","archivado","direccionPropiedad","ciudadCluster","cantidadHabitaciones","tipoPropiedad"];
  for (const f of fields) {
    if (f in body) updateData[f] = body[f];
  }
  if ("proximaAccionFecha" in body) {
    updateData.proximaAccionFecha = body.proximaAccionFecha ? new Date(body.proximaAccionFecha) : null;
  }

  // Log state changes
  if (body.estado) {
    const [prev] = await db.select({ estado: schema.clientes.estado }).from(schema.clientes).where(eq(schema.clientes.id, id)).limit(1);
    if (prev && prev.estado !== body.estado) {
      if (body.estado === "GANADO") { updateData.ganado = true; updateData.perdido = false; updateData.archivado = false; }
      if (body.estado === "PERDIDO") { updateData.perdido = true; updateData.ganado = false; }
      if (body.estado === "ARCHIVADO") { updateData.archivado = true; }
      if (body.estado === "ACTIVO") { updateData.ganado = false; updateData.perdido = false; updateData.archivado = false; }
      await db.insert(schema.notas).values({
        id: crypto.randomUUID(), clienteId: id, autorId: session.user.id,
        contenido: `Status changed to ${body.estado}${body.motivoPerdida ? ` — Reason: ${body.motivoPerdida}` : ""}`,
        tipo: "CAMBIO_ESTADO",
      });
    }
  }

  if (body.etapa) {
    const [prev] = await db.select({ etapa: schema.clientes.etapa }).from(schema.clientes).where(eq(schema.clientes.id, id)).limit(1);
    if (prev && prev.etapa !== body.etapa) {
      await db.insert(schema.notas).values({
        id: crypto.randomUUID(), clienteId: id, autorId: session.user.id,
        contenido: `Stage changed: ${prev.etapa} → ${body.etapa}`,
        tipo: "CAMBIO_ETAPA",
      });
    }
  }

  await db.update(schema.clientes).set(updateData).where(eq(schema.clientes.id, id));
  const [updated] = await db.select().from(schema.clientes).where(eq(schema.clientes.id, id)).limit(1);

  await registrarAuditoria({ usuarioId: session.user.id, accion: "Editó", entidad: "Cliente", entidadId: id });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  await db.update(schema.clientes).set({ eliminadoEn: new Date() }).where(eq(schema.clientes.id, id));
  await registrarAuditoria({ usuarioId: session.user.id, accion: "Eliminó (papelera)", entidad: "Cliente", entidadId: id });
  return NextResponse.json({ ok: true });
}
