import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { puedeAccederCliente } from "@/lib/permisos";

const MODELO = "claude-sonnet-4-6";

function etapaLabel(e: string): string {
  const m: Record<string, string> = {
    PROSPECTO: "Prospect", PRIMER_CONTACTO: "First Contact",
    DECISOR_IDENTIFICADO: "Decision Maker Identified", MEDIDAS_TOMADAS: "Measurements Taken",
    PROPUESTA_ENVIADA: "Proposal Sent", NEGOCIACION: "Negotiation",
    CONTRATO_ENVIADO: "Contract Sent", CERRADO_GANADO: "Closed Won", CERRADO_PERDIDO: "Closed Lost",
  };
  return m[e] || e;
}

function getNextAction(etapa: string): string {
  const acciones: Record<string, string> = {
    PROPUESTA_ENVIADA: "Follow up on proposal — offer payment plan",
    NEGOCIACION: "Request final decision today",
    CONTRATO_ENVIADO: "Call to confirm signature",
  };
  return acciones[etapa] || "Schedule a follow-up call within 48 hours.";
}

function getObjeccionResponse(ob: string, empresa: string): string {
  const respuestas: Record<string, string> = {
    "Price": `"Let me show you our ROI calculator — we offer 6-12 month plans with no interest."`,
    "Has another provider": `"Many clients came to us when their provider fell short. Would you be open to a comparison?"`,
    "Needs to think about it": `"Of course! Can I send you 2-3 case studies? What's the main thing you need to feel confident?"`,
    "Needs to consult": `"Absolutely. Can I prepare a one-pager to make it easy for them to say yes?"`,
  };
  return respuestas[ob] || `"What would need to happen for you to feel confident moving forward with ${empresa}?"`;
}

