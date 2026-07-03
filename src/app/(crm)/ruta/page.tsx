"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Navigation, Loader2, X, GripVertical, Clock, RouteIcon } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

interface Cliente {
  id: string; nombre: string; zona: string; direccionPropiedad: string;
  propiedad: string; temperatura: string;
}

interface Parada extends Cliente {
  orden: number;
  distanciaKm?: number;
  duracionMin?: number;
}

export default function RutaPage() {
  const { success, error } = useToast();
  const [zona, setZona] = useState("");
  const [zonasDisponibles, setZonasDisponibles] = useState<string[]>([]);
  const [clientesZona, setClientesZona] = useState<Cliente[]>([]);
  const searchParams = useSearchParams();
  const [seleccionados, setSeleccionados] = useState<Set<string>>(() => {
    const ids = searchParams.getAll("id");
    return ids.length > 0 ? new Set(ids) : new Set();
  });
  const [puntoPartida, setPuntoPartida] = useState("");
  const [usarGPS, setUsarGPS] = useState(true);
  const [coordsGPS, setCoordsGPS] = useState<{lat: number, lng: number} | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [ruta, setRuta] = useState<Parada[] | null>(null);
  const preseleccionados = searchParams.getAll("id");
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [tiempoTotal, setTiempoTotal] = useState<number | null>(null);
  const [distanciaTotal, setDistanciaTotal] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/clientes/zonas").then(r => r.json()).then(d => setZonasDisponibles(d.zonas || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (usarGPS && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoordsGPS({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { setUsarGPS(false); }
      );
    }
  }, [usarGPS]);

  useEffect(() => {
    if (!zona) { setClientesZona([]); return; }
    setLoadingClientes(true);
    fetch(`/api/clientes?zona=${encodeURIComponent(zona)}&estado=OPERATIVOS&por_pagina=100`)
      .then(r => r.json())
      .then(d => setClientesZona(d.clientes || []))
      .finally(() => setLoadingClientes(false));
  }, [zona]);

  function toggleSeleccion(id: string) {
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function seleccionarTodos() {
    if (seleccionados.size === clientesZona.length) setSeleccionados(new Set());
    else setSeleccionados(new Set(clientesZona.map(c => c.id)));
  }

  async function calcularRuta() {
    if (seleccionados.size === 0) { error("Selecciona al menos un hotel"); return; }
    if (!usarGPS && !puntoPartida.trim()) { error("Ingresa tu punto de partida"); return; }
    if (usarGPS && !coordsGPS) { error("No se pudo obtener tu ubicación GPS. Intenta con dirección manual."); return; }

    setCalculando(true);
    setRuta(null);
    try {
      const clientesSeleccionados = clientesZona.filter(c => seleccionados.has(c.id));
      const res = await fetch("/api/ruta/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origen: usarGPS ? coordsGPS : puntoPartida,
          paradas: clientesSeleccionados.map(c => ({
            id: c.id, nombre: c.nombre,
            direccion: c.direccionPropiedad || `${c.nombre}, ${c.zona}`,
          })),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error calculando ruta");
      }
      const data = await res.json();
      setRuta(data.paradas);
      setTiempoTotal(data.tiempoTotalMin);
      setDistanciaTotal(data.distanciaTotalKm);
      success("Ruta calculada ✓");
    } catch (e: any) {
      error(e.message || "No se pudo calcular la ruta");
    } finally {
      setCalculando(false);
    }
  }

  function abrirEnMaps() {
    if (!ruta) return;
    const waypoints = ruta.map(p => encodeURIComponent(p.direccionPropiedad || p.nombre)).join("/");
    const origen = usarGPS ? "Current+Location" : encodeURIComponent(puntoPartida);
    window.open(`https://www.google.com/maps/dir/${origen}/${waypoints}`, "_blank");
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
          <RouteIcon className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Planear Ruta</h1>
          <p className="text-sm text-[var(--text-secondary)]">Orden óptimo de visita con mapa y tiempos</p>
        </div>
      </div>

      {/* Step 1: Origin */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">📍 Punto de partida</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={usarGPS} onChange={() => setUsarGPS(true)} />
            <span className="text-sm text-[var(--text-secondary)]">
              Mi ubicación actual {coordsGPS ? "✓" : usarGPS ? "(obteniendo...)" : ""}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={!usarGPS} onChange={() => setUsarGPS(false)} />
            <span className="text-sm text-[var(--text-secondary)]">Otra dirección</span>
          </label>
          {!usarGPS && (
            <input className="input text-sm" placeholder="Hotel, dirección o ciudad de partida…"
              value={puntoPartida} onChange={e => setPuntoPartida(e.target.value)} />
          )}
        </div>
      </div>

      {/* Step 2: Zone + selection */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">🏨 Seleccionar hoteles</h2>
        <select className="input text-sm mb-3" value={zona} onChange={e => { setZona(e.target.value); setSeleccionados(new Set()); setRuta(null); }}>
          <option value="">Selecciona una zona…</option>
          {zonasDisponibles.map(z => <option key={z} value={z}>{z}</option>)}
        </select>

        {loadingClientes ? (
          <div className="text-center py-6 text-sm text-[var(--text-muted)]">Cargando hoteles…</div>
        ) : zona && clientesZona.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-muted)]">{clientesZona.length} hoteles en {zona}</span>
              <button onClick={seleccionarTodos} className="text-xs text-marca-500 hover:underline">
                {seleccionados.size === clientesZona.length ? "Deseleccionar todos" : "Seleccionar todos"}
              </button>
            </div>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {clientesZona.map(c => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                  <input type="checkbox" checked={seleccionados.has(c.id)} onChange={() => toggleSeleccion(c.id)} className="rounded" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-[var(--text-primary)]">{c.nombre}</span>
                    {!c.direccionPropiedad && <span className="text-xs text-amber-500 ml-2">⚠️ Sin dirección</span>}
                  </div>
                </label>
              ))}
            </div>
          </>
        ) : zona ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">No hay hoteles en esta zona</p>
        ) : null}
      </div>

      {/* Calculate button */}
      <button onClick={calcularRuta} disabled={calculando || seleccionados.size === 0}
        className="btn-primary w-full justify-center text-base py-3 disabled:opacity-40">
        {calculando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
        {calculando ? "Calculando ruta…" : `Calcular ruta (${seleccionados.size} paradas)`}
      </button>

      {/* Results */}
      {ruta && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">🗺️ Orden de visita</h2>
            <button onClick={abrirEnMaps} className="text-xs text-marca-500 hover:underline flex items-center gap-1">
              Abrir en Google Maps →
            </button>
          </div>

          {(tiempoTotal || distanciaTotal) && (
            <div className="flex gap-3 mb-3 text-xs text-[var(--text-secondary)]">
              {tiempoTotal && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{Math.round(tiempoTotal)} min total</span>}
              {distanciaTotal && <span>· {distanciaTotal.toFixed(1)} km</span>}
            </div>
          )}

          <div className="space-y-2">
            {ruta.map((p, i) => (
              <Link key={p.id} href={`/clientes/${p.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: "#7cc2e8" }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{p.nombre}</p>
                  {p.duracionMin != null && (
                    <p className="text-xs text-[var(--text-muted)]">
                      {i === 0 ? "Desde tu ubicación: " : "Desde la parada anterior: "}
                      ~{Math.round(p.duracionMin)} min{p.distanciaKm ? ` · ${p.distanciaKm.toFixed(1)} km` : ""}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
