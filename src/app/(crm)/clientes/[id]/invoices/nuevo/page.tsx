import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq, isNull, desc } from "drizzle-orm";
import { NuevoInvoiceClient } from "./NuevoInvoiceClient";

export default async function NuevoInvoicePage({ params, searchParams }:
  { params: Promise<{ id: string }>; searchParams: Promise<{ cotizacionId?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;
  const { cotizacionId } = await searchParams;

  const [cliente] = await db.select().from(schema.clientes).where(eq(schema.clientes.id, id)).limit(1);
  if (!cliente) redirect("/clientes");

  // Get all approved/sent quotes for this client
  const cotizaciones = await db.select().from(schema.cotizaciones)
    .where(eq(schema.cotizaciones.clienteId, id))
    .orderBy(desc(schema.cotizaciones.creadoEn));

  // Get lineas for each cotizacion
  const cotizacionesConLineas = await Promise.all(cotizaciones.map(async (c) => {
    const lineas = await db.select().from(schema.cotizacionLineas)
      .where(eq(schema.cotizacionLineas.cotizacionId, c.id))
      .orderBy(schema.cotizacionLineas.orden);
    return { ...c, lineas };
  }));

  const contactos = await db.select().from(schema.contactos)
    .where(eq(schema.contactos.clienteId, id));

  return (
    <NuevoInvoiceClient
      cliente={JSON.parse(JSON.stringify(cliente))}
      cotizaciones={JSON.parse(JSON.stringify(cotizacionesConLineas))}
      contactos={JSON.parse(JSON.stringify(contactos))}
      cotizacionIdInicial={cotizacionId || null}
    />
  );
}
