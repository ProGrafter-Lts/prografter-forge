/**
 * Branded ProGrafter client quotation PDF.
 * Sandbox-only: packages the locked sandbox figures for homeowner presentation.
 */

import { jsPDF } from "jspdf";

import type { ArbitrageResult, MasterBoqLine } from "./procurementEngine";

const NAVY: [number, number, number] = [15, 23, 42];
const CYAN: [number, number, number] = [56, 189, 248];
const GREY: [number, number, number] = [100, 116, 139];

const gbp = (n: number) =>
  `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface ClientQuoteMeta {
  projectRef: string;
  sheetName?: string;
  clientName?: string;
  vatRate: number;
  /** Stage 1 locked "Site Risk & Ground Condition Summary". */
  riskSummary?: string[];
  /** Ground-risk exclusions stated on the face of the quotation. */
  exclusions?: string[];
}

/** Groups the BoQ into presentation-level packages — homeowners never see 40+ lines. */
function summarise(boq: MasterBoqLine[]) {
  const map = new Map<string, number>();
  for (const l of boq) map.set(l.category, (map.get(l.category) ?? 0) + l.total);
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export function generateClientQuotePdf(
  boq: MasterBoqLine[],
  arbitrage: ArbitrageResult,
  meta: ClientQuoteMeta,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = 0;

  // header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 92, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(20);
  doc.text("ProGrafter", M, 44);
  doc.setTextColor(...CYAN);
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text("Verified trades. Documented projects.", M, 62);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("prografter.co.uk", W - M, 44, { align: "right" });
  doc.text(new Date().toLocaleDateString("en-GB"), W - M, 60, { align: "right" });

  y = 128;
  doc.setTextColor(...NAVY).setFont("helvetica", "bold").setFontSize(16);
  doc.text("Client Quotation", M, y);
  y += 20;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...GREY);
  doc.text(`Project reference: ${meta.projectRef}`, M, y);
  y += 14;
  if (meta.clientName) {
    doc.text(`Prepared for: ${meta.clientName}`, M, y);
    y += 14;
  }
  if (meta.sheetName) {
    doc.text(`Priced from: ${meta.sheetName}`, M, y);
    y += 14;
  }
  doc.text(
    "Fixed-price quotation built from a measured takeoff against your approved drawings.",
    M,
    y,
  );
  y += 26;

  // package table
  doc.setDrawColor(...CYAN).setLineWidth(1.2);
  doc.line(M, y, W - M, y);
  y += 16;
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...NAVY);
  doc.text("Works package", M, y);
  doc.text("Price", W - M, y, { align: "right" });
  y += 8;
  doc.setDrawColor(220, 226, 235).setLineWidth(0.6);
  doc.line(M, y, W - M, y);
  y += 16;

  const rows = summarise(boq);
  const factor = arbitrage.retailTotal > 0 ? arbitrage.customerQuoteTotal / arbitrage.retailTotal : 1;
  doc.setFont("helvetica", "normal").setTextColor(40, 48, 66);
  for (const [category, total] of rows) {
    if (y > 720) {
      doc.addPage();
      y = 72;
    }
    doc.text(category, M, y);
    doc.text(gbp(total * factor), W - M, y, { align: "right" });
    y += 16;
  }

  y += 6;
  doc.setDrawColor(...CYAN).setLineWidth(1.2);
  doc.line(M, y, W - M, y);
  y += 22;

  const totals: [string, string, boolean][] = [
    ["Subtotal (ex VAT)", gbp(arbitrage.customerQuoteTotal), false],
    [`VAT @ ${meta.vatRate}%`, gbp(arbitrage.customerQuoteIncVat - arbitrage.customerQuoteTotal), false],
    ["Total payable", gbp(arbitrage.customerQuoteIncVat), true],
  ];
  for (const [label, value, bold] of totals) {
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(bold ? 13 : 10);
    doc.setTextColor(...(bold ? NAVY : GREY));
    doc.text(label, W - M - 170, y, { align: "left" });
    doc.setTextColor(...NAVY);
    doc.text(value, W - M, y, { align: "right" });
    y += bold ? 22 : 17;
  }

  if (arbitrage.passedToCustomer > 0) {
    y += 6;
    doc.setFillColor(236, 250, 255);
    doc.rect(M, y - 12, W - M * 2, 40, "F");
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...NAVY);
    doc.text(
      `Trade buying power saving passed to you: ${gbp(arbitrage.passedToCustomer)}`,
      M + 12,
      y + 4,
    );
    doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GREY);
    doc.text(
      "Negotiated merchant pricing secured against the retail benchmark for this project.",
      M + 12,
      y + 18,
    );
    y += 48;
  }

  const H = doc.internal.pageSize.getHeight();
  const includes = [
    "All labour, plant, materials and waste removal for the packages listed above.",
    "Building control and structural engineering fees where scheduled.",
    "Measured takeoff and compliance review by the ProGrafter agent team.",
    "Quotation valid for 30 days from the date of issue. Prices exclude unforeseen ground conditions.",
  ];

  // Keep the inclusions block whole and clear of the footer strip.
  y += 10;
  if (y + 26 + includes.length * 15 > H - 72) {
    doc.addPage();
    y = 72;
  }
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...NAVY);
  doc.text("What is included", M, y);
  y += 16;
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...GREY);
  for (const line of includes) {
    doc.text(`•  ${line}`, M, y, { maxWidth: W - M * 2 });
    y += 15;
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...GREY);
    doc.text(
      "Sent via ProGrafter (prografter.co.uk) — verified trades, documented projects.",
      M,
      H - 16,
    );
    doc.text(`Page ${p} of ${pages}`, W - M, H - 16, { align: "right" });
  }

  doc.save(`${meta.projectRef}-prografter-client-quote.pdf`);
}
