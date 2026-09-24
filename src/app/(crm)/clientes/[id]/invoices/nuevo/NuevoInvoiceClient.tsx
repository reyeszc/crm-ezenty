"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileCheck, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

const TERMINOS = ["Net 30", "Net 15", "Upon Receipt"];

interface Linea {
  id: string; descripcion: string; tipo: string; unidad: string;
  cantidad: number; precioFinal: number; area?: string; cotizacionLineaId?: string;
}

export function NuevoInvoiceClient({ cliente, cotizaciones, contactos, cotizacionIdInicial }: any) {
  const router = useRouter();
  const { success, error } = useToast();

  const [cotSeleccionada, setCotSeleccionada] = useState<string>(cotizacionIdInicial || cotizaciones[0]?.id || "");
  const [lineasSeleccionadas, setLineasSeleccionadas] = useState<Set<string>>(new Set());
  const [lineasInvoice, setLineasInvoice] = useState<Linea[]>([]);
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set([cotizacionIdInicial || cotizaciones[0]?.id || ""]));
  const [fechasServicio, setFechasServicio] = useState<string[]>([]);
  const [fechaTemp, setFechaTemp] = useState("");
  const [terminosPago, setTerminosPago] = useState("Net 30");
  const [notas, setNotas] = useState("");
  const [contactoId, setContactoId] = useState(contactos.find((c: any) => c.principal)?.id || contactos[0]?.id || "");
  const [saving, setSaving] = useState(false);

  const contacto = contactos.find((c: any) => c.id === contactoId);

  function toggleLinea(linea: any, cotId: string) {
    const key = `${cotId}-${linea.id}`;
    if (lineasSeleccionadas.has(key)) {
      setLineasSeleccionadas(prev => { const n = new Set(prev); n.delete(key); return n; });
      setLineasInvoice(prev => prev.filter(l => l.cotizacionLineaId !== linea.id));
    } else {
      setLineasSeleccionadas(prev => new Set(prev).add(key));
      setLineasInvoice(prev => [...prev, {
        id: crypto.randomUUID(),
        descripcion: linea.descripcion, tipo: linea.tipo,
        unidad: linea.unidad || "sqft", cantidad: linea.cantidad || 1,
        precioFinal: linea.precioFinal || 0, area: linea.area,
        cotizacionLineaId: linea.id,
      }]);
    }
  }

  function updateLinea(id: string, field: string, val: any) {
    setLineasInvoice(prev => prev.map(l => l.id === id ? { ...l, [field]: val } : l));
  }

  const subtotal = lineasInvoice.reduce((s, l) => s + (l.precioFinal * l.cantidad), 0);

  async function guardar() {
    if (lineasInvoice.length === 0) { error("Agrega al menos un servicio"); return; }
    if (lineasInvoice.some(l => !l.descripcion.trim())) { error("Todas las líneas deben tener descripción"); return; }
    if (fechasServicio.length === 0) { error("Agrega al menos una fecha de servicio"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/clientes/${cliente.id}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fechaServicio: fechasServicio[0] || null,
          fechaServicioFin: fechasServicio[fechasServicio.length - 1] || null,
          fechasServicio,
          terminosPago, notas, subtotal, total: subtotal,
          cotizacionId: cotSeleccionada || null,
          contactoNombre: contacto?.nombre || null,
          contactoPuesto: contacto?.puesto || contacto?.cargo || null,
          contactoCorreo: contacto?.correo || null,
          contactoTelefono: contacto?.telefono || null,
          lineas: lineasInvoice,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      success(`Invoice ${data.numero} creado ✓`);
      router.push(`/clientes/${cliente.id}/invoices/${data.id}`);
    } catch { error("No se pudo crear el invoice"); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 space-y-4">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-2">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
          <FileCheck className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Nuevo Invoice</h1>
          <p className="text-sm text-[var(--text-secondary)]">{cliente.nombre}</p>
        </div>
      </div>

      {/* Invoice details */}
      <div className="card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Datos del Invoice</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label text-xs">Fecha(s) de Servicio *</label>
            <div className="flex gap-2">
              <input type="date" className="input text-sm flex-1" value={fechaTemp}
                onChange={e => setFechaTemp(e.target.value)} />
              <button type="button" onClick={() => {
                if (fechaTemp && !fechasServicio.includes(fechaTemp)) {
                  setFechasServicio(prev => [...prev, fechaTemp].sort());
                  setFechaTemp("");
                }
              }} className="btn-secondary !py-1.5 !px-3 text-xs flex-shrink-0">+ Agregar</button>
            </div>
            {fechasServicio.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {fechasServicio.map(f => (
                  <span key={f} className="inline-flex items-center gap-1 bg-marca-50 dark:bg-marca-900/20 text-marca-600 dark:text-marca-300 text-xs px-2 py-1 rounded-full">
                    {new Date(f + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    <button onClick={() => setFechasServicio(prev => prev.filter(x => x !== f))} className="hover:text-red-500 ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
            {fechasServicio.length > 1 && (
              <p className="text-xs text-[var(--text-muted)] mt-1">{fechasServicio.length} día(s) de servicio</p>
            )}
          </div>
          <div>
            <label className="label text-xs">Términos de Pago</label>
            <select className="input text-sm" value={terminosPago} onChange={e => setTerminosPago(e.target.value)}>
              {TERMINOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        {contactos.length > 0 && (
          <div>
            <label className="label text-xs">Contacto</label>
            <select className="input text-sm" value={contactoId} onChange={e => setContactoId(e.target.value)}>
              {contactos.map((c: any) => (
                <option key={c.id} value={c.id}>{c.nombre} {c.puesto ? `- ${c.puesto}` : ""}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Select items from quotes */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Seleccionar Ítems
          {lineasSeleccionadas.size > 0 && (
            <span className="ml-2 text-xs text-emerald-500">{lineasSeleccionadas.size} seleccionado(s)</span>
          )}
        </h2>
        {cotizaciones.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center py-4">No hay cotizaciones para este cliente</p>
        ) : (
          <div className="space-y-2">
            {cotizaciones.map((cot: any) => {
              const abierta = expandidas.has(cot.id);
              return (
                <div key={cot.id} className="border border-[var(--border)] rounded-xl overflow-hidden">
                  <button onClick={() => setExpandidas(prev => { const n = new Set(prev); n.has(cot.id) ? n.delete(cot.id) : n.add(cot.id); return n; })}
                    className="w-full flex items-center justify-between p-3 hover:bg-[var(--bg-secondary)] transition-colors text-left">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{cot.numero}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(cot.creadoEn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {" · "}{cot.estado}
                        {" · "}${(cot.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    {abierta ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
                  </button>
                  {abierta && (
                    <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
                      {cot.lineas?.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] p-3 text-center">Sin líneas</p>
                      ) : cot.lineas?.map((l: any) => {
                        const key = `${cot.id}-${l.id}`;
                        const checked = lineasSeleccionadas.has(key);
                        return (
                          <label key={l.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${checked ? "bg-emerald-50 dark:bg-emerald-900/10" : "hover:bg-[var(--bg-secondary)]"}`}>
                            <input type="checkbox" checked={checked}
                              onChange={() => toggleLinea(l, cot.id)} className="rounded flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[var(--text-primary)] font-medium truncate">{l.descripcion}</p>
                              <p className="text-xs text-[var(--text-muted)]">
                                {l.tipo} · Qty {l.cantidad || 1} · ${(l.precioFinal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-[var(--text-primary)] flex-shrink-0">
                              ${((l.precioFinal || 0) * (l.cantidad || 1)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </p>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add manual line */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">✏️ Agregar línea manual</h2>
          <button onClick={() => setLineasInvoice(prev => [...prev, {
            id: crypto.randomUUID(), descripcion: "", tipo: "", unidad: "flat_fee",
            cantidad: 1, precioFinal: 0,
          }])} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1">
            <Plus className="w-3 h-3" /> Agregar
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">Para servicios de emergencia o trabajos sin cotización previa.</p>
      </div>

      {/* Selected lines preview + edit */}
      {lineasInvoice.length > 0 && (
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">📋 Ítems del Invoice</h2>
          <div className="space-y-2">
            {lineasInvoice.map(l => (
              <div key={l.id} className="p-2 bg-[var(--bg-secondary)] rounded-lg space-y-1.5">
                <div className="flex items-center gap-2">
                  {!l.cotizacionLineaId ? (
                    <input className="input text-xs !py-1 flex-1" value={l.descripcion}
                      onChange={e => updateLinea(l.id, "descripcion", e.target.value)}
                      placeholder="Descripción del servicio..." />
                  ) : (
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate flex-1">{l.descripcion}</p>
                  )}
                </div>
                {!l.cotizacionLineaId && (
                  <input className="input text-xs !py-1 w-full" value={l.tipo || ""}
                    onChange={e => updateLinea(l.id, "tipo", e.target.value)}
                    placeholder="Tipo (Carpet Cleaning, Tile & Grout...)" />
                )}
                <div className="flex items-center gap-2">
                <input type="number" className="input text-xs !py-1 w-16 text-center" value={l.cantidad}
                  onChange={e => updateLinea(l.id, "cantidad", parseFloat(e.target.value) || 1)} min="1" step="1" />
                <div className="relative w-24">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">$</span>
                  <input type="number" className="input text-xs !py-1 pl-5" value={l.precioFinal}
                    onChange={e => updateLinea(l.id, "precioFinal", parseFloat(e.target.value) || 0)} min="0" step="0.01" />
                </div>
                <p className="text-xs font-bold w-20 text-right">${(l.precioFinal * l.cantidad).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                <button onClick={() => {
                  setLineasInvoice(prev => prev.filter(x => x.id !== l.id));
                  setLineasSeleccionadas(prev => { const n = new Set(prev); n.forEach(k => { if (k.endsWith(l.cotizacionLineaId || "")) n.delete(k); }); return n; });
                }} className="text-red-400 hover:text-red-500 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--border)]">
            <span className="text-sm font-bold text-[var(--text-primary)]">TOTAL</span>
            <span className="text-lg font-bold text-emerald-600">${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="card p-4">
        <label className="label text-sm">Notas</label>
        <textarea className="input resize-y" rows={3} value={notas} onChange={e => setNotas(e.target.value)}
          placeholder="Observaciones adicionales, instrucciones de pago..." />
      </div>

      {/* Save */}
      <div className="fixed bottom-16 lg:bottom-4 left-0 right-0 px-4 max-w-2xl mx-auto">
        <button onClick={guardar} disabled={saving || lineasInvoice.length === 0 || fechasServicio.length === 0}
          className="btn-primary w-full justify-center disabled:opacity-40">
          {saving ? "Creando Invoice…" : `Crear Invoice · $${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
        </button>
      </div>
    </div>
  );
}
