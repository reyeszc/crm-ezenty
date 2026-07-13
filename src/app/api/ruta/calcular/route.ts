import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

interface ParadaInput { id: string; nombre: string; direccion: string; }

async function getDistanceMatrix(origins: string[], destinations: string[], apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins.join("|")}&destinations=${destinations.join("|")}&units=metric&key=${apiKey}`;
  const res = await fetch(url);
  return res.json();
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Google Maps API no configurada" }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body?.origen || !body?.paradas?.length) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const origenStr = typeof body.origen === "string" ? body.origen : `${body.origen.lat},${body.origen.lng}`;
  const paradas: ParadaInput[] = body.paradas;
  // "cercano" = nearest neighbor (default), "lejano" = farthest first
  const modo: "cercano" | "lejano" = body.modo || "cercano";

  try {
    let restantes = [...paradas];
    let actual = origenStr;
    const ordenFinal: any[] = [];

    while (restantes.length > 0) {
      const destinos = restantes.map(p => p.direccion);
      const matrix = await getDistanceMatrix([actual], destinos, apiKey);

      if (matrix.status !== "OK" || !matrix.rows[0]) {
        return NextResponse.json({ error: "No se pudo calcular distancias. Verifica las direcciones." }, { status: 400 });
      }

      const elementos = matrix.rows[0].elements;
      let elegidoIdx = -1;
      let elegidoTiempo = modo === "cercano" ? Infinity : -Infinity;
      let elegidoDistKm = 0;
      let elegidoDurMin = 0;

      elementos.forEach((el: any, idx: number) => {
        if (el.status !== "OK") return;
        const t = el.duration.value;
        const esM = modo === "cercano" ? t < elegidoTiempo : t > elegidoTiempo;
        if (esM) {
          elegidoTiempo = t;
          elegidoIdx = idx;
          elegidoDistKm = el.distance.value / 1000;
          elegidoDurMin = t / 60;
        }
      });

      if (elegidoIdx === -1) {
        restantes.forEach(p => ordenFinal.push({ ...p, distanciaKm: null, duracionMin: null }));
        break;
      }

      const siguiente = restantes[elegidoIdx];
      ordenFinal.push({ ...siguiente, distanciaKm: elegidoDistKm, duracionMin: elegidoDurMin });
      actual = siguiente.direccion;
      restantes = restantes.filter((_, i) => i !== elegidoIdx);
    }

    return NextResponse.json({
      paradas: ordenFinal,
      tiempoTotalMin: ordenFinal.reduce((s, p) => s + (p.duracionMin || 0), 0),
      distanciaTotalKm: ordenFinal.reduce((s, p) => s + (p.distanciaKm || 0), 0),
    });
  } catch (err: any) {
    console.error("Route calc error:", err);
    return NextResponse.json({ error: "Error calculando la ruta" }, { status: 500 });
  }
}
