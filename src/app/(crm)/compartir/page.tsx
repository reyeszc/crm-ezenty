"use client";
import { useState, useEffect } from "react";
import { Share2, Copy, Check, QrCode, ExternalLink } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

export default function CompartirPage() {
  const [copiado, setCopiado] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const { success } = useToast();

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const landingUrl = `${origin}/landing`;

  const ligas = [
    { canal: "WhatsApp", utm: "whatsapp", emoji: "💬" },
    { canal: "Instagram", utm: "instagram", emoji: "📸" },
    { canal: "Facebook", utm: "facebook", emoji: "📘" },
    { canal: "Volante", utm: "volante", emoji: "📄" },
  ];

  function copiar(texto: string, key: string) {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(key);
      success("Liga copiada ✓");
      setTimeout(() => setCopiado(null), 2000);
    });
  }

  function compartirWA(url: string) {
    window.open(`https://wa.me/?text=${encodeURIComponent("Check out Ezenty ProCare's floor protection services: " + url)}`, "_blank");
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-marca-50 dark:bg-marca-900/20 flex items-center justify-center">
          <Share2 className="w-5 h-5 text-marca-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Comparte y crece</h1>
          <p className="text-sm text-[var(--text-secondary)]">Difunde tu landing y mide qué canal vende</p>
        </div>
      </div>

      {/* Landing URL */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Tu landing pública</h2>
        <div className="flex gap-2">
          <div className="flex-1 px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-secondary)] truncate">
            {landingUrl}
          </div>
          <button onClick={() => copiar(landingUrl, "main")}
            className="btn-primary !px-3 flex-shrink-0">
            {copiado === "main" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <a href={landingUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary !px-3 flex-shrink-0">
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* UTM links */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Ligas por canal</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">Cada liga marca de dónde vino el lead en el CRM</p>
        <div className="space-y-3">
          {ligas.map(({ canal, utm, emoji }) => {
            const url = `${landingUrl}?utm_source=${utm}`;
            return (
              <div key={utm} className="flex items-center gap-3">
                <span className="text-xl w-7 flex-shrink-0">{emoji}</span>
                <div className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)] truncate">
                  {url}
                </div>
                <button onClick={() => copiar(url, utm)} className="btn-secondary !py-2 !px-2.5 flex-shrink-0">
                  {copiado === utm ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {utm === "whatsapp" && (
                  <button onClick={() => compartirWA(url)} className="btn-secondary !py-2 !px-2.5 flex-shrink-0">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* QR Code */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="w-4 h-4 text-[var(--text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Código QR</h2>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="w-40 h-40 bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border)] rounded-xl flex items-center justify-center">
            <div className="text-center">
              <QrCode className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-xs text-[var(--text-muted)]">QR disponible en producción</p>
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] text-center max-w-xs">
            El QR se genera dinámicamente con tu URL de producción. Imprímelo en volantes o muéstralo en tu punto de venta.
          </p>
        </div>
      </div>

      {/* Share buttons */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Compartir en redes</h2>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => compartirWA(`${landingUrl}?utm_source=whatsapp`)}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-white text-sm" style={{ background: "#25D366" }}>
            💬 WhatsApp
          </button>
          <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(landingUrl + "?utm_source=facebook")}`, "_blank")}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-white text-sm" style={{ background: "#1877F2" }}>
            📘 Facebook
          </button>
        </div>
      </div>
    </div>
  );
}
