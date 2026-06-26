import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea moneda */
export function formatearDinero(
  valor: number,
  moneda = "USD",
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

/** Formatea fecha relativa en español */
export function fechaRelativa(fecha: Date | string): string {
  const d = new Date(fecha);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours} h`;
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;

  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  if (year === now.getFullYear()) {
    return `${day} ${month}`;
  }
  return `${day} ${month} ${year}`;
}

/** Temperatura emoji */
export function tempEmoji(temp: string): string {
  if (temp === "CALIENTE") return "🔥";
  if (temp === "TIBIO") return "🟡";
  return "🔵";
}

/** Etapa en texto legible */
export function etapaLabel(etapa: string): string {
  const map: Record<string, string> = {
    PROSPECTO: "Prospecto",
    PRIMER_CONTACTO: "Primer Contacto",
    DECISOR_IDENTIFICADO: "Decisor Identificado",
    MEDIDAS_TOMADAS: "Medidas Tomadas",
    PROPUESTA_ENVIADA: "Propuesta Enviada",
    NEGOCIACION: "Negociación",
    CONTRATO_ENVIADO: "Contrato Enviado",
    CERRADO_GANADO: "Cerrado Ganado",
    CERRADO_PERDIDO: "Cerrado Perdido",
  };
  return map[etapa] || etapa;
}

/** Codifica texto para URL de WhatsApp */
export function codificarWA(texto: string): string {
  return encodeURIComponent(texto);
}

/** Construye URL de WhatsApp */
export function urlWhatsApp(telefono: string, mensaje: string): string {
  const tel = telefono.replace(/\D/g, "");
  return `https://wa.me/${tel}?text=${codificarWA(mensaje)}`;
}

/** Número de días sin contacto */
export function diasSinContacto(ultimoContacto: Date | string | null): number {
  if (!ultimoContacto) return 999;
  const diff = Date.now() - new Date(ultimoContacto).getTime();
  return Math.floor(diff / 86400000);
}

/** Truncar texto */
export function truncar(texto: string, max = 60): string {
  if (texto.length <= max) return texto;
  return texto.slice(0, max) + "…";
}
