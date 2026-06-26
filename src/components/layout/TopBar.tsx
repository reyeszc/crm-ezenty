"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { Search, Bell, HelpCircle, Sun, Moon, Monitor, LogOut, Settings, User, Plus } from "lucide-react";
import { useTema } from "@/components/providers/ThemeProvider";
import Link from "next/link";


function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ notificaciones: any[]; total: number; urgentes: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const TIPO_CONFIG: Record<string, { emoji: string; color: string }> = {
    VENCIDO: { emoji: "⏰", color: "text-red-600 bg-red-50 dark:bg-red-900/20" },
    PAGO:    { emoji: "💰", color: "text-red-600 bg-red-50 dark:bg-red-900/20" },
    CITA:    { emoji: "📅", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
    DEMO:    { emoji: "🎯", color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
    CALIENTE:{ emoji: "🔥", color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20" },
  };

  async function cargar() {
    setLoading(true);
    try {
      const res = await fetch("/api/notificaciones");
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const total = data?.total || 0;
  const urgentes = data?.urgentes || 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) cargar(); }}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {total > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${urgentes > 0 ? "bg-red-500" : "bg-marca-400"}`}>
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 card shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Notificaciones {total > 0 && <span className="ml-1 text-xs text-[var(--text-muted)]">({total})</span>}
            </h3>
            <button onClick={() => setOpen(false)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              Cerrar
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-[var(--text-muted)]">Cargando…</div>
            ) : !data || data.notificaciones.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">Todo al día</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">No hay nada urgente por atender</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {data.notificaciones.map((n: any) => {
                  const cfg = TIPO_CONFIG[n.tipo] || { emoji: "📌", color: "text-gray-600 bg-gray-50" };
                  return (
                    <Link
                      key={n.id}
                      href={n.clienteId ? `/clientes/${n.clienteId}` : "/seguimiento"}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${cfg.color}`}>
                        {cfg.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{n.titulo}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{n.descripcion}</p>
                        {n.clienteNombre && n.tipo !== "PAGO" && (
                          <p className="text-xs text-marca-500 truncate mt-0.5">{n.clienteNombre}</p>
                        )}
                      </div>
                      {n.urgente && (
                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
            <Link href="/seguimiento" onClick={() => setOpen(false)}
              className="text-xs text-marca-500 hover:text-marca-600 font-medium">
              Ver todos los seguimientos →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  const { data: session } = useSession();
  const { tema, setTema } = useTema();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const nombre = session?.user?.name || "Usuario";
  const inicial = nombre[0]?.toUpperCase() || "U";

  const temas = [
    { valor: "CLARO" as const, icon: Sun, label: "Claro" },
    { valor: "OSCURO" as const, icon: Moon, label: "Oscuro" },
    { valor: "AUTOMATICO" as const, icon: Monitor, label: "Automático" },
  ];

  return (
    <header className="h-14 flex items-center gap-3 px-4 lg:px-6 bg-[var(--bg-primary)] border-b border-[var(--border)] sticky top-0 z-30 flex-shrink-0">
      {/* Search bar */}
      <Link
        href="/buscar"
        className="flex items-center gap-2 flex-1 max-w-md h-9 px-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] text-sm hover:border-marca-300 transition-colors"
        title="Buscar (Ctrl+K)"
        aria-label="Abrir buscador global"
      >
        <Search className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">Buscar clientes, citas, pagos…</span>
        <span className="sm:hidden">Buscar…</span>
        <kbd className="hidden sm:inline-flex ml-auto items-center gap-0.5 text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-muted)] px-1.5 py-0.5 rounded font-mono">
          Ctrl K
        </kbd>
      </Link>

      {/* Spacer */}
      <div className="flex-1 hidden lg:block" />

      {/* New client quick button */}
      <Link
        href="/clientes/nuevo"
        className="hidden sm:flex btn-primary !py-2 !px-3 text-sm"
        aria-label="Agregar cliente"
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
        <span className="hidden md:inline">Nuevo</span>
      </Link>

      {/* Theme switcher */}
      <div className="flex items-center gap-0.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-0.5">
        {temas.map(({ valor, icon: Icon, label }) => (
          <button
            key={valor}
            onClick={() => setTema(valor)}
            title={label}
            aria-label={`Tema ${label}`}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
              tema === valor
                ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        ))}
      </div>

      {/* Notifications bell */}
      <button
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
        aria-label="Notificaciones y recordatorios"
      >
        <Bell className="w-4.5 h-4.5" aria-hidden="true" />
        {/* Red dot placeholder — populated by server data */}
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"
          aria-label="Tienes recordatorios pendientes"
        />
      </button>

      {/* Help */}
      <Link
        href="/ayuda"
        className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
        aria-label="Ayuda y tutorial"
        title="Ayuda"
      >
        <HelpCircle className="w-4.5 h-4.5" aria-hidden="true" />
      </Link>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "#7cc2e8" }}
          aria-label={`Menú de ${nombre}`}
          aria-expanded={menuAbierto}
        >
          {inicial}
        </button>

        {menuAbierto && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuAbierto(false)}
              aria-hidden="true"
            />
            <div className="absolute right-0 top-11 z-50 w-52 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl shadow-lg py-1 animate-slide-up">
              <div className="px-3 py-2 border-b border-[var(--border)]">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{nombre}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{session?.user?.email}</p>
              </div>

              <Link
                href="/perfil"
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                onClick={() => setMenuAbierto(false)}
              >
                <User className="w-4 h-4" aria-hidden="true" />
                Mi perfil
              </Link>

              <Link
                href="/admin/configuracion"
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                onClick={() => setMenuAbierto(false)}
              >
                <Settings className="w-4 h-4" aria-hidden="true" />
                Configuración
              </Link>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
