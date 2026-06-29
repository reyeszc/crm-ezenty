"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Ruler, Save, Loader2, ChevronDown, ChevronUp, Camera, DollarSign } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

const TIPOS_PISO = ["Carpet", "Tile", "LVT", "Concrete", "Pavers", "Hardwood", "Other"];

interface Linea { id: string; descripcion: string; ancho: string; largo: string; }
interface Area {
  id: string;
  nombre: string;
  tipoPiso: string;
  flatFee: string;
  lineas: Linea[];
  abierta: boolean;
  fotoUrl?: string;
  // Habitacion extras
  esTipoHabitacion?: boolean;
  tieneSala?: boolean; tipoSala?: string;
  habitacionesAdicionales?: string; tipoPisoHab?: string;
  tieneKitchenette?: boolean; tipoPisoKitchen?: string;
  // Baño extras
  esTipoBano?: boolean;
  incluyeEntrada?: boolean;
}

function calcSqFt(ancho: string, largo: string) {
  return (parseFloat(ancho) || 0) * (parseFloat(largo) || 0);
}
function subtotalArea(area: Area) {
  return area.lineas.reduce((s, l) => s + calcSqFt(l.ancho, l.largo), 0);
}
function newLinea(): Linea {
  return { id: crypto.randomUUID(), descripcion: "", ancho: "", largo: "" };
}
function newArea(tipo?: "habitacion" | "bano"): Area {
  return {
    id: crypto.randomUUID(), nombre: tipo === "habitacion" ? "Room" : tipo === "bano" ? "Bathroom" : "",
    tipoPiso: "Carpet", flatFee: "", lineas: [newLinea()], abierta: true,
    esTipoHabitacion: tipo === "habitacion", esTipoBano: tipo === "bano",
    tieneSala: false, tipoSala: "Carpet", habitacionesAdicionales: "0",
    tipoPisoHab: "Carpet", tieneKitchenette: false, tipoPisoKitchen: "Tile",
    incluyeEntrada: false,
  };
}

