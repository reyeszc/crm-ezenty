import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and, gte, lte, lt, isNull, isNotNull, sql, sum, count } from "drizzle-orm";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

function makeWhere(esAdmin: boolean, usuarioId: string) {
  return esAdmin ? undefined : eq(schema.clientes.vendedorId, usuarioId);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const usuarioId = session.user.id;
  const esAdmin = (session.user as any).rol === "ADMIN";
  const now = new Date();
  const inicioMes = startOfMonth(now);
  const finMes = endOfMonth(now);

  const baseCliente = esAdmin
    ? eq(schema.clientes.eliminadoEn, sql`NULL`)
    : and(eq(schema.clientes.vendedorId, usuarioId), isNull(schema.clientes.eliminadoEn));

  // Helper to build client conditions
  const cBase = isNull(schema.clientes.eliminadoEn);
  const cVendedor = esAdmin ? cBase : and(cBase, eq(schema.clientes.vendedorId, usuarioId));

  // Parallel queries
  const [
    nuevosLeads,
    clientesActivos,
    clientesGanados,
    pagosAgg,
    embudoAgg,
    cotAprobadas,
    pagosVencidos,
    seguimientoVencidos,
    leadsFrios,
    config,
  ] = await Promise.all([
    // Nuevos leads este mes
    db.select({ cnt: count() }).from(schema.clientes)
      .where(and(cVendedor, gte(schema.clientes.creadoEn, inicioMes), lte(schema.clientes.creadoEn, finMes))),
    // Activos
    db.select({ cnt: count() }).from(schema.clientes)
      .where(and(cVendedor, eq(schema.clientes.estado, "ACTIVO"))),
    // Ganados este mes
    db.select({ cnt: count() }).from(schema.clientes)
      .where(and(cVendedor, eq(schema.clientes.estado, "GANADO"),
        gte(schema.clientes.actualizadoEn, inicioMes))),
    // Pagos del mes
    db.select({ total: sum(schema.pagos.monto) }).from(schema.pagos)
      .where(and(
        isNull(schema.pagos.eliminadoEn),
        eq(schema.pagos.estatus, "PAGADO"),
        gte(schema.pagos.fechaPago, inicioMes),
        lte(schema.pagos.fechaPago, finMes),
        ...(esAdmin ? [] : [eq(schema.pagos.vendedorId, usuarioId)])
      )),
    // Valor embudo
    db.select({ total: sum(schema.clientes.valorEstimado) }).from(schema.clientes)
      .where(and(cVendedor, eq(schema.clientes.estado, "ACTIVO"), isNotNull(schema.clientes.valorEstimado))),

    // Cotizaciones aprobadas este mes
    db.select({ total: sum(schema.cotizaciones.total), cnt: count() })
      .from(schema.cotizaciones)
      .where(and(
        eq(schema.cotizaciones.estado, "APROBADA"),
        gte(schema.cotizaciones.creadoEn, inicioMes),
        lte(schema.cotizaciones.creadoEn, finMes),
        ...(esAdmin ? [] : [eq(schema.cotizaciones.vendedorId, usuarioId)])
      )),
    // Pagos vencidos
    db.select({ cnt: count() }).from(schema.pagos)
      .where(and(
        isNull(schema.pagos.eliminadoEn),
        eq(schema.pagos.estatus, "VENCIDO"),
        ...(esAdmin ? [] : [eq(schema.pagos.vendedorId, usuarioId)])
      )),
    // Seguimiento vencido
    db.select({ cnt: count() }).from(schema.clientes)
      .where(and(cVendedor, eq(schema.clientes.estado, "ACTIVO"),
        lt(schema.clientes.proximaAccionFecha, now))),
    // Leads fríos (>24h sin contacto)
    db.select({ cnt: count() }).from(schema.clientes)
      .where(and(cVendedor, eq(schema.clientes.estado, "ACTIVO"),
        eq(schema.clientes.etapa, "PROSPECTO"),
        isNull(schema.clientes.ultimoContacto),
        lt(schema.clientes.creadoEn, new Date(Date.now() - 86400000)))),
    // Config
    db.select().from(schema.configNegocio).where(eq(schema.configNegocio.id, "singleton")).limit(1),
  ]);

  const meta = config[0]?.metaMensual || 10000;
  const pagosReales = Number(pagosAgg[0]?.total || 0);
  const cotAprobadoTotal = Number(cotAprobadas[0]?.total || 0);
  const cobradoMes = pagosReales + cotAprobadoTotal;

  // Crecimiento 6 meses
  const crecimiento = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const fecha = subMonths(now, 5 - i);
      return { inicio: startOfMonth(fecha), fin: endOfMonth(fecha), mes: fecha.toLocaleString("en-US", { month: "short" }) };
    }).map(async ({ inicio, fin, mes }) => {
      const [ing] = await db.select({ total: sum(schema.pagos.monto) }).from(schema.pagos)
        .where(and(
          isNull(schema.pagos.eliminadoEn),
          eq(schema.pagos.estatus, "PAGADO"),
          gte(schema.pagos.fechaPago, inicio),
          lte(schema.pagos.fechaPago, fin),
          ...(esAdmin ? [] : [eq(schema.pagos.vendedorId, usuarioId)])
        ));
      return { mes, ingresos: Number(ing?.total || 0), ganados: 0 };
    })
  );

  // Embudo por etapa
  const etapas = ["PROSPECTO","PRIMER_CONTACTO","DECISOR_IDENTIFICADO","MEDIDAS_TOMADAS","PROPUESTA_ENVIADA","NEGOCIACION","CONTRATO_ENVIADO"];
  const embudoPorEtapa = await Promise.all(
    etapas.map(async (etapa) => {
      const [agg] = await db.select({ cnt: count(), val: sum(schema.clientes.valorEstimado) })
        .from(schema.clientes)
        .where(and(cVendedor, eq(schema.clientes.estado, "ACTIVO"), eq(schema.clientes.etapa, etapa)));
      return { etapa, count: Number(agg?.cnt || 0), valor: Number(agg?.val || 0) };
    })
  );

  // Probabilidades por etapa para pronóstico
  const prob: Record<string, number> = { PROSPECTO:0.1,PRIMER_CONTACTO:0.2,DECISOR_IDENTIFICADO:0.3,MEDIDAS_TOMADAS:0.4,PROPUESTA_ENVIADA:0.5,NEGOCIACION:0.7,CONTRATO_ENVIADO:0.9 };
  const pronostico = embudoPorEtapa.reduce((acc, { etapa, valor }) => acc + valor * (prob[etapa] || 0), 0);

  // Canales
  const origenes = await db.select({
    origen: schema.clientes.origen,
    leads: count(),
    valor: sum(schema.clientes.valorEstimado),
  }).from(schema.clientes)
    .where(and(cVendedor, isNotNull(schema.clientes.origen)))
    .groupBy(schema.clientes.origen);

  // Tasa de cierre
  const [cerradosTot] = await db.select({ cnt: count() }).from(schema.clientes)
    .where(and(cVendedor, sql`etapa IN ('CERRADO_GANADO','CERRADO_PERDIDO')`));
  const [ganadosTot] = await db.select({ cnt: count() }).from(schema.clientes)
    .where(and(cVendedor, eq(schema.clientes.etapa, "CERRADO_GANADO")));
  const totalCerrados = Number(cerradosTot?.cnt || 0);
  const totalGanados = Number(ganadosTot?.cnt || 0);
  const tasaCierre = totalCerrados > 0 ? Math.round((totalGanados / totalCerrados) * 100) : 0;

  // Citas del mes
  const [citasAgg] = await db.select({ cnt: count() }).from(schema.citas)
    .where(and(
      isNull(schema.citas.eliminadoEn),
      gte(schema.citas.inicio, inicioMes),
      lte(schema.citas.inicio, finMes),
      ...(esAdmin ? [] : [eq(schema.citas.vendedorId, usuarioId)])
    ));

  // Ranking (admin only)
  let ranking: any[] = [];
  if (esAdmin) {
    const vendedores = await db.select({ id: schema.usuarios.id, nombre: schema.usuarios.nombre, metaMensual: schema.usuarios.metaMensual })
      .from(schema.usuarios).where(eq(schema.usuarios.activo, true));
    ranking = await Promise.all(vendedores.map(async (v) => {
      const [cobrado] = await db.select({ total: sum(schema.pagos.monto) }).from(schema.pagos)
        .where(and(eq(schema.pagos.vendedorId, v.id), eq(schema.pagos.estatus, "PAGADO"),
          isNull(schema.pagos.eliminadoEn), gte(schema.pagos.fechaPago, inicioMes)));
      const cobradoV = Number(cobrado?.total || 0);
      return { id: v.id, nombre: v.nombre, cobrado: cobradoV, meta: v.metaMensual,
        porcentaje: v.metaMensual > 0 ? Math.round((cobradoV / v.metaMensual) * 100) : 0, ganados: 0 };
    }));
    ranking.sort((a, b) => b.cobrado - a.cobrado);
  }

  return NextResponse.json({
    meta, cobradoMes, pagosReales,
    porcentajeMeta: Math.min(Math.round((cobradoMes / meta) * 100), 100),
    nuevosLeads: Number(nuevosLeads[0]?.cnt || 0),
    citasDelMes: Number(citasAgg?.cnt || 0),
    clientesGanados: Number(clientesGanados[0]?.cnt || 0),
    clientesActivos: Number(clientesActivos[0]?.cnt || 0),
    valorEmbudo: Number(embudoAgg[0]?.total || 0),
    pagosVencidos: Number(pagosVencidos[0]?.cnt || 0),
    seguimientoVencidos: Number(seguimientoVencidos[0]?.cnt || 0),
    cotizacionesAprobadas: Number(cotAprobadas[0]?.cnt || 0),
    valorCotizacionesAprobadas: Number(cotAprobadas[0]?.total || 0),
    tasaCierre, pronostico, crecimiento, embudoPorEtapa,
    origenes: origenes.map((o: any) => ({
      canal: o.origen || "Desconocido",
      leads: Number(o.leads || 0),
      valor: Number(o.valor || 0),
    })),
    ranking,
    leadsFrios: Number(leadsFrios[0]?.cnt || 0),
  });
}
