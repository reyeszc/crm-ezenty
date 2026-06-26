"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay, closestCorners,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanSquare, Plus, Clock, AlertCircle } from "lucide-react";
import { formatearDinero, etapaLabel, fechaRelativa, tempEmoji } from "@/lib/utils";
import { useToast } from "@/components/providers/ToastProvider";

const ETAPAS_EMBUDO = [
  "PROSPECTO","PRIMER_CONTACTO","DECISOR_IDENTIFICADO","MEDIDAS_TOMADAS",
  "PROPUESTA_ENVIADA","NEGOCIACION","CONTRATO_ENVIADO",
] as const;

const ETAPA_COLORS: Record<string, string> = {
  PROSPECTO: "#94a3b8",
  PRIMER_CONTACTO: "#7cc2e8",
  DECISOR_IDENTIFICADO: "#60a5fa",
  MEDIDAS_TOMADAS: "#818cf8",
  PROPUESTA_ENVIADA: "#a78bfa",
  NEGOCIACION: "#f59e0b",
  CONTRATO_ENVIADO: "#10b981",
};

function ClienteCard({ cliente, isDragging = false }: { cliente: any; isDragging?: boolean }) {
  const vencido = cliente.proximaAccionFecha && new Date(cliente.proximaAccionFecha) < new Date();
  const diasSin = cliente.ultimoContacto
    ? Math.floor((Date.now() - new Date(cliente.ultimoContacto).getTime()) / 86400000)
    : 999;
  const estancado = diasSin >= 7;

  return (
    <div className={`card p-3 cursor-grab active:cursor-grabbing select-none transition-shadow ${isDragging ? "shadow-lg opacity-90 rotate-1" : "hover:shadow-md"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        {/* NAME IS ALWAYS A LINK - even in kanban */}
        <Link
          href={`/clientes/${cliente.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-medium text-[var(--text-primary)] hover:text-marca-500 hover:underline transition-colors leading-tight"
        >
          {cliente.nombre}
        </Link>
        <span className="text-base flex-shrink-0">{tempEmoji(cliente.temperatura)}</span>
      </div>

      {(cliente.empresa?.nombre || cliente.propiedad) && (
        <p className="text-xs text-[var(--text-muted)] mb-1.5 truncate">
          {cliente.empresa?.nombre || cliente.propiedad}
        </p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
        {cliente.valorEstimado && (
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            {formatearDinero(cliente.valorEstimado)}
          </span>
        )}
        {vencido && (
          <span className="badge text-xs bg-red-100 text-red-600">
            <AlertCircle className="w-2.5 h-2.5 mr-0.5" aria-hidden="true" />
            Vencido
          </span>
        )}
        {estancado && !vencido && (
          <span className="badge text-xs bg-amber-100 text-amber-700">
            <Clock className="w-2.5 h-2.5 mr-0.5" aria-hidden="true" />
            {diasSin}d parado
          </span>
        )}
      </div>
    </div>
  );
}

function SortableCard({ cliente }: { cliente: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cliente.id,
    data: { cliente },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ClienteCard cliente={cliente} />
    </div>
  );
}

function Columna({ etapa, clientes }: { etapa: string; clientes: any[] }) {
  const valorTotal = clientes.reduce((s, c) => s + (c.valorEstimado || 0), 0);
  const color = ETAPA_COLORS[etapa] || "#7cc2e8";

  return (
    <div className="flex-shrink-0 w-64 flex flex-col">
      {/* Column header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
            {etapaLabel(etapa)}
          </h3>
          <span className="w-5 h-5 rounded-full bg-[var(--bg-tertiary)] text-xs font-medium text-[var(--text-muted)] flex items-center justify-center flex-shrink-0">
            {clientes.length}
          </span>
        </div>
      </div>
      {valorTotal > 0 && (
        <p className="text-xs text-[var(--text-muted)] px-1 mb-2">
          {formatearDinero(valorTotal)} en esta etapa
        </p>
      )}

      {/* Cards */}
      <div className="flex-1 bg-[var(--bg-secondary)] rounded-xl p-2 min-h-[120px] space-y-2">
        <SortableContext items={clientes.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {clientes.map((cliente) => (
            <SortableCard key={cliente.id} cliente={cliente} />
          ))}
        </SortableContext>
        {clientes.length === 0 && (
          <p className="text-xs text-[var(--text-muted)] text-center pt-4 pb-2">
            Sin clientes aquí
          </p>
        )}
      </div>
    </div>
  );
}

export default function EmbudoPage() {
  const [clientesPorEtapa, setClientesPorEtapa] = useState<Record<string, any[]>>(
    Object.fromEntries(ETAPAS_EMBUDO.map((e) => [e, []]))
  );
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { success, error } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clientes?estado=ACTIVO&por_pagina=100");
      const data = await res.json();
      const mapa: Record<string, any[]> = Object.fromEntries(ETAPAS_EMBUDO.map((e) => [e, []]));
      (data.clientes || []).forEach((c: any) => {
        if (mapa[c.etapa]) mapa[c.etapa].push(c);
      });
      setClientesPorEtapa(mapa);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function findEtapaByClienteId(id: string): string | null {
    for (const [etapa, clientes] of Object.entries(clientesPorEtapa)) {
      if (clientes.find((c) => c.id === id)) return etapa;
    }
    return null;
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const fromEtapa = findEtapaByClienteId(active.id as string);
    const toEtapa = ETAPAS_EMBUDO.includes(over.id as any)
      ? (over.id as string)
      : findEtapaByClienteId(over.id as string);

    if (!fromEtapa || !toEtapa || fromEtapa === toEtapa) return;

    setClientesPorEtapa((prev) => {
      const cliente = prev[fromEtapa].find((c) => c.id === active.id);
      if (!cliente) return prev;
      return {
        ...prev,
        [fromEtapa]: prev[fromEtapa].filter((c) => c.id !== active.id),
        [toEtapa]: [...prev[toEtapa], { ...cliente, etapa: toEtapa }],
      };
    });
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    const toEtapa = ETAPAS_EMBUDO.includes(over.id as any)
      ? (over.id as string)
      : findEtapaByClienteId(over.id as string);

    if (!toEtapa) return;

    const clienteId = active.id as string;

    try {
      await fetch(`/api/clientes/${clienteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapa: toEtapa }),
      });
      success(`Movido a ${etapaLabel(toEtapa)}`);
    } catch {
      error("No se pudo mover el cliente. Recargando…");
      cargar();
    }
  }

  const activeCliente = activeId
    ? Object.values(clientesPorEtapa).flat().find((c) => c.id === activeId)
    : null;

  const totalActivos = Object.values(clientesPorEtapa).flat().length;
  const valorTotal = Object.values(clientesPorEtapa).flat().reduce((s, c) => s + (c.valorEstimado || 0), 0);

  return (
    <div className="h-full flex flex-col pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
            <KanbanSquare className="w-5 h-5 text-purple-500" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Embudo</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Mueve cada cliente hacia la venta — {totalActivos} activos · {formatearDinero(valorTotal)} en juego
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/completados" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors hidden sm:inline">
            Ver completados →
          </Link>
          <Link href="/clientes/nuevo" className="btn-primary !py-2 !px-3 text-sm">
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Nuevo</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ETAPAS_EMBUDO.map((e) => (
            <div key={e} className="flex-shrink-0 w-64">
              <div className="skeleton h-6 w-32 mb-2 rounded" />
              <div className="bg-[var(--bg-secondary)] rounded-xl p-2 space-y-2 min-h-[120px]">
                {[1,2].map((i) => <div key={i} className="skeleton h-20 rounded-lg" />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
            {ETAPAS_EMBUDO.map((etapa) => (
              <Columna key={etapa} etapa={etapa} clientes={clientesPorEtapa[etapa] || []} />
            ))}
          </div>

          <DragOverlay>
            {activeCliente && <ClienteCard cliente={activeCliente} isDragging />}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
