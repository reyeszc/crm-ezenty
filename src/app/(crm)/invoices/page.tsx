"use client";
import { useEffect, useState } from "react";

function calcAging(inv: any): number | null {
  if (inv.estado === "PAGADO") return null;
  const base = inv.fechaServicio ? new Date(inv.fechaServicio) : null;
  if (!base) return null;
  const dias = inv.terminosPago === "Net 30" ? 30 : inv.terminosPago === "Net 15" ? 15 : 0;
  const venc = new Date(base);
  venc.setDate(venc.getDate() + dias);
  const diff = Math.floor((new Date().getTime() - venc.getTime()) / 86400000);
  return diff > 0 ? diff : null;
}
import Link from "next/link";
import { FileCheck, DollarSign, Clock, CheckCircle } from "lucide-react";

const ESTADO_CFG: Record<string, { label: string; cls: string }> = {
  BORRADOR: { label: "Borrador", cls: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  ENVIADO:  { label: "Enviado",  cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  PAGADO:   { label: "Pagado",   cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");

  useEffect(() => {
    fetch("/api/invoices")
      .then(r => r.json())
      .then(d => setInvoices(d.invoices || []))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = filtro === "VENCIDAS"
    ? invoices.filter(i => calcAging(i) !== null)
    : filtro === "TODOS" ? invoices : invoices.filter(i => i.estado === filtro);
  const totalPagado = invoices.filter(i => i.estado === "PAGADO").reduce((s, i) => s + (i.total || 0), 0);
  const totalPendiente = invoices.filter(i => i.estado !== "PAGADO").reduce((s, i) => s + (i.total || 0), 0);
  const vencidas = invoices.filter(i => calcAging(i) !== null);
  const totalVencido = vencidas.reduce((s, i) => s + (i.total || 0), 0);

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
          <FileCheck className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Invoices</h1>
          <p className="text-sm text-[var(--text-secondary)]">{loading ? "Cargando…" : `${invoices.length} invoices`}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Cobrado</p>
            <p className="text-base font-bold text-emerald-600">${totalPagado.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="card p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Pendiente</p>
            <p className="text-base font-bold text-amber-600">${totalPendiente.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="card p-3 col-span-2 flex items-center gap-3 border-l-4 border-l-red-400">
          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Clock className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Vencido ({vencidas.length})</p>
            <p className="text-base font-bold text-red-600">${totalVencido.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["TODOS", "VENCIDAS", "BORRADOR", "ENVIADO", "PAGADO"].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filtro === f ? "bg-marca-300 text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"}`}>
            {f === "TODOS" ? "Todos" : f === "VENCIDAS" ? `⚠️ Vencidas` : ESTADO_CFG[f]?.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : filtrados.length === 0 ? (
        <div className="card p-12 text-center">
          <FileCheck className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">No hay invoices</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(inv => (
            <Link key={inv.id} href={`/clientes/${inv.clienteId}/invoices/${inv.id}`}
              className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{inv.numero}</p>
                  <span className={`badge text-xs ${ESTADO_CFG[inv.estado]?.cls}`}>{ESTADO_CFG[inv.estado]?.label}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] truncate">{inv.clienteNombre}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {inv.fechaServicio ? new Date(inv.fechaServicio).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Sin fecha"} · {inv.terminosPago}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold text-emerald-600">${(inv.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
