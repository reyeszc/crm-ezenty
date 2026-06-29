"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Search, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/providers/ToastProvider";

const ESTADO_CONFIG: Record<string, { label: string; cls: string }> = {
  BORRADOR:  { label: "Borrador",  cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  ENVIADA:   { label: "Enviada",   cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  APROBADA:  { label: "Aprobada",  cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  RECHAZADA: { label: "Rechazada", cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300" },
};

export default function CotizacionesPage() {
  const { data: session } = useSession();
  const { success, error } = useToast();
  const esAdmin = (session?.user as any)?.rol === "ADMIN";
  const [cotizaciones, setCotizaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/cotizaciones")
      .then(r => r.json())
      .then(d => { setCotizaciones(d.cotizaciones || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtradas = cotizaciones.filter(c => {
    if (filtroEstado && c.estado !== filtroEstado) return false;
    if (busqueda && !c.clienteNombre?.toLowerCase().includes(busqueda.toLowerCase()) &&
        !c.numero?.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const totalAprobadas = cotizaciones.filter(c => c.estado === "APROBADA").reduce((s, c) => s + (c.total || 0), 0);
  const totalEnviadas = cotizaciones.filter(c => c.estado === "ENVIADA").reduce((s, c) => s + (c.total || 0), 0);

  async function eliminar(c: any) {
    setEliminando(c.id);
    try {
      const res = await fetch(`/api/cotizaciones/${c.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setCotizaciones(p => p.filter(x => x.id !== c.id));
      success(`${c.numero} eliminada ✓`);
    } catch { error("No se pudo eliminar"); } finally {
      setEliminando(null);
      setConfirmar(null);
    }
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Cotizaciones</h1>
          <p className="text-sm text-[var(--text-secondary)]">{cotizaciones.length} total · ${totalAprobadas.toLocaleString("en-US", { minimumFractionDigits: 2 })} aprobadas</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(ESTADO_CONFIG).map(([estado, cfg]) => {
          const cnt = cotizaciones.filter(c => c.estado === estado);
          const total = cnt.reduce((s, c) => s + (c.total || 0), 0);
          return (
            <button key={estado} onClick={() => setFiltroEstado(filtroEstado === estado ? "" : estado)}
              className={`card p-3 text-left transition-all ${filtroEstado === estado ? "ring-2 ring-marca-300" : ""}`}>
              <p className="text-lg font-bold text-[var(--text-primary)]">{cnt.length}</p>
              <span className={`badge text-xs ${cfg.cls}`}>{cfg.label}</span>
              {total > 0 && <p className="text-xs text-[var(--text-muted)] mt-1">${total.toLocaleString("en-US", { minimumFractionDigits: 0 })}</p>}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input className="input pl-9" placeholder="Buscar por número o cliente…"
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? Array.from({length: 3}).map((_,i) => <div key={i} className="skeleton h-20 rounded-xl" />) :
         filtradas.length === 0 ? (
          <div className="card p-10 text-center">
            <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
            <p className="text-[var(--text-secondary)]">No hay cotizaciones {filtroEstado ? `con estado "${ESTADO_CONFIG[filtroEstado]?.label}"` : "aún"}</p>
          </div>
         ) : filtradas.map((c: any) => {
          const cfg = ESTADO_CONFIG[c.estado] || ESTADO_CONFIG.BORRADOR;
          const vencida = c.estado !== "APROBADA" && c.fechaVencimiento && new Date(c.fechaVencimiento) < new Date();
          return (
            <div key={c.id} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow relative">
            <Link href={`/clientes/${c.clienteId}/cotizacion/${c.id}`} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-[var(--text-primary)]">{c.numero}</p>
                  <span className={`badge text-xs ${cfg.cls}`}>{cfg.label}</span>
                  {vencida && <span className="badge text-xs bg-red-100 text-red-600">Vencida</span>}
                </div>
                <p className="text-sm text-[var(--text-secondary)] truncate">{c.clienteNombre}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {new Date(c.creadoEn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {c.validezDias ? ` · Válida ${c.validezDias} días` : ""}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-emerald-600">${(c.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                {c.descuento > 0 && <p className="text-xs text-[var(--text-muted)]">-${c.descuento.toFixed(2)} desc.</p>}
              </div>
            </Link>
            {esAdmin && (
              <button
                onClick={() => setConfirmar(c)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
                title="Eliminar cotización">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          );
        })}
      </div>
      {/* Confirm delete modal */}
      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setConfirmar(null)}>
          <div className="card w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">¿Eliminar cotización?</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-1">{confirmar.numero}</p>
            <p className="text-sm text-[var(--text-muted)] mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => eliminar(confirmar)} disabled={eliminando === confirmar.id}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors">
                {eliminando === confirmar.id ? "Eliminando…" : "Sí, eliminar"}
              </button>
              <button onClick={() => setConfirmar(null)} className="flex-1 btn-secondary justify-center">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
