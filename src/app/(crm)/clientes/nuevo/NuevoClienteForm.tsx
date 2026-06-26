"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, UserPlus, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

const TIPOS_PROPIEDAD = ["Hotel", "Restaurante", "Facility", "Resort", "Otro"];
const ORIGENES = ["Instagram", "Facebook", "Referido", "Landing", "Visita en campo", "LinkedIn", "Otro"];

export function NuevoClienteForm() {
  const router = useRouter();
  const { success, error, toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: "", telefono: "", correo: "", origen: "",
    temperatura: "FRIO", valorEstimado: "",
    objecion: "", proximaAccion: "Schedule site visit",
    propiedad: "", zona: "", puesto: "",
    management: "", ciudadCluster: "",
    cantidadHabitaciones: "", direccionPropiedad: "",
    tipoPropiedad: "Hotel",
  });
  const [contactos, setContactos] = useState([
    { nombre: "", cargo: "", telefono: "", correo: "", principal: true }
  ]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  function addContacto() {
    setContactos(p => [...p, { nombre: "", cargo: "", telefono: "", correo: "", principal: false }]);
  }
  function removeContacto(i: number) {
    setContactos(p => p.filter((_, idx) => idx !== i));
  }
  function setContacto(i: number, k: string, v: string) {
    setContactos(p => p.map((c, idx) => idx === i ? { ...c, [k]: v } : c));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          valorEstimado: form.valorEstimado ? parseFloat(form.valorEstimado) : undefined,
          cantidadHabitaciones: form.cantidadHabitaciones ? parseInt(form.cantidadHabitaciones) : undefined,
          contactos: contactos.filter(c => c.nombre.trim()),
        }),
      });
      const data = await res.json();
      if (res.status === 409) { toast(`${data.mensaje}`, "warning"); return; }
      if (!res.ok) throw new Error();
      success("Cliente creado ✓");
      router.push(`/clientes/${data.id}`);
    } catch { error("No se pudo crear el cliente."); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-6">
      <Link href="/clientes" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Nuevo cliente</h1>
          <p className="text-sm text-[var(--text-secondary)]">Agregar propiedad al embudo</p>
        </div>
      </div>

      <form onSubmit={guardar} className="space-y-4">
        {/* Información de la propiedad */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">🏨 Información de la propiedad</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Nombre de la propiedad *</label>
              <input className="input" value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Hilton Nashville Downtown" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Tipo de propiedad</label>
                <select className="input" value={form.tipoPropiedad} onChange={e => set("tipoPropiedad", e.target.value)}>
                  {TIPOS_PROPIEDAD.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Habitaciones / Capacidad</label>
                <input className="input" type="number" value={form.cantidadHabitaciones} onChange={e => set("cantidadHabitaciones", e.target.value)} placeholder="330" min="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Ciudad / Cluster</label>
                <input className="input" value={form.ciudadCluster} onChange={e => set("ciudadCluster", e.target.value)} placeholder="Nashville Downtown" />
              </div>
              <div>
                <label className="label">Zona</label>
                <input className="input" value={form.zona} onChange={e => set("zona", e.target.value)} placeholder="Nashville, TN" />
              </div>
            </div>
            <div>
              <label className="label">Dirección</label>
              <input className="input" value={form.direccionPropiedad} onChange={e => set("direccionPropiedad", e.target.value)} placeholder="121 4th Ave S, Nashville, TN 37201" />
            </div>
            <div>
              <label className="label">Management / Operador</label>
              <input className="input" value={form.management} onChange={e => set("management", e.target.value)} placeholder="Aimbridge Hospitality" />
            </div>
          </div>
        </div>

        {/* Contactos */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">👥 Contactos de la propiedad</h2>
            <button type="button" onClick={addContacto} className="btn-secondary !py-1.5 !px-3 text-xs">
              <Plus className="w-3.5 h-3.5" /> Agregar contacto
            </button>
          </div>
          <div className="space-y-4">
            {contactos.map((c, i) => (
              <div key={i} className="bg-[var(--bg-secondary)] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-muted)]">Contacto {i + 1} {i === 0 ? "(principal)" : ""}</span>
                  {i > 0 && (
                    <button type="button" onClick={() => removeContacto(i)} className="text-red-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-xs">Nombre</label>
                    <input className="input text-sm" value={c.nombre} onChange={e => setContacto(i, "nombre", e.target.value)} placeholder="James Wilson" />
                  </div>
                  <div>
                    <label className="label text-xs">Cargo</label>
                    <input className="input text-sm" value={c.cargo} onChange={e => setContacto(i, "cargo", e.target.value)} placeholder="General Manager" />
                  </div>
                  <div>
                    <label className="label text-xs">Teléfono / SMS</label>
                    <input className="input text-sm" value={c.telefono} onChange={e => setContacto(i, "telefono", e.target.value)} placeholder="16155550101" />
                  </div>
                  <div>
                    <label className="label text-xs">Correo</label>
                    <input type="email" className="input text-sm" value={c.correo} onChange={e => setContacto(i, "correo", e.target.value)} placeholder="gm@hotel.com" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CRM */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">📊 Datos del CRM</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Origen / canal</label>
                <select className="input" value={form.origen} onChange={e => set("origen", e.target.value)}>
                  <option value="">Seleccionar</option>
                  {ORIGENES.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Temperatura</label>
                <select className="input" value={form.temperatura} onChange={e => set("temperatura", e.target.value)}>
                  <option value="CALIENTE">🔥 Caliente</option>
                  <option value="TIBIO">🟡 Tibio</option>
                  <option value="FRIO">🔵 Frío</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Valor estimado del contrato ($)</label>
              <input className="input" type="number" value={form.valorEstimado} onChange={e => set("valorEstimado", e.target.value)} placeholder="5000" min="0" />
            </div>
            <div>
              <label className="label">Próxima acción</label>
              <input className="input" value={form.proximaAccion} onChange={e => set("proximaAccion", e.target.value)} placeholder="Schedule site visit" />
            </div>
            <div>
              <label className="label">Notas generales</label>
              <textarea className="input resize-none" rows={3} value={form.objecion} onChange={e => set("objecion", e.target.value)} placeholder="Información adicional sobre esta propiedad..." />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading || !form.nombre.trim()} className="btn-primary w-full justify-center">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {loading ? "Guardando…" : "Crear cliente"}
        </button>
      </form>
    </div>
  );
}
