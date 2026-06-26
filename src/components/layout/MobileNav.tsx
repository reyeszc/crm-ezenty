"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, KanbanSquare, ListChecks, Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tablero" },
  { href: "/clientes", icon: Users, label: "Clientes" },
  { href: "/embudo", icon: KanbanSquare, label: "Embudo" },
  { href: "/seguimiento", icon: ListChecks, label: "Hoy" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [masAbierto, setMasAbierto] = useState(false);

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--bg-primary)] border-t border-[var(--border)] safe-area-pb"
        aria-label="Navegación móvil"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 rounded-xl transition-colors",
                  active
                    ? "text-marca-500"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}

          {/* FAB + Nuevo */}
          <Link
            href="/clientes/nuevo"
            className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12"
            aria-label="Agregar cliente nuevo"
          >
            <div className="w-10 h-10 rounded-full bg-marca-300 text-white flex items-center justify-center shadow-md hover:bg-marca-400 active:bg-marca-500 transition-colors">
              <Plus className="w-5 h-5" aria-hidden="true" />
            </div>
          </Link>

          {/* Más */}
          <button
            onClick={() => setMasAbierto(!masAbierto)}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            aria-label="Más opciones"
            aria-expanded={masAbierto}
          >
            <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px] font-medium">Más</span>
          </button>
        </div>
      </nav>

      {/* More menu overlay */}
      {masAbierto && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/30"
            onClick={() => setMasAbierto(false)}
            aria-hidden="true"
          />
          <div className="lg:hidden fixed bottom-16 left-0 right-0 z-50 bg-[var(--bg-primary)] border-t border-[var(--border)] rounded-t-2xl p-4 grid grid-cols-3 gap-2">
            {[
              { href: "/calendario", label: "Calendario" },
              { href: "/pagos", label: "Pagos" },
              { href: "/completados", label: "Completados" },
              { href: "/perdidos", label: "Perdidos" },
              { href: "/archivados", label: "Archivados" },
              { href: "/compartir", label: "Comparte" },
              { href: "/admin", label: "Admin" },
              { href: "/perfil", label: "Mi perfil" },
              { href: "/ayuda", label: "Ayuda" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMasAbierto(false)}
                className="flex items-center justify-center px-3 py-3 rounded-xl bg-[var(--bg-secondary)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
