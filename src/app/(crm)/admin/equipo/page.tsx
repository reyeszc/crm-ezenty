import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { EquipoClient } from "./EquipoClient";

export default async function EquipoPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).rol !== "ADMIN") redirect("/dashboard");

  const usuarios = await db.select({
    id: schema.usuarios.id,
    nombre: schema.usuarios.nombre,
    correo: schema.usuarios.correo,
    rol: schema.usuarios.rol,
    activo: schema.usuarios.activo,
    metaMensual: schema.usuarios.metaMensual,
    titulo: schema.usuarios.titulo,
    creadoEn: schema.usuarios.creadoEn,
  }).from(schema.usuarios).orderBy(schema.usuarios.creadoEn);

  return <EquipoClient usuariosIniciales={JSON.parse(JSON.stringify(usuarios))} />;
}
