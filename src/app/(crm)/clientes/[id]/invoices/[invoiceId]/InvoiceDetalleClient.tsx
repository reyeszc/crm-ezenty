"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileCheck, Download, CheckCircle, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

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
  const fechaServicio = invoice.fechaServicio ? new Date(invoice.fechaServicio).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";
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
    body { font-family: Arial, sans-serif; margin:0; padding:0; color:#333; font-size:11px; }
    * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; box-sizing:border-box; }
    @media print { @page { size: Letter portrait; margin:0; } html,body { margin:0; padding:0; } .no-print { display:none; } }
    table { width:100%; border-collapse:collapse; }
  </style>
  <script>
    window.addEventListener("load", function() {
      var el = document.getElementById("contenido");
      if (!el) return;
      var scale = Math.min(816 / el.offsetWidth, 1056 / el.offsetHeight, 1);
      if (scale < 1) { el.style.transform = "scale("+scale+")"; el.style.transformOrigin = "top left"; document.body.style.width = Math.round(el.offsetWidth*scale)+"px"; }
    });
  </script>
  </head><body>
  <div id="contenido" style="max-width:750px;margin:0 auto;">
    <!-- Header -->
    <div style="background:#1B2A4A;padding:14px 24px;display:flex;align-items:center;justify-content:space-between">
      <div>
        <p style="color:#fff;font-size:22px;font-weight:900;margin:0;letter-spacing:1px">INVOICE</p>
        <p style="color:#a5b4c8;font-size:11px;margin:4px 0 0">${invoice.numero}</p>
      </div>
      <div style="text-align:right">
        <p style="color:#fff;font-weight:700;font-size:13px;margin:0">EZENTY ProCare LLC</p>
        <p style="color:#a5b4c8;font-size:10px;margin:2px 0 0">${isGA ? "Georgia" : "Tennessee"} · IICRC Certified</p>
      </div>
    </div>
    <!-- Bill To / Invoice Info -->
    <div style="background:#FFF8E7;padding:10px 24px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div>
        <p style="font-size:9px;font-weight:900;color:#1B2A4A;letter-spacing:1px;margin:0 0 4px;text-transform:uppercase">Bill To</p>
        <p style="font-weight:700;font-size:12px;color:#1B2A4A;margin:0">${cliente?.nombre || ""}</p>
        ${invoice.contactoNombre ? `<p style="font-size:10px;color:#555;margin:2px 0 0">${invoice.contactoNombre}${invoice.contactoPuesto ? ` · ${invoice.contactoPuesto}` : ""}</p>` : ""}
        ${cliente?.direccionPropiedad ? `<p style="font-size:10px;color:#555;margin:2px 0 0">${cliente.direccionPropiedad}</p>` : ""}
        ${invoice.contactoCorreo ? `<p style="font-size:10px;color:#555;margin:2px 0 0">${invoice.contactoCorreo}</p>` : ""}
      </div>
      <div style="text-align:right">
        <table style="width:auto;margin-left:auto">
          <tr><td style="font-size:10px;color:#666;padding:1px 6px 1px 0">Invoice #:</td><td style="font-size:10px;font-weight:700;color:#1B2A4A">${invoice.numero}</td></tr>
          <tr><td style="font-size:10px;color:#666;padding:1px 6px 1px 0">Date:</td><td style="font-size:10px;color:#333">${fecha}</td></tr>
          <tr><td style="font-size:10px;color:#666;padding:1px 6px 1px 0">Service Date:</td><td style="font-size:10px;color:#333">${fechaServicio}</td></tr>
          <tr><td style="font-size:10px;color:#666;padding:1px 6px 1px 0">Payment Terms:</td><td style="font-size:10px;font-weight:700;color:#1B2A4A">${invoice.terminosPago}</td></tr>
          <tr><td style="font-size:10px;color:#666;padding:1px 6px 1px 0">Status:</td><td style="font-size:10px;font-weight:700;color:${invoice.estado === "PAGADO" ? "#16a34a" : "#1B2A4A"}">${invoice.estado}</td></tr>
        </table>
      </div>
    </div>
    <!-- Table -->
    <div style="padding:0 24px 10px">
      <table>
        <thead>
          <tr style="background:#1B2A4A">
            <th style="padding:5px 8px;text-align:center;color:white;width:36px;font-size:10px">#</th>
            <th style="padding:5px 8px;text-align:left;color:white;font-size:10px">Service Description</th>
            <th style="padding:5px 8px;text-align:center;color:white;width:50px;font-size:10px">Qty</th>
            <th style="padding:5px 8px;text-align:right;color:white;width:90px;font-size:10px">Unit Price</th>
            <th style="padding:5px 8px;text-align:right;color:white;width:90px;font-size:10px">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          ${descuento > 0 ? `<tr><td colspan="4" style="text-align:right;padding:4px 8px;color:#c00;font-size:10px">Discount:</td><td style="text-align:right;padding:4px 8px;color:#c00;font-size:10px">-$${descuento.toLocaleString("en-US",{minimumFractionDigits:2})}</td></tr>` : ""}
          <tr style="border-top:2px solid #1B2A4A">
            <td colspan="4" style="text-align:right;padding:6px 8px;font-weight:900;font-size:13px;color:#1B2A4A">TOTAL DUE</td>
            <td style="text-align:right;padding:6px 8px;font-weight:900;font-size:13px;color:#16a34a">$${total.toLocaleString("en-US",{minimumFractionDigits:2})}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    ${invoice.notas ? `<div style="padding:6px 24px 10px;border-top:1px solid #eee"><p style="font-size:10px;color:#555;font-style:italic">${invoice.notas}</p></div>` : ""}
    <!-- Payment info -->
    <div style="padding:8px 24px;background:#f0fdf4;border-top:1px solid #bbf7d0">
      <p style="font-size:10px;font-weight:700;color:#15803d;margin:0 0 3px">Payment Information</p>
      <p style="font-size:10px;color:#374151;margin:0">Please remit payment within the terms specified above. Make checks payable to <b>EZENTY ProCare LLC</b>.</p>
    </div>
    <!-- Footer -->
    <div style="background:#f8f9fa;padding:7px 24px;border-top:2px solid #1B2A4A;text-align:center">
      <p style="font-size:9px;color:#666;margin:0">${footer}</p>
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
  const subtotal = lineas.reduce((s: number, l: any) => s + (l.precioFinal || 0) * (l.cantidad || 1), 0);

  async function cambiarEstado(nuevoEstado: string) {
    const res = await fetch(`/api/clientes/${cliente.id}/invoices/${invoice.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    if (res.ok) { setEstado(nuevoEstado); success(`Estado actualizado a ${nuevoEstado} ✓`); }
    else error("No se pudo actualizar");
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

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={generarPDF} disabled={generando}
          className="btn-secondary flex items-center gap-2 text-sm !py-2">
          <Download className="w-4 h-4" />
          {generando ? "Generando…" : "Descargar PDF"}
        </button>
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
        <div><p className="text-xs text-[var(--text-muted)]">Fecha Servicio</p>
          <p className="font-medium">{invoice.fechaServicio ? new Date(invoice.fechaServicio).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</p></div>
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
