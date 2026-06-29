import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { CotizacionDetalleClient } from "./CotizacionDetalleClient";

interface Props { params: Promise<{ id: string; cotId: string }> }

export default async function CotizacionDetallePage({ params }: Props) {
  const { id, cotId } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const [cot] = await db.select().from(schema.cotizaciones)
    .where(and(eq(schema.cotizaciones.id, cotId), eq(schema.cotizaciones.clienteId, id))).limit(1);
  if (!cot) notFound();

  const [cliente] = await db.select({
    id: schema.clientes.id, nombre: schema.clientes.nombre,
    telefono: schema.clientes.telefono, correo: schema.clientes.correo,
    management: schema.clientes.management, direccionPropiedad: schema.clientes.direccionPropiedad,
    zona: schema.clientes.zona, tipoPropiedad: schema.clientes.tipoPropiedad,
    cantidadHabitaciones: schema.clientes.cantidadHabitaciones,
  }).from(schema.clientes).where(eq(schema.clientes.id, id)).limit(1);

  const lineas = await db.select().from(schema.cotizacionLineas)
    .where(eq(schema.cotizacionLineas.cotizacionId, cotId))
    .orderBy(schema.cotizacionLineas.orden);

  const [vendedor] = await db.select({ nombre: schema.usuarios.nombre, correo: schema.usuarios.correo })
    .from(schema.usuarios).where(eq(schema.usuarios.id, cot.vendedorId)).limit(1);

  return (
    <CotizacionDetalleClient
      cotizacion={JSON.parse(JSON.stringify(cot))}
      cliente={JSON.parse(JSON.stringify(cliente))}
      lineas={JSON.parse(JSON.stringify(lineas))}
      vendedor={JSON.parse(JSON.stringify(vendedor || {}))}
    />
  );
}
