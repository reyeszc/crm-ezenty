"use client";
import { HelpCircle, Keyboard, BookOpen } from "lucide-react";

const ATAJOS = [
  { keys: "/ o Ctrl+K", accion: "Abrir buscador global" },
  { keys: "N", accion: "Nuevo cliente" },
  { keys: "G luego H", accion: "Ir a Hoy te toca" },
  { keys: "?", accion: "Ver esta lista de atajos" },
  { keys: "Esc", accion: "Cerrar modales y buscador" },
];

const RITUAL = [
  { paso: "1", titulo: "Abre Hoy te toca", desc: "Ve quién tiene seguimiento vencido y a quién te toca contactar hoy." },
  { paso: "2", titulo: "Atiende los 🔥 primero", desc: "Los calientes son los más cerca de cerrar. Llámalos o escríbeles con un clic." },
  { paso: "3", titulo: "Registra qué pasó", desc: "Agrega una nota rápida: llamada, WhatsApp, correo. Eso mantiene el historial." },
  { paso: "4", titulo: "Define la próxima acción", desc: "Nunca termines una interacción sin agendar qué sigue. El sistema te lo pide." },
  { paso: "5", titulo: "Revisa el tablero", desc: "¿Cómo vas hacia la meta del mes? ¿Qué pagos están vencidos por cobrar?" },
];

export default function AyudaPage() {
  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-marca-50 dark:bg-marca-900/20 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-marca-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Ayuda y tutorial</h1>
          <p className="text-sm text-[var(--text-secondary)]">Cómo usar el CRM cada mañana para vender más</p>
        </div>
      </div>

      {/* Daily ritual */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-[var(--text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Tu ritual diario — 10 minutos cada mañana</h2>
        </div>
        <div className="space-y-4">
          {RITUAL.map(({ paso, titulo, desc }) => (
            <div key={paso} className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: "#7cc2e8" }}>{paso}</div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{titulo}</p>
                <p className="text-sm text-[var(--text-secondary)]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Keyboard className="w-4 h-4 text-[var(--text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Atajos de teclado</h2>
        </div>
        <div className="space-y-2">
          {ATAJOS.map(({ keys, accion }) => (
            <div key={keys} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
              <span className="text-sm text-[var(--text-secondary)]">{accion}</span>
              <kbd className="px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-xs font-mono text-[var(--text-muted)] border border-[var(--border)]">{keys}</kbd>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="card p-5 border border-marca-200 dark:border-marca-800">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">💡 Consejos clave</h2>
        <ul className="space-y-2">
          {[
            "El nombre de cada cliente siempre abre su expediente completo — desde cualquier pantalla.",
            "Usa el Asistente IA en el expediente para redactar mensajes que cierran más rápido.",
            "Un cliente sin próxima acción se marca en naranja — siempre déjale una.",
            "Los 🔥 Calientes primero: son los que van a cerrar este mes.",
            "Usa la landing pública para capturar leads directamente al embudo.",
          ].map((tip, i) => (
            <li key={i} className="flex gap-2 text-sm text-[var(--text-secondary)]">
              <span className="text-marca-400 flex-shrink-0">→</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
