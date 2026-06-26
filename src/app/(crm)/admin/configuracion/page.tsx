import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ConfigForm } from "./ConfigForm";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export default async function ConfigPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).rol !== "ADMIN") redirect("/dashboard");
  const [config] = await db.select().from(schema.configNegocio).where(eq(schema.configNegocio.id, "singleton")).limit(1);
  return <ConfigForm configInicial={JSON.parse(JSON.stringify(config || {}))} />;
}
