"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ruler, Save, Trash2, Loader2, ChevronDown, ChevronUp, Camera, Plus, Edit2, X } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

const TIPOS_PISO = ["Carpet", "Tile", "LVT", "Concrete", "Pavers", "Hardwood", "Other"];

function calcSqFt(ancho: number, largo: number) { return (ancho || 0) * (largo || 0); }

export function MedidaDetalleClient({ cliente, medida, areasIniciales }: {
  cliente: any; medida: any; areasIniciales: any[];
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [editando, setEditando] = useState(false);
  const [areas, setAreas] = useState<any[]>(areasIniciales.map(a => ({ ...a, abierta: false })));
  const [notas, setNotas] = useState(medida.notas || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState<string | null>(null);

  const totalSqFt = areas.reduce((s, a) => s + (a.lineas?.reduce((s2: number, l: any) => s2 + calcSqFt(l.ancho, l.largo), 0) || 0), 0);
  const totalFlatFee = areas.reduce((s, a) => s + (parseFloat(a.flatFee) || 0), 0);

  function toggleArea(id: string) {
    setAreas(p => p.map(a => a.id === id ? { ...a, abierta: !a.abierta } : a));
  }
  function updateArea(id: string, patch: any) {
    setAreas(p => p.map(a => a.id === id ? { ...a, ...patch } : a));
  }
  function removeArea(id: string) {
    setAreas(p => p.filter(a => a.id !== id));
  }
  function addArea() {
    setAreas(p => [...p, {
      id: crypto.randomUUID(), area: "", tipoPiso: "Carpet", flatFee: 0,
      lineas: [{ id: crypto.randomUUID(), descripcion: "", ancho: 0, largo: 0 }],
      abierta: true, esTipoHabitacion: false, esTipoBano: false,
    }]);
  }
  function updateLinea(areaId: string, lineaId: string, patch: any) {
    setAreas(p => p.map(a => a.id === areaId ? {
      ...a, lineas: a.lineas.map((l: any) => l.id === lineaId ? { ...l, ...patch } : l)
    } : a));
  }
  function addLinea(areaId: string) {
    setAreas(p => p.map(a => a.id === areaId ? {
      ...a, lineas: [...a.lineas, { id: crypto.randomUUID(), descripcion: "", ancho: 0, largo: 0 }]
    } : a));
  }
  function removeLinea(areaId: string, lineaId: string) {
    setAreas(p => p.map(a => a.id === areaId ? {
      ...a, lineas: a.lineas.filter((l: any) => l.id !== lineaId)
    } : a));
  }

  async function subirFoto(areaId: string, file: File) {
    setUploadingFoto(areaId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/foto", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      updateArea(areaId, { fotoUrl: data.url });
      success("Foto subida ✓");
    } catch { error("No se pudo subir la foto"); } finally { setUploadingFoto(null); }
  }

  async function guardar() {
    setSaving(true);
    try {
      const sqFtTotalCalc = areas.reduce((s, a) => s + (a.lineas?.reduce((s2: number, l: any) => s2 + calcSqFt(l.ancho, l.largo), 0) || 0), 0);
      const flatFeeTotalCalc = areas.reduce((s, a) => s + (parseFloat(a.flatFee) || 0), 0);
      const res = await fetch(`/api/clientes/${cliente.id}/medidas/${medida.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notas, sqFtTotal: sqFtTotalCalc, flatFeeTotal: flatFeeTotalCalc,
          areas: areas.map(a => ({
            area: a.area, tipoPiso: a.tipoPiso, flatFee: parseFloat(a.flatFee) || 0,
            fotoUrl: a.fotoUrl || null,
            esTipoHabitacion: a.esTipoHabitacion || false,
            esTipoBano: a.esTipoBano || false,
            extras: a.extras || null,
            subtotalSqFt: a.lineas?.reduce((s: number, l: any) => s + calcSqFt(l.ancho, l.largo), 0) || 0,
            lineas: (a.lineas || []).filter((l: any) => l.ancho > 0 && l.largo > 0).map((l: any) => ({
              descripcion: l.descripcion, ancho: parseFloat(l.ancho), largo: parseFloat(l.largo),
              sqFt: calcSqFt(l.ancho, l.largo),
            })),
          })),
        }),
      });
      if (!res.ok) throw new Error();
      success("Medida actualizada ✓");
      setEditando(false);
      router.refresh();
    } catch { error("No se pudo guardar"); } finally { setSaving(false); }
  }

  async function eliminar() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/clientes/${cliente.id}/medidas/${medida.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      success("Medida eliminada ✓");
      router.push(`/clientes/${cliente.id}/medidas`);
    } catch { error("No se pudo eliminar"); } finally { setDeleting(false); setConfirmarEliminar(false); }
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-6">
      <Link href={`/clientes/${cliente.id}/medidas`} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4">
        <ArrowLeft className="w-4 h-4" /> {cliente.nombre} — Historial de medidas
      </Link>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <Ruler className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {new Date(medida.creadoEn).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">{areas.length} áreas registradas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editando ? (
            <>
              <button onClick={() => setEditando(true)} className="btn-secondary !py-2 !px-3 text-sm">
                <Edit2 className="w-3.5 h-3.5" /> Editar
              </button>
              <button onClick={() => setConfirmarEliminar(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            </>
          ) : (
            <button onClick={() => { setEditando(false); setAreas(areasIniciales.map(a => ({ ...a, abierta: false }))); }} className="btn-secondary !py-2 !px-3 text-sm">
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card p-3" style={{ background: "linear-gradient(135deg, #7cc2e8, #2b93c5)" }}>
          <p className="text-xs text-white/80">Total Sq Ft</p>
          <p className="text-lg font-bold text-white">{totalSqFt.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="card p-3" style={{ background: "linear-gradient(135deg, #6DC531, #5aab28)" }}>
          <p className="text-xs text-white/80">Total Flat Fee</p>
          <p className="text-lg font-bold text-white">${totalFlatFee.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Areas */}
      <div className="space-y-3 mb-4">
        {areas.map((area) => (
          <div key={area.id} className="card overflow-hidden">
            <div className="flex items-center gap-2 p-3 bg-[var(--bg-secondary)]">
              <button onClick={() => toggleArea(area.id)} className="text-[var(--text-muted)] flex-shrink-0">
                {area.abierta ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{area.area || "Sin nombre"}</p>
              </div>
              {area.esTipoHabitacion && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex-shrink-0">🛏️</span>}
              {area.esTipoBano && <span className="text-xs bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded flex-shrink-0">🚿</span>}
              <span className="text-xs font-semibold text-marca-500 flex-shrink-0">
                {(area.lineas?.reduce((s: number, l: any) => s + calcSqFt(l.ancho, l.largo), 0) || 0) > 0
                  ? `${area.lineas.reduce((s: number, l: any) => s + calcSqFt(l.ancho, l.largo), 0).toFixed(0)} sqft` : ""}
                {area.flatFee ? ` · $${area.flatFee}` : ""}
              </span>
              {editando && areas.length > 1 && (
                <button onClick={() => removeArea(area.id)} className="text-red-400 hover:text-red-500 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {area.abierta && (
              <div className="p-3 space-y-3">
                {editando ? (
                  <>
                    <div>
                      <label className="label text-xs">Nombre del área</label>
                      <input className="input text-sm" value={area.area} onChange={e => updateArea(area.id, { area: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label text-xs">Tipo de piso</label>
                        <select className="input text-sm !py-1.5" value={area.tipoPiso || "Carpet"}
                          onChange={e => updateArea(area.id, { tipoPiso: e.target.value })}>
                          {TIPOS_PISO.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label text-xs">Flat Fee ($)</label>
                        <input type="number" className="input text-sm !py-1.5" value={area.flatFee || 0}
                          onChange={e => updateArea(area.id, { flatFee: e.target.value })} min="0" step="0.01" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Medidas</p>
                      {(area.lineas || []).map((linea: any) => (
                        <div key={linea.id} className="grid grid-cols-12 gap-1 items-center mb-1">
                          <input className="col-span-5 input text-sm !py-1.5" value={linea.descripcion || ""}
                            onChange={e => updateLinea(area.id, linea.id, { descripcion: e.target.value })} placeholder="Descripción" />
                          <input type="number" className="col-span-3 input text-sm !py-1.5 text-center" value={linea.ancho || 0}
                            onChange={e => updateLinea(area.id, linea.id, { ancho: e.target.value })} placeholder="Ancho" />
                          <input type="number" className="col-span-3 input text-sm !py-1.5 text-center" value={linea.largo || 0}
                            onChange={e => updateLinea(area.id, linea.id, { largo: e.target.value })} placeholder="Largo" />
                          <button onClick={() => removeLinea(area.id, linea.id)} className="col-span-1 text-red-400">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addLinea(area.id)} className="flex items-center gap-1 text-xs text-marca-500 hover:text-marca-600 mt-1">
                        <Plus className="w-3.5 h-3.5" /> Agregar medida
                      </button>
                    </div>
                    <div>
                      <label className="label text-xs">📸 Foto</label>
                      {area.fotoUrl ? (
                        <div className="relative">
                          <img src={area.fotoUrl} className="w-full rounded-lg object-contain max-h-64 bg-black/5" />
                          <button onClick={() => updateArea(area.id, { fotoUrl: null })}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">✕</button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 w-full h-20 border-2 border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--text-muted)] hover:border-marca-300 cursor-pointer">
                          {uploadingFoto === area.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Camera className="w-4 h-4" /> Agregar foto</>}
                          <input type="file" accept="image/*" capture="environment" className="hidden"
                            onChange={e => { if (e.target.files?.[0]) subirFoto(area.id, e.target.files[0]); }} />
                        </label>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {area.fotoUrl && <img src={area.fotoUrl} className="w-full rounded-lg object-contain max-h-64 bg-black/5 mb-2" />}
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-muted)]">Tipo de piso</span>
                      <span className="font-medium text-[var(--text-primary)]">{area.tipoPiso || "—"}</span>
                    </div>
                    {area.flatFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">Flat Fee</span>
                        <span className="font-medium text-[var(--text-primary)]">${area.flatFee}</span>
                      </div>
                    )}
                    {(area.lineas || []).filter((l: any) => l.ancho > 0).length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-[var(--border)]">
                        {area.lineas.filter((l: any) => l.ancho > 0).map((l: any) => (
                          <div key={l.id} className="flex justify-between text-xs text-[var(--text-secondary)]">
                            <span>{l.descripcion || "Medida"} ({l.ancho}×{l.largo})</span>
                            <span>{calcSqFt(l.ancho, l.largo).toFixed(0)} sq ft</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {editando && (
        <button onClick={addArea} className="w-full py-2.5 rounded-xl border-2 border-dashed border-[var(--border)] text-sm text-[var(--text-muted)] hover:border-marca-300 hover:text-marca-500 transition-colors flex items-center justify-center gap-1 mb-4">
          <Plus className="w-4 h-4" /> Agregar área
        </button>
      )}

      {/* Notes */}
      <div className="card p-4 mb-4">
        <label className="label">Notas</label>
        {editando ? (
          <textarea className="input resize-none" rows={2} value={notas} onChange={e => setNotas(e.target.value)} />
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">{notas || "Sin notas"}</p>
        )}
      </div>

      {editando && (
        <button onClick={guardar} disabled={saving} className="btn-primary w-full justify-center mb-6">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      )}

      {/* Confirm delete */}
      {confirmarEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setConfirmarEliminar(false)}>
          <div className="card w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">¿Eliminar esta medida?</h3>
            <p className="text-sm text-[var(--text-muted)] mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={eliminar} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors">
                {deleting ? "Eliminando…" : "Sí, eliminar"}
              </button>
              <button onClick={() => setConfirmarEliminar(false)} className="flex-1 btn-secondary justify-center">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
