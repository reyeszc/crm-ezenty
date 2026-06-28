"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Users, Plus, Search, Filter, SlidersHorizontal, Star, Flame, ChevronDown, ChevronUp } from "lucide-react";
import { formatearDinero, etapaLabel, tempEmoji, fechaRelativa } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks";

function Skeleton() {
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-3 w-48" />
        </div>
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}


function GruposZona({ grupos, tempConfig }: { grupos: Record<string, any[]>; tempConfig: any }) {
  const [colapsados, setColapsados] = useState<Record<string, boolean>>({});
  const toggle = (z: string) => setColapsados(p => ({ ...p, [z]: !p[z] }));
  const ZONA_EMOJI: Record<string, string> = {
    "Nashville, TN": "🎵",
    "Chattanooga, TN": "🌉",
    "Knoxville, TN": "🏔️",
    "Smokies, TN": "🌲",
    "Atlanta, GA": "🏙️",
    "Alpharetta, GA": "🏘️",
    "Marietta, GA": "🏘️",
    "Savannah, GA": "🌿",
    "Georgia": "🍑",
    "Tennessee": "🎸",
  };

  return (
    <div className="space-y-2">
      {Object.entries(grupos).sort(([a],[b]) => a.localeCompare(b)).map(([zonaGrupo, lista]) => {
        const colapsado = colapsados[zonaGrupo] ?? false;
        const calientes = lista.filter((c: any) => c.temperatura === "CALIENTE").length;
        const tibios = lista.filter((c: any) => c.temperatura === "TIBIO").length;
        return (
          <div key={zonaGrupo} className="card overflow-hidden">
            {/* Header — clickable to collapse */}
            <button
              onClick={() => toggle(zonaGrupo)}
              className="w-full flex items-center gap-3 p-3 hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <span className="text-lg">{ZONA_EMOJI[zonaGrupo] || "📍"}</span>
              <div className="flex-1 text-left min-w-0">
                <span className="text-sm font-bold text-[var(--text-primary)]">{zonaGrupo}</span>
                <span className="text-xs text-[var(--text-muted)] ml-2">{lista.length} propiedades</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {calientes > 0 && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">🔥 {calientes}</span>}
                {tibios > 0 && <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">🟡 {tibios}</span>}
                {colapsado
                  ? <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                  : <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />}
              </div>
            </button>

            {/* Content — collapsible */}
            {!colapsado && (
              <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
                {lista.map((c: any) => {
                  const tc = tempConfig[c.temperatura] || tempConfig.TIBIO;
                  const vencido = c.proximaAccionFecha && new Date(c.proximaAccionFecha) < new Date();
                  return (
                    <div key={c.id} className="p-3 flex items-center gap-3 hover:bg-[var(--bg-secondary)] transition-colors">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm" style={{ background: "#7cc2e8" }}>
                        {c.nombre[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/clientes/${c.id}`} className="font-medium text-sm text-[var(--text-primary)] hover:text-marca-500 hover:underline transition-colors">
                            {c.nombre}
                          </Link>
                          <span className={`badge text-xs ${tc.cls}`}>{tc.label}</span>
                          {vencido && <span className="badge text-xs bg-red-100 text-red-600">⏰</span>}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                          {c.cantidadHabitaciones ? `${c.cantidadHabitaciones} rooms · ` : ""}{c.ciudadCluster || c.propiedad || ""}
                        </p>
                        {c.proximaAccion && (
                          <p className={`text-xs truncate ${vencido ? "text-red-500" : "text-[var(--text-muted)]"}`}>
                            → {c.proximaAccion}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {c.valorEstimado && <p className="text-xs font-semibold text-[var(--text-primary)]">{formatearDinero(c.valorEstimado)}</p>}
                        <p className="text-xs text-[var(--text-muted)]">{etapaLabel(c.etapa)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("ACTIVO");
  const [temperatura, setTemperatura] = useState("");
  const [etapa, setEtapa] = useState("");
  const [orden, setOrden] = useState("reciente");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [zona, setZona] = useState("");
  const [agruparZona, setAgruparZona] = useState(false);

  const busquedaDebounced = useDebounce(busqueda, 300);

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      pagina: String(pagina),
      por_pagina: "25",
      orden,
      ...(busquedaDebounced ? { q: busquedaDebounced } : {}),
      ...(estado ? { estado } : {}),
      ...(temperatura ? { temperatura } : {}),
      ...(etapa ? { etapa } : {}),
      ...(zona ? { zona } : {}),
    });
    try {
      const res = await fetch(`/api/clientes?${params}`);
      const data = await res.json();
      setClientes(data.clientes || []);
      setTotal(data.total || 0);
      setPaginas(data.paginas || 1);
    } finally {
      setLoading(false);
    }
  }, [pagina, busquedaDebounced, estado, temperatura, etapa, orden]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPagina(1); }, [busquedaDebounced, estado, temperatura, etapa]);

  const tempConfig: Record<string, { cls: string; label: string }> = {
    CALIENTE: { cls: "temp-caliente", label: "🔥" },
    TIBIO: { cls: "temp-tibio", label: "🟡" },
    FRIO: { cls: "temp-frio", label: "🔵" },
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-500" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Clientes</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Todas tus personas en un solo lugar — {total} total
            </p>
          </div>
        </div>
        <Link href="/clientes/nuevo" className="btn-primary">
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Nuevo</span>
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, empresa, teléfono…"
            className="input pl-10"
            aria-label="Buscar clientes"
          />
        </div>
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className={`btn-secondary !px-3 ${mostrarFiltros ? "border-marca-300 text-marca-600" : ""}`}
          aria-label="Mostrar filtros"
          aria-expanded={mostrarFiltros}
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Filtros</span>
        </button>
      </div>

      {/* Filters panel */}
      {mostrarFiltros && (
        <div className="card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="label text-xs">Estado</label>
            <select value={estado} onChange={(e) => setEstado(e.target.value)} className="input text-sm">
              <option value="">Todos</option>
              <option value="ACTIVO">Activo</option>
              <option value="GANADO">Ganado</option>
              <option value="PERDIDO">Perdido</option>
              <option value="ARCHIVADO">Archivado</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">Temperatura</label>
            <select value={temperatura} onChange={(e) => setTemperatura(e.target.value)} className="input text-sm">
              <option value="">Todas</option>
              <option value="CALIENTE">🔥 Caliente</option>
              <option value="TIBIO">🟡 Tibio</option>
              <option value="FRIO">🔵 Frío</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">Etapa</label>
            <select value={etapa} onChange={(e) => setEtapa(e.target.value)} className="input text-sm">
              <option value="">Todas</option>
              <option value="PROSPECTO">Prospecto</option>
              <option value="PRIMER_CONTACTO">Primer Contacto</option>
              <option value="PROPUESTA_ENVIADA">Propuesta Enviada</option>
              <option value="NEGOCIACION">Negociación</option>
              <option value="CONTRATO_ENVIADO">Contrato Enviado</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">Zona</label>
            <select value={zona} onChange={(e) => setZona(e.target.value)} className="input text-sm">
              <option value="">Todas las zonas</option>
              <option value="Nashville, TN">Nashville, TN</option>
              <option value="Chattanooga, TN">Chattanooga, TN</option>
              <option value="Knoxville, TN">Knoxville, TN</option>
              <option value="Smokies, TN">Smokies, TN</option>
              <option value="Atlanta, GA">Atlanta, GA</option>
              <option value="Alpharetta, GA">Alpharetta, GA</option>
              <option value="Marietta, GA">Marietta, GA</option>
              <option value="Savannah, GA">Savannah, GA</option>
              <option value="Georgia">Georgia</option>
              <option value="Tennessee">Tennessee</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">Ordenar</label>
            <select value={orden} onChange={(e) => setOrden(e.target.value)} className="input text-sm">
              <option value="reciente">Más reciente</option>
              <option value="nombre">Nombre A-Z</option>
              <option value="valor">Mayor valor</option>
              <option value="fecha">Próxima acción</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setAgruparZona(!agruparZona)}
                className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${agruparZona ? "bg-marca-300" : "bg-gray-300 dark:bg-gray-600"}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${agruparZona ? "translate-x-5" : ""}`} />
              </div>
              <span className="text-xs text-[var(--text-secondary)]">Agrupar por zona</span>
            </label>
          </div>
          {(estado || temperatura || etapa) && (
            <button
              onClick={() => { setEstado(""); setTemperatura(""); setEtapa(""); setZona(""); }}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] underline col-span-2 sm:col-span-4 text-left"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Client list */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)
        ) : clientes.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" aria-hidden="true" />
            <p className="text-[var(--text-secondary)] font-medium mb-1">
              {busqueda ? `No encontré nada con "${busqueda}"` : "No hay clientes aquí"}
            </p>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              {busqueda ? "Revisa cómo lo escribiste o prueba otro término." : "Agrega tu primer cliente para empezar."}
            </p>
            <Link href="/clientes/nuevo" className="btn-primary inline-flex">
              <Plus className="w-4 h-4" />
              Nuevo cliente
            </Link>
          </div>
        ) : (
          agruparZona ? (
            (() => {
              const grupos: Record<string, any[]> = {};
              clientes.forEach((c: any) => {
                const z = c.zona || "Sin zona";
                if (!grupos[z]) grupos[z] = [];
                grupos[z].push(c);
              });
              return (<GruposZona grupos={grupos} tempConfig={tempConfig} />);
            })()
          ) :
          clientes.map((c: any) => {
            const tc = tempConfig[c.temperatura] || tempConfig.TIBIO;
            const vencido = c.proximaAccionFecha && new Date(c.proximaAccionFecha) < new Date();
            return (
              <div key={c.id} className="card hover:shadow-md transition-shadow">
                <div className="p-4 flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm" style={{ background: "#7cc2e8" }}>
                    {c.nombre[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* NAME IS ALWAYS A CLICKABLE LINK */}
                      <Link
                        href={`/clientes/${c.id}`}
                        className="font-medium text-[var(--text-primary)] hover:text-marca-500 hover:underline transition-colors cursor-pointer"
                      >
                        {c.nombre}
                      </Link>
                      <span className={`badge text-xs ${tc.cls}`}>{tc.label}</span>
                      {vencido && (
                        <span className="badge text-xs bg-red-100 text-red-600">⏰ Vencido</span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] truncate mt-0.5">
                      {[c.empresa?.nombre, c.propiedad, c.zona].filter(Boolean).join(" · ") || c.correo || "Sin información adicional"}
                    </p>
                    {c.proximaAccion && (
                      <p className={`text-xs mt-0.5 truncate ${vencido ? "text-red-500" : "text-[var(--text-muted)]"}`}>
                        → {c.proximaAccion}
                      </p>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="text-right flex-shrink-0 ml-2">
                    {c.valorEstimado && (
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {formatearDinero(c.valorEstimado)}
                      </p>
                    )}
                    <p className="text-xs text-[var(--text-muted)]">{etapaLabel(c.etapa)}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {paginas > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1} className="btn-secondary !py-1.5 !px-3 text-sm disabled:opacity-40">
            ← Anterior
          </button>
          <span className="text-sm text-[var(--text-muted)]">
            Página {pagina} de {paginas} — {total} clientes
          </span>
          <button onClick={() => setPagina((p) => Math.min(paginas, p + 1))} disabled={pagina >= paginas} className="btn-secondary !py-1.5 !px-3 text-sm disabled:opacity-40">
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
