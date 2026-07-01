"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard, TrendingUp, TrendingDown, Users, Trophy,
  Wallet, AlertCircle, Target, Calendar, Flame, Clock,
  ArrowUpRight, Star
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { formatearDinero } from "@/lib/utils";
import Link from "next/link";

interface DashData {
  meta: number;
  cobradoMes: number;
  porcentajeMeta: number;
  nuevosLeads: number;
  citasDelMes: number;
  clientesGanados: number;
  clientesActivos: number;
  valorEmbudo: number;
  pagosVencidos: number;
  seguimientoVencidos: number;
  tasaCierre: number;
  pronostico: number;
  crecimiento: { mes: string; ingresos: number; ganados: number }[];
  embudoPorEtapa: { etapa: string; count: number; valor: number }[];
  origenes: { canal: string; leads: number; valor: number }[];
  ranking: { id: string; nombre: string; cobrado: number; ganados: number; meta: number; porcentaje: number }[];
  leadsFrios: number;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function MetaCard({ data }: { data: DashData }) {
  const pct = data.porcentajeMeta;
  const diasRestantes = (() => {
    const fin = new Date();
    fin.setMonth(fin.getMonth() + 1, 0);
    return Math.ceil((fin.getTime() - Date.now()) / 86400000);
  })();
  const falta = data.meta - data.cobradoMes;

  let semaforo = "🟢";
  if (pct < 50) semaforo = "🔴";
  else if (pct < 75) semaforo = "🟡";

  return (
    <div className="card p-5 col-span-2">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Meta del mes
          </p>
          <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
            {formatearDinero(data.cobradoMes)}
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            de {formatearDinero(data.meta)} — {pct}% {semaforo}
          </p>
          {(data as any).valorCotizacionesAprobadas > 0 && (
            <div className="flex gap-3 mt-1.5 text-xs text-[var(--text-muted)]">
              <span>💰 Cobrado: {formatearDinero((data as any).pagosReales || (data.cobradoMes - ((data as any).valorCotizacionesAprobadas || 0)))}</span>
              <span>📋 Aprobado: {formatearDinero((data as any).valorCotizacionesAprobadas)}</span>
            </div>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "#ddf0fb" }}
        >
          <Target className="w-6 h-6" style={{ color: "#2b93c5" }} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-3 mb-3">
        <div
          className="h-3 rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444",
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>
          {falta > 0
            ? `Faltan ${formatearDinero(falta)} en ${diasRestantes} días`
            : "¡Meta alcanzada! 🎉"}
        </span>
        <span>{diasRestantes} días restantes</span>
      </div>
    </div>
  );
}

function KpiCard({
  titulo, valor, icono: Icono, color, bg, href, badge,
}: {
  titulo: string;
  valor: string | number;
  icono: React.ElementType;
  color: string;
  bg: string;
  href?: string;
  badge?: string;
}) {
  const content = (
    <div className="card p-4 hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg}`}>
          <Icono className={`w-4.5 h-4.5 ${color}`} aria-hidden="true" />
        </div>
        {badge && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
            {badge}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{valor}</p>
      <p className="text-xs text-[var(--text-muted)] mt-0.5">{titulo}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function GraficaCrecimiento({ data }: { data: DashData["crecimiento"] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-[var(--text-muted)]">
        Aún juntando historial — se llenará solo 📈
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(v: number) => [formatearDinero(v), "Ingresos"]}
          contentStyle={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="ingresos" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={i === data.length - 1 ? "#7cc2e8" : "#b3e0f6"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DashboardClient() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="w-40 h-6" />
            <Skeleton className="w-60 h-4" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-8 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-[var(--text-secondary)]">No se pudo cargar el tablero. <button onClick={() => window.location.reload()} className="text-marca-500 underline">Reintentar</button></p>
      </div>
    );
  }

  const mesAnteriorCrecimiento = data.crecimiento.length >= 2
    ? data.crecimiento[data.crecimiento.length - 2].ingresos
    : 0;
  const crecimientoPct = mesAnteriorCrecimiento > 0
    ? Math.round(((data.cobradoMes - mesAnteriorCrecimiento) / mesAnteriorCrecimiento) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#ddf0fb" }}>
          <LayoutDashboard className="w-5 h-5" style={{ color: "#2b93c5" }} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Tablero</h1>
          <p className="text-sm text-[var(--text-secondary)]">¿Vas a cerrar el mes?</p>
        </div>
      </div>

      {/* Alertas urgentes */}
      {(data.seguimientoVencidos > 0 || data.leadsFrios > 0 || data.pagosVencidos > 0) && (
        <div className="flex flex-wrap gap-2">
          {data.seguimientoVencidos > 0 && (
            <Link href="/seguimiento" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 hover:opacity-80 transition-opacity">
              <AlertCircle className="w-4 h-4" aria-hidden="true" />
              {data.seguimientoVencidos} seguimientos vencidos
            </Link>
          )}
          {data.leadsFrios > 0 && (
            <Link href="/seguimiento" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-sm text-orange-700 dark:text-orange-300 hover:opacity-80 transition-opacity">
              <Flame className="w-4 h-4" aria-hidden="true" />
              ⚠️ {data.leadsFrios} lead{data.leadsFrios > 1 ? "s" : ""} sin contactar en +24h
            </Link>
          )}
          {data.pagosVencidos > 0 && (
            <Link href="/pagos" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-700 dark:text-yellow-300 hover:opacity-80 transition-opacity">
              <Wallet className="w-4 h-4" aria-hidden="true" />
              {data.pagosVencidos} pagos vencidos por cobrar
            </Link>
          )}
        </div>
      )}

      {/* Bento grid principal */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Meta — ocupa 2 columnas */}
        <MetaCard data={data} />

        {/* Embudo */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-purple-500" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {formatearDinero(data.valorEmbudo)}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Valor del embudo activo</p>
          <p className="text-xs text-purple-500 mt-1">{data.clientesActivos} clientes activos</p>
        </div>

        {/* Pronóstico */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-500" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {formatearDinero(data.pronostico)}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Pronóstico del mes</p>
          <p className={`text-xs mt-1 ${data.pronostico >= data.meta ? "text-green-500" : "text-red-400"}`}>
            {data.pronostico >= data.meta ? "🟢 Vas a llegar" : `🔴 Faltan ${formatearDinero(data.meta - data.pronostico)}`}
          </p>
        </div>

        {/* KPIs secundarios */}
        <KpiCard
          titulo="Nuevos leads este mes"
          valor={data.nuevosLeads}
          icono={Users}
          color="text-blue-500"
          bg="bg-blue-50 dark:bg-blue-900/20"
          href="/clientes"
        />
        <KpiCard
          titulo="Citas agendadas"
          valor={data.citasDelMes}
          icono={Calendar}
          color="text-green-500"
          bg="bg-green-50 dark:bg-green-900/20"
          href="/agenda"
        />
        <KpiCard
          titulo="Clientes ganados"
          valor={data.clientesGanados}
          icono={Trophy}
          color="text-emerald-500"
          bg="bg-emerald-50 dark:bg-emerald-900/20"
          href="/completados"
        />
        <KpiCard
          titulo="Tasa de cierre"
          valor={`${data.tasaCierre}%`}
          icono={Star}
          color="text-amber-500"
          bg="bg-amber-50 dark:bg-amber-900/20"
        />
        <KpiCard
          titulo="Pagos vencidos"
          valor={data.pagosVencidos}
          icono={Wallet}
          color="text-red-500"
          bg="bg-red-50 dark:bg-red-900/20"
          href="/pagos"
          badge={data.pagosVencidos > 0 ? "Cobrar" : undefined}
        />
      </div>

      {/* Crecimiento + embudo por etapa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfica de crecimiento */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Ingresos — últimos 6 meses</h2>
              <div className="flex items-center gap-1 mt-0.5">
                {crecimientoPct !== 0 && (
                  <>
                    {crecimientoPct > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span className={`text-xs font-medium ${crecimientoPct > 0 ? "text-green-500" : "text-red-400"}`}>
                      {crecimientoPct > 0 ? "+" : ""}{crecimientoPct}% vs mes anterior
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <GraficaCrecimiento data={data.crecimiento} />
        </div>

        {/* Embudo por etapa */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Embudo activo por etapa</h2>
          <div className="space-y-2">
            {data.embudoPorEtapa.map(({ etapa, count, valor }) => {
              const labels: Record<string, string> = {
                PROSPECTO: "Prospecto",
                PRIMER_CONTACTO: "Primer Contacto",
                DECISOR_IDENTIFICADO: "Decisor",
                MEDIDAS_TOMADAS: "Medidas",
                PROPUESTA_ENVIADA: "Propuesta",
                NEGOCIACION: "Negociación",
                CONTRATO_ENVIADO: "Contrato",
              };
              const maxValor = Math.max(...data.embudoPorEtapa.map((e) => e.valor), 1);
              return (
                <div key={etapa} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-muted)] w-24 flex-shrink-0 truncate">
                    {labels[etapa]}
                  </span>
                  <div className="flex-1 bg-[var(--bg-tertiary)] rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-marca-300"
                      style={{ width: `${(valor / maxValor) * 100}%` }}
                    />
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-medium text-[var(--text-primary)]">{count}</span>
                    {valor > 0 && (
                      <span className="text-xs text-[var(--text-muted)] ml-1">{formatearDinero(valor)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Canales de origen + Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Canales */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
            De dónde llegan tus clientes
          </h2>
          {data.origenes.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Aún no hay datos de origen.</p>
          ) : (
            <div className="space-y-3">
              {data.origenes.map(({ canal, leads, valor }) => (
                <div key={canal} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-marca-300" />
                    <span className="text-sm text-[var(--text-secondary)]">{canal}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{leads} leads</span>
                    {valor > 0 && (
                      <span className="text-xs text-[var(--text-muted)] ml-2">{formatearDinero(valor)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ranking equipo */}
        {data.ranking.length > 0 && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Ranking del equipo</h2>
            <div className="space-y-3">
              {data.ranking.map((v, i) => (
                <div key={v.id} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center flex-shrink-0">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{v.nombre}</p>
                    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full bg-marca-300"
                        style={{ width: `${Math.min(v.porcentaje, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {formatearDinero(v.cobrado)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{v.porcentaje}% meta</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
