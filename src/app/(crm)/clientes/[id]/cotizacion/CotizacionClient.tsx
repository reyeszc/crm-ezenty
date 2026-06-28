"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

// ── Default prices ────────────────────────────────────────────────────────
const PRECIOS_DEFAULT: Record<string, { precio: number; unidad: string; label: string }> = {
  "Carpet - Flat Fee/Room":       { precio: 22.00,  unidad: "flat_fee", label: "Carpet (Flat Fee/hab)" },
  "Carpet - Sq Ft":               { precio: 0.20,   unidad: "sqft",     label: "Carpet ($/sq ft)" },
  "Tile & Grout - Flat Fee/Bath": { precio: 20.00,  unidad: "flat_fee", label: "Tile & Grout (Flat Fee/baño)" },
  "Tile & Grout - Sq Ft":         { precio: 0.55,   unidad: "sqft",     label: "Tile & Grout ($/sq ft)" },
  "LVT - Sq Ft":                  { precio: 0.55,   unidad: "sqft",     label: "LVT ($/sq ft)" },
  "Concrete - Sq Ft":             { precio: 0.55,   unidad: "sqft",     label: "Concrete ($/sq ft)" },
  "Upholstery":                   { precio: 45.00,  unidad: "pieza",    label: "Upholstery ($/pieza)" },
  "Odor Control":                 { precio: 300.00, unidad: "flat_fee", label: "Odor Control" },
  "Guest Rooms":                  { precio: 22.00,  unidad: "habitacion", label: "Guest Rooms ($/habitación)" },
  "Guest Bathrooms":              { precio: 20.00,  unidad: "bano",     label: "Guest Bathrooms ($/baño)" },
};

interface Linea {
  id: string; descripcion: string; tipo: string; unidad: string;
  cantidad: string; precioUnitario: string; precioFinal: string; area: string;
}

function calcSubtotal(l: Linea): number {
  const pf = parseFloat(l.precioFinal) || 0;
  const qty = parseFloat(l.cantidad) || 0;
  if (l.unidad === "flat_fee") return pf;
  return pf * qty;
}

function newLinea(tipo?: string, area?: string, cantidad?: number): Linea {
  const preset = tipo ? PRECIOS_DEFAULT[tipo] : null;
  return {
    id: crypto.randomUUID(),
    descripcion: preset?.label || tipo || "",
    tipo: tipo || "Carpet - Flat Fee/Room",
    unidad: preset?.unidad || "flat_fee",
    cantidad: cantidad ? String(cantidad) : "1",
    precioUnitario: preset ? String(preset.precio) : "0",
    precioFinal: preset ? String(preset.precio) : "0",
    area: area || "",
  };
}

const ESTADO_CONFIG: Record<string, { label: string; cls: string }> = {
  BORRADOR:  { label: "Borrador",  cls: "bg-gray-100 text-gray-600" },
  ENVIADA:   { label: "Enviada",   cls: "bg-blue-100 text-blue-700" },
  APROBADA:  { label: "Aprobada",  cls: "bg-green-100 text-green-700" },
  RECHAZADA: { label: "Rechazada", cls: "bg-red-100 text-red-600" },
};

