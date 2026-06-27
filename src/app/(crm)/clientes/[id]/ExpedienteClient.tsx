"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, Building2, MapPin, Flame, Thermometer, Tag,
  Calendar, Wallet, FileText, Sparkles, Edit2, Check, X, Plus,
  ChevronDown, MessageCircle, Send, Clock, AlertCircle, Trophy,
  XCircle, Archive, RotateCcw, Loader2, Info, Ruler
} from "lucide-react";
import { formatearDinero, fechaRelativa, tempEmoji, etapaLabel, urlWhatsApp, diasSinContacto } from "@/lib/utils";
import { useToast } from "@/components/providers/ToastProvider";
import { motion, AnimatePresence } from "framer-motion";

const ETAPAS = [
  "PROSPECTO","PRIMER_CONTACTO","DECISOR_IDENTIFICADO","MEDIDAS_TOMADAS",
  "PROPUESTA_ENVIADA","NEGOCIACION","CONTRATO_ENVIADO",
];

const TEMPERATURAS = [
  { val: "CALIENTE", emoji: "🔥", label: "Caliente", cls: "temp-caliente" },
  { val: "TIBIO", emoji: "🟡", label: "Tibio", cls: "temp-tibio" },
  { val: "FRIO", emoji: "🔵", label: "Frío", cls: "temp-frio" },
];

const OBJECIONES = [
  "Price","Has another provider","Needs to think about it",
  "Needs to consult with partner/management","Not qualified","Other",
];

const TIPO_NOTA_ICONS: Record<string,string> = {
  NOTA:"📝",LLAMADA:"📞",WHATSAPP:"💬",SMS:"💬",CORREO:"📧",CITA:"📅",
  PAGO:"💰",CAMBIO_ETAPA:"🔄",CAMBIO_ESTADO:"🏷️",OBJECION:"⚠️",ARCHIVO:"📎",REASIGNACION:"👤",
};

function InfoTooltip({ texto }: { texto: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex ml-1">
      <button
        type="button"
        aria-label="Más información"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <Info className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 text-xs bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg shadow-lg p-2.5 z-50 text-[var(--text-secondary)]">
          {texto}
        </div>
      )}
    </span>
  );
}

