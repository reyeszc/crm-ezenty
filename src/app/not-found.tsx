import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Página no encontrada</h1>
        <p className="text-[var(--text-secondary)] mb-6">Esta página no existe o fue movida.</p>
        <Link href="/dashboard" className="btn-primary inline-flex">Volver al inicio</Link>
      </div>
    </div>
  );
}
