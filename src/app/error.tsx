"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Algo salió mal</h1>
        <p className="text-[var(--text-secondary)] mb-6">Ocurrió un error inesperado. Tus datos están seguros.</p>
        <button onClick={reset} className="btn-primary">Reintentar</button>
      </div>
    </div>
  );
}
