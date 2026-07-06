// ---------------------------------------------------------------------------
// THE PROGRAFTER SCORING RUBRIC ("Scoring Bible")
// ---------------------------------------------------------------------------
//
// This file is the SINGLE SOURCE OF TRUTH for what every score means.
//
// The AI never freely decides a score. The deterministic engine (qs-engine.ts)
// places each category against the fixed anchors below, and the AI report
// writer explains those scores using this rubric verbatim. Because the anchors,
// weights and definitions are fixed, the SAME quote ALWAYS produces the SAME
// score — a 5/10 means the same thing every time, and an 8/10 means the same
// thing every time.

// ---------------------------------------------------------------------------
// 1. GENERIC SCORE ANCHORS (apply to every category)
// ---------------------------------------------------------------------------

export const SCORE_ANCHORS: Record<number, string> = {
  0: "Absent or contradicted",
  1: "Mentioned only in vague terms",
  2: "Very limited detail",
  3: "Basic mention but not decision-ready",
  4: "Partial information",
  5: "Acceptable baseline but important gaps remain",
  6: "Reasonable detail but some clarifications needed",
  7: "Good detail with minor gaps",
  8: "Strong detail, mostly decision-ready",
  9: "Very strong detail, only minor clarification needed",
  10: "Complete, specific, decision-ready and clearly evidenced in the quote",
};

// ---------------------------------------------------------------------------
// 2. CATEGORY WEIGHTS (must sum to 100)
// ---------------------------------------------------------------------------
//
// Payment structure and variations carry more weight because they materially
// affect homeowner protection. Temporary works (scaffold, welfare/toilet hire)
// is capped low so that including it can never dominate the total score.

export const CATEGORY_WEIGHTS = {
  scope_detail: 20,
  pricing_transparency: 15,
  payment_structure: 15,
  programme_timescale: 10,
  variations_process: 10,
  certification_handover: 10,
  exclusions_clarity: 7.5,
  vat_clarity: 5,
  allowances: 5,
  temporary_works: 2.5,
  // Meta-indicator only — excluded from the weighted document score.
  homeowner_decision_safety: 0,
} as const;

export type RubricKey = keyof typeof CATEGORY_WEIGHTS;

// ---------------------------------------------------------------------------
// 3. CATEGORY-SPECIFIC RUBRICS (low / medium / high anchors + improvement)
// ---------------------------------------------------------------------------

export interface CategoryRubric {
  label: string;
  anchors: string; // human-readable low/med/high anchor definitions
  improvement: string; // what would move the score up
}

