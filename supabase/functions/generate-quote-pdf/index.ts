// Professional Quote PDF generator
// Renders a 7-page Schedule of Works PDF for a quote and uploads it to the
// `quote-pdfs` private bucket. Returns a signed URL for the trade to
// preview/download, plus a long-lived shareable accept link.
//
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
import React from "npm:react@18.3.1";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "npm:@react-pdf/renderer@3.4.4";

// ---------- Brand ----------
const NAVY = "#1B3A5C";
const TEAL = "#0D9488";
const INK = "#0F172A";
const MUTED = "#64748B";
const RULE = "#E2E8F0";
const CREAM = "#FAF8F3";

// Register fonts (Google Fonts static TTF mirrors)
try {
  Font.register({
    family: "DMSans",
    fonts: [
      { src: "https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZOIHTWEBlw.ttf" },
      { src: "https://fonts.gstatic.com/s/dmsans/v15/rP2Cp2ywxg089UriCZaIGDWCBl0O8w.ttf", fontWeight: 700 },
    ],
  });
  Font.register({
    family: "Bebas",
    src: "https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXoo9Wlhyw.ttf",
  });
  Font.register({
    family: "DMMono",
    src: "https://fonts.gstatic.com/s/dmmono/v14/aFTU7PB1QTsUX8KYthSQBK6P.ttf",
  });
  Font.registerHyphenationCallback((word: string) => [word]);
} catch (_) { /* fallback to Helvetica */ }

