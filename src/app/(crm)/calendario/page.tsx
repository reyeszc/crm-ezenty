"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";

const DIAS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MESES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function CalendarioPage() {
  const [hoy] = useState(new Date());
  const [mes, setMes] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [eventos, setEventos] = useState<{ demos: any[]; servicios: any[] }>({ demos: [], servicios: [] });
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1).toISOString();
    const fin = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).toISOString();
    const res = await fetch(`/api/calendario?inicio=${inicio}&fin=${fin}`);
    const data = await res.json();
    setEventos(data);
    setLoading(false);
  }, [mes]);

  useEffect(() => { cargar(); }, [cargar]);

  function prevMes() { setMes(m => new Date(m.getFullYear(), m.getMonth() - 1, 1)); }
  function nextMes() { setMes(m => new Date(m.getFullYear(), m.getMonth() + 1, 1)); }

  // Build calendar grid
  const primerDia = mes.getDay();
  const diasEnMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celdas = Array.from({ length: primerDia + diasEnMes }, (_, i) =>
    i < primerDia ? null : i - primerDia + 1
  );
  // Pad to full weeks
  while (celdas.length % 7 !== 0) celdas.push(null);

  function eventosDelDia(dia: number | null) {
    if (!dia) return { demos: [], servicios: [] };
    const fecha = new Date(mes.getFullYear(), mes.getMonth(), dia);
    const ds = eventos.demos.filter(d => {
      const f = new Date(d.fecha);
      return f.getDate() === dia && f.getMonth() === mes.getMonth() && f.getFullYear() === mes.getFullYear();
    });
    const ss = eventos.servicios.filter(s => {
      const f = new Date(s.fecha);
      return f.getDate() === dia && f.getMonth() === mes.getMonth() && f.getFullYear() === mes.getFullYear();
    });
    return { demos: ds, servicios: ss };
  }

  const esHoy = (dia: number | null) => {
    if (!dia) return false;
    return dia === hoy.getDate() && mes.getMonth() === hoy.getMonth() && mes.getFullYear() === hoy.getFullYear();
  };

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
            <p className="text-sm text-[var(--text-secondary)]">Demos y servicios programados</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-400"></span>
          Demo programada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          Servicio completado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400"></span>
          Servicio próximo
        </span>
      </div>

      {/* Calendar */}
      <div className="card overflow-hidden">
        {/* Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <button onClick={prevMes} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {MESES[mes.getMonth()]} {mes.getFullYear()}
          </h2>
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
        <div className="grid grid-cols-7">
          {celdas.map((dia, idx) => {
            const { demos: ds, servicios: ss } = eventosDelDia(dia);
            const tieneEventos = ds.length > 0 || ss.length > 0;
            return (
              <div key={idx} className={`min-h-[80px] p-1.5 border-b border-r border-[var(--border)] last:border-r-0 ${!dia ? "bg-[var(--bg-secondary)] opacity-40" : ""} ${esHoy(dia) ? "bg-marca-50 dark:bg-marca-900/20" : ""}`}>
                {dia && (
                  <>
                    <p className={`text-xs font-medium mb-1 w-6 h-6 rounded-full flex items-center justify-center ${esHoy(dia) ? "bg-marca-300 text-white" : "text-[var(--text-secondary)]"}`}>
                      {dia}
                    </p>
                    <div className="space-y-0.5">
                      {ds.map((d: any) => (
                        <Link key={d.id} href={`/clientes/${d.clienteId}`}
                          className="block text-[10px] leading-tight px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 truncate hover:opacity-80">
                          🎯 {d.clienteNombre}
                        </Link>
                      ))}
                      {ss.map((s: any) => (
                        <Link key={s.id} href={`/clientes/${s.clienteId}`}
                          className={`block text-[10px] leading-tight px-1 py-0.5 rounded truncate hover:opacity-80 ${
                            s.estado === "COMPLETADO"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                          }`}>
                          🧹 {s.clienteNombre}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming events list */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Próximos eventos</h2>
        {loading ? (
          <div className="skeleton h-16 rounded-lg" />
        ) : (
          <div className="space-y-2">
            {[...eventos.demos.map(d => ({ ...d, tipo: "demo" })),
              ...eventos.servicios.map(s => ({ ...s, tipo: "servicio" }))]
              .filter(e => new Date(e.fecha) >= new Date())
              .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
              .slice(0, 10)
              .map(e => (
                <Link key={e.id} href={`/clientes/${e.clienteId}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                  <span className="text-lg">{e.tipo === "demo" ? "🎯" : "🧹"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{e.clienteNombre}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {e.tipo === "demo" ? "Demo" : `Servicio: ${e.tipo}`} · {new Date(e.fecha).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span className={`badge text-xs ${e.tipo === "demo" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                    {new Date(e.fecha).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                </Link>
              ))}
            {eventos.demos.length === 0 && eventos.servicios.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">
                No hay demos ni servicios en este mes. Programa una demo desde el expediente de un cliente.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
