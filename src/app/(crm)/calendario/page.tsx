"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";

const DIAS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MESES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface Evento {
  id: string;
  tipo: "cita" | "demo" | "servicio";
  fecha: string;
  titulo?: string;
  clienteNombre?: string;
  clienteId?: string;
  estado?: string;
}

const TIPO_CONFIG = {
  cita:     { emoji: "📅", label: "Cita",     bg: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  demo:     { emoji: "🎯", label: "Demo",     bg: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" },
  servicio: { emoji: "🧹", label: "Servicio", bg: "" }, // dynamic
};

function servicioColor(estado?: string) {
  return estado === "COMPLETADO"
    ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
    : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300";
}

export default function CalendarioPage() {
  const [hoy] = useState(new Date());
  const [mes, setMes] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [vistaActiva, setVistaActiva] = useState<"mes" | "semana">("mes");

  const cargar = useCallback(async () => {
    setLoading(true);
    const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1).toISOString();
    const fin = new Date(mes.getFullYear(), mes.getMonth() + 1, 0, 23, 59).toISOString();
    try {
      const [calRes, citasRes] = await Promise.all([
        fetch(`/api/calendario?inicio=${inicio}&fin=${fin}`),
        fetch(`/api/citas?inicio=${inicio}&fin=${fin}`),
      ]);
      const calData = await calRes.json();
      const citasData = citasRes.ok ? await citasRes.json() : { citas: [] };

      const todos: Evento[] = [
        ...(citasData.citas || []).map((c: any) => ({
          id: c.id, tipo: "cita" as const, fecha: c.inicio,
          titulo: c.titulo, clienteNombre: c.clienteNombre, clienteId: c.clienteId, estado: c.estado,
        })),
        // Visitas programadas (proxima_accion_fecha en clientes)
        ...(calData.citas || []).map((c: any) => ({
          id: `visita-${c.id}`, tipo: "cita" as const, fecha: c.fecha,
          titulo: c.proximaAccion || "Schedule site visit",
          clienteNombre: c.clienteNombre, clienteId: c.clienteId, estado: "PENDIENTE",
        })),
        ...(calData.demos || []).map((d: any) => ({
          id: d.id, tipo: "demo" as const, fecha: d.fecha,
          clienteNombre: d.clienteNombre, clienteId: d.clienteId, estado: d.estado,
        })),
        ...(calData.servicios || []).map((s: any) => ({
          id: s.id, tipo: "servicio" as const, fecha: s.fecha,
          clienteNombre: s.clienteNombre, clienteId: s.clienteId, estado: s.estado,
        })),
      ];
      setEventos(todos);
    } finally { setLoading(false); }
  }, [mes]);

  useEffect(() => { cargar(); }, [cargar]);

  function prevMes() { setMes(m => new Date(m.getFullYear(), m.getMonth() - 1, 1)); }
  function nextMes() { setMes(m => new Date(m.getFullYear(), m.getMonth() + 1, 1)); }

  const primerDia = mes.getDay();
  const diasEnMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celdas = Array.from({ length: primerDia + diasEnMes }, (_, i) => i < primerDia ? null : i - primerDia + 1);
  while (celdas.length % 7 !== 0) celdas.push(null);

  function eventosDelDia(dia: number | null): Evento[] {
    if (!dia) return [];
    return eventos.filter(e => {
      const f = new Date(e.fecha);
      return f.getDate() === dia && f.getMonth() === mes.getMonth() && f.getFullYear() === mes.getFullYear();
    }).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }

  const esHoy = (dia: number | null) => dia !== null && dia === hoy.getDate() &&
    mes.getMonth() === hoy.getMonth() && mes.getFullYear() === hoy.getFullYear();

  // Upcoming events (next 14 days)
  const proximos = eventos
    .filter(e => new Date(e.fecha) >= new Date())
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .slice(0, 15);

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Calendario</h1>
            <p className="text-sm text-[var(--text-secondary)]">Citas, demos y servicios — todo en un lugar</p>
          </div>
        </div>
        <Link href="/clientes/nuevo" className="btn-primary !py-2 !px-3 text-sm">
          <Plus className="w-4 h-4" /> Nueva cita
        </Link>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400"></span>📅 Cita con cliente</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500"></span>🎯 Demo programada</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500"></span>🧹 Servicio completado</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400"></span>🧹 Servicio próximo</span>
      </div>

      {/* Calendar */}
      <div className="card overflow-hidden">
        {/* Nav */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <button onClick={prevMes} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              {MESES[mes.getMonth()]} {mes.getFullYear()}
            </h2>
            <button onClick={() => setMes(new Date(hoy.getFullYear(), hoy.getMonth(), 1))}
              className="text-xs px-2 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors">
              Hoy
            </button>
          </div>
          <button onClick={nextMes} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[var(--border)]">
          {DIAS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-[var(--text-muted)]">{d}</div>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">Cargando calendario…</div>
        ) : (
          <div className="grid grid-cols-7">
            {celdas.map((dia, idx) => {
              const evs = eventosDelDia(dia);
              return (
                <div key={idx} className={`min-h-[80px] p-1 border-b border-r border-[var(--border)] last:border-r-0 ${!dia ? "bg-[var(--bg-secondary)] opacity-30" : ""} ${esHoy(dia) ? "bg-marca-50 dark:bg-marca-900/10" : ""}`}>
                  {dia && (
                    <>
                      <p className={`text-xs font-medium mb-1 w-6 h-6 rounded-full flex items-center justify-center mx-auto ${esHoy(dia) ? "bg-marca-300 text-white" : "text-[var(--text-secondary)]"}`}>
                        {dia}
                      </p>
                      <div className="space-y-0.5">
                        {evs.slice(0, 3).map(e => {
                          const cfg = TIPO_CONFIG[e.tipo];
                          const bgClass = e.tipo === "servicio" ? servicioColor(e.estado) : cfg.bg;
                          return (
                            <Link key={e.id} href={e.clienteId ? `/clientes/${e.clienteId}` : "#"}
                              className={`block text-[10px] leading-tight px-1 py-0.5 rounded truncate hover:opacity-80 ${bgClass}`}>
                              {cfg.emoji} {e.titulo || e.clienteNombre || cfg.label}
                            </Link>
                          );
                        })}
                        {evs.length > 3 && (
                          <p className="text-[10px] text-[var(--text-muted)] text-center">+{evs.length - 3} más</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming list */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Próximos eventos</h2>
        {proximos.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-[var(--text-muted)]">No hay eventos próximos en este mes</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Las citas, demos y servicios aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-2">
            {proximos.map(e => {
              const cfg = TIPO_CONFIG[e.tipo];
              const bgClass = e.tipo === "servicio" ? servicioColor(e.estado) : cfg.bg;
              const fecha = new Date(e.fecha);
              return (
                <Link key={e.id} href={e.clienteId ? `/clientes/${e.clienteId}` : "#"}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${bgClass}`}>
                    {cfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {e.titulo || e.clienteNombre || cfg.label}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {cfg.label} · {fecha.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      {" · "}{fecha.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  {/* Conflict warning — only citas and demos require YOUR presence */}
                  {(() => {
                    const mismoMomento = proximos.filter(x => {
                      if (x.id === e.id) return false;
                      if (e.tipo === "servicio" || x.tipo === "servicio") return false; // servicios no requieren tu presencia
                      const diff = Math.abs(new Date(x.fecha).getTime() - fecha.getTime());
                      return diff < 60 * 60 * 1000; // dentro de 1 hora
                    });
                    return mismoMomento.length > 0 ? (
                      <span className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded flex-shrink-0 font-medium">
                        ⚠️ Conflicto
                      </span>
                    ) : null;
                  })()}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
