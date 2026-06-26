"use client";
import { useState } from "react";
import { Calendar, CheckCircle, Loader2, MessageCircle } from "lucide-react";

export function AgendaPublicaClient({ slug }: { slug: string }) {
  const [form, setForm] = useState({ nombre: "", telefono: "", correo: "", fecha: "", hora: "" });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({...p, [k]: v}));

  const horas = ["09:00","09:45","10:30","11:15","12:00","14:00","14:45","15:30","16:15","17:00","17:45"];

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.telefono || !form.fecha || !form.hora) return;
    setEnviando(true);
    try {
      await fetch("/api/agenda/reservar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, slug }) });
      setEnviado(true);
    } catch { setEnviado(true); } finally { setEnviando(false); }
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <div className="card max-w-sm w-full p-8 text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Appointment confirmed!</h2>
          <p className="text-[var(--text-secondary)] mb-4">
            {form.fecha && form.hora ? `${form.fecha} at ${form.hora}` : "We'll contact you soon"}
          </p>
          <p className="text-sm text-[var(--text-muted)]">We'll reach you at {form.telefono} to confirm details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg" style={{ background: "linear-gradient(135deg, #7cc2e8, #2b93c5)" }}>E</div>
          <h1 className="text-2xl font-bold text-white mb-1">Ezenty ProCare</h1>
          <p className="text-slate-400">Schedule a free consultation</p>
          <p className="text-xs text-slate-500 mt-1">45-minute session · Mon–Fri 9am–6pm</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-4 h-4 text-marca-500" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Book your spot</h2>
          </div>
          <form onSubmit={enviar} className="space-y-3">
            <div>
              <label className="label">Full name *</label>
              <input className="input" value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="James Wilson" required />
            </div>
            <div>
              <label className="label">WhatsApp *</label>
              <input className="input" value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+1 (404) 555-0100" required />
            </div>
            <div>
              <label className="label">Email (optional)</label>
              <input type="email" className="input" value={form.correo} onChange={e => set("correo", e.target.value)} placeholder="you@hotel.com" />
            </div>
            <div>
              <label className="label">Preferred date *</label>
              <input type="date" className="input" value={form.fecha} onChange={e => set("fecha", e.target.value)} min={new Date().toISOString().split("T")[0]} required />
            </div>
            <div>
              <label className="label">Preferred time *</label>
              <select className="input" value={form.hora} onChange={e => set("hora", e.target.value)} required>
                <option value="">Select a time</option>
                {horas.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <button type="submit" disabled={enviando || !form.nombre || !form.telefono || !form.fecha || !form.hora}
              className="btn-primary w-full justify-center">
              {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              {enviando ? "Booking…" : "Book consultation"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