export function CotizacionClient({ cliente, medidas, cotizacionesPrevias }: {
  cliente: any; medidas: any[]; cotizacionesPrevias: any[]; vendedorId: string;
}) {
  const { success, error } = useToast();
  const [lineas, setLineas] = useState<Linea[]>([
    newLinea("Guest Rooms"),
    newLinea("Guest Bathrooms"),
  ]);
  const [medidaSeleccionada, setMedidaSeleccionada] = useState("");
  const [areasSeleccionadas, setAreasSeleccionadas] = useState<Set<string>>(new Set());
  const [mostrarAreas, setMostrarAreas] = useState(false);
  const [descuento, setDescuento] = useState("0");
  const [notas, setNotas] = useState("");
  const [validez, setValidez] = useState("30");
  const [saving, setSaving] = useState(false);
  const [mostrarPrevias, setMostrarPrevias] = useState(true);
  const [mostrarPrecios, setMostrarPrecios] = useState(false);
  const [precios, setPrecios] = useState(
    Object.fromEntries(Object.entries(PRECIOS_DEFAULT).map(([k, v]) => [k, String(v.precio)]))
  );

  const subtotal = lineas.reduce((s, l) => s + calcSubtotal(l), 0);
  const descuentoVal = parseFloat(descuento) || 0;
  const total = subtotal - descuentoVal;

  const addLinea = () => setLineas(p => [...p, newLinea()]);
  const removeLinea = (id: string) => setLineas(p => p.filter(l => l.id !== id));
  const updateLinea = (id: string, patch: Partial<Linea>) =>
    setLineas(p => p.map(l => l.id === id ? { ...l, ...patch } : l));

  function handleTipoChange(id: string, tipo: string) {
    const preset = PRECIOS_DEFAULT[tipo];
    const precioActual = precios[tipo] || String(preset?.precio || 0);
    updateLinea(id, {
      tipo, descripcion: preset?.label || tipo,
      unidad: preset?.unidad || "flat_fee",
      precioUnitario: precioActual, precioFinal: precioActual,
    });
  }

  // When medida changes, show its areas for selection
  const medidaActual = medidas.find(m => m.id === medidaSeleccionada);

  function toggleArea(areaId: string) {
    setAreasSeleccionadas(prev => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  }

  function cargarAreasSeleccionadas() {
    if (!medidaActual) return;
    const areas = medidaActual.areas.filter((a: any) =>
      areasSeleccionadas.size === 0 || areasSeleccionadas.has(a.id)
    );
    const nuevas: Linea[] = [];
    areas.forEach((area: any) => {
      if (area.flatFee > 0) {
        const tipo = area.esTipoBano ? "Tile & Grout - Flat Fee/Bath" : "Carpet - Flat Fee/Room";
        nuevas.push({
          id: crypto.randomUUID(),
          descripcion: `${area.area} — ${PRECIOS_DEFAULT[tipo]?.label || tipo}`,
          tipo, unidad: "flat_fee", cantidad: "1",
          precioUnitario: precios[tipo] || String(PRECIOS_DEFAULT[tipo]?.precio || 0),
          precioFinal: precios[tipo] || String(PRECIOS_DEFAULT[tipo]?.precio || 0),
          area: area.area,
        });
      }
      if (area.subtotalSqFt > 0) {
        const floorType = area.tipoPiso || "Carpet";
        let tipo = "Carpet - Sq Ft";
        if (floorType === "Tile") tipo = "Tile & Grout - Sq Ft";
        else if (floorType === "LVT") tipo = "LVT - Sq Ft";
        else if (floorType === "Concrete") tipo = "Concrete - Sq Ft";
        nuevas.push({
          id: crypto.randomUUID(),
          descripcion: `${area.area} — ${floorType} (${area.subtotalSqFt.toFixed(0)} sq ft)`,
          tipo, unidad: "sqft",
          cantidad: String(area.subtotalSqFt.toFixed(0)),
          precioUnitario: precios[tipo] || String(PRECIOS_DEFAULT[tipo]?.precio || 0),
          precioFinal: precios[tipo] || String(PRECIOS_DEFAULT[tipo]?.precio || 0),
          area: area.area,
        });
      }
    });
    if (nuevas.length > 0) {
      // Keep the Guest Rooms/Bathrooms lines and add area lines
      const guestLines = lineas.filter(l => l.tipo === "Guest Rooms" || l.tipo === "Guest Bathrooms");
      setLineas([...guestLines, ...nuevas]);
      setMostrarAreas(false);
      success(`${nuevas.length} líneas cargadas ✓`);
    } else {
      error("Las áreas seleccionadas no tienen datos suficientes");
    }
  }

  async function guardar() {
    if (lineas.length === 0) { error("Agrega al menos una línea"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/clientes/${cliente.id}/cotizaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineas: lineas.map((l, i) => ({
            descripcion: l.descripcion, tipo: l.tipo, unidad: l.unidad,
            cantidad: parseFloat(l.cantidad) || 0,
            precioUnitario: parseFloat(l.precioUnitario) || 0,
            precioFinal: parseFloat(l.precioFinal) || 0,
            subtotal: calcSubtotal(l), area: l.area, orden: i,
          })),
          subtotal, descuento: descuentoVal, total,
          notas, validezDias: parseInt(validez) || 30,
          medidaId: medidaSeleccionada || null,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      success(`Cotización ${data.numero} creada ✓`);
      window.location.reload();
    } catch { error("No se pudo guardar"); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 lg:pb-6">
      <Link href={`/clientes/${cliente.id}`} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4">
        <ArrowLeft className="w-4 h-4" /> {cliente.nombre}
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Nueva cotización</h1>
          <p className="text-sm text-[var(--text-secondary)]">{cliente.nombre}{cliente.cantidadHabitaciones ? ` · ${cliente.cantidadHabitaciones} rooms` : ""}</p>
        </div>
      </div>

      {/* Previous quotes */}
      {cotizacionesPrevias.length > 0 && (
        <div className="card mb-4 overflow-hidden">
          <button onClick={() => setMostrarPrevias(!mostrarPrevias)}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-secondary)] transition-colors">
            <span className="text-sm font-semibold text-[var(--text-primary)]">Cotizaciones anteriores ({cotizacionesPrevias.length})</span>
            {mostrarPrevias ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
          </button>
          {mostrarPrevias && (
            <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
              {cotizacionesPrevias.map((q: any) => {
                const cfg = ESTADO_CONFIG[q.estado] || ESTADO_CONFIG.BORRADOR;
                return (
                  <div key={q.id} className="flex items-center gap-3 p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{q.numero}</p>
                      <p className="text-xs text-[var(--text-muted)]">{new Date(q.creadoEn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <span className={`badge text-xs ${cfg.cls}`}>{cfg.label}</span>
                    <p className="text-sm font-bold">${(q.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Load from medidas with area selection */}
      {medidas.length > 0 && (
        <div className="card p-4 mb-4">
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">📐 Cargar desde medidas</p>
          <div className="flex gap-2 mb-3">
            <select className="input text-sm flex-1" value={medidaSeleccionada}
              onChange={e => { setMedidaSeleccionada(e.target.value); setAreasSeleccionadas(new Set()); setMostrarAreas(true); }}>
              <option value="">Seleccionar medida…</option>
              {medidas.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {new Date(m.fecha).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {(m.sqFtTotal || 0).toFixed(0)} sq ft · {m.areas?.length || 0} áreas
                </option>
              ))}
            </select>
          </div>

          {/* Area selector */}
          {medidaActual && mostrarAreas && (
            <div className="bg-[var(--bg-secondary)] rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[var(--text-primary)]">Selecciona las áreas a cotizar:</p>
                <button onClick={() => {
                  if (areasSeleccionadas.size === medidaActual.areas.length) setAreasSeleccionadas(new Set());
                  else setAreasSeleccionadas(new Set(medidaActual.areas.map((a: any) => a.id)));
                }} className="text-xs text-marca-500 hover:underline">
                  {areasSeleccionadas.size === medidaActual.areas.length ? "Deseleccionar todas" : "Seleccionar todas"}
                </button>
              </div>
              <div className="space-y-1.5">
                {medidaActual.areas.map((area: any) => (
                  <label key={area.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
                    <input type="checkbox"
                      checked={areasSeleccionadas.has(area.id)}
                      onChange={() => toggleArea(area.id)}
                      className="rounded" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-[var(--text-primary)] font-medium">{area.area}</span>
                      <span className="text-xs text-[var(--text-muted)] ml-2">
                        {area.tipoPiso}
                        {area.subtotalSqFt > 0 ? ` · ${area.subtotalSqFt.toFixed(0)} sq ft` : ""}
                        {area.flatFee > 0 ? ` · $${area.flatFee} flat` : ""}
                        {area.esTipoHabitacion ? " 🛏️" : area.esTipoBano ? " 🚿" : ""}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
              <button onClick={cargarAreasSeleccionadas} disabled={areasSeleccionadas.size === 0 && medidaActual.areas.length > 0}
                className="btn-primary w-full justify-center mt-3 text-sm disabled:opacity-40">
                Cargar {areasSeleccionadas.size > 0 ? `${areasSeleccionadas.size} área(s) seleccionada(s)` : "todas las áreas"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Default prices config */}
      <div className="card mb-4 overflow-hidden">
        <button onClick={() => setMostrarPrecios(!mostrarPrecios)}
          className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-secondary)] transition-colors">
          <span className="text-sm font-semibold text-[var(--text-primary)]">⚙️ Precios por defecto</span>
          {mostrarPrecios ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
        </button>
        {mostrarPrecios && (
          <div className="border-t border-[var(--border)] p-4 grid grid-cols-2 gap-3">
            {Object.entries(PRECIOS_DEFAULT).map(([key, def]) => (
              <div key={key}>
                <label className="label text-xs">{def.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">$</span>
                  <input type="number" className="input text-sm pl-6" value={precios[key]}
                    onChange={e => setPrecios(p => ({ ...p, [key]: e.target.value }))}
                    step="0.01" min="0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quote lines */}
      <div className="card mb-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Líneas de la cotización</h2>
          <button onClick={addLinea} className="btn-secondary !py-1.5 !px-3 text-xs">
            <Plus className="w-3.5 h-3.5" /> Agregar línea
          </button>
        </div>

        <div className="hidden sm:grid grid-cols-12 gap-1 px-4 py-2 bg-[var(--bg-secondary)] text-xs font-medium text-[var(--text-muted)] border-b border-[var(--border)]">
          <div className="col-span-4">Descripción / Servicio</div>
          <div className="col-span-2 text-center">Cantidad</div>
          <div className="col-span-2 text-center">Precio base</div>
          <div className="col-span-2 text-center">Precio final ✏️</div>
          <div className="col-span-1 text-right">Subtotal</div>
          <div className="col-span-1" />
        </div>

        <div className="divide-y divide-[var(--border)]">
          {lineas.map((l) => {
            const sub = calcSubtotal(l);
            const editado = parseFloat(l.precioFinal) !== parseFloat(l.precioUnitario);
            return (
              <div key={l.id} className="p-3 grid grid-cols-12 gap-2 items-start">
                <div className="col-span-12 sm:col-span-4 space-y-1">
                  <select className="input text-xs !py-1" value={l.tipo}
                    onChange={e => handleTipoChange(l.id, e.target.value)}>
                    {Object.keys(PRECIOS_DEFAULT).map(k => <option key={k} value={k}>{PRECIOS_DEFAULT[k].label}</option>)}
                    <option value="Custom">Personalizado</option>
                  </select>
                  <input className="input text-xs !py-1" value={l.descripcion}
                    onChange={e => updateLinea(l.id, { descripcion: e.target.value })}
                    placeholder="Descripción detallada…" />
                  {l.area && <p className="text-xs text-[var(--text-muted)]">📐 {l.area}</p>}
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <label className="label text-xs sm:hidden">Cantidad</label>
                  <div className="flex items-center gap-1">
                    <input type="number" className="input text-sm !py-1.5 text-center" value={l.cantidad}
                      onChange={e => updateLinea(l.id, { cantidad: e.target.value })}
                      min="0" step="1"
                      disabled={l.unidad === "flat_fee"} />
                    <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                      {l.unidad === "sqft" ? "ft²" : l.unidad === "pieza" ? "pza" : l.unidad === "habitacion" ? "hab" : l.unidad === "bano" ? "baño" : "—"}
                    </span>
                  </div>
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <label className="label text-xs sm:hidden">Precio base</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">$</span>
                    <input type="number" className="input text-sm !py-1.5 pl-5 text-center" value={l.precioUnitario}
                      onChange={e => updateLinea(l.id, { precioUnitario: e.target.value, precioFinal: e.target.value })}
                      min="0" step="0.01" />
                  </div>
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <label className="label text-xs sm:hidden">Precio final ✏️</label>
                  <div className="relative">
                    <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-xs ${editado ? "text-emerald-500" : "text-[var(--text-muted)]"}`}>$</span>
                    <input type="number"
                      className={`input text-sm !py-1.5 pl-5 text-center font-semibold ${editado ? "border-emerald-400 text-emerald-600 dark:text-emerald-400" : ""}`}
                      value={l.precioFinal}
                      onChange={e => updateLinea(l.id, { precioFinal: e.target.value })}
                      min="0" step="0.01" />
                  </div>
                  {editado && <p className="text-xs text-emerald-500 text-center">Editado</p>}
                </div>

                <div className="col-span-11 sm:col-span-1 text-right pt-1">
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    ${sub.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="col-span-1 flex justify-end pt-1">
                  <button onClick={() => removeLinea(l.id)} className="text-red-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="border-t border-[var(--border)] p-4 space-y-2 bg-[var(--bg-secondary)]">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Subtotal</span>
            <span className="font-medium">${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Descuento ($)</span>
            <div className="relative w-32">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">$</span>
              <input type="number" className="input text-sm !py-1 pl-5 text-right" value={descuento}
                onChange={e => setDescuento(e.target.value)} min="0" step="0.01" />
            </div>
          </div>
          <div className="flex justify-between text-lg font-bold border-t border-[var(--border)] pt-2">
            <span>TOTAL</span>
            <span className="text-emerald-600">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Notes & validity */}
      <div className="card p-4 mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="label text-sm">Validez (días)</label>
          <input type="number" className="input" value={validez} onChange={e => setValidez(e.target.value)} min="1" />
        </div>
        <div className="col-span-2">
          <label className="label text-sm">Notas / condiciones</label>
          <textarea className="input resize-none" rows={3} value={notas} onChange={e => setNotas(e.target.value)}
            placeholder="Materiales, tiempos de entrega, condiciones de pago…" />
        </div>
      </div>

      <button onClick={guardar} disabled={saving} className="btn-primary w-full justify-center text-base py-4">
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {saving ? "Guardando…" : `Guardar cotización — $${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
      </button>
    </div>
  );
}
