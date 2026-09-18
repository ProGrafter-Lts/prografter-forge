/**
 * ProGrafter letter & envelope print engine.
 *
 * Ported verbatim (behaviour-wise) from the standalone ProGrafter Batch Letter
 * Printer. This module is the single source of truth for letter composition —
 * the same functions feed BOTH the on-screen preview and the print sheet, so
 * what the user sees is exactly what the printer receives.
 *
 * Text only lives here. Layout lives in LetterSheet.tsx / LETTER_PRINT_CSS.
 */

export type LetterTemplateKey = "A" | "B" | "C";

export interface LetterTemplates {
  A: { name: string; body: string };
  B: { name: string; body: string };
  C: { name: string; body: string };
  sender: string;
  signOff: string;
  ps: string;
}

export interface EnvelopeSettings {
  /** "229,162" — width,height in mm */
  size: string;
  addrTop: number; // mm
  addrLeft: number; // mm
  addrSize: number; // pt
}

export interface BatchRow {
  id: string;
  /** Address block, one line per line. Line 0 is the recipient name. */
  address: string[];
  template: LetterTemplateKey;
  ref: string;
  type: string;
}

export const ENVELOPE_SIZES = [
  { id: "229,162", label: "C5 landscape (229 × 162mm)" },
  { id: "162,229", label: "C5 portrait (162 × 229mm)" },
  { id: "210,148", label: "A5 landscape (210 × 148mm)" },
  { id: "148,210", label: "A5 portrait (148 × 210mm)" },
  { id: "220,110", label: "DL landscape (220 × 110mm)" },
];

export const DEFAULT_ENVELOPE: EnvelopeSettings = {
  size: "229,162",
  addrTop: 70,
  addrLeft: 95,
  addrSize: 13,
};

export const DEFAULT_SENDER = [
  "Lee Palfreeman",
  "Founder, ProGrafter Ltd",
  "Mansfield, Nottinghamshire",
  "E-Mail: hello@prografter.co.uk",
  "prografter.co.uk",
].join("\n");

export const DEFAULT_SIGN_OFF = [
  "Kind regards,",
  "",
  "**Lee Palfreeman**",
  "Founder · ProGrafter Ltd",
  "[FOOTER]Company 17124130 · ICO ZC114018",
].join("\n");

export const DEFAULT_PS =
  "P.S. When your building quotes arrive, don't automatically assume the cheapest quote is the cheapest job. Check exactly what's included — and what's missing — before you decide.";

const TEMPLATE_A_BODY = `Dear {{name}}

I noticed your planning application relating to **{{type}}**, reference **{{ref}}**. I wanted to contact you while your project is still at the planning stage, before you start collecting quotes and making decisions about who will carry out the work.

**Before you start collecting building quotes, make sure every builder is actually pricing the same job.**

ProGrafter is a Nottinghamshire-based platform built to help homeowners planning significant building work compare quotes properly, find verified trades and understand exactly what is included before work begins.

Our **Quote Checker** is designed to highlight missing work, exclusions, assumptions and allowances that can make two quotes for apparently the same project look very different.

When you're ready to find trades, ProGrafter is designed around a simple principle: **three properly matched local trades — not thirty random leads.** Trades presented as verified go through checks covering identity, insurance, qualifications or business credentials and references.

I'm Lee Palfreeman, founder of ProGrafter. I've spent 27 years working in construction, and I built the platform after seeing first-hand how difficult it can be for homeowners to compare quotes, understand scope and find reliable people in the right order. My construction background is why ProGrafter exists; **ProGrafter itself is not a building company and this letter is not a quotation for your work.**

To be straight with you, we're early. I'm currently onboarding the founding cohort of Nottinghamshire trades, so the verified network is deliberately small and growing. By the time your planning is approved and you're ready to start, it should be considerably larger.

There's nothing you need to buy or commit to today. **It's simply worth keeping prografter.co.uk with your project paperwork and having a look before you start making decisions.**`;

const TEMPLATE_B_BODY = `Dear {{name}}

I wrote to you recently about your planning application relating to **{{type}}** (reference **{{ref}}**). I appreciate you may still be weighing things up, so this is just a short note in case it is useful now.

ProGrafter is a free service for homeowners running building work. We help you understand what a fair quote looks like, what should be included, and what to ask a builder before you commit any money.

The two things homeowners find most useful at your stage are our free Plan My Project cost guide, and our **Quote Checker**, which reviews a builder's written quote and tells you plainly what is missing.

There is nothing to pay to look, and no obligation. If it is helpful, visit prografter.co.uk or reply to this letter and I will send the information across.`;

const TEMPLATE_C_BODY = `Dear {{name}}

I noticed your planning application relating to **{{type}}** (reference **{{ref}}**). If you are already collecting quotes from builders, this letter is intended to save you money and hassle.

Most homeowner disputes start with a vague quote. Missing scope, unclear payment stages, no allowance for materials, and no written specification are the usual causes.

Our **Quote Checker** reads your builder's quote and reports, in plain English, what is properly specified, what is missing, and the exact questions to put back to the builder before you sign anything.

You can find it at prografter.co.uk. If you would prefer to talk it through first, reply to this letter or email hello@prografter.co.uk.`;

