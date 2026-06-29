"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, FileText,
  Users,
  KanbanSquare,
  CalendarDays,
  Wallet,
  ListChecks,
  Trophy,
  XCircle,
  Archive,
  Share2,
  UserCog,
  CalendarPlus,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navPrincipal = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Tablero",
    color: "text-marca-500",
    bgActive: "bg-marca-50 text-marca-700 dark:bg-marca-900/30 dark:text-marca-300",
  },
  {
    href: "/clientes",
    icon: Users,
    label: "Clientes",
    color: "text-blue-500",
    bgActive: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  {
    href: "/embudo",
    icon: KanbanSquare,
    label: "Embudo",
    color: "text-purple-500",
    bgActive: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
  {
    href: "/calendario",
    icon: CalendarDays,
    label: "Calendario",
    color: "text-green-500",
    bgActive: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  {
    href: "/pagos",
    icon: Wallet,
    label: "Pagos",
    color: "text-amber-500",
    bgActive: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  {
    href: "/cotizaciones",
    icon: FileText,
    label: "Cotizaciones",
    color: "text-emerald-500",
    bgActive: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  {
    href: "/seguimiento",
    icon: ListChecks,
    label: "Seguimiento",
    color: "text-orange-500",
    bgActive: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    badge: true, // will show notification count
  },
];

const navSecundario = [
  {
    href: "/completados",
    icon: Trophy,
    label: "Completados",
    color: "text-emerald-500",
    bgActive: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  {
    href: "/perdidos",
    icon: XCircle,
    label: "Perdidos",
    color: "text-gray-400",
    bgActive: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  {
    href: "/archivados",
    icon: Archive,
    label: "Archivados",
    color: "text-slate-400",
    bgActive: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
];

const navCrecimiento = [
  {
    href: "/compartir",
    icon: Share2,
    label: "Comparte y crece",
    color: "text-marca-400",
    bgActive: "bg-marca-50 text-marca-700 dark:bg-marca-900/30 dark:text-marca-300",
  },
  {
    href: "/agenda-publica",
    icon: CalendarPlus,
    label: "Páginas de agenda",
    color: "text-teal-500",
    bgActive: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  },
];

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  color: string;
  bgActive: string;
  active: boolean;
}

function NavItem({ href, icon: Icon, label, color, bgActive, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
        "hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
        "text-[var(--text-secondary)]",
        active && bgActive
      )}
      style={{ minHeight: "44px" }}
    >
      <Icon
        className={cn("w-5 h-5 flex-shrink-0", active ? "" : color)}
        aria-hidden="true"
      />
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const rol = (session?.user as any)?.rol;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      className="flex flex-col h-full bg-[var(--bg-primary)] border-r border-[var(--border)] overflow-y-auto"
      aria-label="Navegación principal"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--border)]">
        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-white flex items-center justify-center">
          <img src="/logo-small.png" alt="Ezenty ProCare" className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
            Ezenty ProCare
          </p>
          <p className="text-xs text-[var(--text-muted)] truncate">CRM</p>
        </div>
      </div>

      <div className="flex-1 px-3 py-4 space-y-6">
        {/* Principal */}
        <div className="space-y-0.5">
          {navPrincipal.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={isActive(item.href)}
            />
          ))}
        </div>

        {/* Cartera */}
        <div>
          <p className="px-3 mb-1 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Cartera
          </p>
          <div className="space-y-0.5">
            {navSecundario.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                active={isActive(item.href)}
              />
            ))}
          </div>
        </div>

        {/* Crecimiento */}
        <div>
          <p className="px-3 mb-1 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Crecimiento
          </p>
          <div className="space-y-0.5">
            {navCrecimiento.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                active={isActive(item.href)}
              />
            ))}
          </div>
        </div>

        {/* Admin — solo para admin */}
        {rol === "ADMIN" && (
          <div>
            <p className="px-3 mb-1 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Administración
            </p>
            <div className="space-y-0.5">
              <NavItem
                href="/admin"
                icon={ShieldCheck}
                label="Panel admin"
                color="text-marca-500"
                bgActive="bg-marca-50 text-marca-700 dark:bg-marca-900/30 dark:text-marca-300"
                active={isActive("/admin")}
              />
              <NavItem
                href="/admin/equipo"
                icon={UserCog}
                label="Equipo"
                color="text-cyan-500"
                bgActive="bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                active={isActive("/admin/equipo")}
              />
            </div>
          </div>
        )}
      </div>

      {/* AI assistant hint */}
      <div className="px-3 pb-3">
        <Link
          href="/clientes"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-marca-50 to-purple-50 dark:from-marca-900/20 dark:to-purple-900/20 border border-marca-200 dark:border-marca-800 text-xs text-marca-700 dark:text-marca-300 hover:opacity-80 transition-opacity"
          title="Asistente IA disponible en cada expediente"
        >
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span>Asistente IA activo</span>
        </Link>
      </div>
    </nav>
  );
}
