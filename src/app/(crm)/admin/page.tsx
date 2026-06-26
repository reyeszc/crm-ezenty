import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { ShieldCheck, Users, Activity, Download, Settings } from "lucide-react";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).rol !== "ADMIN") redirect("/dashboard");

  const [usuarios, auditoria] = await Promise.all([
    db.select({ id: schema.usuarios.id, nombre: schema.usuarios.nombre, correo: schema.usuarios.correo, rol: schema.usuarios.rol, activo: schema.usuarios.activo, creadoEn: schema.usuarios.creadoEn })
      .from(schema.usuarios).orderBy(desc(schema.usuarios.creadoEn)),
    db.select({ id: schema.registroAuditoria.id, accion: schema.registroAuditoria.accion, entidad: schema.registroAuditoria.entidad, detalle: schema.registroAuditoria.detalle, creadoEn: schema.registroAuditoria.creadoEn, usuarioNombre: schema.usuarios.nombre })
      .from(schema.registroAuditoria).leftJoin(schema.usuarios, eq(schema.registroAuditoria.usuarioId, schema.usuarios.id))
      .orderBy(desc(schema.registroAuditoria.creadoEn)).limit(50),
  ]);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-marca-50 dark:bg-marca-900/20 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-marca-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Panel de administración</h1>
          <p className="text-sm text-[var(--text-secondary)]">Tu equipo, tus datos, tu negocio</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/admin/equipo", icon: Users, label: "Equipo", color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
          { href: "/admin/configuracion", icon: Settings, label: "Configuración", color: "text-marca-500", bg: "bg-marca-50 dark:bg-marca-900/20" },
          { href: "/api/exportar", icon: Download, label: "Exportar datos", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { href: "/admin/auditoria", icon: Activity, label: "Bitácora", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
        ].map(({ href, icon: Icon, label, color, bg }) => (
          <Link key={href} href={href} className="card p-4 hover:shadow-md transition-shadow text-center">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
          </Link>
        ))}
      </div>

      {/* Usuarios */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Usuarios del equipo</h2>
          <Link href="/admin/equipo/nuevo" className="btn-primary !py-1.5 !px-3 text-xs">+ Nuevo</Link>
        </div>
        <div className="space-y-2">
          {usuarios.map((u: any) => (
            <div key={u.id} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
              <div className="w-8 h-8 rounded-full bg-marca-300 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{u.nombre[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{u.nombre}</p>
                <p className="text-xs text-[var(--text-muted)]">{u.correo}</p>
              </div>
              <span className={`badge text-xs ${u.rol === "ADMIN" ? "bg-marca-100 text-marca-700" : "bg-gray-100 text-gray-600"}`}>{u.rol}</span>
              <span className={`text-xs ${u.activo ? "text-green-600" : "text-gray-400"}`}>{u.activo ? "Activo" : "Inactivo"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bitácora */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Actividad reciente</h2>
        <div className="space-y-2">
          {auditoria.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Sin actividad registrada aún.</p>
          ) : auditoria.slice(0, 20).map((a: any) => (
            <div key={a.id} className="flex items-start gap-2 py-1.5 border-b border-[var(--border)] last:border-0">
              <div className="w-2 h-2 rounded-full bg-marca-300 mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">{a.usuarioNombre}</span>
                  {" "}{a.accion} {a.entidad.toLowerCase()}{a.detalle ? ` — ${a.detalle}` : ""}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{a.creadoEn ? new Date(a.creadoEn).toLocaleString("en-US") : ""}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
