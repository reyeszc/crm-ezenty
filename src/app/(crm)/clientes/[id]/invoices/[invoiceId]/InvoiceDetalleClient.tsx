"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileCheck, Download, CheckCircle, Clock, DollarSign, Send } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

function calcVencimiento(invoice: any): Date | null {
  const base = invoice.fechaServicio ? new Date(invoice.fechaServicio) : null;
  if (!base) return null;
  const dias = invoice.terminosPago === "Net 30" ? 30 : invoice.terminosPago === "Net 15" ? 15 : 0;
  const venc = new Date(base);
  venc.setDate(venc.getDate() + dias);
  return venc;
}

function calcAging(invoice: any): number | null {
  if (invoice.estado === "PAGADO") return null;
  const venc = calcVencimiento(invoice);
  if (!venc) return null;
  const hoy = new Date();
  const diff = Math.floor((hoy.getTime() - venc.getTime()) / 86400000);
  return diff > 0 ? diff : null;
}

const ESTADO_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  BORRADOR:  { label: "Borrador",  cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300", icon: Clock },
  ENVIADO:   { label: "Enviado",   cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: FileCheck },
  PAGADO:    { label: "Pagado",    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle },
};

const TN_CITIES = ["nashville","brentwood","franklin","murfreesboro","smyrna","antioch","nolensville","hendersonville","gallatin","columbia","knoxville","chattanooga","memphis","cookeville","kingsport","johnson city","clarksville","oak ridge","maryville","morristown"];

function esGeorgia(direccion?: string | null): boolean {
  if (!direccion) return false;
  const d = direccion.toLowerCase();
  if (d.includes(", ga") || d.includes(" ga ") || d.includes("georgia") || d.includes("atlanta") || d.includes("alpharetta") || d.includes("newnan") || d.includes("rome") || d.includes("marietta") || d.includes("canton")) return true;
  const isTN = TN_CITIES.some(c => d.includes(c)) || d.includes(", tn") || d.includes("tennessee");
  return !isTN;
}

