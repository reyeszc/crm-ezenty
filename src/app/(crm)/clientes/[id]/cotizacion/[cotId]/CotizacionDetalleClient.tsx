"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Download, Send, CheckCircle, XCircle, Printer, Edit2, Save, Plus, Trash2, GripVertical } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { formatearDinero } from "@/lib/utils";

const ESTADOS = ["BORRADOR", "ENVIADA", "APROBADA", "RECHAZADA"] as const;
const ESTADO_CONFIG: Record<string, { label: string; cls: string; next?: string }> = {
  BORRADOR:  { label: "Borrador",  cls: "bg-gray-100 text-gray-600",    next: "ENVIADA" },
  ENVIADA:   { label: "Enviada",   cls: "bg-blue-100 text-blue-700",    next: "APROBADA" },
  APROBADA:  { label: "Aprobada",  cls: "bg-green-100 text-green-700" },
  RECHAZADA: { label: "Rechazada", cls: "bg-red-100 text-red-600" },
};

const UNIDAD_LABEL: Record<string, string> = {
  sqft: "sq ft", flat_fee: "—", pieza: "pza", habitacion: "hab", bano: "baño",
};

export function CotizacionDetalleClient({ cotizacion, cliente, lineas, vendedor }: {
  cotizacion: any; cliente: any; lineas: any[]; vendedor: any;
}) {
  const { success, error } = useToast();
  const [estado, setEstado] = useState(cotizacion.estado);
  const [updatingEstado, setUpdatingEstado] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Edit mode
  const [editando, setEditando] = useState(false);
  const [editLineas, setEditLineas] = useState<any[]>(lineas.map(l => ({ ...l })));
  const [editNotas, setEditNotas] = useState(cotizacion.notas || "");
  const [savingEdit, setSavingEdit] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  function handleDragEnd() {
    if (dragItem.current === null || dragOver.current === null) return;
    const copy = [...editLineas];
    const moved = copy.splice(dragItem.current, 1)[0];
    copy.splice(dragOver.current, 0, moved);
    setEditLineas(copy);
    dragItem.current = null; dragOver.current = null;
  }

  function updateEditLinea(id: string, patch: any) {
    setEditLineas(p => p.map(l => l.id === id ? { ...l, ...patch } : l));
  }

  function removeEditLinea(id: string) {
    setEditLineas(p => p.filter(l => l.id !== id));
  }

  function addEditLinea() {
    setEditLineas(p => [...p, {
      id: crypto.randomUUID(), descripcion: "", tipo: "Carpet Cleaning", unidad: "sqft",
      cantidad: 1, precioUnitario: 0, precioFinal: 0, subtotal: 0, area: "", orden: p.length
    }]);
  }

  async function guardarEdicion() {
    setSavingEdit(true);
    try {
      const lineasActualizadas = editLineas.map((l, i) => ({
        ...l,
        subtotal: (l.precioFinal || l.precioUnitario || 0) * (l.cantidad || 1),
        orden: i,
      }));
      const nuevoTotal = lineasActualizadas.reduce((s, l) => s + l.subtotal, 0);
      const res = await fetch(`/api/clientes/${cliente.id}/cotizaciones/${cotizacion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineas: lineasActualizadas,
          notas: editNotas,
          total: nuevoTotal,
          subtotal: nuevoTotal,
          estado: "BORRADOR",
        }),
      });
      if (!res.ok) throw new Error();
      success("Cotización actualizada ✓");
      setEditando(false);
      setEstado("BORRADOR");
      // Refresh page to show updated data
      window.location.reload();
    } catch { error("No se pudo guardar"); } finally { setSavingEdit(false); }
  }

  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.BORRADOR;
  // Get primary contact from cliente contacts (passed as prop)
  const contactoPrincipal = (cotizacion as any).contactoPrincipal || null;
  const fechaCreacion = new Date(cotizacion.creadoEn);
  const fechaValidez = new Date(fechaCreacion.getTime() + (cotizacion.validezDias || 30) * 86400000);

  async function cambiarEstado(nuevoEstado: string) {
    setUpdatingEstado(true);
    try {
      const res = await fetch(`/api/clientes/${cliente.id}/cotizaciones/${cotizacion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error();
      setEstado(nuevoEstado);
      success(`Cotización marcada como ${ESTADO_CONFIG[nuevoEstado]?.label} ✓`);
    } catch { error("No se pudo actualizar"); } finally { setUpdatingEstado(false); }
  }

  function generateAndPrintPDF() {
    setGeneratingPdf(true);
    // Open print view
    const printWindow = window.open("", "_blank");
    if (!printWindow) { setGeneratingPdf(false); return; }

    const html = buildPDFHTML({ cotizacion, cliente, lineas, vendedor, fechaCreacion, fechaValidez, estado });
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      setGeneratingPdf(false);
    };
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 lg:pb-6">
      {/* Nav */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Link href={`/clientes/${cliente.id}`} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="w-4 h-4" /> {cliente.nombre}
        </Link>
        <span className="text-[var(--text-muted)]">/</span>
        <Link href="/cotizaciones" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          Cotizaciones
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{cotizacion.numero}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`badge text-xs ${cfg.cls}`}>{cfg.label}</span>
              <span className="text-xs text-[var(--text-muted)]">
                {fechaCreacion.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                {" · "}Válida hasta {fechaValidez.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {!editando ? (
            <button onClick={() => { setEditLineas(lineas.map(l => ({ ...l }))); setEditNotas(cotizacion.notas || ""); setEditando(true); }}
              className="btn-secondary !py-2 !px-3 text-sm">
              <Edit2 className="w-3.5 h-3.5" /> Editar
            </button>
          ) : (
            <>
              <button onClick={guardarEdicion} disabled={savingEdit}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                <Save className="w-3.5 h-3.5" /> {savingEdit ? "Guardando…" : "Guardar cambios"}
              </button>
              <button onClick={() => setEditando(false)}
                className="btn-secondary !py-2 !px-3 text-sm">
                Cancelar
              </button>
            </>
          )}
          {!editando && estado === "BORRADOR" && (
            <button onClick={() => cambiarEstado("ENVIADA")} disabled={updatingEstado}
              className="btn-secondary !py-2 !px-3 text-sm">
              <Send className="w-3.5 h-3.5" /> Marcar enviada
            </button>
          )}
          {!editando && estado === "ENVIADA" && (
            <>
              <button onClick={() => cambiarEstado("APROBADA")} disabled={updatingEstado}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                <CheckCircle className="w-3.5 h-3.5" /> Aprobada
              </button>
              <button onClick={() => cambiarEstado("RECHAZADA")} disabled={updatingEstado}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                <XCircle className="w-3.5 h-3.5" /> Rechazada
              </button>
            </>
          )}
          {!editando && (
            <button onClick={generateAndPrintPDF} disabled={generatingPdf}
              className="btn-primary !py-2 !px-3 text-sm">
              {generatingPdf ? "Generando…" : <><Printer className="w-3.5 h-3.5" /> PDF / Imprimir</>}
            </button>
          )}
        </div>
      </div>

      {/* Edit mode */}
      {editando && (
        <div className="card p-4 space-y-4 border-2 border-marca-200">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">✏️ Editando cotización</h2>

          {/* Lines */}
          <div className="divide-y divide-[var(--border)]">
            {editLineas.map((l, idx) => (
              <div key={l.id} data-idx={idx}
                className="py-3 grid grid-cols-12 gap-2 items-center"
                draggable onDragStart={() => dragItem.current = idx}
                onDragEnter={() => dragOver.current = idx}
                onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()}>
                <div className="col-span-1 flex justify-center cursor-grab">
                  <GripVertical className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
                <div className="col-span-5 space-y-1">
                  <input className="input text-xs !py-1" value={l.descripcion}
                    onChange={e => updateEditLinea(l.id, { descripcion: e.target.value })}
                    placeholder="Descripción" />
                  <input className="input text-xs !py-1" value={l.tipo || ""}
                    onChange={e => updateEditLinea(l.id, { tipo: e.target.value })}
                    placeholder="Tipo (Carpet Cleaning, Tile...)" />
                </div>
                <div className="col-span-2">
                  <input type="number" className="input text-sm !py-1 text-center" value={l.cantidad}
                    onChange={e => updateEditLinea(l.id, { cantidad: parseFloat(e.target.value) || 0 })}
                    placeholder="Cant." min="0" />
                  <p className="text-xs text-center text-[var(--text-muted)]">{UNIDAD_LABEL[l.unidad] || l.unidad}</p>
                </div>
                <div className="col-span-2">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">$</span>
                    <input type="number" className="input text-sm !py-1 pl-5 text-center" value={l.precioFinal}
                      onChange={e => updateEditLinea(l.id, { precioFinal: parseFloat(e.target.value) || 0, precioUnitario: parseFloat(e.target.value) || 0 })}
                      placeholder="Precio" min="0" step="0.01" />
                  </div>
                </div>
                <div className="col-span-1 text-right text-xs font-bold text-[var(--text-primary)]">
                  ${((l.precioFinal || 0) * (l.cantidad || 1)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button onClick={() => removeEditLinea(l.id)} className="text-red-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={addEditLinea}
            className="flex items-center gap-1.5 text-sm text-marca-500 hover:text-marca-600">
            <Plus className="w-4 h-4" /> Agregar línea
          </button>

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
            <span className="text-sm font-semibold text-[var(--text-primary)]">TOTAL</span>
            <span className="text-lg font-bold text-emerald-600">
              ${editLineas.reduce((s, l) => s + (l.precioFinal || 0) * (l.cantidad || 1), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="label text-sm">Notas / Terms & Conditions</label>
            <textarea className="input resize-y" rows={8} value={editNotas}
              onChange={e => setEditNotas(e.target.value)} />
          </div>

          <button onClick={guardarEdicion} disabled={savingEdit}
            className="btn-primary w-full justify-center">
            <Save className="w-4 h-4" />
            {savingEdit ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      )}

      {/* Preview card - matches PDF format */}
      <div className="card overflow-hidden">
        {/* Header navy bar */}
        <div className="px-6 py-4" style={{ background: "#1B2A4A" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center flex-shrink-0 p-1">
                <img src="/logo.png" alt="Ezenty" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">SERVICE QUOTATION</p>
                <p className="text-blue-200 text-xs">Floor, Surface & Odor Care · IICRC Certified</p>
                <p className="text-blue-300 text-xs italic">We Protect the Surfaces That Protect Your Brand™</p>
              </div>
            </div>
            <div className="text-right text-white text-sm">
              <p className="font-bold text-lg">{cotizacion.numero}</p>
              <p className="text-blue-200">{fechaCreacion.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}</p>
              <p className="text-xs text-blue-300 mt-1">Valid Through:</p>
              <p className="font-semibold text-yellow-300">{fechaValidez.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}</p>
            </div>
          </div>
        </div>

        {/* Property info */}
        <div className="px-6 py-3" style={{ background: "#FFF8E7" }}>
          <p className="text-xs font-bold text-[#1B2A4A] mb-2 uppercase tracking-wide">Property Information</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div><span className="font-semibold text-[#1B2A4A]">Management: </span><span>{cliente.management || "—"}</span></div>
            <div><span className="font-semibold text-[#1B2A4A]">Property Name: </span><span>{cliente.nombre}</span></div>
            <div><span className="font-semibold text-[#1B2A4A]">Contact Name: </span><span>{contactoPrincipal?.nombre || "—"}</span></div>
            <div><span className="font-semibold text-[#1B2A4A]">Property Address: </span><span>{cliente.direccionPropiedad || "—"}</span></div>
            <div><span className="font-semibold text-[#1B2A4A]">Contact Title: </span><span>{contactoPrincipal?.cargo || "—"}</span></div>
            <div><span className="font-semibold text-[#1B2A4A]">City / State: </span><span>{cliente.zona || "—"}</span></div>
            <div><span className="font-semibold text-[#1B2A4A]">Email: </span><span>{contactoPrincipal?.correo || cliente.correo || "—"}</span></div>
            <div><span className="font-semibold text-[#1B2A4A]">Property Type: </span><span>{cliente.tipoPropiedad || "Hotel"}</span></div>
            <div><span className="font-semibold text-[#1B2A4A]">Phone: </span><span>{contactoPrincipal?.telefono || cliente.telefono || "—"}</span></div>
          </div>
        </div>

        {/* Services table — grouped by floor type */}
        <div className="px-6 py-3">
          <p className="text-xs font-bold text-[#1B2A4A] mb-2 uppercase tracking-wide">Section 1 — Quoted Services & Pricing</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "#1B2A4A" }}>
                <th className="text-white text-left py-2 px-3 w-8">#</th>
                <th className="text-white text-left py-2 px-3">Service Description</th>
                <th className="text-white text-center py-2 px-3 w-16">Qty</th>
                <th className="text-white text-right py-2 px-3">Total ($)</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const grupos: Record<string, any[]> = {};
                lineas.forEach(l => {
                  const g = l.tipo?.includes("Guest") ? "Guest Services" :
                            l.tipo?.includes("Carpet") ? "Carpet Cleaning" :
                            l.tipo?.includes("Tile") ? "Tile & Grout Cleaning" :
                            l.tipo?.includes("LVT") ? "LVT" :
                            l.tipo?.includes("Concrete") ? "Concrete" :
                            l.tipo?.includes("Upholstery") ? "Upholstery" :
                            l.tipo?.includes("Odor") ? "Odor Control" : "Other";
                  if (!grupos[g]) grupos[g] = [];
                  grupos[g].push(l);
                });
                let num = 0;
                return Object.entries(grupos).map(([grupo, items]) => (
                  <>
                    <tr key={`g-${grupo}`} style={{ background: "#E8EEF5" }}>
                      <td colSpan={4} className="py-1.5 px-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#1B2A4A" }}>{grupo}</td>
                    </tr>
                    {items.map((l: any) => {
                      num++;
                      const subtotal = (l.unidad === "habitacion" || l.unidad === "bano" || l.unidad === "pieza")
                        ? (l.precioFinal || 0) * (l.cantidad || 1)
                        : (l.precioFinal || 0);
                      return (
                        <tr key={l.id} style={{ background: num % 2 === 0 ? "#FFFFFF" : "#F8F9FA" }}>
                          <td className="py-2 pl-5 pr-3 text-center text-[var(--text-muted)] font-mono text-xs">{String(num).padStart(2,"0")}</td>
                          <td className="py-2 px-3 text-[var(--text-primary)]">
                            {l.descripcion}
                            {(l.unidad === "habitacion" || l.unidad === "bano" || l.unidad === "pieza") && (l.cantidad || 1) > 1 && (
                              <span className="text-xs text-[var(--text-muted)] ml-1">(${(l.precioFinal||0).toLocaleString("en-US",{minimumFractionDigits:2})} each)</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center text-[var(--text-secondary)]">
                            {(l.unidad === "habitacion" || l.unidad === "bano" || l.unidad === "pieza") ? (l.cantidad || 1) : 1}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold" style={{ color: "#1B2A4A" }}>
                            ${subtotal.toLocaleString("en-US",{minimumFractionDigits:2})}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                ));
              })()}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-3 flex justify-end">
            <div className="w-56 space-y-1">
              {cotizacion.descuento > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Subtotal</span>
                    <span>${(cotizacion.subtotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Descuento</span>
                    <span>-${cotizacion.descuento.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-base font-bold border-t border-[var(--border)] pt-2" style={{ color: "#1B2A4A" }}>
                <span>TOTAL</span>
                <span>${(cotizacion.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Signature section */}
        <div className="px-6 py-3 border-t border-[var(--border)]">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-[#1B2A4A] mb-2">AUTHORIZED BY CLIENT</p>
              <div className="space-y-2 text-sm">
                <div className="border-b border-gray-300 pb-1"><span className="text-[var(--text-muted)] text-xs">Signature:</span></div>
                <div className="border-b border-gray-300 pb-1"><span className="text-[var(--text-muted)] text-xs">Printed Name & Title:</span></div>
                <div className="border-b border-gray-300 pb-1"><span className="text-[var(--text-muted)] text-xs">Date:</span></div>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-[#1B2A4A] mb-2">PREPARED BY: EZENTY ProCare LLC</p>
              <div className="space-y-2 text-sm">
                <div className="border-b border-gray-300 pb-1"><span className="text-[var(--text-muted)] text-xs">Email: </span><span>{vendedor?.correo || "zreyes@ezentyprocare.com"}</span></div>
                <div className="border-b border-gray-300 pb-1"><span className="text-[var(--text-muted)] text-xs">Printed Name: </span><span>{vendedor?.nombre || "Zugheily Reyes"}</span></div>
                <div className="border-b border-gray-300 pb-1"><span className="text-[var(--text-muted)] text-xs">Title: </span><span>{(vendedor as any)?.titulo || ""}</span></div>
                <div className="border-b border-gray-300 pb-1"><span className="text-[var(--text-muted)] text-xs">Phone: </span><span>407-844-7019</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {cotizacion.notas && (
          <div className="px-6 py-3 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-secondary)] italic">Note: {cotizacion.notas}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border)] flex items-center justify-between" style={{ background: "#F8F9FA" }}>
          <p className="text-xs text-[var(--text-muted)]">EZENTY ProCare LLC · Atlanta, GA · IICRC Certified · ezentyprocare.com</p>
          <div className="flex items-center gap-3">
            <img src="/iicrc.png" alt="IICRC Certified Firm" className="w-10 h-10 object-contain flex-shrink-0" />
            <p className="text-xs text-[var(--text-muted)]">{cotizacion.numero} · Confidential · Valid {cotizacion.validezDias || 30} Days</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PDF HTML Generator ────────────────────────────────────────────────────────
function buildPDFHTML({ cotizacion, cliente, lineas, vendedor, fechaCreacion, fechaValidez, estado }: any) {
  // Group lines by tipo (floor type)
  const grupos: Record<string, any[]> = {};
  lineas.forEach((l: any) => {
    const grupo = l.tipo?.includes("Guest") ? "Guest Services" : 
                  l.tipo?.includes("Carpet") ? "Carpet Cleaning" :
                  l.tipo?.includes("Tile") ? "Tile & Grout Cleaning" :
                  l.tipo?.includes("LVT") ? "LVT" :
                  l.tipo?.includes("Concrete") ? "Concrete" :
                  l.tipo?.includes("Upholstery") ? "Upholstery" :
                  l.tipo?.includes("Odor") ? "Odor Control" : "Other Services";
    if (!grupos[grupo]) grupos[grupo] = [];
    grupos[grupo].push(l);
  });

  let rowNum = 0;
  const rows = Object.entries(grupos).map(([grupo, items]) => {
    const groupHeader = `<tr style="background:#e8eef5"><td colspan="4" style="padding:6px 12px;font-weight:700;font-size:11px;color:#1B2A4A;text-transform:uppercase;letter-spacing:0.5px">${grupo}</td></tr>`;
    const itemRows = (items as any[]).map((l: any) => {
      rowNum++;
      const subtotal = (l.unidad === "habitacion" || l.unidad === "bano" || l.unidad === "pieza")
        ? (l.precioFinal || 0) * (l.cantidad || 1)
        : (l.precioFinal || 0);
      const isQtyItem = l.unidad === "habitacion" || l.unidad === "bano" || l.unidad === "pieza";
      const qty = isQtyItem ? (l.cantidad || 1) : 1;
      const eachLabel = isQtyItem && qty > 1
        ? `<span style="font-size:11px;color:#999;margin-left:4px">($${(l.precioFinal||0).toLocaleString("en-US",{minimumFractionDigits:2})} each)</span>`
        : "";
      return `<tr style="background:${rowNum % 2 === 0 ? "#ffffff" : "#f8f9fa"}">
        <td style="padding:7px 12px 7px 20px;text-align:center;color:#666;font-family:monospace;font-size:11px">${String(rowNum).padStart(2,"0")}</td>
        <td style="padding:7px 12px">${l.descripcion}${eachLabel}</td>
        <td style="padding:7px 12px;text-align:center;color:#555">${qty}</td>
        <td style="padding:7px 12px;text-align:right;font-weight:600;color:#1B2A4A">$${subtotal.toLocaleString("en-US",{minimumFractionDigits:2})}</td>
      </tr>`;
    }).join("");
    return groupHeader + itemRows;
  }).join("");

  const totalHTML = cotizacion.descuento > 0 ? `
    <tr><td colspan="3" style="text-align:right;padding:4px 12px;color:#666">Subtotal:</td>
      <td style="text-align:right;padding:4px 12px">$${(cotizacion.subtotal||0).toLocaleString("en-US",{minimumFractionDigits:2})}</td></tr>
    <tr><td colspan="3" style="text-align:right;padding:4px 12px;color:#c00">Descuento:</td>
      <td style="text-align:right;padding:4px 12px;color:#c00">-$${cotizacion.descuento.toLocaleString("en-US",{minimumFractionDigits:2})}</td></tr>` : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>${cotizacion.numero} — Ezenty ProCare</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333; font-size: 13px; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    @media print { 
      body { margin: 0; } 
      .no-print { display: none; }
    }
    table { width: 100%; border-collapse: collapse; }
  </style></head><body>
  <div style="max-width:800px;margin:0 auto;padding:0">
    <!-- Header -->
    <div style="background:#1B2A4A;padding:24px 32px;display:flex;justify-content:space-between;align-items:flex-start">
      <div style="display:flex;align-items:flex-start;gap:16px">
        <img src="https://crm-ezenty.vercel.app/logo.png" alt="Ezenty" style="height:70px;width:70px;object-fit:contain;background:white;border-radius:8px;padding:4px" onerror="this.style.display='none'" />
        <div>
          <div style="color:white;font-size:20px;font-weight:900;letter-spacing:1px;margin-bottom:2px">SERVICE QUOTATION</div>
          <div style="color:#90c4e8;font-size:11px">Floor, Surface &amp; Odor Care · IICRC Certified</div>
          <div style="color:#a8d0ec;font-size:10px;font-style:italic;margin-top:2px">We Protect the Surfaces That Protect Your Brand™</div>
        </div>
      </div>
      <div style="text-align:right;color:white">
        <div style="font-size:16px;font-weight:bold">${cotizacion.numero}</div>
        <div style="color:#90c4e8;font-size:12px">${fechaCreacion.toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"})}</div>
        <div style="color:#90c4e8;font-size:11px;margin-top:6px">Valid Through:</div>
        <div style="color:#FFD700;font-weight:bold">${fechaValidez.toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"})}</div>
      </div>
    </div>

    <!-- Property Info -->
    <div style="background:#FFF8E7;padding:16px 32px">
      <div style="font-size:11px;font-weight:900;color:#1B2A4A;letter-spacing:1px;margin-bottom:10px">PROPERTY INFORMATION</div>
      <table><tbody>
        <tr>
          <td style="padding:3px 0;width:50%"><span style="font-weight:700;color:#1B2A4A">Management: </span>${cliente.management||"—"}</td>
          <td style="padding:3px 0"><span style="font-weight:700;color:#1B2A4A">Property Name: </span>${cliente.nombre}</td>
        </tr>
        <tr>
          <td style="padding:3px 0"><span style="font-weight:700;color:#1B2A4A">Contact Name: </span>${(cotizacion as any).contactoPrincipal?.nombre||"—"}</td>
          <td style="padding:3px 0"><span style="font-weight:700;color:#1B2A4A">Property Address: </span>${cliente.direccionPropiedad||"—"}</td>
        </tr>
        <tr>
          <td style="padding:3px 0"><span style="font-weight:700;color:#1B2A4A">Contact Title: </span>${(cotizacion as any).contactoPrincipal?.cargo||"—"}</td>
          <td style="padding:3px 0"><span style="font-weight:700;color:#1B2A4A">City / State / ZIP: </span>${cliente.zona||"—"}</td>
        </tr>
        <tr>
          <td style="padding:3px 0"><span style="font-weight:700;color:#1B2A4A">Email: </span>${(cotizacion as any).contactoPrincipal?.correo||cliente.correo||"—"}</td>
          <td style="padding:3px 0"><span style="font-weight:700;color:#1B2A4A">Property Type: </span>${cliente.tipoPropiedad||"Hotel"}</td>
        </tr>
        <tr>
          <td style="padding:3px 0"><span style="font-weight:700;color:#1B2A4A">Phone: </span>${(cotizacion as any).contactoPrincipal?.telefono||cliente.telefono||"—"}</td>
        </tr>
      </tbody></table>
    </div>

    <!-- Services -->
    <div style="padding:16px 32px">
      <div style="font-size:11px;font-weight:900;color:#1B2A4A;letter-spacing:1px;margin-bottom:10px">SECTION 1 — QUOTED SERVICES &amp; PRICING</div>
      <table>
        <thead>
          <tr style="background:#1B2A4A">
            <th style="padding:8px 12px;text-align:center;color:white;width:40px">#</th>
            <th style="padding:8px 12px;text-align:left;color:white">Service Description</th>
            <th style="padding:8px 12px;text-align:center;color:white;width:60px">Qty</th>
            <th style="padding:8px 12px;text-align:right;color:white">Total ($)</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          ${totalHTML}
          <tr style="border-top:2px solid #1B2A4A">
            <td colspan="3" style="text-align:right;padding:8px 12px;font-weight:900;font-size:15px;color:#1B2A4A">TOTAL</td>
            <td style="text-align:right;padding:8px 12px;font-weight:900;font-size:15px;color:#1B2A4A">$${(cotizacion.total||0).toLocaleString("en-US",{minimumFractionDigits:2})}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Signatures -->
    <div style="padding:16px 32px;border-top:1px solid #ddd">
      <table><tbody><tr>
        <td style="width:50%;vertical-align:top;padding-right:24px">
          <div style="font-size:11px;font-weight:900;color:#1B2A4A;margin-bottom:10px">AUTHORIZED BY CLIENT</div>
          <div style="margin-bottom:12px"><span style="font-weight:700;color:#1B2A4A">Signature: </span><span style="border-bottom:1px solid #999;display:inline-block;width:180px">&nbsp;</span></div>
          <div style="margin-bottom:12px"><span style="font-weight:700;color:#1B2A4A">Printed Name &amp; Title: </span><span style="border-bottom:1px solid #999;display:inline-block;width:140px">&nbsp;</span></div>
          <div><span style="font-weight:700;color:#1B2A4A">Date: </span><span style="border-bottom:1px solid #999;display:inline-block;width:180px">&nbsp;</span></div>
        </td>
        <td style="width:50%;vertical-align:top">
          <div style="font-size:11px;font-weight:900;color:#1B2A4A;margin-bottom:10px">PREPARED BY: EZENTY ProCare LLC</div>
          <div style="margin-bottom:12px"><span style="font-weight:700;color:#1B2A4A">Email: </span><span style="border-bottom:1px solid #ccc;padding-bottom:2px">${vendedor?.correo||"zreyes@ezentyprocare.com"}</span></div>
          <div style="margin-bottom:12px"><span style="font-weight:700;color:#1B2A4A">Printed Name: </span><span style="border-bottom:1px solid #ccc;padding-bottom:2px">${vendedor?.nombre||"Zugheily Reyes"}</span></div>
          <div style="margin-bottom:12px"><span style="font-weight:700;color:#1B2A4A">Title: </span><span style="border-bottom:1px solid #ccc;padding-bottom:2px">${(vendedor as any)?.titulo||""}</span></div>
          <div><span style="font-weight:700;color:#1B2A4A">Phone: </span><span style="border-bottom:1px solid #ccc;padding-bottom:2px">407-844-7019</span></div>
        </td>
      </tr></tbody></table>
    </div>

    ${cotizacion.notas ? `
        <div style="padding:16px 32px 20px;border-top:1px solid #eee">
          <p style="font-size:11px;font-weight:900;color:#1B2A4A;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">Terms &amp; Conditions</p>
          ${cotizacion.notas.split("\n\n").map((para: string) => {
            const ci = para.indexOf(":");
            if (ci > 0 && ci < 20) {
              const lbl = para.slice(0, ci);
              const txt = para.slice(ci + 1).trim();
              return `<p style="font-size:11px;color:#555;margin-bottom:7px;line-height:1.5"><strong style="color:#1B2A4A">${lbl}:</strong> ${txt}</p>`;
            }
            return `<p style="font-size:11px;color:#555;margin-bottom:7px;line-height:1.5">${para}</p>`;
          }).join("")}
        </div>` : ""}

    <!-- Footer -->
    <div style="background:#f8f9fa;padding:12px 32px;border-top:1px solid #ddd;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:11px;color:#888">EZENTY ProCare LLC · Atlanta, GA · IICRC Certified · ezentyprocare.com</span>
      <div style="display:flex;align-items:center;gap:12px">
        <div style="text-align:center">
          <div style="width:44px;height:44px;border-radius:50%;border:3px solid #1B2A4A;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:7px;font-weight:900;color:#1B2A4A;line-height:1.1">
            <div>IICRC</div><div style="font-size:5px;color:#666">CERTIFIED</div><div>FIRM</div>
          </div>
        </div>
        <span style="font-size:11px;color:#888">${cotizacion.numero} · Confidential. For Client Use Only · Valid ${cotizacion.validezDias||30} Days</span>
      </div>
    </div>
  </div>
  <script>window.focus();</script>
  </body></html>`;
}
