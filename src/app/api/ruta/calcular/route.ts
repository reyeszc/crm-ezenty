import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

interface ParadaInput { id: string; nombre: string; direccion: string; }

async function geocode(address: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "OK" && data.results[0]) {
    const loc = data.results[0].geometry.location;
    return { lat: loc.lat, lng: loc.lng };
  }
  return null;
}

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

  try {
    // Build list of all points: origin + all stops
    const direcciones = paradas.map(p => p.direccion);
    let restantes = [...paradas];
    let actual = origenStr;
    const ordenFinal: any[] = [];

    // Nearest-neighbor greedy algorithm using Distance Matrix
    while (restantes.length > 0) {
      const destinos = restantes.map(p => p.direccion);
      const matrix = await getDistanceMatrix([actual], destinos, apiKey);

      if (matrix.status !== "OK" || !matrix.rows[0]) {
        return NextResponse.json({ error: "No se pudo calcular distancias. Verifica las direcciones." }, { status: 400 });
      }

      const elementos = matrix.rows[0].elements;
      let mejorIdx = -1;
      let mejorTiempo = Infinity;
      let mejorDistKm = 0;
      let mejorDurMin = 0;

      elementos.forEach((el: any, idx: number) => {
        if (el.status === "OK" && el.duration.value < mejorTiempo) {
          mejorTiempo = el.duration.value;
          mejorIdx = idx;
          mejorDistKm = el.distance.value / 1000;
          mejorDurMin = el.duration.value / 60;
        }
      });

      if (mejorIdx === -1) {
        // Couldn't route to remaining stops, add them without distance info
        restantes.forEach(p => ordenFinal.push({ ...p, distanciaKm: null, duracionMin: null }));
        break;
      }

      const siguienteParada = restantes[mejorIdx];
      ordenFinal.push({ ...siguienteParada, distanciaKm: mejorDistKm, duracionMin: mejorDurMin });
      actual = siguienteParada.direccion;
      restantes = restantes.filter((_, i) => i !== mejorIdx);
    }

    const tiempoTotalMin = ordenFinal.reduce((s, p) => s + (p.duracionMin || 0), 0);
    const distanciaTotalKm = ordenFinal.reduce((s, p) => s + (p.distanciaKm || 0), 0);

    return NextResponse.json({
      paradas: ordenFinal,
      tiempoTotalMin,
      distanciaTotalKm,
    });
  } catch (err: any) {
    console.error("Route calc error:", err);
    return NextResponse.json({ error: "Error calculando la ruta" }, { status: 500 });
  }
}
