import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { MedidaDetalleClient } from "./MedidaDetalleClient";

interface Props { params: Promise<{ id: string; medidaId: string }> }

export default async function MedidaDetallePage({ params }: Props) {
  const { id, medidaId } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const [cliente] = await db.select({ id: schema.clientes.id, nombre: schema.clientes.nombre })
    .from(schema.clientes).where(eq(schema.clientes.id, id)).limit(1);
  if (!cliente) notFound();

  const [medida] = await db.select().from(schema.medidasPropiedad).where(eq(schema.medidasPropiedad.id, medidaId)).limit(1);
  if (!medida) notFound();

  const areas = await db.select().from(schema.medidasAreas)
    .where(eq(schema.medidasAreas.medidaId, medidaId)).orderBy(asc(schema.medidasAreas.orden));

  const areasConLineas = await Promise.all(areas.map(async (a) => {
    const lineas = await db.select().from(schema.medidasLineas)
      .where(eq(schema.medidasLineas.areaId, a.id)).orderBy(asc(schema.medidasLineas.orden));
    return { ...a, lineas };
  }));

  return (
    <MedidaDetalleClient
      cliente={JSON.parse(JSON.stringify(cliente))}
      medida={JSON.parse(JSON.stringify(medida))}
      areasIniciales={JSON.parse(JSON.stringify(areasConLineas))}
    />
  );
}
