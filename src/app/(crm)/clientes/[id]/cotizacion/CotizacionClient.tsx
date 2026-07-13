"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

// ── Default prices ────────────────────────────────────────────────────────
const PRECIOS_DEFAULT: Record<string, { precio: number; unidad: string; label: string }> = {
  "Carpet - Flat Fee/Room":       { precio: 22.00,  unidad: "flat_fee", label: "Carpet Cleaning (Flat Fee/hab)" },
  "Carpet - Sq Ft":               { precio: 0.20,   unidad: "sqft",     label: "Carpet Cleaning ($/sq ft)" },
  "Tile & Grout - Flat Fee/Bath": { precio: 20.00,  unidad: "flat_fee", label: "Tile & Grout Cleaning (Flat Fee/baño)" },
  "Tile & Grout - Sq Ft":         { precio: 0.55,   unidad: "sqft",     label: "Tile & Grout Cleaning ($/sq ft)" },
  "LVT - Sq Ft":                  { precio: 0.55,   unidad: "sqft",     label: "LVT ($/sq ft)" },
  "Concrete - Sq Ft":             { precio: 0.55,   unidad: "sqft",     label: "Concrete ($/sq ft)" },
  "Upholstery":                   { precio: 45.00,  unidad: "pieza",    label: "Upholstery ($/pieza)" },
  "Odor Control":                 { precio: 300.00, unidad: "flat_fee", label: "Odor Control" },
  "Guest Rooms":                  { precio: 22.00,  unidad: "habitacion", label: "Guest Rooms" },
  "Guest Bathrooms":              { precio: 20.00,  unidad: "bano",     label: "Guest Bathrooms" },
};

interface Linea {
  id: string; descripcion: string; tipo: string; unidad: string;
  cantidad: string; precioUnitario: string; precioFinal: string; area: string;
}