export const DEFAULT_TEMPLATES: LetterTemplates = {
  A: { name: "First contact — planning stage", body: TEMPLATE_A_BODY },
  B: { name: "Follow-up — no response", body: TEMPLATE_B_BODY },
  C: { name: "Quote Checker focused", body: TEMPLATE_C_BODY },
  sender: DEFAULT_SENDER,
  signOff: DEFAULT_SIGN_OFF,
  ps: DEFAULT_PS,
};

/* ------------------------------------------------------------------ */
/* Composition helpers — ported from the standalone printer            */
/* ------------------------------------------------------------------ */

export const escapeHtml = (s: string | null | undefined) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** UK long date, e.g. "18th September 2026". Generated at print time. */
export const todayStr = (d: Date = new Date()) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const day = d.getDate();
  let suffix = "th";
  const n = day % 10;
  const t = day % 100;
  if (t < 11 || t > 13) {
    if (n === 1) suffix = "st";
    else if (n === 2) suffix = "nd";
    else if (n === 3) suffix = "rd";
  }
  return `${day}${suffix} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/** **bold** and *italic* into safe HTML. */
export const mdInline = (text: string | null | undefined) => {
  if (!text) return "";
  let s = escapeHtml(text);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|\s|\()\*([^*\n]+)\*(?=[\s.,;:!?)]|$)/g, "$1<em>$2</em>");
  return s;
};

export const fillPlaceholders = (tpl: string, row: BatchRow) => {
  const name = (row.address[0] || "").trim();
  const greeting = name ? `Dear ${name}` : "Dear Sir or Madam";
  return (tpl || "")
    .replace(/\{\{name\}\}/g, name || "Homeowner")
    .replace(/\{\{address\}\}/g, row.address.join("\n"))
    .replace(/\{\{ref\}\}/g, row.ref || "[reference]")
    .replace(/\{\{type\}\}/g, row.type || "[proposal description]")
    .replace(/\{\{date\}\}/g, todayStr())
    .replace(/\{\{greeting\}\}/g, greeting);
};

/** Multi-line block (sender / sign-off). [FOOTER] marks the small print line. */
export const renderBlock = (text: string | null | undefined) => {
  if (!text) return "";
  return text
    .split("\n")
    .map((raw) => {
      let ln = raw;
      let footer = false;
      if (ln.indexOf("[FOOTER]") === 0) {
        footer = true;
        ln = ln.slice(8);
      }
      const inner = mdInline(ln) || "&nbsp;";
      return `<div${footer ? ' class="footer"' : ""}>${inner}</div>`;
    })
    .join("");
};

/** Body text into paragraphs, with the same smart splitting as the printer. */
export const renderBody = (text: string | null | undefined) => {
  if (!text) return "";
  const clean = text.replace(/\r/g, "").trim();
  if (!clean) return "";
  const paras = /\n\s*\n/.test(clean)
    ? clean.split(/\n\s*\n/).map((p) => p.replace(/\n+/g, " ").trim())
    : clean.split(/\n/).map((p) => p.trim());
  return paras
    .filter((p) => p.length > 0)
    .map((p) => `<p>${mdInline(p)}</p>`)
    .join("");
};

/**
 * THE letter builder. Used by preview and print alike.
 */
export const buildLetterHtml = (
  row: BatchRow,
  templates: LetterTemplates,
  logoUrl: string,
) => {
  const t = templates[row.template] || templates.A;
  const senderHtml = renderBlock(templates.sender || "");
  const signOffHtml = renderBlock(templates.signOff || "");
  const bodyHtml = renderBody(fillPlaceholders(t.body, row));
  const psRaw = templates.ps || "";
  const psHtml = psRaw ? `<div class="ps">${mdInline(fillPlaceholders(psRaw, row))}</div>` : "";
  const recName = (row.address[0] || "").trim();
  const recRestLines = row.address
    .slice(1)
    .map((ln) => `<div>${escapeHtml(ln)}</div>`)
    .join("");

  return (
    '<div class="letterPage">' +
    '<table class="headerTbl"><tr>' +
    `<td class="logoCell"><img class="logo" src="${escapeHtml(logoUrl)}" alt="ProGrafter"></td>` +
    `<td class="senderCell">${senderHtml}</td>` +
    "</tr></table>" +
    '<div class="recipient">' +
    `<div class="recName">${escapeHtml(recName)}</div>` +
    recRestLines +
    "</div>" +
    `<div class="date">${escapeHtml(todayStr())}</div>` +
    `<div class="body">${bodyHtml}</div>` +
    `<div class="sign">${signOffHtml}</div>` +
    psHtml +
    "</div>"
  );
};

export const buildEnvelopeHtml = (row: BatchRow) =>
  `<div class="envSheet"><div class="rec">${escapeHtml(row.address.join("\n"))}</div></div>`;

/** A row is READY when it has a name, at least one address line and a postcode. */
export const rowIsReady = (row: BatchRow) => {
  const name = (row.address[0] || "").trim();
  const rest = row.address.slice(1).filter((l) => l.trim().length > 0);
  return Boolean(name && rest.length >= 1 && row.template && row.ref && row.type);
};