export const CATEGORY_RUBRICS: Record<Exclude<RubricKey, "homeowner_decision_safety">, CategoryRubric> = {
  vat_clarity: {
    label: "VAT clarity",
    anchors:
      "0 = no VAT info at all; 2 = VAT mentioned but no rate/amount; 5 = VAT rate OR amount shown but not both; 7 = rate and amount shown; 9 = rate, amount and VAT-inclusive total shown; 10 = rate, amount, inclusive total and VAT treatment (standard/reduced/reverse-charge) stated.",
    improvement: "Show the VAT rate, the VAT amount and a clearly VAT-inclusive total.",
  },
  scope_detail: {
    label: "Physical scope detail",
    anchors:
      "0 = no scope described; 2 = one or two vague line items; 4 = a few items, no quantities/spec; 5 = several items, limited spec; 6 = itemised list, some finishes; 8 = fully itemised with quantities/finishes for the main works; 10 = complete room-by-room / element-by-element specification with quantities, finishes, methods and exclusions.",
    improvement: "Add an itemised scope with quantities, finishes and methods for each element of the works.",
  },
  pricing_transparency: {
    label: "Pricing transparency",
    anchors:
      "0 = no price; 2 = a single lump sum only; 5 = total plus VAT but no breakdown; 7 = subtotal, VAT and total shown; 9 = subtotal, VAT, total and section/trade sub-totals; 10 = full priced breakdown per work item with labour/material split.",
    improvement: "Provide a priced breakdown per work section rather than a single lump sum.",
  },
  payment_structure: {
    label: "Payment structure",
    anchors:
      "0 = no payment information at all; 2 = payment mentioned vaguely but no stages; 5 = deposit/final payment mentioned but no clear triggers; 7 = staged payments listed but not tied clearly to work completion; 9 = staged payments tied to clear milestones; 10 = full payment schedule with amounts, triggers, retention/final balance and variation payment rules.",
    improvement: "Provide a written staged payment schedule showing each amount, the trigger, and the work to be completed before payment is due.",
  },
  programme_timescale: {
    label: "Programme / timescale",
    anchors:
      "0 = no timing information; 2 = vague timing only (e.g. 'as soon as possible'); 5 = estimated duration but no start date or stages; 7 = start/duration given with broad phases; 9 = clear schedule of works with key milestones; 10 = full programme with start date, phase durations, dependencies and completion target.",
    improvement: "Provide an estimated start date, phase durations and a target completion date.",
  },
  variations_process: {
    label: "Variations process",
    anchors:
      "0 = no mention of changes/variations; 2 = 'extras charged separately' with no process; 5 = variations mentioned but no pricing/approval method; 7 = written variation process without pricing basis; 9 = written variation process with pricing basis and approval; 10 = full variations procedure with day-rates/margins, written sign-off and effect on programme.",
    improvement: "Describe how changes are priced, approved in writing, and how they affect the programme.",
  },
  certification_handover: {
    label: "Certification / handover",
    anchors:
      "0 = nothing on certificates/warranties/handover; 2 = warranty implied but unspecified; 5 = warranty OR certification mentioned; 7 = certification route stated (e.g. Building Control/electrical/gas); 9 = certification plus warranty and handover pack; 10 = full handover pack: all certificates, warranties, as-builts and sign-off listed.",
    improvement: "Confirm which certificates, warranties and handover documents will be provided on completion.",
  },
  exclusions_clarity: {
    label: "Exclusions clarity",
    anchors:
      "0 = no exclusions stated; 3 = a single generic exclusion; 5 = some exclusions listed; 7 = clear exclusions list covering the obvious risk items; 9 = comprehensive exclusions with assumptions; 10 = comprehensive exclusions plus stated assumptions and who carries each excluded risk.",
    improvement: "List clearly what is NOT included, and state the assumptions behind the price.",
  },
  allowances: {
    label: "Allowances / provisional sums",
    anchors:
      "0 = client-selected items not covered at all; 5 = allowances implied but no values; 8 = named provisional sums/allowances with values; 10 = all allowances shown with values, what they cover and how any difference is reconciled.",
    improvement: "Show each allowance/provisional sum with its value and how any cost difference is reconciled.",
  },
  temporary_works: {
    label: "Temporary works / site setup",
    anchors:
      "0 = temporary works needed but not addressed; 5 = not itemised (acceptable for many projects); 7 = scaffold OR welfare included; 9 = scaffold and welfare included; 10 = scaffold, welfare, access, protection and durations all itemised. NOTE: this category is weighted low — its inclusion must not materially inflate the total.",
    improvement: "Confirm scaffold, welfare/toilet, site access and protection with durations if the site requires them.",
  },
};

// ---------------------------------------------------------------------------
// 4. PROJECT-DEPENDENT ITEMS
// ---------------------------------------------------------------------------
//
// These must NOT automatically reduce the score. They are only relevant if the
// homeowner brief says they are expected, or the quote claims to include them
// but does not specify them. Otherwise classify them as "project-dependent —
// confirm if expected" rather than "missing".

export const PROJECT_DEPENDENT_ITEMS = [
  "kitchen",
  "bathroom",
  "flooring",
  "tiling",
  "decoration",
  "heating",
  "party wall",
  "planning",
  "landscaping",
];

// ---------------------------------------------------------------------------
// 5. RUBRIC TEXT FOR THE AI WRITER PROMPT
// ---------------------------------------------------------------------------

export function rubricPromptText(): string {
  const anchors = Object.entries(SCORE_ANCHORS)
    .map(([n, d]) => `${n}/10 = ${d}`)
    .join("\n");
  const cats = Object.entries(CATEGORY_RUBRICS)
    .map(
      ([key, r]) =>
        `- ${r.label} (weight ${CATEGORY_WEIGHTS[key as RubricKey]}%): ${r.anchors}\n  Improve by: ${r.improvement}`,
    )
    .join("\n");
  return `PROGRAFTER SCORING RUBRIC (fixed — the scores were computed against these anchors; explain them, never re-decide them).

GENERIC SCORE ANCHORS (apply to every category):
${anchors}

CATEGORY-SPECIFIC ANCHORS AND WEIGHTS:
${cats}

PROJECT-DEPENDENT ITEMS (${PROJECT_DEPENDENT_ITEMS.join(", ")}):
Do NOT treat these as missing/problems unless the homeowner brief says they are expected, or the quote claims to include them but does not specify them. Otherwise label them "project-dependent — confirm if expected".

For every category discussed you MUST express: the score, the reason, the evidence source, and what would improve the score (use the "improve by" text). Write like a QS/compliance audit, not an AI opinion.`;
}