function buildInvoiceHTML({ invoice, cliente, lineas, vendedor }: any) {
  const isGA = esGeorgia(cliente?.direccionPropiedad);
  const fecha = new Date(invoice.creadoEn).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const fechaServicio = invoice.fechasServicio
    ? JSON.parse(invoice.fechasServicio).map((f: string) => new Date(f + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })).join(", ")
    : invoice.fechaServicio ? new Date(invoice.fechaServicio).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "-";
  const remitAddress = isGA
    ? "8735 Dunwoody Place, Suite #12459, Atlanta, GA 30350"
    : "Nashville, TN";

  const baseDate = invoice.fechaServicio ? new Date(invoice.fechaServicio) : new Date(invoice.creadoEn);
  const diasTermino = invoice.terminosPago === "Net 30" ? 30 : invoice.terminosPago === "Net 15" ? 15 : 0;
  const dueDate = new Date(baseDate);
  dueDate.setDate(dueDate.getDate() + diasTermino);
  const fechaVence = dueDate.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

  const subtotal = lineas.reduce((s: number, l: any) => s + (l.precioFinal || 0) * (l.cantidad || 1), 0);
  const descuento = invoice.descuento || 0;
  const total = invoice.total || subtotal - descuento;

  const rows = lineas.map((l: any, i: number) => {
    const sub = (l.precioFinal || 0) * (l.cantidad || 1);
    return `<tr style="background:${i % 2 === 0 ? "#fff" : "#f8f9fa"}">
      <td style="padding:5px 8px 5px 14px;text-align:center;color:#666;font-family:monospace;font-size:10px">${String(i+1).padStart(2,"0")}</td>
      <td style="padding:5px 8px;font-size:11px">${l.descripcion || ""}</td>
      <td style="padding:5px 8px;text-align:center;color:#555;font-size:11px">${l.cantidad || 1}</td>
      <td style="padding:5px 8px;text-align:right;color:#555;font-size:11px">$${(l.precioFinal||0).toLocaleString("en-US",{minimumFractionDigits:2})}</td>
      <td style="padding:5px 8px;text-align:right;font-weight:600;color:#1B2A4A;font-size:11px">$${sub.toLocaleString("en-US",{minimumFractionDigits:2})}</td>
    </tr>`;
  }).join("");

  const footer = isGA
    ? `<b>EZENTY ProCare LLC</b> · Serving Georgia · IICRC Certified · contact@ezentyprocare.com`
    : `<b>EZENTY ProCare LLC</b> · Serving Tennessee · IICRC Certified · contact@ezentyprocare.com`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin:0; padding:0; color:#222; font-size:10px; }
    * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; box-sizing:border-box; }
    @media print { @page { size: Letter portrait; margin:0; } html,body { margin:0; padding:0; } }
    table { width:100%; border-collapse:collapse; }
    td,th { vertical-align:top; }
  </style>
  <script>
    window.addEventListener("load", function() {
      var el = document.getElementById("contenido");
      if (!el) return;
      var scale = Math.min(816/el.offsetWidth, 1056/el.offsetHeight, 1);
      if (scale < 1) { el.style.transform="scale("+scale+")"; el.style.transformOrigin="top left"; document.body.style.width=Math.round(el.offsetWidth*scale)+"px"; }
    });
  </script>
  </head><body>
  <div id="contenido" style="max-width:760px;margin:0 auto;background:#fff;">

    <!-- Header: Logo left, Invoice info right -->
    <div style="padding:16px 24px 12px;display:flex;align-items:flex-start;justify-content:space-between;border-bottom:1px solid #e5e7eb">
      <!-- Logo -->
      <div style="display:flex;flex-direction:column;align-items:flex-start">
        <div style="display:flex;align-items:center;gap:8px">
          <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="4" fill="#1B2A4A"/>
            <text x="24" y="32" font-family="Arial" font-size="22" font-weight="900" fill="white" text-anchor="middle">ZE</text>
          </svg>
          <div>
            <p style="margin:0;font-size:18px;font-weight:900;color:#1B2A4A;letter-spacing:2px">EZENTY</p>
            <p style="margin:0;font-size:9px;color:#555;letter-spacing:3px">- PROCARE -</p>
          </div>
        </div>
      </div>
      <!-- Invoice info top right -->
      <div style="text-align:right">
        <p style="margin:0;font-size:20px;font-weight:900;color:#1B2A4A;letter-spacing:1px">INVOICE</p>
        <p style="margin:2px 0;font-size:12px;font-weight:700;color:#1B2A4A">${invoice.numero}</p>
        <div style="display:inline-block;background:${invoice.estado === "PAGADO" ? "#dcfce7" : "#FFF3CD"};padding:2px 10px;border-radius:12px;margin-top:3px">
          <p style="margin:0;font-size:9px;font-weight:700;color:${invoice.estado === "PAGADO" ? "#16a34a" : "#B45309"}">● ${invoice.estado}</p>
        </div>
      </div>
    </div>

    <!-- Tagline -->
    <div style="background:#f3f4f6;padding:5px 24px;border-bottom:1px solid #e5e7eb">
      <p style="font-size:9px;color:#555;margin:0;font-style:italic">Premium Service Invoice &nbsp;·&nbsp; Floor &amp; Surface Care Aligned to Your Standards</p>
    </div>

    <!-- Bill To / Invoice Details -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;padding:12px 24px;border-bottom:1px solid #e5e7eb">
      <div>
        <p style="font-size:9px;font-weight:900;color:#1B2A4A;letter-spacing:1px;margin:0 0 6px;text-transform:uppercase">BILL TO</p>
        <p style="font-size:9px;color:#444;margin:0 0 2px">Name: &nbsp;<b style="color:#1B2A4A;font-size:10px">${cliente?.nombre || ""}</b></p>
        ${invoice.contactoNombre ? `<p style="font-size:9px;color:#444;margin:0 0 2px">Attn: &nbsp;<b>${invoice.contactoNombre}</b></p>` : ""}
        ${cliente?.direccionPropiedad ? `<p style="font-size:9px;color:#444;margin:0 0 2px">Address: ${cliente.direccionPropiedad}</p>` : ""}
        ${invoice.contactoCorreo ? `<p style="font-size:9px;color:#444;margin:0">Email: ${invoice.contactoCorreo}</p>` : ""}
      </div>
      <div style="text-align:right">
        <p style="font-size:9px;font-weight:900;color:#1B2A4A;letter-spacing:1px;margin:0 0 6px;text-transform:uppercase">INVOICE DETAILS</p>
        <table style="width:100%">
          <tr><td style="font-size:9px;color:#555;padding:1px 0">Invoice #:</td><td style="font-size:9px;font-weight:700;color:#1B2A4A;text-align:right">${invoice.numero}</td></tr>
          <tr><td style="font-size:9px;color:#555;padding:1px 0">Invoice Date:</td><td style="font-size:9px;color:#333;text-align:right">${fecha}</td></tr>
          <tr><td style="font-size:9px;color:#555;padding:1px 0">Service Date:</td><td style="font-size:9px;color:#333;text-align:right">${fechaServicio}</td></tr>
          <tr><td style="font-size:9px;color:#555;padding:1px 0">Payment Terms:</td><td style="font-size:9px;font-weight:700;color:#1B2A4A;text-align:right">${invoice.terminosPago} days</td></tr>
          <tr><td style="font-size:9px;color:#555;padding:1px 0">Due Date:</td><td style="font-size:9px;color:#333;text-align:right">${fechaVence}</td></tr>
        </table>
      </div>
    </div>

    <!-- Services Overview -->
    <div style="padding:10px 24px;border-bottom:1px solid #e5e7eb">
      <p style="font-size:9px;font-weight:900;color:#1B2A4A;margin:0 0 3px;text-transform:uppercase">SERVICES OVERVIEW</p>
      <p style="font-size:9px;color:#444;margin:0;line-height:1.5;font-style:italic">${invoice.notas || "Professional floor and surface care services were completed to support brand standards, guest satisfaction, and long-term asset preservation. All work was executed using commercial-grade equipment and industry-certified processes."}</p>
    </div>

    <!-- Service Breakdown -->
    <div style="padding:10px 24px 0">
      <p style="font-size:9px;font-weight:900;color:#1B2A4A;margin:0 0 4px;text-transform:uppercase">SERVICE BREAKDOWN</p>
      <p style="font-size:9px;font-weight:700;color:#1B2A4A;margin:0 0 4px">NON-TAXABLE ITEMS (Labor Only)</p>
      <table>
        <thead>
          <tr style="background:#1B2A4A">
            <th style="padding:4px 8px;text-align:center;color:white;width:32px;font-size:9px">#</th>
            <th style="padding:4px 8px;text-align:left;color:white;font-size:9px">Description</th>
            <th style="padding:4px 8px;text-align:center;color:white;width:36px;font-size:9px">Qty</th>
            <th style="padding:4px 8px;text-align:right;color:white;width:75px;font-size:9px">Amount</th>
            <th style="padding:4px 8px;text-align:right;color:white;width:75px;font-size:9px">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <!-- Subtotal non-taxable -->
      <div style="display:flex;justify-content:flex-end;padding:5px 0;border-top:1px solid #e5e7eb;margin-top:2px">
        <span style="font-size:10px;font-weight:700;color:#1B2A4A;margin-right:12px">Subtotal (Non-Taxable)</span>
        <span style="font-size:10px;font-weight:700;color:#1B2A4A;min-width:75px;text-align:right">$${subtotal.toLocaleString("en-US",{minimumFractionDigits:2})}</span>
      </div>

      <!-- Taxable items -->
      <p style="font-size:9px;font-weight:700;color:#1B2A4A;margin:6px 0 4px">TAXABLE ITEMS &nbsp;<span style="font-weight:400;font-style:italic;color:#666">Products &amp; Materials</span></p>
      <table>
        <thead>
          <tr style="background:#1B2A4A">
            <th style="padding:4px 8px;text-align:center;color:white;width:32px;font-size:9px">#</th>
            <th style="padding:4px 8px;text-align:left;color:white;font-size:9px">Description</th>
            <th style="padding:4px 8px;text-align:center;color:white;width:36px;font-size:9px">Qty</th>
            <th style="padding:4px 8px;text-align:right;color:white;width:75px;font-size:9px">Amount</th>
            <th style="padding:4px 8px;text-align:right;color:white;width:75px;font-size:9px">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background:#fff"><td style="padding:5px 8px;text-align:center;font-size:9px;color:#999">01</td><td style="padding:5px 8px"></td><td></td><td></td><td style="padding:5px 8px;text-align:right;font-size:9px;color:#999">-</td></tr>
          <tr style="background:#f8f9fa"><td style="padding:5px 8px;text-align:center;font-size:9px;color:#999">02</td><td style="padding:5px 8px"></td><td></td><td></td><td style="padding:5px 8px;text-align:right;font-size:9px;color:#999">-</td></tr>
        </tbody>
      </table>
      <div style="display:flex;justify-content:flex-end;padding:5px 0;border-top:1px solid #e5e7eb;margin-top:2px">
        <span style="font-size:10px;font-weight:700;color:#1B2A4A;margin-right:12px">Subtotal (Taxable)</span>
        <span style="font-size:10px;font-weight:700;color:#1B2A4A;min-width:75px;text-align:right">$0.00</span>
      </div>
    </div>

    <!-- Notes + Financial Summary -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;padding:10px 24px;border-top:1px solid #e5e7eb;margin-top:6px">
      <div style="padding-right:16px">
        <p style="font-size:9px;font-weight:900;color:#1B2A4A;margin:0 0 4px;text-transform:uppercase">IMPORTANT NOTES:</p>
        <p style="font-size:8.5px;color:#444;margin:0 0 2px;line-height:1.6">- Labor services are classified as non-taxable under ${isGA ? "Georgia" : "Tennessee"} law.</p>
        <p style="font-size:8.5px;color:#444;margin:0 0 2px;line-height:1.6">- Sales tax applies only to materials and chemical applications.</p>
        <p style="font-size:8.5px;color:#444;margin:0 0 2px;line-height:1.6">- This invoice reflects services completed per agreed scope.</p>
        <p style="font-size:8.5px;color:#444;margin:0;line-height:1.6">- Payment terms ${invoice.terminosPago} days.</p>
      </div>
      <div>
        <p style="font-size:9px;font-weight:900;color:#1B2A4A;margin:0 0 4px;text-transform:uppercase">FINANCIAL SUMMARY:</p>
        <table style="width:100%">
          <tr><td style="font-size:9px;color:#444;padding:2px 0">Labor (Non-Taxable):</td><td style="font-size:9px;font-weight:600;text-align:right;color:#1B2A4A">$${subtotal.toLocaleString("en-US",{minimumFractionDigits:2})}</td></tr>
          <tr><td style="font-size:9px;color:#444;padding:2px 0">Products (Taxable):</td><td style="font-size:9px;text-align:right;color:#1B2A4A">$0.00</td></tr>
          <tr><td style="font-size:9px;color:#444;padding:2px 0">Sales Tax (${isGA ? "GA" : "TN"}):</td><td style="font-size:9px;text-align:right;color:#1B2A4A">$0.00</td></tr>
          ${descuento > 0 ? `<tr><td style="font-size:9px;color:#c00;padding:2px 0">Discount:</td><td style="font-size:9px;text-align:right;color:#c00">-$${descuento.toLocaleString("en-US",{minimumFractionDigits:2})}</td></tr>` : ""}
          <tr style="border-top:2px solid #1B2A4A">
            <td style="font-size:11px;font-weight:900;color:#1B2A4A;padding:4px 0">TOTAL DUE:</td>
            <td style="font-size:11px;font-weight:900;text-align:right;color:#1B2A4A">$${total.toLocaleString("en-US",{minimumFractionDigits:2})}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Payment Instructions -->
    <div style="padding:10px 24px;border-top:2px solid #e5e7eb">
      <p style="font-size:10px;font-weight:900;color:#1B2A4A;text-align:center;letter-spacing:1px;margin:0 0 8px;text-transform:uppercase">PAYMENT INSTRUCTIONS:</p>
      <div style="display:flex;align-items:center;justify-content:center;gap:24px">
        <!-- IICRC badge placeholder -->
        <div style="border:2px solid #1B2A4A;border-radius:4px;padding:4px 8px;text-align:center;min-width:60px">
          <p style="font-size:8px;font-weight:900;color:#1B2A4A;margin:0">IICRC</p>
          <p style="font-size:7px;font-weight:700;color:#1B2A4A;margin:0">CERTIFIED</p>
          <p style="font-size:7px;color:#1B2A4A;margin:0">FIRM</p>
        </div>
        <div>
          <p style="font-size:9px;color:#444;margin:0 0 2px"><b style="color:#1B2A4A">Accepted Methods:</b> Check / ACH Transfer</p>
          <p style="font-size:9px;color:#444;margin:0 0 2px"><b style="color:#1B2A4A">Payable To:</b> EZENTY PROCARE LLC</p>
          <p style="font-size:9px;color:#444;margin:0"><b style="color:#1B2A4A">Remit To:</b> ${remitAddress}</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#1B2A4A;padding:8px 24px;display:flex;align-items:center;justify-content:space-between">
      <div>
        <p style="font-size:9px;color:#fff;font-weight:700;margin:0">EZENTY PROCARE LLC | Floor &amp; Surface Care Aligned to Your Standards</p>
        <p style="font-size:8px;color:#a5b4c8;font-style:italic;margin:1px 0 0">For billing inquiries or payment confirmation, contact: info@ezentyprocare.com</p>
      </div>
      <p style="font-size:9px;color:#a5b4c8;margin:0;flex-shrink:0">${invoice.numero}</p>
    </div>
  </div>
  </body></html>`;
}

export function InvoiceDetalleClient({ invoice, cliente, lineas, vendedor }: any) {
  const router = useRouter();
  const { success, error } = useToast();
  const [estado, setEstado] = useState(invoice.estado);
  const [generando, setGenerando] = useState(false);

  const cfg = ESTADO_CFG[estado] || ESTADO_CFG.BORRADOR;
  const aging = calcAging({ ...invoice, estado });
  const fechaVencimiento = calcVencimiento(invoice);

  function abrirEmailRecordatorio() {
    const dias = aging || 0;
    const vencStr = fechaVencimiento ? fechaVencimiento.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
    const to = invoice.contactoCorreo || "";
    const subject = `Payment Reminder - ${invoice.numero} - ${dias} Days Past Due`;
    const fechasStr = invoice.fechasServicio
      ? JSON.parse(invoice.fechasServicio).map((f: string) => new Date(f + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })).join(", ")
      : invoice.fechaServicio ? new Date(invoice.fechaServicio).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
    const body = `Dear ${invoice.contactoNombre || "Valued Client"},

