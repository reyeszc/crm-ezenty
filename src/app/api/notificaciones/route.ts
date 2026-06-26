import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and, isNull, lt, lte, gte } from "drizzle-orm";
import { puedeAccederCliente } from "@/lib/permisos";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const esAdmin = (session.user as any).rol === "ADMIN";
  const uid = session.user.id;
  const ahora = new Date();
  const hoyFin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
  const hace7dias = new Date(ahora.getTime() - 7 * 86400000);

  const condBase = and(
    isNull(schema.clientes.eliminadoEn),
    eq(schema.clientes.estado, "ACTIVO"),
    ...(esAdmin ? [] : [eq(schema.clientes.vendedorId, uid)])
  );

  // 1. Seguimientos vencidos
  const vencidos = await db.select({
    id: schema.clientes.id,
    nombre: schema.clientes.nombre,
    proximaAccion: schema.clientes.proximaAccion,
    proximaAccionFecha: schema.clientes.proximaAccionFecha,
    temperatura: schema.clientes.temperatura,
  }).from(schema.clientes)
    .where(and(condBase, lt(schema.clientes.proximaAccionFecha, ahora)))
    .limit(10);

  // 2. Pagos vencidos
  const pagosVencidos = await db.select({
    id: schema.pagos.id,
    monto: schema.pagos.monto,
    clienteId: schema.pagos.clienteId,
    clienteNombre: schema.clientes.nombre,
    fechaVencimiento: schema.pagos.fechaVencimiento,
  }).from(schema.pagos)
    .leftJoin(schema.clientes, eq(schema.pagos.clienteId, schema.clientes.id))
    .where(and(
      isNull(schema.pagos.eliminadoEn),
      eq(schema.pagos.estatus, "VENCIDO"),
      ...(esAdmin ? [] : [eq(schema.pagos.vendedorId, uid)])
    ))
    .limit(5);

  // 3. Citas de hoy
  const citasHoy = await db.select({
    id: schema.citas.id,
    titulo: schema.citas.titulo,
    inicio: schema.citas.inicio,
    clienteNombre: schema.clientes.nombre,
    clienteId: schema.citas.clienteId,
  }).from(schema.citas)
    .leftJoin(schema.clientes, eq(schema.citas.clienteId, schema.clientes.id))
    .where(and(
      isNull(schema.citas.eliminadoEn),
      gte(schema.citas.inicio, ahora),
      lte(schema.citas.inicio, hoyFin),
      ...(esAdmin ? [] : [eq(schema.citas.vendedorId, uid)])
    ))
    .limit(5);

  // 4. Demos hoy
  const demosHoy = await db.select({
    id: schema.demos.id,
    fecha: schema.demos.fecha,
    clienteNombre: schema.clientes.nombre,
    clienteId: schema.demos.clienteId,
  }).from(schema.demos)
    .leftJoin(schema.clientes, eq(schema.demos.clienteId, schema.clientes.id))
    .where(and(
      gte(schema.demos.fecha, ahora),
      lte(schema.demos.fecha, hoyFin),
      ...(esAdmin ? [] : [eq(schema.demos.usuarioId, uid)])
    ))
    .limit(5);

  // 5. Calientes sin contacto +7 días
  const calientesSinContacto = await db.select({
    id: schema.clientes.id,
    nombre: schema.clientes.nombre,
    ultimoContacto: schema.clientes.ultimoContacto,
  }).from(schema.clientes)
    .where(and(
      condBase,
      eq(schema.clientes.temperatura, "CALIENTE"),
      lt(schema.clientes.ultimoContacto, hace7dias)
    ))
    .limit(5);

  // Build notifications array
  const notificaciones: any[] = [];

  vencidos.forEach(c => notificaciones.push({
    id: `vencido-${c.id}`,
    tipo: "VENCIDO",
    titulo: "Seguimiento vencido",
    descripcion: c.proximaAccion || "Sin acción definida",
    clienteId: c.id,
    clienteNombre: c.nombre,
    urgente: c.temperatura === "CALIENTE",
    fecha: c.proximaAccionFecha,
  }));

  pagosVencidos.forEach(p => notificaciones.push({
    id: `pago-${p.id}`,
    tipo: "PAGO",
    titulo: "Pago vencido por cobrar",
    descripcion: `$${(p.monto || 0).toLocaleString("en-US")} — ${p.clienteNombre}`,
    clienteId: p.clienteId,
    clienteNombre: p.clienteNombre,
    urgente: true,
    fecha: p.fechaVencimiento,
  }));

  citasHoy.forEach(c => notificaciones.push({
    id: `cita-${c.id}`,
    tipo: "CITA",
    titulo: "Cita hoy",
    descripcion: `${c.titulo} — ${new Date(c.inicio).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
    clienteId: c.clienteId,
    clienteNombre: c.clienteNombre,
    urgente: false,
    fecha: c.inicio,
  }));

  demosHoy.forEach(d => notificaciones.push({
    id: `demo-${d.id}`,
    tipo: "DEMO",
    titulo: "Demo hoy",
    descripcion: `${d.clienteNombre} — ${new Date(d.fecha).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
    clienteId: d.clienteId,
    clienteNombre: d.clienteNombre,
    urgente: true,
    fecha: d.fecha,
  }));

  calientesSinContacto.forEach(c => notificaciones.push({
    id: `caliente-${c.id}`,
    tipo: "CALIENTE",
    titulo: "🔥 Sin contacto +7 días",
    descripcion: c.nombre,
    clienteId: c.id,
    clienteNombre: c.nombre,
    urgente: true,
    fecha: c.ultimoContacto,
  }));

  // Sort: urgent first, then by date
  notificaciones.sort((a, b) => {
    if (a.urgente && !b.urgente) return -1;
    if (!a.urgente && b.urgente) return 1;
    return 0;
  });

  return NextResponse.json({
    notificaciones,
    total: notificaciones.length,
    urgentes: notificaciones.filter(n => n.urgente).length,
  });
}
