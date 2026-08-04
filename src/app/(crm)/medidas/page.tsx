"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Ruler, ChevronDown, ChevronUp, Search } from "lucide-react";

interface MedidaResumen {
  id: string; clienteId: string; clienteNombre: string;
  sqFtTotal: number; flatFeeTotal: number; creadoEn: string; notas?: string;
}

export default function MedidasPage() {
  const [loading, setLoading] = useState(true);
  const [medidas, setMedidas] = useState<MedidaResumen[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/medidas")
      .then(r => r.json())
      .then(d => setMedidas(d.medidas || []))
      .finally(() => setLoading(false));
  }, []);

  // Group by client
  const porCliente = medidas.reduce((acc, m) => {
    const nombre = m.clienteNombre?.toLowerCase() || "";
    if (busqueda && !nombre.includes(busqueda.toLowerCase())) return acc;
    if (!acc[m.clienteId]) acc[m.clienteId] = { nombre: m.clienteNombre, medidas: [] };
    acc[m.clienteId].medidas.push(m);
    return acc;
  }, {} as Record<string, { nombre: string; medidas: MedidaResumen[] }>);

  function toggleCliente(id: string) {
    setExpandidos(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const totalClientes = Object.keys(porCliente).length;
  const totalMedidas = medidas.filter(m => {
    const nombre = m.clienteNombre?.toLowerCase() || "";
    return !busqueda || nombre.includes(busqueda.toLowerCase());
  }).length;

  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <Ruler className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Medidas</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {loading ? "Cargando…" : `${totalMedidas} medidas · ${totalClientes} clientes`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input className="input pl-9" placeholder="Buscar por cliente…"
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : Object.keys(porCliente).length === 0 ? (
        <div className="card p-12 text-center">
          <Ruler className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">No hay medidas registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(porCliente)
            .sort(([,a], [,b]) => a.nombre.localeCompare(b.nombre))
            .map(([clienteId, { nombre, medidas: ms }]) => {
              const abierto = expandidos.has(clienteId);
              const totalSqFt = ms.reduce((s, m) => s + (m.sqFtTotal || 0), 0);
              return (
                <div key={clienteId} className="card overflow-hidden">
                  {/* Client header */}
                  <button onClick={() => toggleCliente(clienteId)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-[var(--bg-secondary)] transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {nombre?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{nombre}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {ms.length} medida{ms.length !== 1 ? "s" : ""} · {totalSqFt.toLocaleString("en-US", { maximumFractionDigits: 0 })} sq ft total
                      </p>
                    </div>
                    <Link href={`/clientes/${clienteId}`}
                      onClick={e => e.stopPropagation()}
                      className="text-xs text-marca-500 hover:underline flex-shrink-0 mr-2">
                      Ver cliente
                    </Link>
                    {abierto ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                             : <ChevronDown className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />}
                  </button>

                  {/* Medidas list */}
                  {abierto && (
                    <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
                      {ms.sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
                        .map(m => (
                          <Link key={m.id} href={`/clientes/${clienteId}/medidas/${m.id}`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--text-primary)]">
                                {new Date(m.creadoEn).toLocaleDateString("en-US", {
                                  month: "long", day: "numeric", year: "numeric"
                                })}
                              </p>
                              {m.notas && (
                                <p className="text-xs text-[var(--text-muted)] truncate">{m.notas}</p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-marca-500">
                                {(m.sqFtTotal || 0).toFixed(0)} sq ft
                              </p>
                              {m.flatFeeTotal > 0 && (
                                <p className="text-xs text-green-600 font-semibold">
                                  ${(m.flatFeeTotal || 0).toFixed(2)}
                                </p>
                              )}
                            </div>
                            <ChevronUp className="w-4 h-4 text-[var(--text-muted)] rotate-90" />
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
