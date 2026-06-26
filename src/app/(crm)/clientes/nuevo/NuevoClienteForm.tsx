"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

export function NuevoClienteForm() {
  const router = useRouter();
  const { success, error, toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: "", telefono: "", correo: "", origen: "",
    temperatura: "TIBIO", valorEstimado: "",
    objecion: "", proximaAccion: "Initial contact",
    propiedad: "", zona: "", puesto: "",
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

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
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        toast(`${data.mensaje} ¿Abrir su ficha?`, "warning");
        return;
      }
      if (!res.ok) throw new Error();
      success("Cliente creado ✓");
      router.push(`/clientes/${data.id}`);
    } catch {
      error("No se pudo crear el cliente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto pb-20 lg:pb-0">
      <Link href="/clientes" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Nuevo cliente</h1>
          <p className="text-sm text-[var(--text-secondary)]">Agregar en segundos</p>
        </div>
      </div>
      <form onSubmit={guardar} className="card p-5 space-y-4">
        <div>
          <label className="label">Nombre completo *</label>
          <input className="input" value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="James Wilson" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">WhatsApp</label>
            <input className="input" value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="14045551234" />
            <p className="text-xs text-[var(--text-muted)] mt-1">Con código de país, sin guiones</p>
          </div>
          <div>
            <label className="label">Correo</label>
            <input className="input" type="email" value={form.correo} onChange={e => set("correo", e.target.value)} placeholder="name@hotel.com" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Origen / canal</label>
            <select className="input" value={form.origen} onChange={e => set("origen", e.target.value)}>
              <option value="">Seleccionar</option>
              <option>Instagram</option><option>Facebook</option>
              <option>Referido</option><option>Landing</option><option>Otro</option>
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Propiedad / empresa</label>
            <input className="input" value={form.propiedad} onChange={e => set("propiedad", e.target.value)} placeholder="Hilton Atlanta" />
          </div>
          <div>
            <label className="label">Valor estimado ($)</label>
            <input className="input" type="number" value={form.valorEstimado} onChange={e => set("valorEstimado", e.target.value)} placeholder="5000" min="0" />
          </div>
        </div>
        <div>
          <label className="label">Próxima acción</label>
          <input className="input" value={form.proximaAccion} onChange={e => set("proximaAccion", e.target.value)} placeholder="Initial contact call" />
        </div>
        <button type="submit" disabled={loading || !form.nombre.trim()} className="btn-primary w-full justify-center">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {loading ? "Guardando…" : "Crear cliente"}
        </button>
      </form>
    </div>
  );
}
