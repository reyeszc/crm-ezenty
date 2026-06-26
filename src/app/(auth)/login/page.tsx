import { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-marca-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
            style={{ background: "linear-gradient(135deg, #7cc2e8, #2b93c5)" }}
            aria-hidden="true"
          >
            E
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Ezenty ProCare
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Protecting Floor Assets. Supporting Facility Standards.
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
