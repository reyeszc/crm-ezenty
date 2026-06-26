"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, RotateCcw } from "lucide-react";
import { formatearDinero, fechaRelativa } from "@/lib/utils";
import { useToast } from "@/components/providers/ToastProvider";

export default function CompletadosPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { success } = useToast();

  useEffect(() => {
    fetch("/api/clientes?estado=GANADO&por_pagina=50&orden=reciente")
      .then(r => r.json()).then(d => { setClientes(d.clientes || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalGanado = clientes.reduce((s, c) => s + (c.valorEstimado || 0), 0);

  async function reactivar(id: string, nombre: string) {
    const res = await fetch(`/api/clientes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado: "ACTIVO", etapa: "PRIMER_CONTACTO" }) });
    if (res.ok) { setClientes(p => p.filter(c => c.id !== id)); success(`${nombre} reactivado`); }
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Clientes completados</h1>
          <p className="text-sm text-[var(--text-secondary)]">Tu muro de victorias — {clientes.length} clientes · {formatearDinero(totalGanado)}</p>
        </div>
      </div>
      {loading ? Array.from({length:3}).map((_,i) => <div key={i} className="skeleton h-20 rounded-xl" />) :
       clientes.length === 0 ? (
        <div className="card p-12 text-center">
          <Trophy className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-lg font-semibold text-[var(--text-primary)]">Aún no tienes clientes completados</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Cierra tu primera venta y aparecerá aquí 🎉</p>
          <Link href="/embudo" className="btn-primary inline-flex mt-4">Ir al embudo</Link>
        </div>
       ) : clientes.map((c: any) => (
        <div key={c.id} className="card p-4 flex items-center gap-3 border-l-4 border-emerald-400">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">{c.nombre[0]}</div>
          <div className="flex-1 min-w-0">
            <Link href={`/clientes/${c.id}`} className="font-medium text-[var(--text-primary)] hover:text-marca-500 hover:underline transition-colors">{c.nombre}</Link>
            <p className="text-xs text-[var(--text-muted)]">{c.propiedad || c.zona || ""}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {c.valorEstimado && <span className="text-sm font-bold text-emerald-600">{formatearDinero(c.valorEstimado)}</span>}
            <button onClick={() => reactivar(c.id, c.nombre)} className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-marca-500 transition-colors" title="Reactivar">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
       ))}
    </div>
  );
}
