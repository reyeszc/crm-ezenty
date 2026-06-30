import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [usuario] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.id, session.user.id)).limit(1);

  return NextResponse.json({
    id: usuario?.id,
    nombre: usuario?.nombre,
    titulo: usuario?.titulo,
    correo: usuario?.correo,
  });
}
