"use client";
import { useSession } from "next-auth/react";
import { useState, useRef } from "react";
import { User, Loader2, Eye, EyeOff, Camera } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

export default function PerfilPage() {
  const { data: session, update } = useSession();
  const [pass, setPass] = useState({ actual: "", nueva: "", confirmar: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const { success, error } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const nombre = session?.user?.name || "";
  const correo = session?.user?.email || "";
  const rol = (session?.user as any)?.rol || "";
  const foto = session?.user?.image || "";

  async function subirFoto(file: File) {
    setUploadingFoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/foto", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // Save URL to user profile
      const saveRes = await fetch("/api/usuario/foto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fotoUrl: data.url }),
      });
      if (!saveRes.ok) throw new Error();
      await update({ image: data.url });
      success("Foto actualizada ✓ — recarga la página para verla");
    } catch { error("No se pudo subir la foto"); } finally { setUploadingFoto(false); }
  }

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    if (pass.nueva !== pass.confirmar) { error("Las contraseñas no coinciden"); return; }
    if (pass.nueva.length < 8) { error("Mínimo 8 caracteres"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/usuario/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pass) });
      if (!res.ok) throw new Error();
      success("Contraseña actualizada ✓");
      setPass({ actual: "", nueva: "", confirmar: "" });
    } catch { error("No se pudo cambiar la contraseña"); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto pb-20 lg:pb-0">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center">
          <User className="w-5 h-5 text-[var(--text-muted)]" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Mi perfil</h1>
      </div>

      {/* Photo + Info */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--bg-secondary)] flex items-center justify-center">
              {foto ? (
                <img src={foto} alt={nombre} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-2xl font-bold text-white" style={{ background: "#7cc2e8" }}>
                  {nombre[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-marca-300 text-white flex items-center justify-center shadow-md hover:bg-marca-400 transition-colors"
              title="Cambiar foto"
            >
              {uploadingFoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { if (e.target.files?.[0]) subirFoto(e.target.files[0]); }} />
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)]">{nombre}</p>
            <p className="text-sm text-[var(--text-secondary)]">{correo}</p>
            <span className="badge text-xs bg-marca-100 text-marca-700 mt-1">{rol}</span>
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-3">
          Haz clic en el ícono de cámara para cambiar tu foto de perfil
        </p>
      </div>

      {/* Change password */}
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
