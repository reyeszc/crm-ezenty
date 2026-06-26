"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  mensaje: string;
  tipo: ToastType;
  accionDeshacer?: () => void;
}

interface ToastContextValue {
  toast: (mensaje: string, tipo?: ToastType, opciones?: { deshacer?: () => void }) => void;
  success: (mensaje: string) => void;
  error: (mensaje: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  success: () => {},
  error: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, NodeJS.Timeout>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback(
    (
      mensaje: string,
      tipo: ToastType = "info",
      opciones?: { deshacer?: () => void }
    ) => {
      const id = Math.random().toString(36).slice(2);
      const t: Toast = {
        id,
        mensaje,
        tipo,
        accionDeshacer: opciones?.deshacer,
      };
      setToasts((prev) => [...prev.slice(-4), t]);

      const duration = opciones?.deshacer ? 6000 : 3500;
      timers.current[id] = setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const success = useCallback(
    (mensaje: string) => toast(mensaje, "success"),
    [toast]
  );
  const error = useCallback(
    (mensaje: string) => toast(mensaje, "error"),
    [toast]
  );

  const icons = {
    success: <CheckCircle className="w-4 h-4 flex-shrink-0" />,
    error: <XCircle className="w-4 h-4 flex-shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 flex-shrink-0" />,
    info: <Info className="w-4 h-4 flex-shrink-0" />,
  };

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300",
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300",
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300",
  };

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-label="Notificaciones"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3
              rounded-xl border shadow-lg max-w-sm w-full
              animate-slide-in-right
              ${colors[t.tipo]}
            `}
            role="alert"
          >
            {icons[t.tipo]}
            <span className="text-sm font-medium flex-1">{t.mensaje}</span>
            {t.accionDeshacer && (
              <button
                onClick={() => {
                  t.accionDeshacer?.();
                  removeToast(t.id);
                }}
                className="text-xs font-semibold underline hover:no-underline flex-shrink-0"
              >
                Deshacer
              </button>
            )}
            <button
              onClick={() => removeToast(t.id)}
              className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
              aria-label="Cerrar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