function AIPanel({ clienteId, onAccion }: { clienteId: string; onAccion: (texto: string) => void }) {
  const [cargando, setCargando] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const { error } = useToast();

  async function llamarIA(funcion: string) {
    setCargando(funcion);
    setResultado(null);
    try {
      const res = await fetch(`/api/clientes/${clienteId}/ia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funcion }),
      });
      const data = await res.json();
      setResultado(data.resultado);
      setAviso(data.aviso || null);
    } catch {
      error("No se pudo conectar con el asistente.");
    } finally {
      setCargando(null);
    }
  }

  const funciones = [
    { id: "mensaje", label: "✍️ Redactar mensaje", desc: "SMS/correo para cerrar" },
    { id: "temperatura", label: "🌡️ Clasificar temperatura", desc: "🔥 Pain confirmado · 🟡 Señal parcial · 🔵 Sin señal" },
    { id: "proximaAccion", label: "🎯 Sugerir próxima acción", desc: "Qué hacer y cuándo" },
    { id: "resumen", label: "📋 Resumir expediente", desc: "3-5 líneas del historial" },
    { id: "objecion", label: "🛡️ Manejar objeción", desc: "Cómo vencerla" },
  ];

  return (
    <div className="card p-4 border border-marca-200 dark:border-marca-800">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-marca-500" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Asistente IA</h3>
        <span className="text-xs text-[var(--text-muted)]">Tu copiloto de ventas</span>
      </div>

      <div className="grid grid-cols-1 gap-1.5 mb-3">
        {funciones.map((f) => (
          <button
            key={f.id}
            onClick={() => llamarIA(f.id)}
            disabled={!!cargando}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
          >
            {cargando === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> : null}
            <span className="font-medium">{f.label}</span>
            <span className="text-[var(--text-muted)] text-xs ml-auto">{f.desc}</span>
          </button>
        ))}
      </div>

      {aviso && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg mb-3">
          {aviso}
        </p>
      )}

      {resultado && (
        <div className="relative">
          <pre className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] p-3 rounded-lg whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
            {resultado}
          </pre>
          <button
            onClick={() => onAccion(resultado)}
            className="mt-2 btn-primary !py-1.5 !px-3 text-xs w-full justify-center"
          >
            Usar este mensaje
          </button>
        </div>
      )}
    </div>
  );
}

export function ExpedienteClient({ clienteInicial, config, etiquetasDisponibles, plantillas, usuarioActualId, rolActual }: any) {
  const [cliente, setCliente] = useState(clienteInicial);
  const [nuevaNota, setNuevaNota] = useState("");
  const [tipoNota, setTipoNota] = useState("NOTA");
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [mostrarIA, setMostrarIA] = useState(false);
  const [mostrarPago, setMostrarPago] = useState(false);
  const [celebrar, setCelebrar] = useState(false);
  const [editando, setEditando] = useState<Record<string,any>>({});
  const { toast, success, error } = useToast();

  const diasSin = diasSinContacto(cliente.ultimoContacto);
  const pagoTotal = cliente.pagos?.reduce((s: number, p: any) => p.estatus === "PAGADO" ? s + p.monto : s, 0) || 0;
  const pagoEsperado = cliente.valorEstimado || 0;
  const pctPago = pagoEsperado > 0 ? Math.min(Math.round((pagoTotal / pagoEsperado) * 100), 100) : 0;

  // WhatsApp URL
  const config2 = config || {};
  const msgWA = (config2.mensajeWhatsapp || "Hi {nombre}!")
    .replace("{nombre}", cliente.nombre)
    .replace("{empresa}", cliente.empresa?.nombre || cliente.propiedad || "")
    .replace("{etapa}", etapaLabel(cliente.etapa));
  const waUrl = cliente.telefono ? urlWhatsApp(cliente.telefono, msgWA) : null;

  // Email URL
  const emailUrl = cliente.correo
    ? `mailto:${cliente.correo}?subject=Ezenty ProCare — Follow up&body=${encodeURIComponent(`Hi ${cliente.nombre},\n\n`)}`
    : null;

  async function guardarNota() {
    if (!nuevaNota.trim()) return;
    setGuardandoNota(true);
    try {
      const res = await fetch(`/api/clientes/${cliente.id}/notas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: nuevaNota, tipo: tipoNota }),
      });
      if (!res.ok) throw new Error();
      const nota = await res.json();
      setCliente((prev: any) => ({
        ...prev,
        notas_rel: [nota, ...prev.notas_rel],
        ultimoContacto: nota.fecha,
      }));
      setNuevaNota("");
      success("Nota guardada ✓");
    } catch {
      error("No se pudo guardar la nota. Reintenta.");
    } finally {
      setGuardandoNota(false);
    }
  }

  async function cambiarEtapa(etapa: string) {
    const res = await fetch(`/api/clientes/${cliente.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etapa }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCliente((prev: any) => ({ ...prev, etapa: updated.etapa }));
      success(`Etapa actualizada a ${etapaLabel(etapa)}`);
    }
  }

  async function cambiarTemperatura(temp: string) {
    const res = await fetch(`/api/clientes/${cliente.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ temperatura: temp }),
    });
    if (res.ok) {
      setCliente((prev: any) => ({ ...prev, temperatura: temp }));
      success("Temperatura actualizada");
    }
  }

  async function marcarGanado() {
    const res = await fetch(`/api/clientes/${cliente.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "GANADO", etapa: "CERRADO_GANADO" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCliente((prev: any) => ({ ...prev, estado: "GANADO", etapa: "CERRADO_GANADO" }));
      setCelebrar(true);
      setTimeout(() => setCelebrar(false), 3000);
      success(`¡Cerraste a ${cliente.nombre}! 🎉 +${formatearDinero(cliente.valorEstimado || 0)}`);
    }
  }

  async function marcarPerdido(motivo: string) {
    const res = await fetch(`/api/clientes/${cliente.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "PERDIDO", etapa: "CERRADO_PERDIDO", motivoPerdida: motivo }),
    });
    if (res.ok) {
      setCliente((prev: any) => ({ ...prev, estado: "PERDIDO", etapa: "CERRADO_PERDIDO", motivoPerdida: motivo }));
      toast("Cliente marcado como perdido", "info", {
        deshacer: async () => {
          await fetch(`/api/clientes/${cliente.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: "ACTIVO", etapa: "NEGOCIACION" }),
          });
          setCliente((prev: any) => ({ ...prev, estado: "ACTIVO", etapa: "NEGOCIACION" }));
        }
      });
    }
  }

  async function archivar() {
    const res = await fetch(`/api/clientes/${cliente.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "ARCHIVADO" }),
    });
    if (res.ok) {
      setCliente((prev: any) => ({ ...prev, estado: "ARCHIVADO" }));
      toast(`${cliente.nombre} archivado`, "info", {
        deshacer: async () => {
          await fetch(`/api/clientes/${cliente.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: "ACTIVO" }),
          });
          setCliente((prev: any) => ({ ...prev, estado: "ACTIVO" }));
        }
      });
    }
  }

  const tempInfo = TEMPERATURAS.find((t) => t.val === cliente.temperatura);

  return (
    <div className="max-w-4xl mx-auto pb-20 lg:pb-6">
      {/* Confetti celebración */}
      {celebrar && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-6xl"
          >
            🎉
          </motion.div>
        </div>
      )}

      {/* Back */}
      <Link href="/clientes" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Volver a Clientes
      </Link>

      {/* Header del expediente */}
      <div className="card p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{ background: "#7cc2e8" }}>
            {cliente.nombre[0]?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{cliente.nombre}</h1>
              {/* Estado badge */}
              <span className={`badge text-xs ${
                cliente.estado === "GANADO" ? "bg-green-100 text-green-700" :
                cliente.estado === "PERDIDO" ? "bg-gray-100 text-gray-600" :
                cliente.estado === "ARCHIVADO" ? "bg-slate-100 text-slate-500" :
                "bg-marca-100 text-marca-700"
              }`}>
                {cliente.estado === "GANADO" ? "✓ Ganado" :
                 cliente.estado === "PERDIDO" ? "✗ Perdido" :
                 cliente.estado === "ARCHIVADO" ? "📦 Archivado" : "● Activo"}
              </span>
              {/* Temperatura */}
              <button
                onClick={() => {
                  const idx = TEMPERATURAS.findIndex((t) => t.val === cliente.temperatura);
                  const next = TEMPERATURAS[(idx + 1) % TEMPERATURAS.length];
                  cambiarTemperatura(next.val);
                }}
                className={`badge cursor-pointer hover:opacity-80 transition-opacity ${tempInfo?.cls}`}
                title="Clic para cambiar temperatura"
              >
                {tempInfo?.emoji} {tempInfo?.label}
                <InfoTooltip texto="Qué tan cerca está de comprar. 🔥 Caliente = atiéndelo hoy. 🔵 Frío = a futuro. Consejo: gasta tu energía primero en los calientes." />
              </button>
            </div>

            {/* Info básica */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
              {cliente.puesto && <span>{cliente.puesto}</span>}
              {cliente.empresa && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                  {cliente.empresa.nombre}
                </span>
              )}
              {cliente.propiedad && !cliente.empresa && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                  {cliente.propiedad}
                </span>
              )}
              {cliente.zona && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  {cliente.zona}
                </span>
              )}
            </div>

            {/* Contacto */}
            <div className="flex flex-wrap gap-2 mt-2">
              {cliente.telefono && (
                <a href={`sms:${cliente.telefono}`} className="btn-secondary !py-1.5 !px-3 text-xs">
                  <MessageCircle className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
                  SMS
                </a>
              )}
              {emailUrl && (
                <a href={emailUrl} className="btn-secondary !py-1.5 !px-3 text-xs">
                  <Mail className="w-3.5 h-3.5 text-marca-500" aria-hidden="true" />
                  Correo
                </a>
              )}
              {cliente.telefono && (
                <a href={`tel:${cliente.telefono}`} className="btn-secondary !py-1.5 !px-3 text-xs">
                  <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                  {cliente.telefono}
                </a>
              )}
              <Link href={`/clientes/${cliente.id}/medidas`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors">
                <Ruler className="w-3.5 h-3.5" />
                📐 Medidas
              </Link>
            </div>
          </div>

          {/* Valor */}
          {cliente.valorEstimado && (
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {formatearDinero(cliente.valorEstimado)}
              </p>
              <p className="text-xs text-[var(--text-muted)]">valor estimado</p>
            </div>
          )}
        </div>

        {/* Alertas clave */}
        <div className="mt-4 flex flex-wrap gap-2">
          {diasSin > 7 && (
            <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {diasSin} días sin contacto
            </span>
          )}
          {cliente.objecion && (
            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
              Objeción: {cliente.objecion}
            </span>
          )}
          {cliente.proximaAccion && (
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              cliente.proximaAccionFecha && new Date(cliente.proximaAccionFecha) < new Date()
                ? "text-red-600 bg-red-50 dark:bg-red-900/20"
                : "text-marca-600 bg-marca-50 dark:bg-marca-900/20"
            }`}>
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              {cliente.proximaAccion}
              {cliente.proximaAccionFecha && ` — ${new Date(cliente.proximaAccionFecha).toLocaleDateString("en-US")}`}
            </span>
          )}
        </div>
      </div>

      {/* Grid de 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-4">
          {/* Etapa del embudo */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Etapa del embudo</h2>
              <InfoTooltip texto="Arrastra o selecciona en qué etapa del proceso de venta está este cliente." />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ETAPAS.map((etapa) => (
                <button
                  key={etapa}
                  onClick={() => cambiarEtapa(etapa)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    cliente.etapa === etapa
                      ? "bg-marca-300 text-white"
                      : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                  }`}
                >
                  {etapaLabel(etapa)}
                </button>
              ))}
            </div>

            {/* Acciones de estado */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--border)]">
              {cliente.estado !== "GANADO" && (
                <button onClick={marcarGanado} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 transition-colors">
                  <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
                  Marcar como Ganado 🎉
                </button>
              )}
              {cliente.estado !== "PERDIDO" && (
                <button
                  onClick={() => {
                    const motivo = prompt("Motivo de pérdida:\n\n" + ["Price","Has another provider","Needs to think about it","Needs to consult","Not qualified","Other"].join("\n") + "\n\nEscribe el motivo:");
                    if (motivo) marcarPerdido(motivo);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  Marcar como Perdido
                </button>
              )}
              {cliente.estado !== "ARCHIVADO" && (
                <button onClick={archivar} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors">
                  <Archive className="w-3.5 h-3.5" aria-hidden="true" />
                  Archivar
                </button>
              )}
              {cliente.estado !== "ACTIVO" && (
                <button
                  onClick={async () => {
                    await fetch(`/api/clientes/${cliente.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ estado: "ACTIVO", etapa: "PRIMER_CONTACTO" }),
                    });
                    setCliente((p: any) => ({ ...p, estado: "ACTIVO", etapa: "PRIMER_CONTACTO" }));
                    success("Cliente reactivado ✓");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-marca-50 dark:bg-marca-900/20 text-marca-700 dark:text-marca-400 hover:bg-marca-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  Reactivar
                </button>
              )}
            </div>
          </div>

          {/* Pagos */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-500" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Pagos</h2>
                <InfoTooltip texto="Cuánto has cobrado a este cliente. La barra muestra el avance hacia el valor total del trato." />
              </div>
              <button onClick={() => setMostrarPago(!mostrarPago)} className="btn-secondary !py-1 !px-2 text-xs">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Registrar
              </button>
            </div>

            {/* Barra de avance */}
            {pagoEsperado > 0 && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                  <span>Cobrado: {formatearDinero(pagoTotal)}</span>
                  <span>Total: {formatearDinero(pagoEsperado)}</span>
                </div>
                <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                  <div className="h-2 rounded-full bg-amber-400 transition-all" style={{ width: `${pctPago}%` }} />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{pctPago}% cobrado — falta {formatearDinero(pagoEsperado - pagoTotal)}</p>
              </div>
            )}

            {mostrarPago && (
              <PagoForm clienteId={cliente.id} onGuardado={(p) => {
                setCliente((prev: any) => ({ ...prev, pagos: [p, ...prev.pagos] }));
                setMostrarPago(false);
                success("Pago registrado ✓");
              }} />
            )}

            <div className="space-y-2 mt-2">
              {cliente.pagos?.length === 0 && <p className="text-xs text-[var(--text-muted)]">No hay pagos registrados.</p>}
              {cliente.pagos?.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <div>
                    <span className={`badge text-xs mr-2 ${p.estatus === "PAGADO" ? "bg-green-100 text-green-700" : p.estatus === "VENCIDO" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                      {p.estatus === "PAGADO" ? "✓" : p.estatus === "VENCIDO" ? "⚠️" : "⏳"} {p.estatus}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{p.metodo?.replace(/_/g, " ")} · {p.folio}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{formatearDinero(p.monto)}</span>
                    {p.fechaPago && <p className="text-xs text-[var(--text-muted)]">{new Date(p.fechaPago).toLocaleDateString("en-US")}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Línea de tiempo */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-blue-500" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Historial</h2>
            </div>

            {/* Nueva nota */}
            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                {["NOTA","LLAMADA","SMS","CORREO"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTipoNota(t)}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${tipoNota === t ? "bg-marca-300 text-white" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]"}`}
                  >
                    {TIPO_NOTA_ICONS[t]} {t}
                  </button>
                ))}
              </div>
              <textarea
                value={nuevaNota}
                onChange={(e) => setNuevaNota(e.target.value)}
                placeholder="Escribe una nota, llamada, mensaje enviado…"
                className="input resize-none text-sm"
                rows={2}
              />
              <button
                onClick={guardarNota}
                disabled={guardandoNota || !nuevaNota.trim()}
                className="mt-2 btn-primary !py-1.5 !px-3 text-xs"
              >
                {guardandoNota ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Guardar nota
              </button>
            </div>

            <div className="space-y-3">
              {cliente.notas_rel?.length === 0 && (
                <p className="text-xs text-[var(--text-muted)]">No hay notas aún. Registra tu primer contacto.</p>
              )}
              {cliente.notas_rel?.map((nota: any) => (
                <div key={nota.id} className="flex gap-3 pb-3 border-b border-[var(--border)] last:border-0">
                  <span className="text-base flex-shrink-0 mt-0.5">{TIPO_NOTA_ICONS[nota.tipo] || "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{nota.contenido}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {nota.autor?.nombre} · {fechaRelativa(nota.fecha)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          {/* Asistente IA */}
          <button
            onClick={() => setMostrarIA(!mostrarIA)}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-marca-200 dark:border-marca-800 bg-gradient-to-r from-marca-50 to-purple-50 dark:from-marca-900/20 dark:to-purple-900/20 text-sm text-marca-700 dark:text-marca-300 hover:opacity-80 transition-opacity"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              Asistente IA
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${mostrarIA ? "rotate-180" : ""}`} />
          </button>

          {mostrarIA && (
            <AIPanel clienteId={cliente.id} onAccion={(texto) => setNuevaNota(texto)} />
          )}

          {/* Datos del cliente */}
          <div className="card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Datos del cliente</h2>

            {[
              { label: "Correo", val: cliente.correo, icon: Mail },
              { label: "SMS", val: cliente.telefono, icon: Phone },
              { label: "Origen", val: cliente.origen },
              { label: "Canal UTM", val: cliente.utmCanal },
              { label: "Propiedad", val: cliente.propiedad },
              { label: "Management", val: cliente.management },
              { label: "Zona", val: cliente.zona },
              { label: "Título", val: cliente.titulo },
            ].map(({ label, val }) => val ? (
              <div key={label}>
                <p className="text-xs text-[var(--text-muted)]">{label}</p>
                <p className="text-sm text-[var(--text-primary)]">{val}</p>
              </div>
            ) : null)}

            {/* Objeción — editable inline */}
            <div>
              <p className="text-xs text-[var(--text-muted)] flex items-center mb-1">
                Objeción principal
                <InfoTooltip texto="La razón por la que NO te ha comprado. Anótala apenas la oigas: es lo que vas a vencer para cerrar." />
              </p>
              <ObjecionEditor
                valor={cliente.objecion || ""}
                onGuardar={async (val) => {
                  const res = await fetch(`/api/clientes/${cliente.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ objecion: val }),
                  });
                  if (res.ok) {
                    setCliente((p: any) => ({ ...p, objecion: val }));
                    success("Objeción guardada ✓");
                  }
                }}
              />
            </div>

            {/* Próxima acción — editable */}
            <div>
              <p className="text-xs text-[var(--text-muted)] flex items-center mb-1">
                Próxima acción
                <InfoTooltip texto="El siguiente paso con este cliente y cuándo. Si lo dejas vacío, el cliente se te enfría. Siempre déjale una." />
              </p>
              <ProximaAccionEditor
                accion={cliente.proximaAccion || ""}
                fecha={cliente.proximaAccionFecha || ""}
                onGuardar={async (accion, fecha) => {
                  const res = await fetch(`/api/clientes/${cliente.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ proximaAccion: accion, proximaAccionFecha: fecha || null }),
                  });
                  if (res.ok) {
                    setCliente((p: any) => ({ ...p, proximaAccion: accion, proximaAccionFecha: fecha }));
                    success("Próxima acción guardada ✓");
                  }
                }}
              />
            </div>
          </div>

          {/* Etiquetas */}
          {cliente.etiquetas?.length > 0 && (
            <div className="card p-4">
              <h3 className="text-xs text-[var(--text-muted)] mb-2">Etiquetas</h3>
              <div className="flex flex-wrap gap-1.5">
                {cliente.etiquetas.map((ce: any) => (
                  <span key={ce.etiquetaId} className="badge text-xs" style={{ background: ce.etiqueta.color + "20", color: ce.etiqueta.color }}>
                    {ce.etiqueta.nombre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Empresa */}
          {cliente.empresa && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Empresa</h3>
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{cliente.empresa.nombre}</p>
              {cliente.empresa.giro && <p className="text-xs text-[var(--text-muted)]">{cliente.empresa.giro}</p>}
              {cliente.empresa.sitioWeb && (
                <a href={cliente.empresa.sitioWeb} target="_blank" rel="noopener noreferrer" className="text-xs text-marca-500 hover:underline">
                  {cliente.empresa.sitioWeb}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ACCIONES_RAPIDAS = [
  "Schedule site visit", "Follow up on proposal", "Send quote",
  "Demo programada", "Send contract", "Confirm signature",
  "Re-engage — send case study", "Request referral",
];

function ProximaAccionEditor({ accion, fecha, onGuardar }: {
  accion: string; fecha: string; onGuardar: (a: string, f: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [valAccion, setValAccion] = useState(accion);
  const [valFecha, setValFecha] = useState(fecha ? new Date(fecha).toISOString().split("T")[0] : "");
  const vencido = fecha && new Date(fecha) < new Date();

  function guardar() { onGuardar(valAccion, valFecha); setEditando(false); }

  if (!editando) {
    return (
      <button onClick={() => setEditando(true)} className="w-full text-left group" title="Clic para editar">
        {accion ? (
          <div>
            <span className={`text-sm group-hover:underline ${vencido ? "text-red-600 dark:text-red-400 font-medium" : "text-[var(--text-primary)]"}`}>
              {accion}
            </span>
            {fecha && (
              <span className="block text-xs text-[var(--text-muted)] mt-0.5">
                📅 {new Date(fecha).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                {vencido && <span className="text-red-500 ml-1">— Vencida</span>}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-red-500">🟠 Sin próxima acción — define una ahora</span>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 mb-1">
        {ACCIONES_RAPIDAS.map(a => (
          <button key={a} type="button" onClick={() => setValAccion(a)}
            className="text-xs px-2 py-1 rounded-full bg-marca-50 dark:bg-marca-900/20 text-marca-600 dark:text-marca-400 hover:bg-marca-100 transition-colors">
            {a}
          </button>
        ))}
      </div>
      <input className="input text-sm" value={valAccion} onChange={e => setValAccion(e.target.value)}
        placeholder="Describe la próxima acción…" />
      <div>
        <label className="label text-xs">Fecha</label>
        <input type="date" className="input text-sm" value={valFecha} onChange={e => setValFecha(e.target.value)}
          min={new Date().toISOString().split("T")[0]} />
      </div>
      <div className="flex gap-2">
        <button onClick={guardar} className="btn-primary !py-1 !px-3 text-xs">Guardar</button>
        <button onClick={() => { setValAccion(accion); setValFecha(fecha ? new Date(fecha).toISOString().split("T")[0] : ""); setEditando(false); }}
          className="btn-secondary !py-1 !px-3 text-xs">Cancelar</button>
      </div>
    </div>
  );
}


const OBJECIONES_COMUNES = [
  "Price", "Has another provider", "Needs to think about it",
  "Needs to consult with management", "No budget right now",
  "Happy with current provider", "Not interested", "Other",
];

function ObjecionEditor({ valor, onGuardar }: { valor: string; onGuardar: (v: string) => void }) {
  const [editando, setEditando] = useState(false);
  const [val, setVal] = useState(valor);
  function guardar() { onGuardar(val); setEditando(false); }
  if (!editando) {
    return (
      <button onClick={() => setEditando(true)} className="w-full text-left group" title="Clic para editar">
        {valor
          ? <span className="text-sm text-amber-600 dark:text-amber-400 group-hover:underline">{valor}</span>
          : <span className="text-xs text-[var(--text-muted)] italic group-hover:text-marca-500">+ Registrar objeción principal</span>}
      </button>
    );
  }
  return (
    <div className="space-y-2">
      <select value={val} onChange={e => setVal(e.target.value)} className="input text-sm">
        <option value="">Sin objeción principal</option>
        {OBJECIONES_COMUNES.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <input className="input text-sm" value={val} onChange={e => setVal(e.target.value)} placeholder="O escribe una personalizada…" />
      <div className="flex gap-2">
        <button onClick={guardar} className="btn-primary !py-1 !px-3 text-xs">Guardar como principal</button>
        <button onClick={() => { setVal(valor); setEditando(false); }} className="btn-secondary !py-1 !px-3 text-xs">Cancelar</button>
      </div>
    </div>
  );
}


// Mini form de pago
function PagoForm({ clienteId, onGuardado }: { clienteId: string; onGuardado: (p: any) => void }) {
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("TRANSFERENCIA");
  const [estatus, setEstatus] = useState("PAGADO");
  const [guardando, setGuardando] = useState(false);
  const { error } = useToast();

  async function guardar() {
    if (!monto || parseFloat(monto) <= 0) return;
    setGuardando(true);
    try {
      const res = await fetch(`/api/clientes/${clienteId}/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto: parseFloat(monto), metodo, estatus }),
      });
      if (!res.ok) throw new Error();
      const pago = await res.json();
      onGuardado(pago);
    } catch {
      error("No se pudo guardar el pago.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="bg-[var(--bg-secondary)] rounded-lg p-3 mb-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label text-xs">Monto ($)</label>
          <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className="input text-sm" placeholder="0.00" min="0" />
        </div>
        <div>
          <label className="label text-xs">Método</label>
          <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className="input text-sm">
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="MESES_SIN_INTERESES">Meses s/int.</option>
            <option value="DEPOSITO_ANTICIPO">Depósito/Anticipo</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label text-xs">Estatus</label>
        <select value={estatus} onChange={(e) => setEstatus(e.target.value)} className="input text-sm">
          <option value="PAGADO">Pagado ✓</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="VENCIDO">Vencido</option>
        </select>
      </div>
      <button onClick={guardar} disabled={guardando || !monto} className="btn-primary text-xs !py-1.5 w-full justify-center">
        {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Guardar pago"}
      </button>
    </div>
  );
}
