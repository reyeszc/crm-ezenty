"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Search, Bell, HelpCircle, Sun, Moon, Monitor, LogOut, Settings, User, Plus } from "lucide-react";
import { useTema } from "@/components/providers/ThemeProvider";
import Link from "next/link";

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