// ---------- Helpers ----------
const fmtGBP = (pence: number) =>
  `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return String(d); }
};

const slug = (s: string) =>
  (s || "trade").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

// ---------- Styles ----------
const s = StyleSheet.create({
  page: {
    fontFamily: "DMSans",
    fontSize: 10,
    color: INK,
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 48,
    backgroundColor: "#FFFFFF",
  },
  // Cover
  coverPage: { backgroundColor: CREAM, padding: 0 },
  coverHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 36, paddingBottom: 0 },
  brandMark: { fontFamily: "Bebas", fontSize: 22, color: NAVY, letterSpacing: 2 },
  tradeBadge: { fontFamily: "DMSans", fontSize: 9, color: MUTED, textAlign: "right" },
  coverBody: { flexGrow: 1, paddingHorizontal: 48, paddingTop: 80 },
  coverEyebrow: { fontFamily: "DMMono", fontSize: 9, color: TEAL, letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 },
  coverTitle: { fontFamily: "Bebas", fontSize: 56, color: NAVY, lineHeight: 1, letterSpacing: 1 },
  coverSubtitle: { fontFamily: "DMSans", fontSize: 18, color: INK, marginTop: 18, lineHeight: 1.3 },
  coverMeta: { flexDirection: "row", marginTop: 56, paddingTop: 20, borderTopWidth: 1, borderTopColor: RULE },
  coverMetaCol: { flex: 1, paddingRight: 16 },
  metaLabel: { fontFamily: "DMMono", fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  metaValue: { fontFamily: "DMSans", fontSize: 11, color: INK, marginBottom: 2 },
  coverTotal: { marginTop: "auto", paddingHorizontal: 48, paddingBottom: 56, alignItems: "center" },
  totalLabel: { fontFamily: "DMMono", fontSize: 10, color: MUTED, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 },
  totalValue: { fontFamily: "Bebas", fontSize: 64, color: TEAL, letterSpacing: 1 },
  // Section
  sectionEyebrow: { fontFamily: "DMMono", fontSize: 8, color: TEAL, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
  h1: { fontFamily: "Bebas", fontSize: 28, color: NAVY, marginBottom: 14, letterSpacing: 1 },
  h2: { fontFamily: "Bebas", fontSize: 16, color: NAVY, marginTop: 14, marginBottom: 6, letterSpacing: 1 },
  body: { fontFamily: "DMSans", fontSize: 10, color: INK, lineHeight: 1.45 },
  muted: { fontFamily: "DMSans", fontSize: 9, color: MUTED, lineHeight: 1.4 },
  rule: { borderBottomWidth: 1, borderBottomColor: RULE, marginVertical: 10 },
  // Table
  table: { marginTop: 6, borderWidth: 1, borderColor: RULE, borderRadius: 4 },
  thead: { flexDirection: "row", backgroundColor: NAVY, paddingVertical: 6, paddingHorizontal: 8 },
  th: { fontFamily: "DMMono", fontSize: 8, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 1 },
  tr: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: RULE },
  trAlt: { backgroundColor: "#F8FAFC" },
  td: { fontFamily: "DMSans", fontSize: 10, color: INK },
  tdMono: { fontFamily: "DMMono", fontSize: 9, color: INK },
  // Totals
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 4 },
  totalsLabel: { fontFamily: "DMSans", fontSize: 10, color: MUTED, marginRight: 12 },
  totalsValue: { fontFamily: "DMMono", fontSize: 11, color: INK, width: 110, textAlign: "right" },
  grand: { borderTopWidth: 2, borderTopColor: NAVY, marginTop: 8, paddingTop: 8 },
  // Highlight box
  highlight: { backgroundColor: "#ECFEFF", borderLeftWidth: 4, borderLeftColor: TEAL, padding: 10, marginTop: 10, borderRadius: 2 },
  // Pill
  pill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontFamily: "DMMono", fontSize: 8 },
  pillOk: { backgroundColor: "#DCFCE7", color: "#166534" },
  pillWarn: { backgroundColor: "#FEF3C7", color: "#92400E" },
  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    fontFamily: "DMMono",
    fontSize: 7,
    color: MUTED,
  },
});

// ---------- Components ----------
const Footer = ({ pageNumber, totalPages }: any) =>
  React.createElement(View, { style: s.footer, fixed: true } as any, [
    React.createElement(Text, { key: "g" }, "Generated on prografter.co.uk"),
    React.createElement(Text, { key: "p" }, `${pageNumber} / ${totalPages}`),
  ]);

const PageFrame = ({ children }: any) =>
  React.createElement(
    Page,
    { size: "A4", style: s.page },
    children,
    React.createElement(Text, {
      style: s.footer,
      fixed: true,
      render: ({ pageNumber, totalPages }: any) =>
        `Generated on prografter.co.uk     ·     ${pageNumber} / ${totalPages}`,
    }),
  );

// ---------- PDF Document ----------
function buildDoc(ctx: any) {
  const {
    quote, trade, homeowner, job, materials, milestones,
  } = ctx;

  const totalPence = ctx.totals.grandIncl;
  const subtotalPence = ctx.totals.subtotalExcl;
  const vatPence = ctx.totals.vat;

  // ---------- Page 1: Cover ----------
  const coverPage = React.createElement(
    Page,
    { size: "A4", style: { ...s.page, ...s.coverPage } },
    React.createElement(View, { style: s.coverHeader },
      React.createElement(Text, { style: s.brandMark }, "PROGRAFTER"),
      React.createElement(View, null,
        React.createElement(Text, { style: s.tradeBadge }, trade.company_name || trade.name || ""),
        trade.verified
          ? React.createElement(Text, { style: { ...s.tradeBadge, color: TEAL } }, "✓ Verified on ProGrafter")
          : React.createElement(Text, { style: s.tradeBadge }, "Verification pending"),
      ),
    ),
    React.createElement(View, { style: s.coverBody },
      React.createElement(Text, { style: s.coverEyebrow }, "Quote & Schedule of Works"),
      React.createElement(Text, { style: s.coverTitle }, (job.title || job.job_type || "Project Quote").toUpperCase()),
      React.createElement(Text, { style: s.coverSubtitle }, job.description?.slice(0, 180) || ""),
      React.createElement(View, { style: s.coverMeta },
        React.createElement(View, { style: s.coverMetaCol },
          React.createElement(Text, { style: s.metaLabel }, "Prepared for"),
          React.createElement(Text, { style: s.metaValue }, homeowner?.name || "Homeowner"),
          React.createElement(Text, { style: s.muted }, [job.address, job.postcode].filter(Boolean).join(", ")),
        ),
        React.createElement(View, { style: s.coverMetaCol },
          React.createElement(Text, { style: s.metaLabel }, "Prepared by"),
          React.createElement(Text, { style: s.metaValue }, trade.company_name || trade.name),
          React.createElement(Text, { style: s.muted }, trade.name || ""),
          trade.verified_on_prografter_at
            ? React.createElement(Text, { style: s.muted }, `Verified ${fmtDate(trade.verified_on_prografter_at)}`)
            : null,
        ),
        React.createElement(View, { style: s.coverMetaCol },
          React.createElement(Text, { style: s.metaLabel }, "Reference"),
          React.createElement(Text, { style: { ...s.metaValue, fontFamily: "DMMono" } }, quote.reference || quote.id.slice(0, 8)),
          React.createElement(Text, { style: s.muted }, `Issued ${fmtDate(quote.created_at)}`),
          React.createElement(Text, { style: s.muted }, `Valid until ${fmtDate(quote.valid_until)}`),
        ),
      ),
    ),
    React.createElement(View, { style: s.coverTotal },
      React.createElement(Text, { style: s.totalLabel }, "Total quoted (incl. VAT)"),
      React.createElement(Text, { style: s.totalValue }, fmtGBP(totalPence)),
    ),
    React.createElement(Text, {
      style: s.footer,
      fixed: true,
      render: ({ pageNumber, totalPages }: any) =>
        `prografter.co.uk     ·     ${pageNumber} / ${totalPages}`,
    }),
  );

  // ---------- Page 2: Schedule of Works ----------
  const sectionRows = (label: string, rows: any[], altStart = false) => {
    if (!rows.length) return null;
    return React.createElement(View, { style: { marginTop: 10 }, wrap: false },
      React.createElement(Text, { style: s.h2 }, label),
      React.createElement(View, { style: s.table },
        React.createElement(View, { style: s.thead },
          React.createElement(Text, { style: { ...s.th, flex: 4 } }, "Description"),
          React.createElement(Text, { style: { ...s.th, flex: 1, textAlign: "right" } }, "Qty"),
          React.createElement(Text, { style: { ...s.th, flex: 1.2, textAlign: "right" } }, "Unit £"),
          React.createElement(Text, { style: { ...s.th, flex: 1.2, textAlign: "right" } }, "Line £"),
        ),
        ...rows.map((r, i) =>
          React.createElement(View, { key: i, style: { ...s.tr, ...(i % 2 ? s.trAlt : {}) } },
            React.createElement(Text, { style: { ...s.td, flex: 4 } }, r.description),
            React.createElement(Text, { style: { ...s.tdMono, flex: 1, textAlign: "right" } }, `${r.qty} ${r.unit || ""}`),
            React.createElement(Text, { style: { ...s.tdMono, flex: 1.2, textAlign: "right" } }, fmtGBP(r.unitPence)),
            React.createElement(Text, { style: { ...s.tdMono, flex: 1.2, textAlign: "right" } }, fmtGBP(r.linePence)),
          ),
        ),
      ),
    );
  };

  const schedulePage = React.createElement(PageFrame, null,
    React.createElement(Text, { style: s.sectionEyebrow }, "Page 02 · Schedule of works"),
    React.createElement(Text, { style: s.h1 }, "Itemised schedule"),
    React.createElement(Text, { style: s.muted }, `Reference ${quote.reference} · Valid until ${fmtDate(quote.valid_until)}`),
    sectionRows("Materials", ctx.lineGroups.materials),
    sectionRows("Labour", ctx.lineGroups.labour),
    ctx.lineGroups.compliance.length ? sectionRows("Compliance & Certification", ctx.lineGroups.compliance) : null,
    React.createElement(View, { style: { marginTop: 18 } },
      React.createElement(View, { style: s.totalsRow },
        React.createElement(Text, { style: s.totalsLabel }, "Subtotal (excl. VAT)"),
        React.createElement(Text, { style: s.totalsValue }, fmtGBP(subtotalPence)),
      ),
      trade.vat_registered
        ? React.createElement(View, { style: s.totalsRow },
            React.createElement(Text, { style: s.totalsLabel }, "VAT @ 20%"),
            React.createElement(Text, { style: s.totalsValue }, fmtGBP(vatPence)),
          )
        : React.createElement(View, { style: s.totalsRow },
            React.createElement(Text, { style: s.totalsLabel }, "VAT"),
            React.createElement(Text, { style: s.totalsValue }, "Not VAT-registered"),
          ),
      React.createElement(View, { style: { ...s.totalsRow, ...s.grand } },
        React.createElement(Text, { style: { ...s.totalsLabel, color: NAVY, fontWeight: 700 } }, "Grand total (incl. VAT)"),
        React.createElement(Text, { style: { ...s.totalsValue, color: NAVY, fontFamily: "DMMono" } }, fmtGBP(totalPence)),
      ),
    ),
    quote.exclusions
      ? React.createElement(View, { style: { marginTop: 16 } },
          React.createElement(Text, { style: s.h2 }, "Exclusions"),
          React.createElement(Text, { style: s.body }, quote.exclusions),
        )
      : null,
  );

  // ---------- Page 3: Methodology & Timeline ----------
  const days = quote.working_days || ctx.estimatedWorkingDays || 0;
  const start = quote.estimated_start_date;
  const end = ctx.estimatedEndDate;
  const methodologyPage = React.createElement(PageFrame, null,
    React.createElement(Text, { style: s.sectionEyebrow }, "Page 03 · Methodology & timeline"),
    React.createElement(Text, { style: s.h1 }, "How we'll deliver"),
    React.createElement(Text, { style: s.body },
      quote.methodology
        || quote.message
        || "Methodology will be shared on request. The work will be carried out in accordance with current Building Regulations and manufacturer specifications.",
    ),
    React.createElement(Text, { style: s.h2 }, "Timeline"),
    React.createElement(View, { style: { flexDirection: "row", marginTop: 4 } },
      React.createElement(View, { style: { flex: 1 } },
        React.createElement(Text, { style: s.metaLabel }, "Estimated start"),
        React.createElement(Text, { style: s.metaValue }, fmtDate(start)),
      ),
      React.createElement(View, { style: { flex: 1 } },
        React.createElement(Text, { style: s.metaLabel }, "Working days"),
        React.createElement(Text, { style: s.metaValue }, days ? `${days} days` : "TBC"),
      ),
      React.createElement(View, { style: { flex: 1 } },
        React.createElement(Text, { style: s.metaLabel }, "Estimated completion"),
        React.createElement(Text, { style: s.metaValue }, fmtDate(end)),
      ),
    ),
    // Visual timeline bar
    React.createElement(View, { style: { marginTop: 14, height: 14, backgroundColor: "#E2E8F0", borderRadius: 7, overflow: "hidden" } },
      React.createElement(View, { style: { width: "100%", height: "100%", backgroundColor: TEAL } }),
    ),
    React.createElement(View, { style: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 } },
      React.createElement(Text, { style: s.muted }, fmtDate(start)),
      React.createElement(Text, { style: s.muted }, "Practical completion"),
      React.createElement(Text, { style: s.muted }, fmtDate(end)),
    ),
  );

  // ---------- Page 4: Materials & Specifications ----------
  const materialsPage = React.createElement(PageFrame, null,
    React.createElement(Text, { style: s.sectionEyebrow }, "Page 04 · Materials & specifications"),
    React.createElement(Text, { style: s.h1 }, "Specified materials"),
    React.createElement(Text, { style: s.muted }, "Brand and model details for major items in this project."),
    materials.length === 0 && (!quote.materials_spec || quote.materials_spec.length === 0)
      ? React.createElement(Text, { style: { ...s.body, marginTop: 14, fontStyle: "italic", color: MUTED } },
          "No specific materials nominated. Trade-grade equivalents will be sourced and approved with the homeowner before purchase.")
      : React.createElement(View, { style: s.table },
          React.createElement(View, { style: s.thead },
            React.createElement(Text, { style: { ...s.th, flex: 3 } }, "Item"),
            React.createElement(Text, { style: { ...s.th, flex: 3 } }, "Brand / Model"),
            React.createElement(Text, { style: { ...s.th, flex: 1.4, textAlign: "right" } }, "Sourced by"),
          ),
          ...[
            ...materials.map((m: any) => ({
              description: m.description,
              brand: [m.brand, m.model_or_spec].filter(Boolean).join(" — ") || "Trade-grade equivalent",
              source: "Trade",
            })),
            ...((quote.materials_spec || []) as any[]).map((m: any) => ({
              description: m.description || "—",
              brand: m.brand_model || "Client to choose",
              source: m.sourced_by === "client" ? "Client" : "Trade",
            })),
          ].map((m: any, i: number) =>
            React.createElement(View, { key: i, style: { ...s.tr, ...(i % 2 ? s.trAlt : {}) } },
              React.createElement(Text, { style: { ...s.td, flex: 3 } }, m.description),
              React.createElement(Text, { style: { ...s.td, flex: 3 } }, m.brand),
              React.createElement(Text, { style: { ...s.tdMono, flex: 1.4, textAlign: "right" } }, m.source),
            ),
          ),
        ),
  );

  // ---------- Page 5: Trade Credentials ----------
  const credRow = (label: string, value: string | null | undefined, pending = false) =>
    React.createElement(View, { style: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: RULE } },
      React.createElement(Text, { style: { ...s.metaLabel, flex: 1.4 } }, label),
      pending
        ? React.createElement(Text, { style: { ...s.body, flex: 2.6, fontStyle: "italic", color: MUTED } }, "Pending verification — see ProGrafter profile")
        : React.createElement(Text, { style: { ...s.body, flex: 2.6 } }, value || "—"),
    );

  const credentialsPage = React.createElement(PageFrame, null,
    React.createElement(Text, { style: s.sectionEyebrow }, "Page 05 · Trade credentials"),
    React.createElement(Text, { style: s.h1 }, "Who's doing the work"),
    React.createElement(Text, { style: s.h2 }, "Business"),
    credRow("Business name", trade.company_name),
    credRow("Trade type", trade.trade_type),
    credRow("Contact", trade.name),
    credRow("Years on the tools", trade.years_experience ? `${trade.years_experience} years` : null),
    credRow("Companies House", trade.companies_house_number),
    credRow("VAT registered", trade.vat_registered ? `Yes${trade.vat_number ? ` (${trade.vat_number})` : ""}` : "No"),

    React.createElement(Text, { style: s.h2 }, "Public liability insurance"),
    credRow("Insurer", trade.public_liability_insurer, !trade.public_liability_insurer && !trade.insurance_cert_url),
    credRow("Policy number", trade.public_liability_policy_number, !trade.public_liability_policy_number && !trade.insurance_cert_url),
    credRow("Cover", trade.public_liability_cover_pence ? fmtGBP(trade.public_liability_cover_pence) : null, !trade.public_liability_cover_pence),
    credRow("Expiry", trade.public_liability_expiry ? fmtDate(trade.public_liability_expiry) : null, !trade.public_liability_expiry),

    trade.professional_indemnity_insurer || trade.professional_indemnity_policy_number
      ? React.createElement(View, null,
          React.createElement(Text, { style: s.h2 }, "Professional indemnity"),
          credRow("Insurer", trade.professional_indemnity_insurer),
          credRow("Policy number", trade.professional_indemnity_policy_number),
          credRow("Cover", trade.professional_indemnity_cover_pence ? fmtGBP(trade.professional_indemnity_cover_pence) : null),
          credRow("Expiry", trade.professional_indemnity_expiry ? fmtDate(trade.professional_indemnity_expiry) : null),
        )
      : null,

    React.createElement(Text, { style: s.h2 }, "ProGrafter verification"),
    React.createElement(View, { style: { ...s.highlight, marginTop: 6 } },
      trade.verified
        ? React.createElement(Text, { style: s.body },
            `✓ Verified on ProGrafter${trade.verified_on_prografter_at ? ` on ${fmtDate(trade.verified_on_prografter_at)}` : ""}.`,
            trade.tier ? ` Tier: ${trade.tier.toUpperCase()}.` : "",
            trade.completed_jobs_count ? ` ${trade.completed_jobs_count} completed jobs on the platform.` : "")
        : React.createElement(Text, { style: s.body }, "Verification in progress — see ProGrafter profile for live status."),
    ),
  );

  // ---------- Page 6: Terms, Variations, Payment Schedule ----------
  const termsPage = React.createElement(PageFrame, null,
    React.createElement(Text, { style: s.sectionEyebrow }, "Page 06 · Terms · Variations · Payments"),
    React.createElement(Text, { style: s.h1 }, "Working agreement"),
    React.createElement(Text, { style: s.body },
      "This Schedule forms the basis of the works to be carried out at the address shown on Page 1. The figures quoted are valid until the date shown and assume reasonable site access during normal working hours. Once accepted on ProGrafter, this Schedule will be incorporated into a digital construction contract co-signed by both parties.",
    ),
    React.createElement(Text, { style: s.h2 }, "Variations"),
    React.createElement(View, { style: s.highlight },
      React.createElement(Text, { style: { ...s.body, fontWeight: 700, color: NAVY } },
        "Any work outside this Schedule will be quoted as a Variation and signed off digitally on ProGrafter before commencement."),
    ),
    React.createElement(Text, { style: s.h2 }, "Payment schedule"),
    React.createElement(View, { style: s.table },
      React.createElement(View, { style: s.thead },
        React.createElement(Text, { style: { ...s.th, flex: 0.5 } }, "#"),
        React.createElement(Text, { style: { ...s.th, flex: 4 } }, "Milestone"),
        React.createElement(Text, { style: { ...s.th, flex: 1.4, textAlign: "right" } }, "Amount"),
      ),
      ...milestones.map((m: any, i: number) =>
        React.createElement(View, { key: i, style: { ...s.tr, ...(i % 2 ? s.trAlt : {}) } },
          React.createElement(Text, { style: { ...s.tdMono, flex: 0.5 } }, String(m.sequence)),
          React.createElement(Text, { style: { ...s.td, flex: 4 } }, m.description),
          React.createElement(Text, { style: { ...s.tdMono, flex: 1.4, textAlign: "right" } }, fmtGBP(m.amount_pence)),
        ),
      ),
    ),
    React.createElement(Text, { style: { ...s.muted, marginTop: 8 } },
      "Funds are held and released through ProGrafter's payment infrastructure. No payments are taken outside the platform.",
    ),
  );

  // ---------- Page 7: Acceptance ----------
  const acceptUrl = `https://prografter.co.uk/quote/${quote.id}?token=${quote.accept_token}`;
  const acceptancePage = React.createElement(PageFrame, null,
    React.createElement(Text, { style: s.sectionEyebrow }, "Page 07 · Acceptance"),
    React.createElement(Text, { style: s.h1 }, "Accepting this quote"),
    React.createElement(Text, { style: s.body },
      "Acceptance happens on ProGrafter so the contract is digitally signed, time-stamped, and tamper-evident. Click the link below — or follow the QR code from your email — to review and accept.",
    ),
    React.createElement(View, { style: { ...s.highlight, marginTop: 14 } },
      React.createElement(Text, { style: { ...s.metaLabel, color: NAVY } }, "Accept this quote"),
      React.createElement(Text, { style: { fontFamily: "DMMono", fontSize: 10, color: TEAL, marginTop: 4 } }, acceptUrl),
    ),
    React.createElement(View, { style: { flexDirection: "row", marginTop: 36 } },
      React.createElement(View, { style: { flex: 1, marginRight: 12 } },
        React.createElement(Text, { style: s.metaLabel }, "Homeowner signature"),
        React.createElement(View, { style: { borderBottomWidth: 1, borderBottomColor: NAVY, height: 36, marginTop: 8 } }),
        React.createElement(Text, { style: { ...s.muted, marginTop: 4 } }, `${homeowner?.name || "Homeowner"} · Date: __________`),
      ),
      React.createElement(View, { style: { flex: 1 } },
        React.createElement(Text, { style: s.metaLabel }, "Trade signature"),
        React.createElement(View, { style: { borderBottomWidth: 1, borderBottomColor: NAVY, height: 36, marginTop: 8 } }),
        React.createElement(Text, { style: { ...s.muted, marginTop: 4 } }, `${trade.name || trade.company_name} · Date: __________`),
      ),
    ),
    React.createElement(View, { style: { position: "absolute", bottom: 56, left: 48, right: 48, paddingTop: 10, borderTopWidth: 1, borderTopColor: RULE } },
      React.createElement(Text, { style: { ...s.muted, textAlign: "center" } },
        "ProGrafter Ltd · Companies House 17124130 · prografter.co.uk"),
    ),
  );

  return React.createElement(Document, null,
    coverPage, schedulePage, methodologyPage, materialsPage, credentialsPage, termsPage, acceptancePage,
  );
}

