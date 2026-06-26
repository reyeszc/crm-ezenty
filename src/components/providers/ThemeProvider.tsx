"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Tema = "CLARO" | "OSCURO" | "AUTOMATICO";

interface ThemeContextValue {
  tema: Tema;
  setTema: (t: Tema) => void;
  temaEfectivo: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>({
  tema: "AUTOMATICO",
  setTema: () => {},
  temaEfectivo: "light",
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTemaState] = useState<Tema>("AUTOMATICO");
  const [temaEfectivo, setTemaEfectivo] = useState<"light" | "dark">("light");

  // Aplicar tema al montar
  useEffect(() => {
    const saved = (localStorage.getItem("tema") as Tema) || "AUTOMATICO";
    setTemaState(saved);
    aplicarTema(saved);

    // Escuchar cambios del sistema
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const current = (localStorage.getItem("tema") as Tema) || "AUTOMATICO";
      if (current === "AUTOMATICO") aplicarTema("AUTOMATICO");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function aplicarTema(t: Tema) {
    const isDark =
      t === "OSCURO" ||
      (t === "AUTOMATICO" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", isDark);
    setTemaEfectivo(isDark ? "dark" : "light");
  }

  function setTema(t: Tema) {
    setTemaState(t);
    localStorage.setItem("tema", t);
    aplicarTema(t);

    // Persistir en servidor (best-effort)
    fetch("/api/usuario/tema", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tema: t }),
    }).catch(() => {});
  }

  return (
    <ThemeContext.Provider value={{ tema, setTema, temaEfectivo }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTema = () => useContext(ThemeContext);