function calcSubtotal(l: Linea): number {
  const pf = parseFloat(l.precioFinal) || 0;
  const qty = parseFloat(l.cantidad) || 0;
  // flat_fee and sqft areas: precio already includes total, qty=1
  if (l.unidad === "flat_fee") return pf;
  // Guest rooms/bathrooms: cantidad × precio unitario
  if (l.unidad === "habitacion" || l.unidad === "bano" || l.unidad === "pieza") return pf * qty;
  // sqft: already calculated as total
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

export function CotizacionClient({ cliente, medidas, cotizacionesPrevias, contactos }: {
  cliente: any; medidas: any[]; cotizacionesPrevias: any[]; contactos: any[]; vendedorId: string;
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
  const [cotizacionViendo, setCotizacionViendo] = useState<string | null>(null);
  const [detalleCot, setDetalleCot] = useState<{cot: any, lineas: any[]} | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [mostrarPrecios, setMostrarPrecios] = useState(false);
  // Contact selection
  const contactoPrincipal = contactos?.find((c: any) => c.esPrincipal) || contactos?.[0];
  const [contactoSeleccionadoId, setContactoSeleccionadoId] = useState<string>(contactoPrincipal?.id || "");
  const [editandoContacto, setEditandoContacto] = useState(false);
  const [contactoEditado, setContactoEditado] = useState<any>(null);
  const [precios, setPrecios] = useState(
    Object.fromEntries(Object.entries(PRECIOS_DEFAULT).map(([k, v]) => [k, String(v.precio)]))
  );

  const subtotal = lineas.reduce((s, l) => s + calcSubtotal(l), 0);
  const descuentoVal = parseFloat(descuento) || 0;
  const total = subtotal - descuentoVal;

  // Drag-to-reorder state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  function handleDragStart(index: number) { dragItem.current = index; }
  function handleDragEnter(index: number) { dragOverItem.current = index; }
  function handleDragEnd() {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const copy = [...lineas];
    const dragged = copy.splice(dragItem.current, 1)[0];
    copy.splice(dragOverItem.current, 0, dragged);
    setLineas(copy);
    dragItem.current = null;
    dragOverItem.current = null;
  }

  // Touch drag support
  const touchStartY = useRef<number>(0);
  const touchDragIndex = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent, index: number) {
    touchStartY.current = e.touches[0].clientY;
    touchDragIndex.current = index;
    dragItem.current = index;
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (touchDragIndex.current === null) return;
    const el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
    const row = el?.closest("[data-linea-index]");
    if (row) {
      const idx = parseInt(row.getAttribute("data-linea-index") || "-1");
      if (idx >= 0 && idx !== dragItem.current) dragOverItem.current = idx;
    }
  }
  function handleTouchEnd() { handleDragEnd(); touchDragIndex.current = null; }

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

  // Load cotizacion detail when selected
  useEffect(() => {
    if (!cotizacionViendo) { setDetalleCot(null); return; }
    setLoadingDetalle(true);
    fetch(`/api/clientes/${cliente.id}/cotizaciones/${cotizacionViendo}`)
      .then(r => r.json())
      .then(d => setDetalleCot({ cot: d.cotizacion, lineas: d.lineas || [] }))
      .catch(() => setDetalleCot(null))
      .finally(() => setLoadingDetalle(false));
  }, [cotizacionViendo, cliente.id]);

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
        const precioPorSqFt = parseFloat(precios[tipo] || String(PRECIOS_DEFAULT[tipo]?.precio || 0));
        const totalArea = precioPorSqFt * area.subtotalSqFt;
        nuevas.push({
          id: crypto.randomUUID(),
          descripcion: area.area,
          tipo, unidad: "flat_fee",
          cantidad: "1",
          precioUnitario: totalArea.toFixed(2),
          precioFinal: totalArea.toFixed(2),
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
      // Get effective contact data (edited or original)
      const contactoSeleccionado = contactos?.find((c: any) => c.id === contactoSeleccionadoId);
      const contactoFinal = (editandoContacto && contactoEditado) ? contactoEditado : contactoSeleccionado;

      const res = await fetch(`/api/clientes/${cliente.id}/cotizaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactoNombre: contactoFinal?.nombre || null,
          contactoPuesto: contactoFinal?.puesto || contactoFinal?.cargo || null,
          contactoCorreo: contactoFinal?.correo || null,
          contactoTelefono: contactoFinal?.telefono || null,
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

      {/* Contact selector */}
      {contactos && contactos.length > 0 && (
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">👤 Dirigir cotización a</h2>
          <div className="space-y-2">
            {contactos.map((c: any) => {
              const seleccionado = contactoSeleccionadoId === c.id;
              const datos = (editandoContacto && seleccionado && contactoEditado) ? contactoEditado : c;
              return (
                <div key={c.id}
                  onClick={() => { setContactoSeleccionadoId(c.id); setEditandoContacto(false); setContactoEditado(null); }}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${seleccionado ? "border-marca-300 bg-marca-50/30 dark:bg-marca-900/10" : "border-[var(--border)] hover:border-marca-200"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {(editandoContacto && seleccionado) ? (
                        <div className="space-y-2" onClick={e => e.stopPropagation()}>
                          <input className="input text-sm !py-1.5 font-semibold" value={contactoEditado?.nombre || ""} placeholder="Nombre"
                            onChange={e => setContactoEditado((p: any) => ({ ...p, nombre: e.target.value }))} />
                          <input className="input text-sm !py-1.5" value={contactoEditado?.cargo || contactoEditado?.puesto || ""} placeholder="Título / Cargo"
                            onChange={e => setContactoEditado((p: any) => ({ ...p, cargo: e.target.value, puesto: e.target.value }))} />
                          <input className="input text-sm !py-1.5" value={contactoEditado?.correo || ""} placeholder="Email"
                            onChange={e => setContactoEditado((p: any) => ({ ...p, correo: e.target.value }))} />
                          <input className="input text-sm !py-1.5" value={contactoEditado?.telefono || ""} placeholder="Teléfono"
                            onChange={e => setContactoEditado((p: any) => ({ ...p, telefono: e.target.value }))} />
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => setEditandoContacto(false)}
                              className="flex-1 py-1.5 rounded-lg bg-marca-300 text-white text-xs font-semibold">✓ Listo</button>
                            <button onClick={() => { setEditandoContacto(false); setContactoEditado(null); }}
                              className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-600 text-xs">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{datos.nombre}</p>
                          {(datos.cargo || datos.puesto) && <p className="text-xs text-[var(--text-muted)]">{datos.cargo || datos.puesto}</p>}
                          {datos.correo && <p className="text-xs text-[var(--text-secondary)]">{datos.correo}</p>}
                          {datos.telefono && <p className="text-xs text-[var(--text-secondary)]">{datos.telefono}</p>}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {c.principal && <span className="text-xs bg-marca-100 text-marca-600 px-1.5 py-0.5 rounded">Principal</span>}
                      {seleccionado && !editandoContacto && (
                        <button onClick={e => { e.stopPropagation(); setContactoEditado({ ...c }); setEditandoContacto(true); }}
                          className="text-xs text-marca-500 hover:underline">Editar</button>
                      )}
                      {seleccionado && <span className="text-marca-500">✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  <button key={q.id} onClick={() => setCotizacionViendo(q.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-[var(--bg-secondary)] transition-colors text-left">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{q.numero}</p>
                      <p className="text-xs text-[var(--text-muted)]">{new Date(q.creadoEn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <span className={`badge text-xs ${cfg.cls}`}>{cfg.label}</span>
                    <p className="text-sm font-bold text-[var(--text-primary)]">${(q.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                    <span className="text-xs text-marca-500">Ver →</span>
                  </button>
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
          {lineas.map((l, idx) => {
            const sub = calcSubtotal(l);
            const editado = parseFloat(l.precioFinal) !== parseFloat(l.precioUnitario);
            return (
              <div key={l.id} data-linea-index={idx}
                className="p-3 grid grid-cols-12 gap-2 items-start transition-opacity"
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
                onDragOver={e => e.preventDefault()}>
                {/* Drag handle */}
                <div className="col-span-1 flex items-center justify-center pt-2 cursor-grab active:cursor-grabbing touch-none"
                  onTouchStart={e => handleTouchStart(e, idx)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}>
                  <GripVertical className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
                <div className="col-span-11 sm:col-span-3 space-y-1">
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
                      {l.unidad === "sqft" ? "ft²" : l.unidad === "pieza" ? "pza" : l.unidad === "habitacion" ? "hab" : l.unidad === "bano" ? "baños" : l.unidad === "flat_fee" ? "" : "—"}
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

                <div className="col-span-11 sm:col-span-1 text-right pt-1 col-start-2 sm:col-start-auto">
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

      {/* Cotizacion detail modal */}
      {cotizacionViendo && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setCotizacionViendo(null)}>
          <div className="w-full max-w-2xl my-4" onClick={e => e.stopPropagation()}>
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                <h3 className="font-semibold text-[var(--text-primary)]">
                  {detalleCot?.cot?.numero || cotizacionViendo}
                </h3>
                <button onClick={() => setCotizacionViendo(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg">✕</button>
              </div>
              {loadingDetalle ? (
                <div className="p-8 text-center text-sm text-[var(--text-muted)]">Cargando…</div>
              ) : detalleCot ? (
                <div>
                  {/* Summary */}
                  <div className="px-5 py-3 bg-[var(--bg-secondary)] flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(detalleCot.cot.creadoEn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {detalleCot.cot.validezDias ? ` · Válida ${detalleCot.cot.validezDias} días` : ""}
                    </span>
                    <span className={`badge text-xs ${ESTADO_CONFIG[detalleCot.cot.estado]?.cls || ""}`}>
                      {ESTADO_CONFIG[detalleCot.cot.estado]?.label}
                    </span>
                  </div>
                  {/* Lines */}
                  <div className="px-5 py-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)]">
                          <th className="text-left pb-2 text-xs text-[var(--text-muted)] font-medium">#</th>
                          <th className="text-left pb-2 text-xs text-[var(--text-muted)] font-medium">Descripción</th>
                          <th className="text-right pb-2 text-xs text-[var(--text-muted)] font-medium">Precio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {detalleCot.lineas.map((l: any, i: number) => {
                          const sub = (l.unidad === "habitacion" || l.unidad === "bano" || l.unidad === "pieza")
                            ? (l.precioFinal || 0) * (l.cantidad || 1)
                            : (l.precioFinal || 0);
                          return (
                            <tr key={l.id}>
                              <td className="py-2 text-xs text-[var(--text-muted)] font-mono">{String(i+1).padStart(2,"0")}</td>
                              <td className="py-2 text-[var(--text-primary)]">{l.descripcion}</td>
                              <td className="py-2 text-right font-semibold text-[var(--text-primary)]">
                                ${sub.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Total */}
                  <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">TOTAL</span>
                    <span className="text-lg font-bold text-emerald-600">
                      ${(detalleCot.cot.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {detalleCot.cot.notas && (
                    <div className="px-5 py-2 border-t border-[var(--border)]">
                      <p className="text-xs text-[var(--text-muted)] italic">{detalleCot.cot.notas}</p>
                    </div>
                  )}
                  {/* Actions */}
                  <div className="px-5 py-3 border-t border-[var(--border)] flex gap-2">
                    <Link href={`/clientes/${cliente.id}/cotizacion/${cotizacionViendo}`}
                      className="btn-primary !py-2 text-sm flex-1 justify-center">
                      Ver detalle completo / PDF
                    </Link>
                    <button onClick={() => setCotizacionViendo(null)} className="btn-secondary !py-2 !px-4">
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-[var(--text-muted)]">No se pudo cargar la cotización</div>
              )}
            </div>
          </div>
        </div>
      )}

      <button onClick={guardar} disabled={saving} className="btn-primary w-full justify-center text-base py-4">
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {saving ? "Guardando…" : `Guardar cotización — $${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
      </button>
    </div>
  );
}
