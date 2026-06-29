"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserCog, Plus, Edit2, UserX, UserCheck, Key, Loader2, X, Save } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

const ROLES = ["ADMIN", "VENDEDOR", "SOLO_LECTURA"];

interface Usuario {
  id: string; nombre: string; correo: string;
  rol: string; activo: boolean; metaMensual: number; creadoEn: string;
}

function ModalUsuario({ usuario, onClose, onGuardado }: {
  usuario: Partial<Usuario> | null;
  onClose: () => void;
  onGuardado: (u: Usuario) => void;
}) {
  const esNuevo = !usuario?.id;
  const [form, setForm] = useState({
    nombre: usuario?.nombre || "",
    correo: usuario?.correo || "",
    rol: usuario?.rol || "VENDEDOR",
    metaMensual: String(usuario?.metaMensual || 0),
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function guardar() {
    if (!form.nombre.trim() || !form.correo.trim()) return;
    if (esNuevo && !form.password) { error("La contraseña es requerida para usuarios nuevos"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/usuarios${esNuevo ? "" : `/${usuario?.id}`}`, {
        method: esNuevo ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre, correo: form.correo,
          rol: form.rol, metaMensual: parseFloat(form.metaMensual) || 0,
          ...(form.password ? { password: form.password } : {}),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error"); }
      const data = await res.json();
      success(esNuevo ? "Usuario creado ✓" : "Usuario actualizado ✓");
      onGuardado(data);
      onClose();
    } catch (e: any) { error(e.message || "No se pudo guardar"); } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {esNuevo ? "Nuevo usuario" : `Editar — ${usuario?.nombre}`}
          </h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Nombre completo (como aparecerá en cotizaciones)</label>
            <input className="input" value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Zugheily Reyes" />
            <p className="text-xs text-[var(--text-muted)] mt-1">Usa nombre y apellido — aparece en Prepared By de las cotizaciones</p>
          </div>
          <div>
            <label className="label">Correo</label>
            <input type="email" className="input" value={form.correo} onChange={e => set("correo", e.target.value)} placeholder="maria@ezentyprocare.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Rol</label>
              <select className="input" value={form.rol} onChange={e => set("rol", e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Meta mensual ($)</label>
              <input type="number" className="input" value={form.metaMensual} onChange={e => set("metaMensual", e.target.value)} placeholder="5000" min="0" />
            </div>
          </div>
          <div>
            <label className="label">URL de foto de perfil (opcional)</label>
            <input type="url" className="input" value={(form as any).avatarUrl || ""} onChange={e => set("avatarUrl", e.target.value)} placeholder="https://..." />
            <p className="text-xs text-[var(--text-muted)] mt-1">Sube la foto a Google Drive o Dropbox y pega el enlace directo</p>
          </div>
          <div>
            <label className="label">{esNuevo ? "Contraseña" : "Nueva contraseña (dejar vacío para no cambiar)"}</label>
            <input type="password" className="input" value={form.password} onChange={e => set("password", e.target.value)}
              placeholder={esNuevo ? "Mínimo 8 caracteres" : "Dejar vacío para no cambiar"} minLength={8} />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={guardar} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? "Guardando…" : "Guardar"}
          </button>
          <button onClick={onClose} className="btn-secondary !px-4">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export function EquipoClient({ usuariosIniciales }: { usuariosIniciales: Usuario[] }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciales);
  const [modal, setModal] = useState<Partial<Usuario> | null | "nuevo">(null);
  const [confirmDesactivar, setConfirmDesactivar] = useState<Usuario | null>(null);
  const { success, error, toast } = useToast();

  async function toggleActivo(u: Usuario) {
    const res = await fetch(`/api/admin/usuarios/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !u.activo }),
    });
    if (res.ok) {
      setUsuarios(p => p.map(x => x.id === u.id ? { ...x, activo: !x.activo } : x));
      success(`${u.nombre} ${!u.activo ? "activado" : "desactivado"} ✓`);
    } else { error("No se pudo actualizar"); }
    setConfirmDesactivar(null);
  }

  async function resetPassword(u: Usuario) {
    const nueva = prompt(`Nueva contraseña temporal para ${u.nombre} (mínimo 8 caracteres):`);
    if (!nueva || nueva.length < 8) { error("Contraseña muy corta — mínimo 8 caracteres"); return; }
    const res = await fetch(`/api/admin/usuarios/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: nueva }),
    });
    if (res.ok) {
      success(`Contraseña de ${u.nombre} actualizada ✓`);
    } else { error("No se pudo cambiar la contraseña"); }
  }

  function onGuardado(u: Usuario) {
    setUsuarios(p => {
      const exists = p.find(x => x.id === u.id);
      return exists ? p.map(x => x.id === u.id ? u : x) : [...p, u];
    });
  }

  const rolColor: Record<string, string> = {
    ADMIN: "bg-marca-100 text-marca-700",
    VENDEDOR: "bg-green-100 text-green-700",
    SOLO_LECTURA: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-6">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4">
        <ArrowLeft className="w-4 h-4" /> Panel admin
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center">
            <UserCog className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Equipo</h1>
            <p className="text-sm text-[var(--text-secondary)]">{usuarios.length} usuarios</p>
          </div>
        </div>
        <button onClick={() => setModal("nuevo")} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      <div className="space-y-3">
        {usuarios.map(u => (
          <div key={u.id} className={`card p-4 flex items-center gap-3 ${!u.activo ? "opacity-60" : ""}`}>
            {/* Avatar */}
            <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
              {(u as any).avatarUrl ? (
                <img src={(u as any).avatarUrl} alt={u.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: u.activo ? "#7cc2e8" : "#94a3b8" }}>
                  {u.nombre[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-[var(--text-primary)]">{u.nombre}</p>
                <span className={`badge text-xs ${rolColor[u.rol] || "bg-gray-100 text-gray-600"}`}>{u.rol}</span>
                {!u.activo && <span className="badge text-xs bg-red-100 text-red-600">Inactivo</span>}
              </div>
              <p className="text-sm text-[var(--text-muted)] truncate">{u.correo}</p>
              {u.metaMensual > 0 && (
                <p className="text-xs text-[var(--text-muted)]">Meta: ${u.metaMensual.toLocaleString()}/mes</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Edit */}
              <button onClick={() => setModal(u)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-marca-500 transition-colors"
                title="Editar usuario">
                <Edit2 className="w-4 h-4" />
              </button>

              {/* Reset password */}
              <button onClick={() => resetPassword(u)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-amber-500 transition-colors"
                title="Restablecer contraseña">
                <Key className="w-4 h-4" />
              </button>

              {/* Activate / Deactivate */}
              <button
                onClick={() => {
                  if (u.activo) setConfirmDesactivar(u);
                  else toggleActivo(u);
                }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  u.activo
                    ? "text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500"
                    : "text-[var(--text-muted)] hover:bg-green-50 hover:text-green-500"
                }`}
                title={u.activo ? "Desactivar usuario" : "Activar usuario"}>
                {u.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal editar/crear */}
      {modal !== null && (
        <ModalUsuario
          usuario={modal === "nuevo" ? {} : modal as Usuario}
          onClose={() => setModal(null)}
          onGuardado={onGuardado}
        />
      )}

      {/* Confirm deactivate */}
      {confirmDesactivar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="card w-full max-w-sm p-6 text-center">
            <UserX className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              ¿Desactivar a {confirmDesactivar.nombre}?
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-5">
              No podrá entrar al CRM pero sus clientes y datos se conservan. Puedes reactivarlo cuando quieras.
            </p>
            <div className="flex gap-2">
              <button onClick={() => toggleActivo(confirmDesactivar)} className="btn-danger flex-1 justify-center">
                Sí, desactivar
              </button>
              <button onClick={() => setConfirmDesactivar(null)} className="btn-secondary flex-1 justify-center">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
