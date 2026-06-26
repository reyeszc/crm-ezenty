"use client";
import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useDebounce } from "@/lib/hooks";
import { useEffect } from "react";

export default function BuscarPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any>(null);
  const qD = useDebounce(q, 300);

  useEffect(() => {
    if (qD.length < 2) { setResults(null); return; }
    fetch(`/api/buscar?q=${encodeURIComponent(qD)}`)
      .then(r => r.json()).then(setResults);
  }, [qD]);

  return (
    <div className="max-w-xl mx-auto pb-20 lg:pb-0">
      <div className="flex items-center gap-3 mb-4">
        <Search className="w-5 h-5 text-[var(--text-muted)]" />
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Búsqueda global</h1>
      </div>
      <input autoFocus value={q} onChange={e => setQ(e.target.value)}
        className="input text-lg mb-4" placeholder="Nombre, empresa, teléfono, correo…" />
      {results && (
        <div className="space-y-4">
          {results.clientes?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Clientes</p>
              <div className="space-y-1">
                {results.clientes.map((c: any) => (
                  <Link key={c.id} href={`/clientes/${c.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-marca-300 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {c.nombre[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{c.nombre}</p>
                      <p className="text-xs text-[var(--text-muted)]">{c.empresa?.nombre || c.propiedad || ""}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {results.clientes?.length === 0 && q.length >= 2 && (
            <div className="text-center py-8">
              <p className="text-[var(--text-secondary)]">No encontré nada con &ldquo;{q}&rdquo;</p>
              <Link href="/clientes/nuevo" className="mt-3 btn-primary inline-flex">+ Nuevo cliente</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
