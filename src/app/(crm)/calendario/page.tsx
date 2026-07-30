"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";

const DIAS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DIAS_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MESES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface Evento {
  id: string; tipo: "cita"|"demo"|"servicio";
  fecha: string; titulo?: string;
  clienteNombre?: string; clienteId?: string; estado?: string;
}

const TIPO_CONFIG = {
  cita:     { emoji: "📅", label: "Cita",     bg: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  demo:     { emoji: "🎯", label: "Demo",     bg: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" },
  servicio: { emoji: "🧹", label: "Servicio", bg: "" },
};
function servicioColor(estado?: string) {
  return estado === "COMPLETADO"
    ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
    : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300";
}

function getEvConfig(ev: Evento) {
  const tipo = (ev.tipo as string);
  if (tipo === "service_scheduled" || (tipo === "cita" && ev.titulo?.toLowerCase().includes("service scheduled"))) {
    return { emoji: "🧹", label: "Service Scheduled", bg: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" };
  }
  if (tipo === "demo_scheduled" || (tipo === "cita" && ev.titulo?.toLowerCase().includes("demo scheduled"))) {
    return { emoji: "🎯", label: "Demo Scheduled", bg: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" };
  }
  if (tipo === "demo" || (tipo === "cita" && ev.titulo?.toLowerCase().includes("demo"))) {
    return { emoji: "🎯", label: "Demo", bg: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" };
  }
  if (tipo === "servicio") {
    return { emoji: "🧹", label: "Service", bg: servicioColor(ev.estado) };
  }
  return { emoji: "📅", label: "Site Visit", bg: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" };
}

function EventoBadge({ ev }: { ev: Evento }) {
  const cfg = getEvConfig(ev);
  return (
    <Link href={ev.clienteId ? `/clientes/${ev.clienteId}` : "#"}
      className={`block text-xs rounded px-1 py-0.5 truncate ${cfg.bg} hover:opacity-80`}>
      {cfg.emoji} {ev.clienteNombre || ev.titulo || cfg.label}
    </Link>
  );
}

function EventoRow({ ev }: { ev: Evento }) {
  const cfg = getEvConfig(ev);
  const hora = new Date(ev.fecha).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return (
    <Link href={ev.clienteId ? `/clientes/${ev.clienteId}` : "#"}
      className={`flex items-center gap-2 p-2 rounded-lg ${cfg.bg} hover:opacity-80 transition-opacity`}>
      <span className="text-base flex-shrink-0">{cfg.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{ev.clienteNombre || ev.titulo || cfg.label}</p>
        <p className="text-xs opacity-70">{hora} · {cfg.label}</p>
      </div>
    </Link>
  );
}

export default function CalendarioPage() {
  const [hoy] = useState(new Date());
  const [cursor, setCursor] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<"mes"|"semana"|"dia">("mes");
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date>(hoy);

  const cargar = useCallback(async () => {
    setLoading(true);
    let inicio: Date, fin: Date;
    if (vista === "mes") {
      inicio = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      fin = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59);
    } else if (vista === "semana") {
      const dow = cursor.getDay();
      inicio = new Date(cursor); inicio.setDate(cursor.getDate() - dow);
      fin = new Date(inicio); fin.setDate(inicio.getDate() + 6); fin.setHours(23, 59);
    } else {
      inicio = new Date(diaSeleccionado); inicio.setHours(0, 0, 0);
      fin = new Date(diaSeleccionado); fin.setHours(23, 59, 59);
    }
    try {
      const [calRes, citasRes] = await Promise.all([
        fetch(`/api/calendario?inicio=${inicio.toISOString()}&fin=${fin.toISOString()}`),
        fetch(`/api/citas?inicio=${inicio.toISOString()}&fin=${fin.toISOString()}`),
      ]);
      const calData = await calRes.json();
      const citasData = citasRes.ok ? await citasRes.json() : { citas: [] };
      const todos: Evento[] = [
        ...(citasData.citas || []).map((c: any) => ({
          id: c.id, tipo: "cita" as const, fecha: c.inicio,
          titulo: c.titulo, clienteNombre: c.clienteNombre, clienteId: c.clienteId, estado: c.estado,
        })),
        ...(calData.citas || []).map((c: any) => {
          const accion = c.proximaAccion || "Site visit";
          const t = accion.toLowerCase();
          const tipo = t.includes("service scheduled") ? "service_scheduled"
            : t.includes("demo scheduled") ? "demo_scheduled"
            : t.includes("demo") ? "demo"
            : "cita";
          return {
            id: `visita-${c.id}`, tipo: tipo as any, fecha: c.fecha,
            titulo: accion, clienteNombre: c.clienteNombre, clienteId: c.clienteId, estado: "PENDIENTE",
          };
        }),
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
  }, [cursor, vista, diaSeleccionado]);

  useEffect(() => { cargar(); }, [cargar]);

  function eventosDelDia(d: Date) {
    return eventos.filter(e => new Date(e.fecha).toDateString() === d.toDateString())
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }

  function navAnterior() {
    const n = new Date(cursor);
    if (vista === "mes") n.setMonth(n.getMonth() - 1);
    else if (vista === "semana") n.setDate(n.getDate() - 7);
    else { const d = new Date(diaSeleccionado); d.setDate(d.getDate() - 1); setDiaSeleccionado(d); return; }
    setCursor(n);
  }
  function navSiguiente() {
    const n = new Date(cursor);
    if (vista === "mes") n.setMonth(n.getMonth() + 1);
    else if (vista === "semana") n.setDate(n.getDate() + 7);
    else { const d = new Date(diaSeleccionado); d.setDate(d.getDate() + 1); setDiaSeleccionado(d); return; }
    setCursor(n);
  }

  function tituloNav() {
    if (vista === "mes") return `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (vista === "semana") {
      const dow = cursor.getDay();
      const lun = new Date(cursor); lun.setDate(cursor.getDate() - dow);
      const dom = new Date(lun); dom.setDate(lun.getDate() + 6);
      return `${lun.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${dom.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`;
    }
    return diaSeleccionado.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
  }

  // ── VISTA MES ─────────────────────────────────────────────────────────────
  function VistaMes() {
    const primerDia = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
    const diasMes = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const celdas: (Date | null)[] = [
      ...Array(primerDia).fill(null),
      ...Array.from({ length: diasMes }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
    ];
    while (celdas.length % 7 !== 0) celdas.push(null);

    return (
      <div>
        <div className="grid grid-cols-7 border-b border-[var(--border)]">
          {DIAS.map(d => <div key={d} className="py-2 text-center text-xs font-semibold text-[var(--text-muted)]">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {celdas.map((dia, i) => {
            if (!dia) return <div key={i} className="min-h-[80px] border-b border-r border-[var(--border)] bg-[var(--bg-secondary)]" />;
            const evs = eventosDelDia(dia);
            const esHoy = dia.toDateString() === hoy.toDateString();
            return (
              <div key={i} className="min-h-[80px] p-1 border-b border-r border-[var(--border)] cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                onClick={() => { setDiaSeleccionado(dia); setVista("dia"); }}>
                <div className={`w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-full mb-1 ${esHoy ? "bg-marca-300 text-white" : "text-[var(--text-secondary)]"}`}>
                  {dia.getDate()}
                </div>
                <div className="space-y-0.5">
                  {evs.slice(0, 3).map(ev => <EventoBadge key={ev.id} ev={ev} />)}
                  {evs.length > 3 && <p className="text-xs text-[var(--text-muted)] pl-1">+{evs.length - 3} más</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── VISTA SEMANA ───────────────────────────────────────────────────────────
  function VistaSemana() {
    const dow = cursor.getDay();
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(cursor); d.setDate(cursor.getDate() - dow + i); return d;
    });
    return (
      <div>
        <div className="grid grid-cols-7 border-b border-[var(--border)]">
          {dias.map((d, i) => {
            const esHoy = d.toDateString() === hoy.toDateString();
            const evs = eventosDelDia(d);
            return (
              <div key={i} className="cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                onClick={() => { setDiaSeleccionado(d); setVista("dia"); }}>
                {/* Day header */}
                <div className="py-2 text-center border-b border-[var(--border)]">
                  <p className="text-xs text-[var(--text-muted)]">{DIAS[d.getDay()]}</p>
                  <div className={`w-7 h-7 mx-auto flex items-center justify-center text-sm font-semibold rounded-full ${esHoy ? "bg-marca-300 text-white" : "text-[var(--text-primary)]"}`}>
                    {d.getDate()}
                  </div>
                  {evs.length > 0 && (
                    <span className="text-xs text-marca-500 font-medium">{evs.length} evento{evs.length !== 1 ? "s" : ""}</span>
                  )}
                </div>
                {/* Events */}
                <div className="p-1.5 space-y-1.5 min-h-[200px]" onClick={e => e.stopPropagation()}>
                  {evs.length === 0 && <p className="text-xs text-[var(--text-muted)] text-center mt-4 opacity-50">—</p>}
                  {evs.map(ev => {
                    const cfg = getEvConfig(ev);
                    const hora = new Date(ev.fecha).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                    return (
                      <Link key={ev.id} href={ev.clienteId ? `/clientes/${ev.clienteId}` : "#"}
                        className={`block rounded-lg p-1.5 ${cfg.bg} hover:opacity-80 transition-opacity`}>
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-xs">{cfg.emoji}</span>
                          <span className="text-xs font-semibold opacity-70">{hora}</span>
                        </div>
                        <p className="text-xs font-medium leading-tight break-words">
                          {ev.clienteNombre || ev.titulo || cfg.label}
                        </p>
                        {ev.titulo && ev.clienteNombre && (
                          <p className="text-xs opacity-60 leading-tight mt-0.5 break-words">{ev.titulo}</p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── VISTA DÍA ──────────────────────────────────────────────────────────────
  function VistaDia() {
    const evs = eventosDelDia(diaSeleccionado);
    return (
      <div className="p-4 space-y-3">
        {loading ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-8">Cargando…</p>
        ) : evs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">📅</p>
            <p className="text-sm text-[var(--text-muted)]">No hay eventos este día</p>
          </div>
        ) : (
          evs.map(ev => <EventoRow key={ev.id} ev={ev} />)
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Calendario</h1>
            <p className="text-sm text-[var(--text-secondary)]">Visitas, demos y servicios</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Vista switcher */}
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-xs">
            {(["mes","semana","dia"] as const).map(v => (
              <button key={v} onClick={() => setVista(v)}
                className={`px-3 py-1.5 font-medium capitalize transition-colors ${vista === v ? "bg-marca-300 text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"}`}>
                {v === "dia" ? "Day" : v === "semana" ? "Week" : "Month"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={navAnterior} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)]">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="flex-1 text-center text-sm font-semibold text-[var(--text-primary)]">{tituloNav()}</h2>
        <button onClick={navSiguiente} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)]">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={() => { setCursor(new Date(hoy.getFullYear(), hoy.getMonth(), 1)); setDiaSeleccionado(hoy); }}
          className="text-xs text-marca-500 hover:underline">Today</button>
      </div>

      {/* Calendar grid */}
      <div className="card overflow-hidden">
        {loading && vista !== "dia" && (
          <div className="h-64 flex items-center justify-center text-sm text-[var(--text-muted)]">Cargando…</div>
        )}
        {!loading && vista === "mes" && <VistaMes />}
        {!loading && vista === "semana" && <VistaSemana />}
        {vista === "dia" && <VistaDia />}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 text-xs text-[var(--text-muted)] justify-center flex-wrap">
        <span>📅 Site Visit</span>
        <span>🎯 Demo / Demo Scheduled</span>
        <span>🧹 Service / Service Scheduled</span>
      </div>
    </div>
  );
}
