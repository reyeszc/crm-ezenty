"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, AlertCircle, CheckCircle, Clock, Plus } from "lucide-react";
import { formatearDinero, fechaRelativa } from "@/lib/utils";

export default function PagosPage() {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    fetch("/api/pagos")
      .then(r => r.json())
      .then(d => { setPagos(d.pagos || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtrados = filtro === "todos" ? pagos
    : pagos.filter((p: any) => p.estatus === filtro.toUpperCase());

  const totalCobrado = pagos.filter(p => p.estatus === "PAGADO").reduce((s, p) => s + p.monto, 0);
  const totalPendiente = pagos.filter(p => p.estatus === "PENDIENTE").reduce((s, p) => s + p.monto, 0);
  const totalVencido = pagos.filter(p => p.estatus === "VENCIDO").reduce((s, p) => s + p.monto, 0);

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Pagos</h1>
            <p className="text-sm text-[var(--text-secondary)]">Lo que cobraste y lo que falta</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Cobrado", val: totalCobrado, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", icon: CheckCircle },
          { label: "Pendiente", val: totalPendiente, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", icon: Clock },
          { label: "Vencido", val: totalVencido, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", icon: AlertCircle },
        ].map(({ label, val, color, bg, icon: Icon }) => (
          <div key={label} className="card p-4">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xl font-bold text-[var(--text-primary)]">{formatearDinero(val)}</p>
            <p className="text-xs text-[var(--text-muted)]">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["todos", "pagado", "pendiente", "vencido"].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filtro === f ? "bg-marca-300 text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Payments list */}
      <div className="space-y-2">
        {loading ? Array.from({length: 4}).map((_,i) => <div key={i} className="skeleton h-20 rounded-xl" />) :
         filtrados.length === 0 ? (
           <div className="card p-10 text-center">
             <Wallet className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
             <p className="text-[var(--text-secondary)]">No hay pagos {filtro !== "todos" ? `con estatus "${filtro}"` : "registrados"}</p>
           </div>
         ) : filtrados.map((p: any) => (
           <div key={p.id} className={`card p-4 flex items-center gap-3 ${p.estatus === "VENCIDO" ? "border-l-4 border-red-400" : ""}`}>
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${p.estatus === "PAGADO" ? "bg-green-100 dark:bg-green-900/20" : p.estatus === "VENCIDO" ? "bg-red-100 dark:bg-red-900/20" : "bg-amber-100 dark:bg-amber-900/20"}`}>
               {p.estatus === "PAGADO" ? <CheckCircle className="w-4 h-4 text-green-600" /> : p.estatus === "VENCIDO" ? <AlertCircle className="w-4 h-4 text-red-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
             </div>
             <div className="flex-1 min-w-0">
               <Link href={`/clientes/${p.clienteId}`} className="text-sm font-medium text-[var(--text-primary)] hover:text-marca-500 hover:underline transition-colors">
                 {p.clienteNombre || "Cliente"}
               </Link>
               <p className="text-xs text-[var(--text-muted)]">{p.metodo?.replace(/_/g," ")} · {p.folio} {p.concepto ? `· ${p.concepto}` : ""}</p>
             </div>
             <div className="text-right flex-shrink-0">
               <p className="text-sm font-bold text-[var(--text-primary)]">{formatearDinero(p.monto)}</p>
               <p className="text-xs text-[var(--text-muted)]">{p.fechaPago ? fechaRelativa(p.fechaPago) : p.fechaVencimiento ? `Vence ${fechaRelativa(p.fechaVencimiento)}` : "Sin fecha"}</p>
             </div>
           </div>
         ))}
      </div>
    </div>
  );
}
