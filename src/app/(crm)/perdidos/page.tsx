"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { XCircle, RotateCcw, BarChart2 } from "lucide-react";
import { fechaRelativa } from "@/lib/utils";
import { useToast } from "@/components/providers/ToastProvider";

export default function PerdidosPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { success } = useToast();

  useEffect(() => {
    fetch("/api/clientes?estado=PERDIDO&por_pagina=50&orden=reciente")
      .then(r => r.json()).then(d => { setClientes(d.clientes || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Count motivos
  const motivos = clientes.reduce((acc: Record<string,number>, c: any) => {
    const m = c.motivoPerdida || "Sin motivo";
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});

  async function reactivar(id: string, nombre: string) {
    const res = await fetch(`/api/clientes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado: "ACTIVO", etapa: "PROSPECTO", proximaAccion: "Re-engagement — follow up" }) });
    if (res.ok) { setClientes(p => p.filter(c => c.id !== id)); success(`${nombre} reactivado`); }
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <XCircle className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Perdidos</h1>
          <p className="text-sm text-[var(--text-secondary)]">Aprende por qué y reactiva — {clientes.length} clientes</p>
        </div>
      </div>

      {/* Motivos chart */}
      {Object.keys(motivos).length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4 text-[var(--text-muted)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Por qué perdemos ventas</h2>
          </div>
          <div className="space-y-2">
            {Object.entries(motivos).sort(([,a],[,b]) => (b as number)-(a as number)).map(([motivo, cnt]) => (
              <div key={motivo} className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-secondary)] w-40 truncate">{motivo}</span>
                <div className="flex-1 bg-[var(--bg-tertiary)] rounded-full h-2">
                  <div className="h-2 rounded-full bg-gray-400" style={{ width: `${((cnt as number)/clientes.length)*100}%` }} />
                </div>
                <span className="text-xs font-medium text-[var(--text-secondary)]">{cnt as number}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? Array.from({length:3}).map((_,i) => <div key={i} className="skeleton h-20 rounded-xl" />) :
       clientes.length === 0 ? (
        <div className="card p-12 text-center">
          <XCircle className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">No hay clientes perdidos</p>
        </div>
       ) : clientes.map((c: any) => (
        <div key={c.id} className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 font-bold flex-shrink-0 text-sm">{c.nombre[0]}</div>
          <div className="flex-1 min-w-0">
            <Link href={`/clientes/${c.id}`} className="font-medium text-[var(--text-primary)] hover:text-marca-500 hover:underline transition-colors">{c.nombre}</Link>
            <p className="text-xs text-[var(--text-muted)]">{c.motivoPerdida ? `Motivo: ${c.motivoPerdida}` : "Sin motivo registrado"}</p>
          </div>
          <button onClick={() => reactivar(c.id, c.nombre)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-marca-50 text-marca-700 hover:bg-marca-100 transition-colors flex-shrink-0">
            <RotateCcw className="w-3.5 h-3.5" />
            Reactivar
          </button>
        </div>
       ))}
    </div>
  );
}
