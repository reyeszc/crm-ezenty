import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and, isNull } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).rol !== "ADMIN") {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key no configurada" }, { status: 500 });

  // Get all clients without address
  const clientes = await db.select({
    id: schema.clientes.id,
    nombre: schema.clientes.nombre,
    zona: schema.clientes.zona,
    propiedad: schema.clientes.propiedad,
  }).from(schema.clientes)
    .where(and(
      isNull(schema.clientes.eliminadoEn),
      isNull(schema.clientes.direccionPropiedad),
    ))
    .limit(120);

  let actualizados = 0;
  let errores = 0;

  for (const cliente of clientes) {
    const query = `${cliente.nombre}, ${cliente.zona || "TN"}`;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "OK" && data.results[0]) {
        const result = data.results[0];
        const direccion = result.formatted_address;
        const lat = result.geometry.location.lat;
        const lng = result.geometry.location.lng;

        await db.update(schema.clientes).set({
          direccionPropiedad: direccion,
          latitud: lat,
          longitud: lng,
        }).where(eq(schema.clientes.id, cliente.id));

        actualizados++;
      } else {
        errores++;
      }
    } catch {
      errores++;
    }

    // Small delay to respect rate limits
    await new Promise(r => setTimeout(r, 100));
  }

  return NextResponse.json({ actualizados, errores, total: clientes.length });
}
