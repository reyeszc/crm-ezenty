"use client";
import { useState } from "react";
import { Settings, Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

export function ConfigForm({ configInicial }: { configInicial: any }) {
  const [c, setC] = useState(configInicial);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();
  const set = (k: string, v: any) => setC((p: any) => ({...p, [k]: v}));

  async function guardar() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) });
      if (!res.ok) throw new Error();
      success("Configuración guardada ✓");
    } catch { error("No se pudo guardar."); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-xl mx-auto pb-20 lg:pb-0">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-marca-50 flex items-center justify-center">
          <Settings className="w-5 h-5 text-marca-500" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Configuración del negocio</h1>
      </div>
      <div className="card p-5 space-y-4">
        {[
          { key: "nombreNegocio", label: "Nombre del negocio" },
          { key: "colorMarca", label: "Color de marca (#hex)", type: "color" },
          { key: "moneda", label: "Moneda (USD, MXN…)" },
          { key: "husoHorario", label: "Huso horario" },
          { key: "horarioInicio", label: "Hora inicio citas" },
          { key: "horarioFin", label: "Hora fin citas" },
          { key: "mensajeWhatsapp", label: "Mensaje tipo WhatsApp", textarea: true },
          { key: "whatsappNegocio", label: "WhatsApp del negocio" },
          { key: "metaMensual", label: "Meta mensual ($)", type: "number" },
        ].map(({ key, label, type, textarea }) => (
          <div key={key}>
            <label className="label">{label}</label>
            {textarea ? (
              <textarea className="input resize-none" rows={3} value={c[key] || ""} onChange={e => set(key, e.target.value)} />
            ) : (
              <input className="input" type={type || "text"} value={c[key] || ""} onChange={e => set(key, type === "number" ? parseFloat(e.target.value) : e.target.value)} />
            )}
          </div>
        ))}
        <button onClick={guardar} disabled={saving} className="btn-primary w-full justify-center">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Guardar configuración
        </button>
      </div>
    </div>
  );
}