export function MedidasClient({ clienteId, clienteNombre }: { clienteId: string; clienteNombre: string }) {
  const [areas, setAreas] = useState<Area[]>([newArea()]);
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [uploadingFoto, setUploadingFoto] = useState<string | null>(null);
  const { success, error } = useToast();

  const totalSqFt = areas.reduce((s, a) => s + subtotalArea(a), 0);
  const totalFlatFee = areas.reduce((s, a) => s + (parseFloat(a.flatFee) || 0), 0);

  const cargarHistorial = useCallback(async () => {
    try {
      const res = await fetch(`/api/clientes/${clienteId}/medidas`);
      const data = await res.json();
      setHistorial(data.medidas || []);
    } finally { setLoadingHistorial(false); }
  }, [clienteId]);

  useEffect(() => { cargarHistorial(); }, [cargarHistorial]);

  // Area mutations
  const updateArea = (id: string, patch: Partial<Area>) =>
    setAreas(p => p.map(a => a.id === id ? { ...a, ...patch } : a));
  const removeArea = (id: string) => setAreas(p => p.filter(a => a.id !== id));
  const toggleArea = (id: string) => updateArea(id, { abierta: !areas.find(a => a.id === id)?.abierta });

  // Line mutations
  const addLinea = (areaId: string) =>
    setAreas(p => p.map(a => a.id === areaId ? { ...a, lineas: [...a.lineas, newLinea()] } : a));
  const removeLinea = (areaId: string, lineaId: string) =>
    setAreas(p => p.map(a => a.id === areaId ? { ...a, lineas: a.lineas.filter(l => l.id !== lineaId) } : a));
  const updateLinea = (areaId: string, lineaId: string, patch: Partial<Linea>) =>
    setAreas(p => p.map(a => a.id === areaId ? { ...a, lineas: a.lineas.map(l => l.id === lineaId ? { ...l, ...patch } : l) } : a));

  // Photo upload
  async function subirFoto(areaId: string, file: File) {
    setUploadingFoto(areaId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("areaId", areaId);
      const res = await fetch("/api/upload/foto", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      updateArea(areaId, { fotoUrl: data.url });
      success("Foto subida ✓");
    } catch { error("No se pudo subir la foto. Configura Cloudinary primero."); }
    finally { setUploadingFoto(null); }
  }

  async function guardar() {
    if (!areas.some(a => a.nombre.trim())) { error("Agrega al menos un área con nombre"); return; }
    setSaving(true);
    try {
      const payload = {
        notas, sqFtTotal: totalSqFt, flatFeeTotal: totalFlatFee,
        areas: areas.filter(a => a.nombre.trim()).map(a => ({
          area: a.nombre, tipoPiso: a.tipoPiso, flatFee: parseFloat(a.flatFee) || 0,
          subtotalSqFt: subtotalArea(a), fotoUrl: a.fotoUrl || null,
          esTipoHabitacion: a.esTipoHabitacion || false,
          esTipoBano: a.esTipoBano || false,
          extras: a.esTipoHabitacion ? {
            tieneSala: a.tieneSala, tipoSala: a.tipoSala,
            habitacionesAdicionales: parseInt(a.habitacionesAdicionales || "0"),
            tipoPisoHab: a.tipoPisoHab,
            tieneKitchenette: a.tieneKitchenette, tipoPisoKitchen: a.tipoPisoKitchen,
          } : a.esTipoBano ? {
            incluyeEntrada: a.incluyeEntrada,
          } : null,
          lineas: a.lineas.filter(l => parseFloat(l.ancho) > 0 && parseFloat(l.largo) > 0).map(l => ({
            descripcion: l.descripcion, ancho: parseFloat(l.ancho),
            largo: parseFloat(l.largo), sqFt: calcSqFt(l.ancho, l.largo),
          })),
        })),
      };
      const res = await fetch(`/api/clientes/${clienteId}/medidas`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      success("Medidas guardadas ✓");
      setAreas([newArea()]); setNotas("");
      cargarHistorial();
    } catch { error("No se pudieron guardar las medidas"); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-6">
      <Link href={`/clientes/${clienteId}`} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4">
        <ArrowLeft className="w-4 h-4" /> {clienteNombre}
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <Ruler className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Tomar medidas</h1>
          <p className="text-sm text-[var(--text-secondary)]">{clienteNombre}</p>
        </div>
      </div>

      {/* Totals banner */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card p-3 flex items-center gap-2" style={{ background: "linear-gradient(135deg, #7cc2e8, #2b93c5)" }}>
          <Ruler className="w-4 h-4 text-white flex-shrink-0" />
          <div>
            <p className="text-xs text-white/80">Total Sq Ft</p>
            <p className="text-lg font-bold text-white">{totalSqFt.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className="card p-3 flex items-center gap-2" style={{ background: "linear-gradient(135deg, #6DC531, #5aab28)" }}>
          <DollarSign className="w-4 h-4 text-white flex-shrink-0" />
          <div>
            <p className="text-xs text-white/80">Total Flat Fee</p>
            <p className="text-lg font-bold text-white">${totalFlatFee.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Areas */}
      <div className="space-y-3 mb-3">
        {areas.map((area, aIdx) => (
          <div key={area.id} className="card overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 p-3 bg-[var(--bg-secondary)]">
              <button type="button" onClick={() => toggleArea(area.id)} className="text-[var(--text-muted)] flex-shrink-0">
                {area.abierta ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <input
                className="flex-1 bg-transparent text-sm font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                value={area.nombre}
                onChange={e => updateArea(area.id, { nombre: e.target.value })}
                placeholder={`Área ${aIdx + 1} — ej: Lobby, Room 101`}
              />
              {area.esTipoHabitacion && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex-shrink-0">🛏️ Room</span>}
              {area.esTipoBano && <span className="text-xs bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded flex-shrink-0">🚿 Bath</span>}
              <span className="text-xs font-semibold text-marca-500 flex-shrink-0">
                {subtotalArea(area) > 0 ? `${subtotalArea(area).toFixed(0)} sqft` : ""}
                {area.flatFee ? ` · $${area.flatFee}` : ""}
              </span>
              {areas.length > 1 && (
                <button type="button" onClick={() => removeArea(area.id)} className="text-red-400 hover:text-red-500 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {area.abierta && (
              <div className="p-3 space-y-3">
                {/* Area name */}
                <div>
                  <label className="label text-xs">Nombre del área *</label>
                  <input
                    className="input text-sm font-medium"
                    value={area.nombre}
                    onChange={e => updateArea(area.id, { nombre: e.target.value })}
                    placeholder={area.esTipoHabitacion ? "ej: Room 101, Suite 205…" : area.esTipoBano ? "ej: Bathroom Floor 1, Master Bath…" : "ej: Lobby, Corredor Piso 1, Sala de Eventos…"}
                    autoFocus={!area.nombre}
                  />
                </div>
                {/* Floor type + Flat Fee */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-xs">Tipo de piso</label>
                    <select className="input text-sm !py-1.5" value={area.tipoPiso}
                      onChange={e => updateArea(area.id, { tipoPiso: e.target.value })}>
                      {TIPOS_PISO.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Flat Fee ($)</label>
                    <input className="input text-sm !py-1.5" type="number" value={area.flatFee}
                      onChange={e => updateArea(area.id, { flatFee: e.target.value })}
                      placeholder="0.00" min="0" step="0.01" />
                  </div>
                </div>

                {/* Habitacion extras */}
                {area.esTipoHabitacion && (
                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">🛏️ Detalles de la habitación</p>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <input type="checkbox" checked={area.tieneSala || false}
                          onChange={e => updateArea(area.id, { tieneSala: e.target.checked })} />
                        Tiene sala
                      </label>
                      {area.tieneSala && (
                        <select className="input text-xs !py-1" value={area.tipoSala}
                          onChange={e => updateArea(area.id, { tipoSala: e.target.value })}>
                          {TIPOS_PISO.map(t => <option key={t}>{t}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label text-xs">Hab. adicionales</label>
                        <input className="input text-sm !py-1.5" type="number" value={area.habitacionesAdicionales}
                          onChange={e => updateArea(area.id, { habitacionesAdicionales: e.target.value })}
                          min="0" placeholder="0" />
                      </div>
                      <div>
                        <label className="label text-xs">Piso hab.</label>
                        <select className="input text-xs !py-1.5" value={area.tipoPisoHab}
                          onChange={e => updateArea(area.id, { tipoPisoHab: e.target.value })}>
                          {TIPOS_PISO.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <input type="checkbox" checked={area.tieneKitchenette || false}
                        onChange={e => updateArea(area.id, { tieneKitchenette: e.target.checked })} />
                      Kitchenette
                      {area.tieneKitchenette && (
                        <select className="input text-xs !py-0.5 ml-2" value={area.tipoPisoKitchen}
                          onChange={e => updateArea(area.id, { tipoPisoKitchen: e.target.value })}>
                          {TIPOS_PISO.map(t => <option key={t}>{t}</option>)}
                        </select>
                      )}
                    </label>
                  </div>
                )}

                {/* Baño extras */}
                {area.esTipoBano && (
                  <div className="bg-cyan-50 dark:bg-cyan-900/10 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">🚿 Detalles del baño</p>
                    <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <input type="checkbox" checked={area.incluyeEntrada || false}
                        onChange={e => updateArea(area.id, { incluyeEntrada: e.target.checked })} />
                      Incluye entrada / vestíbulo
                    </label>
                  </div>
                )}

                {/* Measurements */}
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Medidas (opcional si usas Flat Fee)</p>
                  <div className="grid grid-cols-12 gap-1 text-xs font-medium text-[var(--text-muted)] px-1 mb-1">
                    <div className="col-span-4">Descripción</div>
                    <div className="col-span-3 text-center">Ancho (ft)</div>
                    <div className="col-span-3 text-center">Largo (ft)</div>
                    <div className="col-span-1 text-right">Sqft</div>
                    <div className="col-span-1" />
                  </div>
                  {area.lineas.map((linea, lIdx) => {
                    const sqft = calcSqFt(linea.ancho, linea.largo);
                    return (
                      <div key={linea.id} className="grid grid-cols-12 gap-1 items-center mb-1">
                        <div className="col-span-4">
                          <input className="input text-sm !py-1.5" value={linea.descripcion}
                            onChange={e => updateLinea(area.id, linea.id, { descripcion: e.target.value })}
                            placeholder={`Medida ${lIdx + 1}`} />
                        </div>
                        <div className="col-span-3">
                          <input className="input text-sm !py-1.5 text-center" type="number" value={linea.ancho}
                            onChange={e => updateLinea(area.id, linea.id, { ancho: e.target.value })}
                            placeholder="0" min="0" step="0.5" />
                        </div>
                        <div className="col-span-3">
                          <input className="input text-sm !py-1.5 text-center" type="number" value={linea.largo}
                            onChange={e => updateLinea(area.id, linea.id, { largo: e.target.value })}
                            placeholder="0" min="0" step="0.5" />
                        </div>
                        <div className="col-span-1 text-right text-xs font-medium text-[var(--text-primary)]">
                          {sqft > 0 ? sqft.toFixed(0) : "—"}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          {area.lineas.length > 1 && (
                            <button type="button" onClick={() => removeLinea(area.id, linea.id)} className="text-red-400 hover:text-red-500">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <button type="button" onClick={() => addLinea(area.id)}
                    className="flex items-center gap-1 text-xs text-marca-500 hover:text-marca-600 mt-1">
                    <Plus className="w-3.5 h-3.5" /> Agregar medida
                  </button>
                </div>

                {/* Photo */}
                <div>
                  <label className="label text-xs">📸 Foto del área</label>
                  {area.fotoUrl ? (
                    <div className="relative">
                      <img src={area.fotoUrl} alt={area.nombre} className="w-full rounded-lg object-contain max-h-64 bg-black/5" />
                      <button onClick={() => updateArea(area.id, { fotoUrl: undefined })}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 w-full h-20 border-2 border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--text-muted)] hover:border-marca-300 hover:text-marca-500 cursor-pointer transition-colors">
                      {uploadingFoto === area.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          Tomar foto o seleccionar
                        </>
                      )}
                      <input type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={e => { if (e.target.files?.[0]) subirFoto(area.id, e.target.files[0]); }} />
                    </label>
                  )}
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                  <span className="text-xs text-[var(--text-muted)]">
                    {area.tipoPiso}{area.esTipoHabitacion ? " · Room" : area.esTipoBano ? " · Bath" : ""}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {subtotalArea(area) > 0 ? `${subtotalArea(area).toFixed(0)} sq ft` : ""}
                    {area.flatFee ? ` · $${parseFloat(area.flatFee).toFixed(2)} flat` : ""}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add area buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button type="button" onClick={() => setAreas(p => [...p, newArea()])}
          className="py-2.5 rounded-xl border-2 border-dashed border-[var(--border)] text-xs text-[var(--text-muted)] hover:border-marca-300 hover:text-marca-500 transition-colors flex items-center justify-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Área general
        </button>
        <button type="button" onClick={() => setAreas(p => [...p, newArea("habitacion")])}
          className="py-2.5 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800 text-xs text-blue-500 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-1">
          <Plus className="w-3.5 h-3.5" /> 🛏️ Habitación
        </button>
        <button type="button" onClick={() => setAreas(p => [...p, newArea("bano")])}
          className="py-2.5 rounded-xl border-2 border-dashed border-cyan-200 dark:border-cyan-800 text-xs text-cyan-500 hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors flex items-center justify-center gap-1">
          <Plus className="w-3.5 h-3.5" /> 🚿 Baño
        </button>
      </div>

      {/* Notes */}
      <div className="card p-4 mb-4">
        <label className="label">Notas de las medidas</label>
        <textarea className="input resize-none" rows={2} value={notas} onChange={e => setNotas(e.target.value)}
          placeholder="Observaciones, condición del piso, detalles del trabajo…" />
      </div>

      {/* Save */}
      <button onClick={guardar} disabled={saving} className="btn-primary w-full justify-center mb-6">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Guardando…" : `Guardar — ${totalSqFt.toFixed(0)} sq ft · $${totalFlatFee.toFixed(2)}`}
      </button>

      {/* History */}
      {historial.length > 0 && (
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Historial de medidas</h2>
          <div className="space-y-2">
            {historial.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {new Date(m.fecha).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  {m.notas && <p className="text-xs text-[var(--text-muted)]">{m.notas}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-marca-500">
                    {(m.sqFtTotal || 0).toFixed(0)} sq ft
                  </p>
                  {m.flatFeeTotal > 0 && (
                    <p className="text-xs font-semibold text-green-600">${(m.flatFeeTotal || 0).toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
