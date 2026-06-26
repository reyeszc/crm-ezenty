"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Ruler, Save, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

interface Linea { id: string; descripcion: string; ancho: string; largo: string; }
interface Area { id: string; nombre: string; lineas: Linea[]; abierta: boolean; }

function calcSqFt(ancho: string, largo: string): number {
  const a = parseFloat(ancho) || 0;
  const l = parseFloat(largo) || 0;
  return a * l;
}

function subtotalArea(area: Area): number {
  return area.lineas.reduce((s, l) => s + calcSqFt(l.ancho, l.largo), 0);
}

function newLinea(): Linea {
  return { id: crypto.randomUUID(), descripcion: "", ancho: "", largo: "" };
}

function newArea(): Area {
  return { id: crypto.randomUUID(), nombre: "", lineas: [newLinea()], abierta: true };
}

export function MedidasClient({ clienteId, clienteNombre }: { clienteId: string; clienteNombre: string }) {
  const [areas, setAreas] = useState<Area[]>([newArea()]);
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const { success, error } = useToast();

  const totalPropiedad = areas.reduce((s, a) => s + subtotalArea(a), 0);

  const cargarHistorial = useCallback(async () => {
    try {
      const res = await fetch(`/api/clientes/${clienteId}/medidas`);
      const data = await res.json();
      setHistorial(data.medidas || []);
    } finally {
      setLoadingHistorial(false);
    }
  }, [clienteId]);

  useEffect(() => { cargarHistorial(); }, [cargarHistorial]);

  function addArea() { setAreas(p => [...p, newArea()]); }
  function removeArea(id: string) { setAreas(p => p.filter(a => a.id !== id)); }
  function toggleArea(id: string) { setAreas(p => p.map(a => a.id === id ? { ...a, abierta: !a.abierta } : a)); }
  function setAreaNombre(id: string, nombre: string) { setAreas(p => p.map(a => a.id === id ? { ...a, nombre } : a)); }

  function addLinea(areaId: string) {
    setAreas(p => p.map(a => a.id === areaId ? { ...a, lineas: [...a.lineas, newLinea()] } : a));
  }
  function removeLinea(areaId: string, lineaId: string) {
    setAreas(p => p.map(a => a.id === areaId ? { ...a, lineas: a.lineas.filter(l => l.id !== lineaId) } : a));
  }
  function setLinea(areaId: string, lineaId: string, key: keyof Linea, val: string) {
    setAreas(p => p.map(a => a.id === areaId ? {
      ...a, lineas: a.lineas.map(l => l.id === lineaId ? { ...l, [key]: val } : l)
    } : a));
  }

  async function guardar() {
    if (!areas.some(a => a.nombre.trim())) { error("Agrega al menos un área con nombre"); return; }
    setSaving(true);
    try {
      const payload = {
        notas,
        sqFtTotal: totalPropiedad,
        areas: areas.filter(a => a.nombre.trim()).map(a => ({
          area: a.nombre,
          subtotalSqFt: subtotalArea(a),
          lineas: a.lineas.filter(l => parseFloat(l.ancho) > 0 && parseFloat(l.largo) > 0).map(l => ({
            descripcion: l.descripcion,
            ancho: parseFloat(l.ancho),
            largo: parseFloat(l.largo),
            sqFt: calcSqFt(l.ancho, l.largo),
          })),
        })),
      };
      const res = await fetch(`/api/clientes/${clienteId}/medidas`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      success("Medidas guardadas ✓");
      setAreas([newArea()]);
      setNotas("");
      cargarHistorial();
    } catch { error("No se pudieron guardar las medidas"); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-6">
      <Link href={`/clientes/${clienteId}`} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4">
        <ArrowLeft className="w-4 h-4" /> {clienteNombre}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <Ruler className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Tomar medidas</h1>
          <p className="text-sm text-[var(--text-secondary)]">{clienteNombre}</p>
        </div>
      </div>

      {/* Total banner */}
      <div className="card p-4 mb-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #7cc2e8, #2b93c5)" }}>
        <span className="text-white font-medium">Total de la propiedad</span>
        <span className="text-white text-2xl font-bold">{totalPropiedad.toLocaleString("en-US", { maximumFractionDigits: 0 })} sq ft</span>
      </div>

      {/* Areas */}
      <div className="space-y-3 mb-4">
        {areas.map((area, aIdx) => (
          <div key={area.id} className="card overflow-hidden">
            {/* Area header */}
            <div className="flex items-center gap-2 p-3 bg-[var(--bg-secondary)]">
              <button type="button" onClick={() => toggleArea(area.id)} className="text-[var(--text-muted)]">
                {area.abierta ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <input
                className="flex-1 bg-transparent text-sm font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] border-b border-transparent focus:border-marca-300"
                value={area.nombre}
                onChange={e => setAreaNombre(area.id, e.target.value)}
                placeholder={`Área ${aIdx + 1} — ej: Lobby, Corredor Piso 1`}
              />
              <span className="text-xs font-semibold text-marca-500 flex-shrink-0">
                {subtotalArea(area).toLocaleString("en-US", { maximumFractionDigits: 0 })} sq ft
              </span>
              {areas.length > 1 && (
                <button type="button" onClick={() => removeArea(area.id)} className="text-red-400 hover:text-red-500 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {area.abierta && (
              <div className="p-3 space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-1 text-xs font-medium text-[var(--text-muted)] px-1">
                  <div className="col-span-4">Descripción</div>
                  <div className="col-span-3 text-center">Ancho (ft)</div>
                  <div className="col-span-3 text-center">Largo (ft)</div>
                  <div className="col-span-1 text-right">Sq ft</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Lines */}
                {area.lineas.map((linea, lIdx) => {
                  const sqft = calcSqFt(linea.ancho, linea.largo);
                  return (
                    <div key={linea.id} className="grid grid-cols-12 gap-1 items-center">
                      <div className="col-span-4">
                        <input className="input text-sm !py-1.5" value={linea.descripcion}
                          onChange={e => setLinea(area.id, linea.id, "descripcion", e.target.value)}
                          placeholder={`Medida ${lIdx + 1}`} />
                      </div>
                      <div className="col-span-3">
                        <input className="input text-sm !py-1.5 text-center" type="number" value={linea.ancho}
                          onChange={e => setLinea(area.id, linea.id, "ancho", e.target.value)}
                          placeholder="0" min="0" step="0.5" />
                      </div>
                      <div className="col-span-3">
                        <input className="input text-sm !py-1.5 text-center" type="number" value={linea.largo}
                          onChange={e => setLinea(area.id, linea.id, "largo", e.target.value)}
                          placeholder="0" min="0" step="0.5" />
                      </div>
                      <div className="col-span-1 text-right text-sm font-medium text-[var(--text-primary)]">
                        {sqft > 0 ? sqft.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—"}
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
                  className="flex items-center gap-1 text-xs text-marca-500 hover:text-marca-600 transition-colors mt-1">
                  <Plus className="w-3.5 h-3.5" /> Agregar medida
                </button>

                {/* Subtotal */}
                <div className="flex justify-end pt-2 border-t border-[var(--border)]">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    Subtotal {area.nombre || `Área ${aIdx + 1}`}: {subtotalArea(area).toLocaleString("en-US", { maximumFractionDigits: 0 })} sq ft
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add area */}
      <button type="button" onClick={addArea}
        className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--border)] text-sm text-[var(--text-muted)] hover:border-marca-300 hover:text-marca-500 transition-colors flex items-center justify-center gap-2 mb-4">
        <Plus className="w-4 h-4" /> Agregar área
      </button>

      {/* Notas */}
      <div className="card p-4 mb-4">
        <label className="label">Notas de las medidas</label>
        <textarea className="input resize-none" rows={2} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones, condición del piso, tipo de carpet…" />
      </div>

      {/* Save */}
      <button onClick={guardar} disabled={saving} className="btn-primary w-full justify-center mb-6">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Guardando…" : `Guardar medidas — ${totalPropiedad.toLocaleString("en-US", { maximumFractionDigits: 0 })} sq ft total`}
      </button>

      {/* Historial */}
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
                <span className="text-sm font-bold text-marca-500">
                  {(m.sqFtTotal || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })} sq ft
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
