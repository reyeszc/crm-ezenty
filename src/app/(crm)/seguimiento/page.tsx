"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ListChecks, AlertCircle, Flame, Clock, MessageCircle, Phone, CalendarDays, Navigation, CheckSquare, Square } from "lucide-react";
import { formatearDinero, fechaRelativa, tempEmoji, etapaLabel, urlWhatsApp } from "@/lib/utils";

export default function SeguimientoPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch("/api/clientes?estado=OPERATIVOS&orden=fecha&por_pagina=200");
        const { clientes: todos = [] } = await res.json();

        const now = new Date();
        const hoy = now.toDateString();
        const manana = new Date(now);
        manana.setHours(0, 0, 0, 0);
        manana.setDate(manana.getDate() + 1);

        const future = todos
          .filter((c: any) => c.proximaAccionFecha && new Date(c.proximaAccionFecha) >= manana)
          .sort((a: any, b: any) => new Date(a.proximaAccionFecha).getTime() - new Date(b.proximaAccionFecha).getTime());

        const fechasUnicas = [...new Set(future.map((c: any) =>
          new Date(c.proximaAccionFecha).toDateString()
        ))].slice(0, 2);

        setData({
          vencidos: todos.filter((c: any) => c.proximaAccionFecha && new Date(c.proximaAccionFecha) < now),
          deHoy: todos.filter((c: any) => c.proximaAccionFecha && new Date(c.proximaAccionFecha).toDateString() === hoy),
          sinAccion: todos.filter((c: any) => !c.proximaAccion && !c.proximaAccionFecha),
          proximaFecha: fechasUnicas[0] ? future.filter((c: any) => new Date(c.proximaAccionFecha).toDateString() === fechasUnicas[0]) : [],
          segundaFecha: fechasUnicas[1] ? future.filter((c: any) => new Date(c.proximaAccionFecha).toDateString() === fechasUnicas[1]) : [],
          fechasUnicas,
          todos,
        });
      } finally { setLoading(false); }
    }
    cargar();
  }, []);

  function toggleSeleccion(id: string) {
    setSeleccionados(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function seleccionarGrupo(clientes: any[]) {
    const ids = clientes.map((c: any) => c.id);
    const todosSeleccionados = ids.every(id => seleccionados.has(id));
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (todosSeleccionados) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  }

  function planearRuta() {
    if (!data) return;
    const todos = [...(data.deHoy || []), ...(data.proximaFecha || []), ...(data.segundaFecha || []), ...(data.vencidos || [])];
    const clientes = todos.filter((c: any) => seleccionados.has(c.id));
    const params = clientes.map((c: any) => `id=${c.id}`).join("&");
    router.push(`/ruta?${params}`);
  }

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
    </div>
  );

  const { vencidos = [], deHoy = [], sinAccion = [], proximaFecha = [], segundaFecha = [], fechasUnicas = [] } = data || {};
  const calientes = [...vencidos, ...deHoy]
    .filter((c: any) => c.temperatura === "CALIENTE")
    .sort((a: any, b: any) => (b.valorEstimado || 0) - (a.valorEstimado || 0));

  function labelFecha(dateStr: string) {
    const d = new Date(dateStr);
    const manana = new Date(); manana.setDate(manana.getDate() + 1);
    if (d.toDateString() === manana.toDateString()) return "Mañana";
    return d.toLocaleDateString("es-US", { weekday: "long", month: "short", day: "numeric" });
  }

  function GrupoHeader({ titulo, clientes, icon, color }: { titulo: string; clientes: any[]; icon: React.ReactNode; color?: string }) {
    const todosSeleccionados = clientes.length > 0 && clientes.every((c: any) => seleccionados.has(c.id));
    return (
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className={`text-sm font-semibold ${color || "text-[var(--text-primary)]"}`}>{titulo}</h2>
        </div>
        {clientes.length > 0 && (
          <button onClick={() => seleccionarGrupo(clientes)}
            className="flex items-center gap-1 text-xs text-marca-500 hover:text-marca-600">
            {todosSeleccionados
              ? <><CheckSquare className="w-3.5 h-3.5" /> Quitar todos</>
              : <><Square className="w-3.5 h-3.5" /> Seleccionar todos</>
            }
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-28 lg:pb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
          <ListChecks className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Hoy te toca</h1>
          <p className="text-sm text-[var(--text-secondary)]">A quién contactar hoy — ábrelo cada mañana</p>
        </div>
      </div>

      {/* Vencidos */}
      {vencidos.length > 0 && (
        <section>
          <GrupoHeader titulo={`Seguimientos vencidos (${vencidos.length})`} clientes={vencidos}
            icon={<AlertCircle className="w-4 h-4 text-red-500" />} color="text-red-600 dark:text-red-400" />
          <div className="space-y-2">
            {vencidos.map((c: any) => (
              <ClienteRow key={c.id} cliente={c} urgente
                seleccionado={seleccionados.has(c.id)} onToggle={() => toggleSeleccion(c.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Calientes */}
      {calientes.length > 0 && (
        <section>
          <GrupoHeader titulo={`🔥 Calientes — atiende primero (${calientes.length})`} clientes={calientes}
            icon={<Flame className="w-4 h-4 text-red-500" />} />
          <div className="space-y-2">
            {calientes.map((c: any) => (
              <ClienteRow key={c.id} cliente={c}
                seleccionado={seleccionados.has(c.id)} onToggle={() => toggleSeleccion(c.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Hoy */}
      {deHoy.filter((c: any) => c.temperatura !== "CALIENTE").length > 0 && (
        <section>
          <GrupoHeader titulo="Para hoy" clientes={deHoy.filter((c: any) => c.temperatura !== "CALIENTE")}
            icon={<CalendarDays className="w-4 h-4 text-orange-500" />} />
          <div className="space-y-2">
            {deHoy.filter((c: any) => c.temperatura !== "CALIENTE").map((c: any) => (
              <ClienteRow key={c.id} cliente={c}
                seleccionado={seleccionados.has(c.id)} onToggle={() => toggleSeleccion(c.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Próxima fecha */}
      {proximaFecha.length > 0 && (
        <section>
          <GrupoHeader titulo={`${labelFecha(fechasUnicas[0])} (${proximaFecha.length})`} clientes={proximaFecha}
            icon={<CalendarDays className="w-4 h-4 text-blue-500" />} />
          <div className="space-y-2">
            {proximaFecha.map((c: any) => (
              <ClienteRow key={c.id} cliente={c}
                seleccionado={seleccionados.has(c.id)} onToggle={() => toggleSeleccion(c.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Segunda fecha */}
      {segundaFecha.length > 0 && (
        <section>
          <GrupoHeader titulo={`${labelFecha(fechasUnicas[1])} (${segundaFecha.length})`} clientes={segundaFecha}
            icon={<CalendarDays className="w-4 h-4 text-blue-400" />} />
          <div className="space-y-2">
            {segundaFecha.map((c: any) => (
              <ClienteRow key={c.id} cliente={c}
                seleccionado={seleccionados.has(c.id)} onToggle={() => toggleSeleccion(c.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Sin acción */}
      {sinAccion.length > 0 && (
        <section>
          <GrupoHeader titulo={`🟠 Sin seguimiento definido (${sinAccion.length})`} clientes={[]}
            icon={<Clock className="w-4 h-4 text-orange-500" />} color="text-orange-600 dark:text-orange-400" />
          <div className="space-y-2">
            {sinAccion.map((c: any) => <ClienteRow key={c.id} cliente={c} sinAccion
              seleccionado={false} onToggle={() => {}} />)}
          </div>
        </section>
      )}

      {vencidos.length === 0 && deHoy.length === 0 && sinAccion.length === 0 && proximaFecha.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">¡Todo al día!</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">No tienes seguimientos pendientes hoy.</p>
        </div>
      )}

      {/* Floating Plan Route Button */}
      {seleccionados.size > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button onClick={planearRuta}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl shadow-lg text-white font-semibold text-sm"
            style={{ background: "linear-gradient(135deg, #7cc2e8, #2b93c5)" }}>
            <Navigation className="w-4 h-4" />
            Planear ruta con {seleccionados.size} parada{seleccionados.size !== 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  );
}

function ClienteRow({ cliente, urgente, sinAccion, seleccionado, onToggle }: {
  cliente: any; urgente?: boolean; sinAccion?: boolean; seleccionado: boolean; onToggle: () => void;
}) {
  return (
    <div className={`card p-4 flex items-center gap-3 cursor-pointer transition-colors ${
      seleccionado ? "ring-2 ring-marca-300 bg-marca-50/30 dark:bg-marca-900/10" : ""
    } ${urgente ? "border-l-4 border-red-400" : sinAccion ? "border-l-4 border-orange-400" : ""}`}
      onClick={onToggle}>
      {/* Checkbox */}
      <div className="flex-shrink-0" onClick={e => { e.stopPropagation(); onToggle(); }}>
        {seleccionado
          ? <CheckSquare className="w-5 h-5 text-marca-500" />
          : <Square className="w-5 h-5 text-[var(--text-muted)]" />
        }
      </div>

      <span className="text-xl flex-shrink-0">{tempEmoji(cliente.temperatura)}</span>

      <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
        <Link href={`/clientes/${cliente.id}`}
          className="font-medium text-[var(--text-primary)] hover:text-marca-500 hover:underline transition-colors">
          {cliente.nombre}
        </Link>
        <p className="text-xs text-[var(--text-muted)] truncate">
          {etapaLabel(cliente.etapa)} · {cliente.propiedad || cliente.nombre}
        </p>
        {cliente.proximaAccion && (
          <p className={`text-xs mt-0.5 ${urgente ? "text-red-500 font-medium" : "text-[var(--text-secondary)]"}`}>
            → {cliente.proximaAccion}
            {urgente && cliente.proximaAccionFecha && (
              <span className="ml-1 text-red-400">(venció {fechaRelativa(cliente.proximaAccionFecha)})</span>
            )}
            {!urgente && cliente.proximaAccionFecha && (
              <span className="ml-1 text-[var(--text-muted)]">
                · {new Date(cliente.proximaAccionFecha).toLocaleDateString("es-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </p>
        )}
        {sinAccion && <p className="text-xs text-orange-500 mt-0.5">🟠 Define la próxima acción</p>}
      </div>

      <div className="flex gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
        {cliente.telefono && (
          <a href={`sms:${cliente.telefono}`}
            className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
            <MessageCircle className="w-4 h-4" />
          </a>
        )}
        {cliente.telefono && (
          <a href={`tel:${cliente.telefono}`}
            className="w-9 h-9 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">
            <Phone className="w-4 h-4" />
          </a>
        )}
        {cliente.valorEstimado && (
          <span className="self-center text-sm font-semibold text-[var(--text-primary)] ml-1">
            {formatearDinero(cliente.valorEstimado)}
          </span>
        )}
      </div>
    </div>
  );
}