// ---------- Build context ----------
function buildContext(quote: any, trade: any, homeowner: any, job: any, quoteMaterials: any[]) {
  // Determine selected price (pence)
  const selectedAmount = (() => {
    if (quote.tier_enabled) {
      const tier = quote.selected_tier || "standard";
      return Number(quote[`${tier}_price`] ?? quote.amount ?? 0);
    }
    return Number(quote.amount ?? 0);
  })();
  const grandIncl = Math.round(selectedAmount * 100);

  // Materials lines
  const materialsLines = quoteMaterials.map((m) => {
    const unit = Math.round(Number(m.unit_price_ex_vat) * 100);
    const qty = Number(m.quantity);
    return {
      description: [m.description, m.brand, m.model_or_spec].filter(Boolean).join(" — "),
      qty,
      unit: m.unit,
      unitPence: unit,
      linePence: Math.round(unit * qty),
    };
  });
  const materialsTotalPence = materialsLines.reduce((acc, r) => acc + r.linePence, 0);

  // Compliance line if green job
  const compliance: any[] = [];
  if (job.is_green_job) {
    compliance.push({
      description: "Compliance & MCS certification (per scheme requirements)",
      qty: 1, unit: "lot", unitPence: 0, linePence: 0,
    });
  }

  // Labour = grand-excl - materials (rough breakdown shown to homeowner)
  const grandExcl = trade.vat_registered ? Math.round(grandIncl / 1.2) : grandIncl;
  const labourPence = Math.max(0, grandExcl - materialsTotalPence);
  const labourLines = [{
    description: quote.message?.slice(0, 140) || "Labour & site management",
    qty: quote.working_days || 1,
    unit: quote.working_days ? "days" : "lot",
    unitPence: quote.working_days ? Math.round(labourPence / Math.max(1, quote.working_days)) : labourPence,
    linePence: labourPence,
  }];

  const subtotalExcl = grandExcl;
  const vat = trade.vat_registered ? grandIncl - grandExcl : 0;

  // Milestones (25/50/25 mirroring the contract generator)
  const milestones = [
    { sequence: 1, description: "Commencement payment (25%)", amount_pence: Math.round(grandIncl * 0.25) },
    { sequence: 2, description: "Practical completion (50%)", amount_pence: Math.round(grandIncl * 0.50) },
    { sequence: 3, description: "Final payment (25%)", amount_pence: grandIncl - Math.round(grandIncl * 0.25) - Math.round(grandIncl * 0.50) },
  ];

  // Estimated end date
  let estimatedEndDate: string | null = null;
  if (quote.estimated_start_date && quote.working_days) {
    const start = new Date(quote.estimated_start_date);
    const end = new Date(start);
    // simple add (calendar days) — close enough for an estimate doc
    end.setDate(end.getDate() + Math.ceil(quote.working_days * 1.4));
    estimatedEndDate = end.toISOString().slice(0, 10);
  }

  return {
    quote, trade, homeowner, job,
    materials: quoteMaterials, milestones,
    estimatedWorkingDays: quote.working_days,
    estimatedEndDate,
    lineGroups: { materials: materialsLines, labour: labourLines, compliance },
    totals: { subtotalExcl, vat, grandIncl },
  };
}