function plantillaLocal(funcion: string, cliente: any, empresa: string): string {
  const n = String(cliente.nombre || "");
  const etapa = etapaLabel(String(cliente.etapa || ""));
  const ob = String(cliente.objecion || "none");
  const temp = String(cliente.temperatura || "TIBIO");
  const valor = cliente.valorEstimado ? `$${cliente.valorEstimado}` : "TBD";
  const prox = String(cliente.proximaAccion || "Not defined");

  switch (funcion) {
    case "mensaje":
      return `Hi ${n}! This is [your name] from Ezenty ProCare.\n\nI wanted to follow up regarding our floor protection services for ${empresa}. We're at the ${etapa} stage.\n\nWould you have 15 minutes this week to connect? 🏨\n\n*Add ANTHROPIC_API_KEY for a personalized message.*`;
    case "temperatura":
      const tempLabel = temp === "CALIENTE" ? "🔥 Hot — Act today." : temp === "TIBIO" ? "🟡 Warm — Follow up this week." : "🔵 Cold — Re-engage with a new angle.";
      return `**Assessment for ${n}:**\nStage: ${etapa} | Objection: ${ob}\n\n${tempLabel}\n\n*Add ANTHROPIC_API_KEY for personalized analysis.*`;
    case "proximaAccion":
      const nextAction = getNextAction(String(cliente.etapa || ""));
      const suggestedDate = new Date(Date.now() + 2 * 86400000).toLocaleDateString("en-US");
      return `**Suggested next action for ${n}:**\n\n${nextAction}\n\nSuggested date: ${suggestedDate}\n\n*Add ANTHROPIC_API_KEY for context-aware suggestions.*`;
    case "resumen":
      return `**Summary — ${n}** (${empresa})\n📍 Stage: ${etapa} | ${temp === "CALIENTE" ? "🔥 Hot" : temp === "TIBIO" ? "🟡 Warm" : "🔵 Cold"}\n💰 Value: ${valor}\n⚠️ Objection: ${ob}\n📅 Next: ${prox}\n\n*Add ANTHROPIC_API_KEY for a full AI summary.*`;
    case "objecion":
      return `**Handling objection: "${ob}"**\n\nSuggested response:\n\n${getObjeccionResponse(ob, empresa)}\n\n**Next step:** Follow up within 48 hours.\n\n*Add ANTHROPIC_API_KEY for personalized responses.*`;
    default:
      return "Function not available.";
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  if (!await puedeAccederCliente(session.user.id, (session.user as any).rol, id)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const funcion = String(body?.funcion || "");
  const funciones = ["mensaje", "temperatura", "proximaAccion", "resumen", "objecion"];
  if (!funciones.includes(funcion)) return NextResponse.json({ error: "Función inválida" }, { status: 400 });

  const [cliente] = await db.select().from(schema.clientes)
    .where(and(eq(schema.clientes.id, id), isNull(schema.clientes.eliminadoEn))).limit(1);
  if (!cliente) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const [empresaRow] = cliente.empresaId
    ? await db.select().from(schema.empresas).where(eq(schema.empresas.id, cliente.empresaId)).limit(1)
    : [null];
  const empresaNombre = String(empresaRow?.nombre || cliente.propiedad || "your property");

  const notasList = await db.select({ contenido: schema.notas.contenido, tipo: schema.notas.tipo })
    .from(schema.notas).where(and(eq(schema.notas.clienteId, id), isNull(schema.notas.eliminadoEn)))
    .orderBy(desc(schema.notas.fecha)).limit(5);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      resultado: plantillaLocal(funcion, cliente, empresaNombre),
      fuente: "plantilla_local",
      aviso: "Activa el asistente de IA poniendo tu ANTHROPIC_API_KEY para respuestas más personalizadas.",
    });
  }

  const notasStr = notasList.map((n) => n.contenido).join(" | ") || "none";
  const prompts: Record<string, string> = {
    mensaje: `Write a WhatsApp message (<200 words) for ${cliente.nombre} at ${empresaNombre}. Stage: ${etapaLabel(String(cliente.etapa))}. Objection: ${cliente.objecion || "none"}. Move them to next stage with a clear CTA. Sign as "Ezenty ProCare team".`,
    temperatura: `You are a sales assistant for Ezenty ProCare, a hospitality floor care company. In this CRM, temperature has a specific meaning:
🔥 CALIENTE = Public reviews or site visit confirmed real pain (deteriorated carpet, mold, stains, odors). Top priority.
🟡 TIBIO = Management verified in portfolio OR partial signal in public reviews. Visit soon.
🔵 FRÍO = No confirmed signal yet. Needs an in-person visit to evaluate.

Client: ${cliente.nombre} | Stage: ${etapaLabel(String(cliente.etapa))} | Current temp: ${cliente.temperatura} | Objection: ${cliente.objecion || "none"}
Visit notes and history: ${notasStr || "No notes yet"}

Based on the notes and visit history, should we keep or change the temperature? Respond with:
1) Recommended temperature (🔥/🟡/🔵) + label
2) 2-sentence reason based on what the notes say about floor/surface condition
3) One specific next action`,
    proximaAccion: `Suggest ONE specific next action for ${cliente.nombre} at ${etapaLabel(String(cliente.etapa))} stage. Objection: ${cliente.objecion || "none"}. Be concrete: what, how, when. Under 80 words.`,
    resumen: `Summarize in 3-5 lines: ${cliente.nombre} at ${empresaNombre}, stage ${etapaLabel(String(cliente.etapa))}, value $${cliente.valorEstimado || "TBD"}, objection: ${cliente.objecion || "none"}. Notes: ${notasStr}. Include most important next action.`,
    objecion: `Handle objection "${cliente.objecion}" from ${cliente.nombre}. Write response (<150 words): validate concern, reframe with benefit, end with question that moves sale forward.`,
  };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODELO, max_tokens: 1000, messages: [{ role: "user", content: prompts[funcion] }] }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    const texto = String(data.content?.[0]?.text || plantillaLocal(funcion, cliente, empresaNombre));
    return NextResponse.json({ resultado: texto, fuente: "ia" });
  } catch {
    return NextResponse.json({
      resultado: plantillaLocal(funcion, cliente, empresaNombre),
      fuente: "plantilla_local",
      aviso: "IA no disponible. Usando plantilla local.",
    });
  }
}
