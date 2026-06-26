import type { Metadata } from "next";
import { AgendaPublicaClient } from "./AgendaPublicaClient";

export const metadata: Metadata = {
  title: "Schedule a Consultation — Ezenty ProCare",
  description: "Book a free consultation with Ezenty ProCare floor care specialists.",
};

interface Props { params: Promise<{ slug: string }> }

export default async function AgendaPublicaPage({ params }: Props) {
  const { slug } = await params;
  return <AgendaPublicaClient slug={slug} />;
}
