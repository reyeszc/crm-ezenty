"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ListChecks, AlertCircle, Flame, Clock, MessageCircle, Phone, CalendarDays } from "lucide-react";
import { formatearDinero, fechaRelativa, tempEmoji, etapaLabel, urlWhatsApp } from "@/lib/utils";

export default function SeguimientoPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch("/api/clientes?estado=OPERATIVOS&orden=fecha&por_pagina=200");
        const { clientes: todos = [] } = await res.json();

        const now = new Date();
        const hoy = now.toDateString();

        // Next 2 upcoming dates AFTER today (not including today)
        const manana = new Date(now);
        manana.setHours(0, 0, 0, 0);
        manana.setDate(manana.getDate() + 1);

        const future = todos
          .filter((c: any) => c.proximaAccionFecha && new Date(c.proximaAccionFecha) >= manana)
          .sort((a: any, b: any) => new Date(a.proximaAccionFecha).getTime() - new Date(b.proximaAccionFecha).getTime());

        const fechasUnicas = [...new Set(future.map((c: any) =>
          new Date(c.proximaAccionFecha).toDateString()
        ))].slice(0, 2);

        const proximaFecha = fechasUnicas[0]
          ? future.filter((c: any) => new Date(c.proximaAccionFecha).toDateString() === fechasUnicas[0])
          : [];
        const segundaFecha = fechasUnicas[1]
          ? future.filter((c: any) => new Date(c.proximaAccionFecha).toDateString() === fechasUnicas[1])
          : [];

        setData({
          vencidos: todos.filter((c: any) => c.proximaAccionFecha && new Date(c.proximaAccionFecha) < now),
          deHoy: todos.filter((c: any) => c.proximaAccionFecha && new Date(c.proximaAccionFecha).toDateString() === hoy),
          sinAccion: todos.filter((c: any) => !c.proximaAccion && !c.proximaAccionFecha),
          proximaFecha,
          segundaFecha,
          fechasUnicas,
          todos,
        });
      } finally { setLoading(false); }
    }
    cargar();
  }, []);

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

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 lg:pb-0">
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
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">
              Seguimientos vencidos ({vencidos.length})
            </h2>
          </div>
          <div className="space-y-2">
            {vencidos.map((c: any) => <ClienteRow key={c.id} cliente={c} urgente />)}
          </div>
        </section>
      )}

      {/* Calientes */}
      {calientes.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              🔥 Calientes — atiende primero ({calientes.length})
            </h2>
          </div>
          <div className="space-y-2">
            {calientes.map((c: any) => <ClienteRow key={c.id} cliente={c} />)}
          </div>
        </section>
      )}

      {/* Hoy */}
      {deHoy.filter((c: any) => c.temperatura !== "CALIENTE").length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Para hoy</h2>
          <div className="space-y-2">
            {deHoy.filter((c: any) => c.temperatura !== "CALIENTE").map((c: any) => (
              <ClienteRow key={c.id} cliente={c} />
            ))}
          </div>
        </section>
      )}

      {/* Próxima fecha con eventos */}
      {proximaFecha.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)] capitalize">
              {labelFecha(fechasUnicas[0])} ({proximaFecha.length})
            </h2>
          </div>
          <div className="space-y-2">
            {proximaFecha.map((c: any) => <ClienteRow key={c.id} cliente={c} />)}
          </div>
        </section>
      )}

      {/* Segunda fecha con eventos */}
      {segundaFecha.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)] capitalize">
              {labelFecha(fechasUnicas[1])} ({segundaFecha.length})
            </h2>
          </div>
          <div className="space-y-2">
            {segundaFecha.map((c: any) => <ClienteRow key={c.id} cliente={c} />)}
          </div>
        </section>
      )}

      {/* Sin acción definida */}
      {sinAccion.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-orange-600 dark:text-orange-400">
              🟠 Sin seguimiento definido ({sinAccion.length})
            </h2>
          </div>
          <div className="space-y-2">
            {sinAccion.map((c: any) => <ClienteRow key={c.id} cliente={c} sinAccion />)}
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
    </div>
  );
}

function ClienteRow({ cliente, urgente, sinAccion }: { cliente: any; urgente?: boolean; sinAccion?: boolean }) {
  return (
    <div className={`card p-4 flex items-center gap-3 ${urgente ? "border-l-4 border-red-400" : sinAccion ? "border-l-4 border-orange-400" : ""}`}>
      <span className="text-xl flex-shrink-0">{tempEmoji(cliente.temperatura)}</span>
      <div className="flex-1 min-w-0">
        <Link href={`/clientes/${cliente.id}`} className="font-medium text-[var(--text-primary)] hover:text-marca-500 hover:underline transition-colors">
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
      <div className="flex gap-1.5 flex-shrink-0">
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
