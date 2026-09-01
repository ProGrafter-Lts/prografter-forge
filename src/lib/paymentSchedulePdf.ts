/**
 * Branded ProGrafter payment schedule & schedule of works.
 *
 * ProGrafter-branded document, naming the trade carrying out the works — the
 * same brand treatment used by the client quotation PDF (clientQuotePdf.ts).
 */

import { jsPDF } from "jspdf";

const NAVY: [number, number, number] = [15, 31, 56];
const TEAL: [number, number, number] = [13, 148, 136];
const GREY: [number, number, number] = [100, 116, 139];

const money = (n: number) =>
  `£${Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface ScheduleStage {
  stage_name: string;
  stage_order: number;
  planned_start: string | null;
  planned_end: string | null;
  status: string;
  payment_amount: number;
  payment_status: string;
  scope_detail?: string | null;
}

export interface ScheduleMeta {
  projectTitle: string;
  reference?: string;
  tradeName: string;
  homeownerName?: string;
  contractValue: number;
}

const date = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "TBC";

export function generatePaymentSchedulePdf(stages: ScheduleStage[], meta: ScheduleMeta) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;

  // Brand band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 96, "F");
  doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(20);
  doc.text("ProGrafter", M, 44);
  doc.setTextColor(...TEAL).setFont("helvetica", "normal").setFontSize(10);
  doc.text("Payment Schedule & Schedule of Works", M, 62);
  doc.setTextColor(255, 255, 255).setFontSize(9);
  doc.text("prografter.co.uk", W - M, 44, { align: "right" });
  doc.text(new Date().toLocaleDateString("en-GB"), W - M, 60, { align: "right" });

  let y = 130;
  doc.setTextColor(...NAVY).setFont("helvetica", "bold").setFontSize(15);
  doc.text(meta.projectTitle || "Project", M, y);
  y += 18;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...GREY);
  const lines = [
    `Contractor: ${meta.tradeName}`,
    meta.homeownerName ? `Client: ${meta.homeownerName}` : null,
    meta.reference ? `Reference: ${meta.reference}` : null,
    `Contract value: ${money(meta.contractValue)}`,
  ].filter(Boolean) as string[];
  for (const l of lines) {
    doc.text(l, M, y);
    y += 14;
  }

  y += 12;
  doc.setDrawColor(...TEAL).setLineWidth(1).line(M, y, W - M, y);
  y += 24;

  const colAmount = W - M;
  const colDates = W - M - 130;

  const header = () => {
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...NAVY);
    doc.text("STAGE", M, y);
    doc.text("PROGRAMME", colDates, y);
    doc.text("PAYMENT", colAmount, y, { align: "right" });
    y += 8;
    doc.setDrawColor(220, 226, 233).setLineWidth(0.6).line(M, y, W - M, y);
    y += 16;
  };
  header();

  stages.forEach((s, i) => {
    if (y > H - 130) {
      doc.addPage();
      y = 70;
      header();
    }
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...NAVY);
    doc.text(`${i + 1}. ${s.stage_name}`, M, y, { maxWidth: colDates - M - 12 });
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...GREY);
    doc.text(`${date(s.planned_start)} – ${date(s.planned_end)}`, colDates, y);
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...NAVY);
    doc.text(money(s.payment_amount), colAmount, y, { align: "right" });
    y += 14;

    if (s.scope_detail) {
      doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...GREY);
      const wrapped = doc.splitTextToSize(s.scope_detail, colDates - M - 12) as string[];
      for (const w of wrapped.slice(0, 6)) {
        doc.text(w, M, y);
        y += 12;
      }
    }
    doc.setFontSize(8).setTextColor(...TEAL);
    doc.text(
      `${s.status.replace(/_/g, " ")} · payment ${s.payment_status.replace(/_/g, " ")}`.toUpperCase(),
      M,
      y,
    );
    y += 20;
    doc.setDrawColor(235, 239, 244).setLineWidth(0.5).line(M, y - 10, W - M, y - 10);
  });

  const total = stages.reduce((t, s) => t + Number(s.payment_amount || 0), 0);
  if (y > H - 110) {
    doc.addPage();
    y = 70;
  }
  doc.setFillColor(...NAVY);
  doc.roundedRect(M, y, W - M * 2, 40, 6, 6, "F");
  doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(11);
  doc.text("Total scheduled payments", M + 16, y + 25);
  doc.text(money(total), W - M - 16, y + 25, { align: "right" });
  y += 62;

  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...GREY);
  doc.text(
    `Issued through ProGrafter. Stage payments become due on completion and homeowner confirmation of each stage. Works carried out by ${meta.tradeName}.`,
    M,
    y,
    { maxWidth: W - M * 2 },
  );

  doc.save(
    `payment-schedule-${(meta.reference || meta.projectTitle || "project").replace(/\W+/g, "-").toLowerCase()}.pdf`,
  );
}
