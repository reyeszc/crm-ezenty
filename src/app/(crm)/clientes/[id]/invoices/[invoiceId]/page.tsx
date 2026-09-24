import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { InvoiceDetalleClient } from "./InvoiceDetalleClient";

export default async function InvoiceDetallePage({ params }: { params: Promise<{ id: string; invoiceId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id, invoiceId } = await params;

  const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, invoiceId)).limit(1);
  if (!invoice) redirect(`/clientes/${id}`);

  const [cliente] = await db.select().from(schema.clientes).where(eq(schema.clientes.id, id)).limit(1);
  const lineas = await db.select().from(schema.invoiceLineas).where(eq(schema.invoiceLineas.invoiceId, invoiceId)).orderBy(schema.invoiceLineas.orden);
  const [vendedor] = await db.select({ nombre: schema.usuarios.nombre, correo: schema.usuarios.correo, titulo: schema.usuarios.titulo })
    .from(schema.usuarios).where(eq(schema.usuarios.id, invoice.vendedorId)).limit(1);

  return (
    <InvoiceDetalleClient
      invoice={JSON.parse(JSON.stringify(invoice))}
      cliente={JSON.parse(JSON.stringify(cliente))}
      lineas={JSON.parse(JSON.stringify(lineas))}
      vendedor={JSON.parse(JSON.stringify(vendedor || {}))}
    />
  );
}
