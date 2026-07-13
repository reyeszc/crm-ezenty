import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { CotizacionClient } from "./CotizacionClient";

interface Props { params: Promise<{ id: string }> }

export default async function CotizacionPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const [cliente] = await db.select({
    id: schema.clientes.id, nombre: schema.clientes.nombre,
    propiedad: schema.clientes.propiedad, zona: schema.clientes.zona,
    management: schema.clientes.management,
    cantidadHabitaciones: schema.clientes.cantidadHabitaciones,
    direccionPropiedad: schema.clientes.direccionPropiedad,
    tipoPropiedad: schema.clientes.tipoPropiedad,
    ciudadCluster: schema.clientes.ciudadCluster,
  }).from(schema.clientes)
    .where(and(eq(schema.clientes.id, id), isNull(schema.clientes.eliminadoEn))).limit(1);
  if (!cliente) notFound();

  // Get contacts
  const contactos = await db.select().from(schema.contactos)
    .where(eq(schema.contactos.clienteId, id))
    .orderBy(schema.contactos.principal);

  // Get latest medidas
  const medidas = await db.select().from(schema.medidasPropiedad)
    .where(eq(schema.medidasPropiedad.clienteId, id))
    .orderBy(desc(schema.medidasPropiedad.creadoEn)).limit(5);

  // Get areas for each medida
  const medidasConAreas = await Promise.all(medidas.map(async (m) => {
    const areas = await db.select().from(schema.medidasAreas)
      .where(eq(schema.medidasAreas.medidaId, m.id));
    return { ...m, areas };
  }));

  // Get existing quotes
  const cotizaciones = await db.select().from(schema.cotizaciones)
    .where(and(eq(schema.cotizaciones.clienteId, id), isNull(schema.cotizaciones.eliminadoEn)))
    .orderBy(desc(schema.cotizaciones.creadoEn));

  return (
    <CotizacionClient
      cliente={JSON.parse(JSON.stringify(cliente))}
      medidas={JSON.parse(JSON.stringify(medidasConAreas))}
      cotizacionesPrevias={JSON.parse(JSON.stringify(cotizaciones))}
      contactos={JSON.parse(JSON.stringify(contactos))}
      vendedorId={session.user.id}
    />
  );
}
