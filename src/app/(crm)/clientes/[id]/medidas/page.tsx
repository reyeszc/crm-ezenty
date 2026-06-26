import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq, and, isNull } from "drizzle-orm";
import { MedidasClient } from "./MedidasClient";

interface Props { params: Promise<{ id: string }> }

export default async function MedidasPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const [cliente] = await db.select({ id: schema.clientes.id, nombre: schema.clientes.nombre })
    .from(schema.clientes).where(and(eq(schema.clientes.id, id), isNull(schema.clientes.eliminadoEn))).limit(1);
  if (!cliente) notFound();

  return <MedidasClient clienteId={id} clienteNombre={cliente.nombre} />;
}
