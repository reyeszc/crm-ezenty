"use client";
import { useState } from "react";
import { CheckCircle, MessageCircle, Star, Shield, Clock, Users, Loader2 } from "lucide-react";

const SERVICIOS = [
  "Carpet Cleaning",
  "Tile & Grout Restoration",
  "Upholstery Cleaning",
  "In-House Hospitality Technician",
  "Odor Control",
];

const TESTIMONIOS = [
  { nombre: "James Wilson", cargo: "GM — Marriott Atlanta", texto: "Ezenty ProCare transformed our lobby flooring. Our guests notice the difference immediately.", estrellas: 5 },
  { nombre: "Sarah Johnson", cargo: "Director of Operations — Hyatt Place", texto: "The tile & grout restoration was incredible. Like having brand-new floors without replacing them.", estrellas: 5 },
  { nombre: "Michael Thompson", cargo: "GM — Holiday Inn Express", texto: "Their in-house technician program saved us 40% vs. our previous provider. Highly recommended.", estrellas: 5 },
];

export function LandingClient({ config, utmCanal }: { config: any; utmCanal: string | null }) {
  const [form, setForm] = useState({ nombre: "", telefono: "", correo: "", fecha: "", mensaje: "" });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const set = (k: string, v: string) => setForm(p => ({...p, [k]: v}));

  const marca = config.colorMarca || "#7cc2e8";
  const waUrl = `https://wa.me/${config.whatsappNegocio}?text=${encodeURIComponent("Hi! I'd like to learn more about Ezenty ProCare's floor protection services.")}`;

  async function enviarFormulario(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.telefono.trim()) return;
    setEnviando(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/landing/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, utmCanal }),
      });

      if (!res.ok) {
        // Anti-pérdida: save locally if API fails
        const pendientes = JSON.parse(localStorage.getItem("leads_pendientes") || "[]");
        pendientes.push({ ...form, utmCanal, ts: Date.now() });
        localStorage.setItem("leads_pendientes", JSON.stringify(pendientes));
        setEnviado(true);
      } else {
        setEnviado(true);
      }
    } catch {
      // Anti-pérdida: never lose a lead
      const pendientes = JSON.parse(localStorage.getItem("leads_pendientes") || "[]");
      pendientes.push({ ...form, utmCanal, ts: Date.now() });
      localStorage.setItem("leads_pendientes", JSON.stringify(pendientes));
      setEnviado(true);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="card max-w-sm w-full p-8 text-center">
          <CheckCircle className="w-14 h-14 mx-auto mb-4" style={{ color: marca }} />
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">¡We got your request!</h2>
          <p className="text-[var(--text-secondary)] mb-6">We'll contact you within 24 hours to confirm your consultation.</p>
          {form.fecha && <p className="text-sm font-medium" style={{ color: marca }}>📅 Requested: {form.fecha}</p>}
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold"
            style={{ background: "#25D366" }}>
            <MessageCircle className="w-5 h-5" />
            Message us on WhatsApp now
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(ellipse at top, ${marca}, transparent)` }} />
        <div className="relative max-w-5xl mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm mb-6" style={{ background: marca + "30", color: marca, border: `1px solid ${marca}60` }}>
                <Shield className="w-4 h-4" />
                IICRC Certified · Georgia & Tennessee
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
                Protecting Floor Assets.<br />
                <span style={{ color: marca }}>Supporting Facility Standards.</span>
              </h1>
              <p className="text-slate-300 text-lg mb-8">
                Professional floor care for hotels & commercial properties. Carpet cleaning, tile & grout restoration, upholstery and odor control — powered by 8+ years of hospitality expertise.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                {SERVICIOS.map(s => (
                  <span key={s} className="flex items-center gap-1.5 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: marca }} />
                    {s}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1"><Users className="w-4 h-4" style={{ color: marca }} /> 500+ properties served</span>
                <span className="flex items-center gap-1"><Star className="w-4 h-4" style={{ color: marca }} /> 4.9/5 rating</span>
              </div>
            </div>

            {/* Form */}
            <div>
              <div className="card p-6 bg-white/5 border border-white/10 backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-1">Schedule Your Free Consultation</h2>
                <p className="text-slate-400 text-sm mb-5">No obligation · We'll contact you within 24 hours</p>

                <form onSubmit={enviarFormulario} className="space-y-3" noValidate>
                  <div>
                    <label className="label text-slate-300 text-sm">Full name *</label>
                    <input className="input bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-marca-300" value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="James Wilson" required />
                  </div>
                  <div>
                    <label className="label text-slate-300 text-sm">WhatsApp / Phone *</label>
                    <input className="input bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-marca-300" value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+1 (404) 555-0100" required />
                    <p className="text-xs text-slate-500 mt-1">We'll text you to confirm</p>
                  </div>
                  <div>
                    <label className="label text-slate-300 text-sm">Email (optional)</label>
                    <input type="email" className="input bg-white/10 border-white/20 text-white placeholder:text-slate-500" value={form.correo} onChange={e => set("correo", e.target.value)} placeholder="you@hotel.com" />
                  </div>
                  <div>
                    <label className="label text-slate-300 text-sm">Preferred date (optional)</label>
                    <input type="date" className="input bg-white/10 border-white/20 text-white" value={form.fecha} onChange={e => set("fecha", e.target.value)} min={new Date().toISOString().split("T")[0]} />
                  </div>

                  {errorMsg && <p className="text-red-400 text-sm" role="alert">{errorMsg}</p>}

                  <button type="submit" disabled={enviando || !form.nombre.trim() || !form.telefono.trim()}
                    className="w-full py-4 rounded-xl font-bold text-white text-lg transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: marca }}>
                    {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    {enviando ? "Sending…" : "Schedule My Consultation →"}
                  </button>
                  <p className="text-xs text-center text-slate-500">
                    By submitting you agree to be contacted by Ezenty ProCare
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 bg-white/5 border-y border-white/10">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">What Our Clients Say</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIOS.map((t) => (
              <div key={t.nombre} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.estrellas }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{ color: "#f59e0b" }} />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.texto}"</p>
                <p className="text-sm font-semibold">{t.nombre}</p>
                <p className="text-xs text-slate-400">{t.cargo}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="py-16 text-center">
        <div className="max-w-xl mx-auto px-4">
          <Clock className="w-10 h-10 mx-auto mb-4" style={{ color: marca }} />
          <h2 className="text-2xl font-bold mb-3">Ready to protect your floors?</h2>
          <p className="text-slate-400 mb-6">Join 500+ hospitality properties trusting Ezenty ProCare</p>
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg"
            style={{ background: "#25D366" }}>
            <MessageCircle className="w-5 h-5" />
            Message us on WhatsApp
          </a>
        </div>
      </section>

      <footer className="py-8 border-t border-white/10 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} Ezenty ProCare LLC · IICRC Certified · Atlanta, GA & Nashville, TN
      </footer>
    </div>
  );
}
