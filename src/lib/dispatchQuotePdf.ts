/**
 * Dispatch & Handover Hub — white-labelled client quotation PDF.
 *
 * Renders the tradesman's own branding over the Stage 2 retail roll-up, the
 * locked SiteScout ground truth, Sharon's programme and the contractual
 * payment schedule. Merchant/trade-gap figures are never included.
 */

import { jsPDF } from "jspdf";

import type { DispatchBranding, PaymentStage, ScheduleBand } from "./dispatchBranding";

type RGB = [number, number, number];

const GREY: RGB = [105, 118, 135];
const INK: RGB = [22, 28, 38];

export const hexToRgb = (hex: string): RGB => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full || "0f766e", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const gbp = (n: number) =>
  `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface DispatchQuoteData {
  branding: DispatchBranding;
  projectRef: string;
  revision: string;
  clientName?: string;
  siteAddress?: string;
  surveyDate: string;
  riskSummary: string[];
  exclusions: string[];
  /** Retail package roll-up: [package name, price ex VAT]. */
  packages: [string, number][];
  subtotalExVat: number;
  vatRate: number;
  totalIncVat: number;
  schedule: ScheduleBand[];
  payments: PaymentStage[];
  terms: string[];
}

export function generateDispatchQuotePdf(d: DispatchQuoteData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 46;
  const accent = hexToRgb(d.branding.accent);
  let y = 0;

  const page = () => {
    doc.addPage();
    y = 64;
  };
  const room = (need: number) => {
    if (y + need > H - 70) page();
  };
  const heading = (text: string) => {
    room(44);
    doc.setFillColor(...accent);
    doc.rect(M, y, 3, 14, "F");
    doc.setFont("helvetica", "bold").setFontSize(11.5).setTextColor(...INK);
    doc.text(text.toUpperCase(), M + 12, y + 11.5);
    y += 26;
  };
  const body = (text: string, size = 9, colour: RGB = GREY) => {
    doc.setFont("helvetica", "normal").setFontSize(size).setTextColor(...colour);
    const lines = doc.splitTextToSize(text, W - M * 2);
    room(lines.length * (size + 3.5));
    doc.text(lines, M, y);
    y += lines.length * (size + 3.5);
  };

  /* ------------------------------------------------------------- header */
  doc.setFillColor(...accent);
  doc.rect(0, 0, W, 6, "F");

  let logoBottom = 40;
  if (d.branding.logoDataUrl) {
    try {
      const fmt = d.branding.logoDataUrl.includes("image/png") ? "PNG" : "JPEG";
      doc.addImage(d.branding.logoDataUrl, fmt, M, 28, 120, 48, undefined, "FAST");
      logoBottom = 82;
    } catch {
      /* unreadable logo — fall back to the company name */
    }
  }
  if (!d.branding.logoDataUrl) {
    doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(...INK);
    const nm = doc.splitTextToSize(d.branding.companyName, 300);
    doc.text(nm, M, 50);
    logoBottom = 50 + nm.length * 16;
  }

  // Trust badge, top right
  doc.setFillColor(242, 246, 250);
  doc.roundedRect(W - M - 208, 30, 208, 30, 6, 6, "F");
  doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(...accent);
  doc.text("MATHEMATICALLY VERIFIED &", W - M - 196, 44);
  doc.text("PROTECTED BY PROGRAFTER AI", W - M - 196, 54);

  y = Math.max(logoBottom, 76) + 14;

  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...INK);
  doc.text("Fixed-Price Quotation", M, y);
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...accent);
  doc.text(`REVISION ${d.revision}`, W - M, y, { align: "right" });
  y += 18;

  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GREY);
  const left = [
    `Project reference: ${d.projectRef}`,
    d.clientName ? `Prepared for: ${d.clientName}` : "",
    d.siteAddress ? `Site: ${d.siteAddress}` : "",
    `Date of issue: ${new Date().toLocaleDateString("en-GB")}`,
  ].filter(Boolean);
  const right = [
    d.branding.companyName,
    d.branding.address,
    `${d.branding.phone}  ·  ${d.branding.email}`,
    `${d.branding.companyNumber}  ·  ${d.branding.vatNumber}`,
  ].filter(Boolean);
  const rows = Math.max(left.length, right.length);
  for (let i = 0; i < rows; i++) {
    if (left[i]) doc.text(doc.splitTextToSize(left[i], 230), M, y + i * 12);
    if (right[i])
      doc.text(doc.splitTextToSize(right[i], 230), W - M, y + i * 12, { align: "right" });
  }
  y += rows * 12 + 18;

  doc.setDrawColor(...accent).setLineWidth(1);
  doc.line(M, y, W - M, y);
  y += 22;

  /* -------------------------------- 1. ground truth & exclusions */
  heading("1 · Site conditions, ground truth & exclusions");
  body(
    `Site conditions surveyed on ${d.surveyDate} using the ProGrafter SiteScout survey. The findings below are recorded as the basis of this price.`,
  );
  y += 6;
  for (const line of d.riskSummary) {
    doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GREY);
    const w = doc.splitTextToSize(`•  ${line}`, W - M * 2 - 8);
    room(w.length * 11 + 4);
    doc.text(w, M + 8, y);
    y += w.length * 11 + 4;
  }
  y += 10;
  room(30);
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...INK);
  doc.text("Stated exclusions", M, y);
  y += 14;
  for (const line of d.exclusions) {
    doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GREY);
    const w = doc.splitTextToSize(`•  ${line}`, W - M * 2 - 8);
    room(w.length * 11 + 4);
    doc.text(w, M + 8, y);
    y += w.length * 11 + 4;
  }
  y += 18;

  /* -------------------------------------------- 2. the fixed price */
  heading("2 · The fixed-price quotation");
  room(28);
  doc.setFillColor(...accent);
  doc.rect(M, y - 12, W - M * 2, 22, "F");
  doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(255, 255, 255);
  doc.text("WORKS PACKAGE", M + 10, y + 3);
  doc.text("PRICE (EX VAT)", W - M - 10, y + 3, { align: "right" });
  y += 24;

  doc.setFont("helvetica", "normal").setFontSize(9.5);
  d.packages.forEach(([name, value], i) => {
    room(20);
    if (i % 2 === 1) {
      doc.setFillColor(246, 248, 251);
      doc.rect(M, y - 11, W - M * 2, 18, "F");
    }
    doc.setTextColor(...INK);
    doc.text(name, M + 10, y + 2);
    doc.text(gbp(value), W - M - 10, y + 2, { align: "right" });
    y += 18;
  });

  y += 12;
  const vatValue = Number((d.totalIncVat - d.subtotalExVat).toFixed(2));
  const totals: [string, string, boolean][] = [
    ["Subtotal (ex VAT)", gbp(d.subtotalExVat), false],
    [`VAT @ ${d.vatRate}%`, gbp(vatValue), false],
    ["Total payable inc VAT", gbp(d.totalIncVat), true],
  ];
  for (const [label, value, bold] of totals) {
    room(24);
    if (bold) {
      doc.setFillColor(...accent);
      doc.rect(W - M - 260, y - 13, 260, 24, "F");
      doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(255, 255, 255);
      doc.text(label, W - M - 250, y + 3);
      doc.text(value, W - M - 10, y + 3, { align: "right" });
      y += 30;
    } else {
      doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...GREY);
      doc.text(label, W - M - 250, y);
      doc.setTextColor(...INK);
      doc.text(value, W - M - 10, y, { align: "right" });
      y += 16;
    }
  }
  y += 12;

  /* ------------------------------------------ 3. schedule of works */
  heading("3 · Schedule of works & programme");
  for (const band of d.schedule) {
    room(34);
    doc.setFillColor(...accent);
    doc.circle(M + 4, y - 2, 3, "F");
    doc.setDrawColor(224, 230, 238).setLineWidth(0.8);
    doc.line(M + 4, y + 2, M + 4, y + 22);
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...INK);
    doc.text(`${band.weeks}  ·  ${band.title}`, M + 16, y + 1);
    doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GREY);
    const w = doc.splitTextToSize(band.detail, W - M * 2 - 20);
    doc.text(w, M + 16, y + 13);
    y += 16 + w.length * 11 + 6;
  }
  y += 10;

  /* ------------------------- 4. contractual terms & payment schedule */
  heading("4 · Contractual terms & payment schedule");
  for (const [i, stage] of d.payments.entries()) {
    room(20);
    if (i % 2 === 1) {
      doc.setFillColor(246, 248, 251);
      doc.rect(M, y - 11, W - M * 2, 18, "F");
    }
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...INK);
    doc.text(`${stage.pct}%   ${stage.label}`, M + 10, y + 2);
    doc.text(gbp((d.totalIncVat * stage.pct) / 100), W - M - 10, y + 2, { align: "right" });
    y += 18;
  }
  y += 14;
  for (const t of d.terms) body(t, 8.5);

  /* -------------------------------------------------------- footer */
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(230, 235, 241).setLineWidth(0.6);
    doc.line(M, H - 42, W - M, H - 42);
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...GREY);
    doc.text(
      `${d.branding.companyName}  ·  ${d.projectRef} Rev ${d.revision}  ·  Prepared with ProGrafter (prografter.co.uk)`,
      M,
      H - 28,
    );
    doc.text(`Page ${p} of ${pages}`, W - M, H - 28, { align: "right" });
  }

  doc.save(`${d.projectRef}-quotation-rev-${d.revision}.pdf`);
}
