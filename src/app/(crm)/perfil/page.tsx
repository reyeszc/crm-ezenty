"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { User, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

export default function PerfilPage() {
  const { data: session } = useSession();
  const [pass, setPass] = useState({ actual: "", nueva: "", confirmar: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    if (pass.nueva !== pass.confirmar) { error("Las contraseñas no coinciden"); return; }
    if (pass.nueva.length < 8) { error("La contraseña debe tener al menos 8 caracteres"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/usuario/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pass) });
      if (!res.ok) throw new Error();
      success("Contraseña actualizada ✓");
      setPass({ actual: "", nueva: "", confirmar: "" });
    } catch { error("No se pudo cambiar la contraseña"); } finally { setLoading(false); }
  }

  const nombre = session?.user?.name || "";
  const correo = session?.user?.email || "";
  const rol = (session?.user as any)?.rol || "";

  return (
    <div className="max-w-md mx-auto pb-20 lg:pb-0">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center">
          <User className="w-5 h-5 text-[var(--text-muted)]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Mi perfil</h1>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{ background: "#7cc2e8" }}>
            {nombre[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)]">{nombre}</p>
            <p className="text-sm text-[var(--text-secondary)]">{correo}</p>
            <span className="badge text-xs bg-marca-100 text-marca-700 mt-1">{rol}</span>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Cambiar contraseña</h2>
        <form onSubmit={cambiarPassword} className="space-y-3">
          {[
            { key: "actual", label: "Contraseña actual" },
            { key: "nueva", label: "Nueva contraseña" },
            { key: "confirmar", label: "Confirmar nueva contraseña" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} className="input pr-10"
                  value={(pass as any)[key]} onChange={e => setPass(p => ({...p, [key]: e.target.value}))} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Actualizar contraseña
          </button>
        </form>
      </div>
    </div>
  );
}
