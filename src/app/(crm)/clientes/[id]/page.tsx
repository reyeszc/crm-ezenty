import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { puedeAccederCliente } from "@/lib/permisos";
import { ExpedienteClient } from "./ExpedienteClient";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [c] = await db.select({ nombre: schema.clientes.nombre }).from(schema.clientes).where(eq(schema.clientes.id, id)).limit(1);
  return { title: c?.nombre || "Cliente" };
}

export default async function ExpedientePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();
  const rol = (session.user as any).rol;
  if (!await puedeAccederCliente(session.user.id, rol, id)) notFound();

  const [cliente] = await db.select().from(schema.clientes)
    .where(and(eq(schema.clientes.id, id), isNull(schema.clientes.eliminadoEn))).limit(1);
  if (!cliente) notFound();

  const [empresa, vendedor, notasList, citasList, pagosList, etiquetasList] = await Promise.all([
    cliente.empresaId ? db.select().from(schema.empresas).where(eq(schema.empresas.id, cliente.empresaId)).limit(1) : Promise.resolve([]),
    db.select({ id: schema.usuarios.id, nombre: schema.usuarios.nombre }).from(schema.usuarios).where(eq(schema.usuarios.id, cliente.vendedorId)).limit(1),
    db.select({ id: schema.notas.id, contenido: schema.notas.contenido, tipo: schema.notas.tipo, fecha: schema.notas.fecha, autorId: schema.notas.autorId, autorNombre: schema.usuarios.nombre })
      .from(schema.notas).leftJoin(schema.usuarios, eq(schema.notas.autorId, schema.usuarios.id))
      .where(and(eq(schema.notas.clienteId, id), isNull(schema.notas.eliminadoEn)))
      .orderBy(desc(schema.notas.fecha)),
    db.select().from(schema.citas).where(and(eq(schema.citas.clienteId, id), isNull(schema.citas.eliminadoEn))).limit(10),
    db.select().from(schema.pagos).where(and(eq(schema.pagos.clienteId, id), isNull(schema.pagos.eliminadoEn))),
    db.select({ clienteId: schema.clienteEtiquetas.clienteId, etiquetaId: schema.clienteEtiquetas.etiquetaId, nombre: schema.etiquetas.nombre, color: schema.etiquetas.color })
      .from(schema.clienteEtiquetas).leftJoin(schema.etiquetas, eq(schema.clienteEtiquetas.etiquetaId, schema.etiquetas.id))
      .where(eq(schema.clienteEtiquetas.clienteId, id)),
  ]);

  const [config] = await db.select().from(schema.configNegocio).where(eq(schema.configNegocio.id, "singleton")).limit(1);
  const plantillas = await db.select().from(schema.plantillas).where(eq(schema.plantillas.esGlobal, true));

  const clienteData = {
    ...cliente,
    empresa: empresa[0] || null,
    vendedor: vendedor[0] || null,
    notas_rel: notasList.map(n => ({ ...n, autor: { id: n.autorId, nombre: n.autorNombre } })),
    citas: citasList,
    pagos: pagosList,
    etiquetas: etiquetasList.map(e => ({ etiquetaId: e.etiquetaId, etiqueta: { nombre: e.nombre, color: e.color } })),
    archivos: [],
    tareas: [],
  };

  return (
    <ExpedienteClient
      clienteInicial={JSON.parse(JSON.stringify(clienteData))}
      config={JSON.parse(JSON.stringify(config || {}))}
      etiquetasDisponibles={[]}
      plantillas={plantillas}
      usuarioActualId={session.user.id}
      rolActual={rol}
    />
  );
}