// ---------- HTTP handler ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth client (for identifying caller)
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { quote_id } = await req.json();
    if (!quote_id) {
      return new Response(JSON.stringify({ error: "quote_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Service-role client for cross-table reads + storage upload
    const admin = createClient(supabaseUrl, serviceKey);

    // Fetch the quote and verify caller is the trade owner
    const { data: quote, error: qErr } = await admin
      .from("quotes")
      .select("*")
      .eq("id", quote_id)
      .maybeSingle();
    if (qErr || !quote) {
      return new Response(JSON.stringify({ error: "Quote not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: trade } = await admin.from("trades").select("*").eq("id", quote.trade_id).maybeSingle();
    if (!trade) {
      return new Response(JSON.stringify({ error: "Trade not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (trade.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Only the quote owner can generate the PDF" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: job } = await admin.from("jobs").select("*").eq("id", quote.job_id).maybeSingle();
    const { data: homeowner } = job?.homeowner_id
      ? await admin.from("homeowners").select("*").eq("id", job.homeowner_id).maybeSingle()
      : { data: null };
    const { data: quoteMaterials } = await admin
      .from("quote_materials")
      .select("*")
      .eq("quote_id", quote_id)
      .order("created_at", { ascending: true });

    // Build PDF
    const ctx = buildContext(quote, trade, homeowner, job || {}, quoteMaterials || []);
    const doc = buildDoc(ctx);
    const pdfBlob = await pdf(doc).toBlob();
    const pdfBuffer = new Uint8Array(await pdfBlob.arrayBuffer());

    // Upload to storage
    const filename = `ProGrafter_Quote_${quote.reference || quote_id.slice(0, 8)}_${slug(trade.company_name || trade.name)}.pdf`;
    const path = `${trade.id}/${quote_id}/${filename}`;

    const { error: upErr } = await admin.storage
      .from("quote-pdfs")
      .upload(path, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
        cacheControl: "300",
      });
    if (upErr) {
      console.error("Upload failed", upErr);
      return new Response(JSON.stringify({ error: "Failed to store PDF", detail: upErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update quote row
    await admin
      .from("quotes")
      .update({
        pdf_path: path,
        pdf_generated_at: new Date().toISOString(),
        pdf_version: (quote.pdf_version || 0) + 1,
      })
      .eq("id", quote_id);

    // Log event (best-effort)
    await admin.from("quote_pdf_events").insert({
      quote_id,
      event_type: "generated",
      actor_user_id: user.id,
      actor_role: "trade",
      metadata: { filename, size_bytes: pdfBuffer.byteLength },
    });

    // Signed URL for trade preview (1 hour)
    const { data: signed } = await admin.storage
      .from("quote-pdfs")
      .createSignedUrl(path, 60 * 60, { download: filename });

    const acceptUrl = `https://prografter.co.uk/quote/${quote_id}?token=${quote.accept_token}`;

    return new Response(JSON.stringify({
      ok: true,
      filename,
      path,
      signed_url: signed?.signedUrl ?? null,
      accept_url: acceptUrl,
      size_bytes: pdfBuffer.byteLength,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("generate-quote-pdf error", err);
    return new Response(JSON.stringify({ error: "Internal error", detail: err?.message ?? String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
