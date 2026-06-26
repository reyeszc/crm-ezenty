"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ListChecks, AlertCircle, Flame, Clock, MessageCircle, Phone } from "lucide-react";
import { formatearDinero, fechaRelativa, tempEmoji, etapaLabel, urlWhatsApp } from "@/lib/utils";

export default function SeguimientoPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        // Load today's + overdue clients
        const [vencidosRes, hoyRes, leadsFriosRes] = await Promise.all([
          fetch("/api/clientes?estado=ACTIVO&orden=fecha&por_pagina=50"),
          fetch("/api/clientes?estado=ACTIVO&orden=fecha&por_pagina=50"),
          fetch("/api/clientes?estado=ACTIVO&etapa=PROSPECTO&por_pagina=20"),
        ]);
        const [vencidosData] = await Promise.all([vencidosRes.json()]);

        const now = new Date();
        const hoy = now.toDateString();
        const todos = vencidosData.clientes || [];

        const vencidos = todos.filter((c: any) =>
          c.proximaAccionFecha && new Date(c.proximaAccionFecha) < now
        );
        const deHoy = todos.filter((c: any) => {
          if (!c.proximaAccionFecha) return false;
          const d = new Date(c.proximaAccionFecha);
          return d.toDateString() === hoy && d >= now;
        });
        const sinAccion = todos.filter((c: any) => !c.proximaAccion && !c.proximaAccionFecha);

        setData({ vencidos, deHoy, sinAccion, todos });
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
      </div>
    );
  }

  const { vencidos = [], deHoy = [], sinAccion = [] } = data || {};
  const calientes = [...vencidos, ...deHoy]
    .filter((c: any) => c.temperatura === "CALIENTE")
    .sort((a: any, b: any) => (b.valorEstimado || 0) - (a.valorEstimado || 0));

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
          <ListChecks className="w-5 h-5 text-orange-500" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Hoy te toca</h1>
          <p className="text-sm text-[var(--text-secondary)]">A quién contactar hoy — ábrelo cada mañana</p>
        </div>
      </div>

      {/* Vencidos — máxima prioridad */}
      {vencidos.length > 0 && (
        <section aria-labelledby="vencidos-heading">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500" aria-hidden="true" />
            <h2 id="vencidos-heading" className="text-sm font-semibold text-red-600 dark:text-red-400">
              Seguimientos vencidos ({vencidos.length})
            </h2>
          </div>
          <div className="space-y-2">
            {vencidos.map((c: any) => <ClienteRow key={c.id} cliente={c} urgente />)}
          </div>
        </section>
      )}

      {/* Sin acción definida */}
      {sinAccion.length > 0 && (
        <section aria-labelledby="sin-accion-heading">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-orange-500" aria-hidden="true" />
            <h2 id="sin-accion-heading" className="text-sm font-semibold text-orange-600 dark:text-orange-400">
              🟠 Sin seguimiento definido ({sinAccion.length})
            </h2>
          </div>
          <div className="space-y-2">
            {sinAccion.map((c: any) => <ClienteRow key={c.id} cliente={c} sinAccion />)}
          </div>
        </section>
      )}

      {/* Calientes para hoy */}
      {calientes.length > 0 && (
        <section aria-labelledby="calientes-heading">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-red-500" aria-hidden="true" />
            <h2 id="calientes-heading" className="text-sm font-semibold text-[var(--text-primary)]">
              🔥 Calientes — atiende primero ({calientes.length})
            </h2>
          </div>
          <div className="space-y-2">
            {calientes.map((c: any) => <ClienteRow key={c.id} cliente={c} />)}
          </div>
        </section>
      )}

      {/* De hoy (no calientes) */}
      {deHoy.filter((c: any) => c.temperatura !== "CALIENTE").length > 0 && (
        <section aria-labelledby="hoy-heading">
          <h2 id="hoy-heading" className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Para hoy
          </h2>
          <div className="space-y-2">
            {deHoy.filter((c: any) => c.temperatura !== "CALIENTE").map((c: any) => (
              <ClienteRow key={c.id} cliente={c} />
            ))}
          </div>
        </section>
      )}

      {vencidos.length === 0 && deHoy.length === 0 && sinAccion.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">¡Hoy no tienes pendientes!</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Todos tus clientes tienen su próxima acción al día.</p>
        </div>
      )}
    </div>
  );
}

function ClienteRow({ cliente, urgente, sinAccion }: { cliente: any; urgente?: boolean; sinAccion?: boolean }) {
  const waUrl = cliente.telefono
    ? urlWhatsApp(cliente.telefono, `Hi ${cliente.nombre}!`)
    : null;

  return (
    <div className={`card p-4 flex items-center gap-3 ${urgente ? "border-l-4 border-red-400" : sinAccion ? "border-l-4 border-orange-400" : ""}`}>
      {/* Temp */}
      <span className="text-xl flex-shrink-0">{tempEmoji(cliente.temperatura)}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/clientes/${cliente.id}`} className="font-medium text-[var(--text-primary)] hover:text-marca-500 hover:underline transition-colors">
          {cliente.nombre}
        </Link>
        <p className="text-xs text-[var(--text-muted)] truncate">
          {etapaLabel(cliente.etapa)} · {cliente.empresa?.nombre || cliente.propiedad || ""}
        </p>
        {cliente.proximaAccion && (
          <p className={`text-xs mt-0.5 ${urgente ? "text-red-500 font-medium" : "text-[var(--text-secondary)]"}`}>
            → {cliente.proximaAccion}
            {urgente && cliente.proximaAccionFecha && (
              <span className="ml-1 text-red-400">
                (venció {fechaRelativa(cliente.proximaAccionFecha)})
              </span>
            )}
          </p>
        )}
        {sinAccion && (
          <p className="text-xs text-orange-500 mt-0.5">🟠 Define la próxima acción</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 flex-shrink-0">
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors"
            aria-label={`WhatsApp a ${cliente.nombre}`}
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
          </a>
        )}
        {cliente.telefono && (
          <a href={`tel:${cliente.telefono}`}
            className="w-9 h-9 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label={`Llamar a ${cliente.nombre}`}
          >
            <Phone className="w-4 h-4" aria-hidden="true" />
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
