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

  const [vendedor] = await db.select({ nombre: schema.usuarios.nombre, correo: schema.usuarios.correo, titulo: schema.usuarios.titulo })
    .from(schema.usuarios).where(eq(schema.usuarios.id, cot.vendedorId)).limit(1);

  // Use contact stored on the quote first, fallback to client's primary contact
  const cotObj = JSON.parse(JSON.stringify(cot));
  if ((cot as any).contactoNombre) {
    cotObj.contactoPrincipal = {
      nombre: (cot as any).contactoNombre,
      cargo: (cot as any).contactoPuesto || null,
      correo: (cot as any).contactoCorreo || null,
      telefono: (cot as any).contactoTelefono || null,
    };
  } else {
    const contactos = await db.select().from(schema.contactos)
      .where(eq(schema.contactos.clienteId, id))
      .orderBy(schema.contactos.principal)
      .limit(5);
    const contactoPrincipal = contactos.find(c => c.principal) || contactos[0] || null;
    if (contactoPrincipal) cotObj.contactoPrincipal = JSON.parse(JSON.stringify(contactoPrincipal));
  }

  return (
    <CotizacionDetalleClient
      cotizacion={cotObj}
      cliente={JSON.parse(JSON.stringify(cliente))}
      lineas={JSON.parse(JSON.stringify(lineas))}
      vendedor={JSON.parse(JSON.stringify(vendedor || {}))}
    />
  );
}
