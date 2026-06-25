import type { Metadata } from "next";
import { LandingClient } from "./LandingClient";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Ezenty ProCare — Protecting Floor Assets",
    description: "Professional floor care for hospitality properties. Carpet cleaning, tile & grout, upholstery and odor control.",
    openGraph: {
      title: "Ezenty ProCare — Schedule Your Consultation",
      description: "Protecting Floor Assets. Supporting Facility Standards.",
      type: "website",
    },
  };
}

export default async function LandingPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const utmCanal = params.utm_source || params.ref || null;
  const [config] = await db.select({ nombreNegocio: schema.configNegocio.nombreNegocio, colorMarca: schema.configNegocio.colorMarca, whatsappNegocio: schema.configNegocio.whatsappNegocio })
    .from(schema.configNegocio).where(eq(schema.configNegocio.id, "singleton")).limit(1);

  return <LandingClient config={config || { nombreNegocio: "Ezenty ProCare", colorMarca: "#7cc2e8", whatsappNegocio: "14075551234" }} utmCanal={utmCanal} />;
}
