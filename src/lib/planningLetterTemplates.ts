/**
 * Planning outreach letter templates (A / B / C).
 * Deterministic composition used by the Planning Pipeline Batch Letter Printer.
 * No AI, no network — pure string composition from lead data.
 */

export type LetterTemplateId = "A" | "B" | "C";

export interface LetterRecipient {
  name: string | null;
  address: string | null;
  postcode: string | null;
  siteAddress: string;
  council: string;
  reference: string;
  description: string | null;
}

export const SENDER = {
  name: "ProGrafter",
  line1: "ProGrafter — Construction Confidence for Homeowners",
  email: "hello@prografter.co.uk",
  web: "prografter.co.uk",
};

export const TEMPLATE_META: Record<LetterTemplateId, { label: string; purpose: string }> = {
  A: { label: "Template A", purpose: "First contact — planning approved / submitted" },
  B: { label: "Template B", purpose: "Follow-up — no response to first letter" },
  C: { label: "Template C", purpose: "Quote Checker focused — homeowner already quoting" },
};

const longDate = () =>
  new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export const letterGreeting = (r: LetterRecipient) =>
  r.name && r.name.trim() ? `Dear ${r.name.trim()},` : "Dear Homeowner,";

const project = (r: LetterRecipient) =>
  (r.description || "your planning application").replace(/\s+/g, " ").trim().toLowerCase();

export const composeLetterBody = (r: LetterRecipient, template: LetterTemplateId): string[] => {
  const proj = project(r);
  const ref = r.reference;
  const council = r.council;

  if (template === "B") {
    return [
      `I wrote to you recently about your planning application (${ref}) with ${council} for ${proj}. I appreciate you may still be weighing things up, so this is just a short note in case it is useful now.`,
      `ProGrafter is a free service for homeowners running building work. We help you understand what a fair quote looks like, what should be included, and what to ask a builder before you commit any money.`,
      `The two things homeowners find most useful at your stage are our free Plan My Project cost guide, and our Quote Checker, which reviews a builder's written quote and tells you plainly what is missing.`,
      `There is nothing to pay to look, and no obligation. If it is helpful, visit ${SENDER.web} or reply to this letter and I will send the information across.`,
    ];
  }

  if (template === "C") {
    return [
      `I noticed your planning application (${ref}) with ${council} for ${proj}. If you are already collecting quotes from builders, this letter is intended to save you money and hassle.`,
      `Most homeowner disputes start with a vague quote. Missing scope, unclear payment stages, no allowance for materials, and no written specification are the usual causes.`,
      `Our Quote Checker reads your builder's quote and reports, in plain English, what is properly specified, what is missing, and the exact questions to put back to the builder before you sign anything.`,
      `You can find it at ${SENDER.web}. If you would prefer to talk it through first, reply to this letter or email ${SENDER.email}.`,
    ];
  }

  return [
    `I hope you don't mind me writing. I saw your planning application (${ref}) with ${council} for ${proj}, and I wanted to introduce something that may be genuinely useful before the building work begins.`,
    `ProGrafter is a free service for homeowners. We help you plan the project properly, understand realistic costs, check builders' quotes, and avoid the common problems that cause overspend and disputes.`,
    `There is no sales pressure and nothing to pay to get started. Plan My Project gives you an honest cost range for work like yours, and the Quote Checker reviews a written quote and highlights anything missing.`,
    `If that sounds useful, visit ${SENDER.web} or email ${SENDER.email} and I will point you in the right direction. Best of luck with the project.`,
  ];
};

/** Full plain-text letter, used for copy/CSV/printing fallbacks. */
export const fullLetterText = (r: LetterRecipient, template: LetterTemplateId): string =>
  [
    SENDER.line1,
    SENDER.email,
    "",
    longDate(),
    "",
    [r.name || "The Homeowner", r.address || r.siteAddress, r.postcode || ""].filter(Boolean).join("\n"),
    "",
    letterGreeting(r),
    "",
    ...composeLetterBody(r, template),
    "",
    "Kind regards,",
    SENDER.name,
    SENDER.web,
    "",
    `Ref: ${r.reference} · ${TEMPLATE_META[template].label}`,
  ].join("\n");

export const letterDateLabel = longDate;
