import Link from "next/link";
import { CalendarPlus, Copy, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export default async function AgendaPublicaPage() {
  const session = await auth();
  const usuarios = await db.select({ id: schema.usuarios.id, nombre: schema.usuarios.nombre, correo: schema.usuarios.correo, rol: schema.usuarios.rol, activo: schema.usuarios.activo }).from(schema.usuarios).where(eq(schema.usuarios.activo, true));

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
          <CalendarPlus className="w-5 h-5 text-teal-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Páginas de agenda</h1>
          <p className="text-sm text-[var(--text-secondary)]">Tu liga para que te agenden solos</p>
        </div>
      </div>

      <div className="space-y-3">
        {usuarios.map((u: any) => {
          const slug = u.nombre.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
          const url = `/agenda/${slug}`;
          return (
            <div key={u.id} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 font-bold flex-shrink-0">{u.nombre[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--text-primary)]">{u.nombre}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{url}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => navigator.clipboard.writeText(window.location.origin + url)}
                  className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-marca-500 transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <Link href={url} target="_blank" className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-marca-500 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