I hope this message finds you well. This is a friendly reminder that Invoice ${invoice.numero} for services rendered on ${fechasStr} is currently past due.

Invoice Details:
- Invoice #: ${invoice.numero}
- Service Date(s): ${fechasStr}
- Due Date: ${vencStr}
- Payment Terms: ${invoice.terminosPago}
- Amount Due: $${(invoice.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
- Days Past Due: ${dias} day(s)

We kindly ask that you process this payment at your earliest convenience. If you have already submitted payment, please disregard this notice.

If you have any questions regarding this invoice, please don't hesitate to contact us.

Thank you for your prompt attention to this matter. We appreciate your continued business.

Best regards,
${vendedor?.nombre || "Ezenty ProCare Team"}
EZENTY ProCare LLC
contact@ezentyprocare.com`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank");
  }
  const subtotal = lineas.reduce((s: number, l: any) => s + (l.precioFinal || 0) * (l.cantidad || 1), 0);

  async function cambiarEstado(nuevoEstado: string) {
    const res = await fetch(`/api/clientes/${cliente.id}/invoices/${invoice.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    if (res.ok) { setEstado(nuevoEstado); success(`Estado actualizado a ${nuevoEstado} ✓`); }
    else error("No se pudo actualizar");
  }

  async function generarYEnviar() {
    await generarPDF();
    // Open Gmail after short delay so PDF starts downloading
    setTimeout(() => abrirEmailRecordatorio(), 1500);
  }

  async function generarPDF() {
    setGenerando(true);
    try {
      const html = buildInvoiceHTML({ invoice: { ...invoice, estado }, cliente, lineas, vendedor });
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;width:816px;background:white;z-index:-1;";
      container.innerHTML = html.replace(/<script[\s\S]*?<\/script>/gi, "");
      document.body.appendChild(container);
      await new Promise(r => setTimeout(r, 600));
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff", width: 816, windowWidth: 816 });
      document.body.removeChild(container);
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pw / canvas.width, ph / canvas.height);
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", (pw - canvas.width * ratio) / 2, 0, canvas.width * ratio, canvas.height * ratio);
      pdf.save(`${invoice.numero}.pdf`);
      success("PDF descargado ✓");
    } catch { error("No se pudo generar el PDF"); }
    finally { setGenerando(false); }
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-4">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-2">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
          <FileCheck className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">{invoice.numero}</h1>
            <span className={`badge text-xs ${cfg.cls}`}>{cfg.label}</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{cliente?.nombre}</p>
        </div>
      </div>

      {/* Aging alert */}
      {aging !== null && (
        <div className={`card p-3 flex items-center gap-3 ${aging >= 30 ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10" : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10"}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${aging >= 30 ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
            <Clock className={`w-4 h-4 ${aging >= 30 ? "text-red-600" : "text-amber-600"}`} />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-bold ${aging >= 30 ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>
              {aging} día{aging !== 1 ? "s" : ""} vencida
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Venció el {fechaVencimiento?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={generarPDF} disabled={generando}
          className="btn-secondary flex items-center gap-2 text-sm !py-2">
          <Download className="w-4 h-4" />
          {generando ? "Generando..." : "Descargar PDF"}
        </button>
        {invoice.contactoCorreo && (
          <button onClick={generarYEnviar} disabled={generando}
            className="btn-secondary flex items-center gap-2 text-sm !py-2">
            <Send className="w-4 h-4" />
            {generando ? "Generando..." : "PDF + Enviar"}
          </button>
        )}
        {invoice.contactoCorreo && estado !== "PAGADO" && (
          <button onClick={abrirEmailRecordatorio}
            className="btn-secondary text-sm !py-2 flex items-center gap-2">
            <Send className="w-4 h-4" /> Recordatorio de Pago
          </button>
        )}
        {estado !== "ENVIADO" && (
          <button onClick={() => cambiarEstado("ENVIADO")} className="btn-secondary text-sm !py-2 flex items-center gap-2">
            <FileCheck className="w-4 h-4" /> Marcar Enviado
          </button>
        )}
        {estado !== "PAGADO" && (
          <button onClick={() => cambiarEstado("PAGADO")} className="btn-primary text-sm !py-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Marcar Pagado
          </button>
        )}
      </div>

      {/* Invoice info */}
      <div className="card p-4 grid grid-cols-2 gap-3 text-sm">
        <div className="col-span-2"><p className="text-xs text-[var(--text-muted)]">Fecha(s) de Servicio</p>
          <p className="font-medium">
            {invoice.fechasServicio ? (() => {
              const fechas = JSON.parse(invoice.fechasServicio);
              return fechas.map((f: string) => new Date(f + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })).join(" · ");
            })() : invoice.fechaServicio ? new Date(invoice.fechaServicio).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
          </p></div>
        <div><p className="text-xs text-[var(--text-muted)]">Términos de Pago</p>
          <p className="font-medium">{invoice.terminosPago}</p></div>
        <div><p className="text-xs text-[var(--text-muted)]">Contacto</p>
          <p className="font-medium">{invoice.contactoNombre || "—"}</p></div>
        <div><p className="text-xs text-[var(--text-muted)]">Total</p>
          <p className="font-bold text-emerald-600 text-base">${(invoice.total || subtotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p></div>
      </div>

      {/* Line items */}
      <div className="card overflow-hidden">
        <div className="p-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-[var(--text-muted)]">
            <div className="col-span-6">Descripción</div>
            <div className="col-span-2 text-center">Cant.</div>
            <div className="col-span-2 text-right">Precio</div>
            <div className="col-span-2 text-right">Total</div>
          </div>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {lineas.map((l: any, i: number) => (
            <div key={l.id} className={`p-3 grid grid-cols-12 gap-2 items-center ${i % 2 === 0 ? "" : "bg-[var(--bg-secondary)]"}`}>
              <div className="col-span-6">
                <p className="text-sm font-medium text-[var(--text-primary)]">{l.descripcion}</p>
                {l.tipo && <p className="text-xs text-[var(--text-muted)]">{l.tipo}</p>}
              </div>
              <div className="col-span-2 text-center text-sm text-[var(--text-secondary)]">{l.cantidad || 1}</div>
              <div className="col-span-2 text-right text-sm text-[var(--text-secondary)]">${(l.precioFinal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className="col-span-2 text-right text-sm font-bold text-[var(--text-primary)]">
                ${((l.precioFinal || 0) * (l.cantidad || 1)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t-2 border-[var(--border)] flex justify-between items-center">
          <span className="font-bold text-[var(--text-primary)]">TOTAL DUE</span>
          <span className="text-xl font-bold text-emerald-600">${(invoice.total || subtotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {invoice.notas && (
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Notas</p>
          <p className="text-sm text-[var(--text-secondary)]">{invoice.notas}</p>
        </div>
      )}
    </div>
  );
}
