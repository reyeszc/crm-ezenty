"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Archive, RotateCcw } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

export default function ArchivadosPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { success } = useToast();

  useEffect(() => {
    fetch("/api/clientes?estado=ARCHIVADO&por_pagina=50")
      .then(r => r.json()).then(d => { setClientes(d.clientes || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function restaurar(id: string, nombre: string) {
    const res = await fetch(`/api/clientes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado: "ACTIVO", archivado: false }) });
    if (res.ok) { setClientes(p => p.filter(c => c.id !== id)); success(`${nombre} restaurado`); }
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Archive className="w-5 h-5 text-slate-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Archivados</h1>
          <p className="text-sm text-[var(--text-secondary)]">Guardados sin perder nada — {clientes.length} clientes</p>
        </div>
      </div>
      {loading ? Array.from({length:3}).map((_,i) => <div key={i} className="skeleton h-16 rounded-xl" />) :
       clientes.length === 0 ? (
        <div className="card p-12 text-center">
          <Archive className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">No hay nada archivado</p>
        </div>
       ) : clientes.map((c: any) => (
        <div key={c.id} className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 font-bold flex-shrink-0 text-sm">{c.nombre[0]}</div>
          <div className="flex-1 min-w-0">
            <Link href={`/clientes/${c.id}`} className="font-medium text-[var(--text-primary)] hover:text-marca-500 hover:underline transition-colors">{c.nombre}</Link>
            <p className="text-xs text-[var(--text-muted)]">{c.propiedad || c.zona || ""}</p>
          </div>
          <button onClick={() => restaurar(c.id, c.nombre)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors flex-shrink-0">
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar
          </button>
        </div>
       ))}
    </div>
  );
}
