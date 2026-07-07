// Staged multi-document pipeline for the Quote Health Check.
//
// Principle: never rely on one AI pass over all uploaded files. Instead:
//   1. Identify each supporting document's type.
//   2. Extract facts from EACH document separately (temperature 0).
//   3. Source-tag every fact.
//   4. Merge into a single evidence record.
//   5. Score quote-only (Document Score) and merged (Project Pack Confidence).
//   6. Generate the report from the merged evidence.

import type { CheckRow, StandardRow } from "./standard-engine.ts";

export type DocType =
  | "main_builder_quote"
  | "payment_schedule"
  | "drawings"
  | "specification"
  | "scope_of_works"
  | "builder_message"
  | "homeowner_notes"
  | "building_control"
  | "planning"
  | "structural_calcs"
  | "photo_evidence"
  | "unknown_supporting_document";

export const DOC_TYPES: DocType[] = [
  "main_builder_quote",
  "payment_schedule",
  "drawings",
  "specification",
  "scope_of_works",
  "builder_message",
  "homeowner_notes",
  "building_control",
  "planning",
  "structural_calcs",
  "photo_evidence",
  "unknown_supporting_document",
];

// How a fact is sourced. Aligns with the standard-engine SourceType vocabulary
// plus the richer document-level tags the spec calls for.
export type FactSource =
  | "main_quote"
  | "payment_schedule_document"
  | "drawing"
  | "specification"
  | "homeowner_note"
  | "builder_message"
  | "admin_note"
  | "ai_inference"
  | "not_found";

export interface DocFact {
  label: string;
  value: string;
  source_type: FactSource;
  status: string; // e.g. "supplied separately", "addressed", "missing"
}

export interface DocExtraction {
  file_name: string;
  detected_type: DocType;
  detected_type_label: string;
  facts: DocFact[];
  summary: string;
  affected_report: boolean;
  affected_reason: string | null;
}

const TYPE_LABELS: Record<DocType, string> = {
  main_builder_quote: "Main builder quote",
  payment_schedule: "Payment schedule",
  drawings: "Drawings",
  specification: "Specification",
  scope_of_works: "Scope of works",
  builder_message: "Builder email / message",
  homeowner_notes: "Homeowner notes",
  building_control: "Building Control document",
  planning: "Planning document",
  structural_calcs: "Structural calculations",
  photo_evidence: "Photo evidence",
  unknown_supporting_document: "Unknown supporting document",
};

export function docTypeLabel(t: DocType): string {
  return TYPE_LABELS[t] || "Supporting document";
}

// A cheap filename hint to seed classification (the AI still confirms/overrides).
export function guessTypeFromName(name: string): DocType {
  const n = (name || "").toLowerCase();
  if (/payment|stage|schedule|instal?ment|deposit/.test(n)) return "payment_schedule";
  if (/drawing|plan|elevation|section|dwg|architect/.test(n)) return "drawings";
  if (/spec|specification/.test(n)) return "specification";
  if (/scope|sow|works/.test(n)) return "scope_of_works";
  if (/email|message|whatsapp|correspond|letter/.test(n)) return "builder_message";
  if (/note|homeowner|owner/.test(n)) return "homeowner_notes";
  if (/building.?control|bc\b|part.?p|completion.?cert/.test(n)) return "building_control";
  if (/planning|permission|pp\b/.test(n)) return "planning";
  if (/struct|calc|engineer|beam/.test(n)) return "structural_calcs";
  if (/photo|img|image|jpg|jpeg|png|site/.test(n)) return "photo_evidence";
  if (/quote|quotation|estimate|tender/.test(n)) return "main_builder_quote";
  return "unknown_supporting_document";
}

// Prompt to identify + extract facts from ONE supporting document.
export function buildDocExtractionPrompt(fileName: string, hint: DocType): string {
  return `You are a DOCUMENT IDENTIFICATION + EVIDENCE EXTRACTION engine for a UK residential building project pack.

You are given ONE supporting document (file name: "${fileName}"). A filename hint suggests it may be: ${docTypeLabel(hint)} (this is only a hint — decide for yourself from the content).

TASK:
1. Identify the document type. Choose exactly one of:
   ${DOC_TYPES.join(", ")}.
   If you cannot tell, use "unknown_supporting_document". Never leave it blank.
2. Extract the relevant facts for that document type. Quote figures/text VERBATIM — never recompute or invent.
   - payment_schedule: whether staged payments are present, stage names, stage amounts, stage percentages, payment triggers, deposit amount, final payment, retention, whether payments are tied to completed work, variation payment rules.
   - drawings / specification / scope_of_works: project type, rooms/areas shown, structural openings, drainage, services, key scope expectations, drawing reference/date.
   - homeowner_notes: expected inclusions, verbal agreements, concerns, known exclusions, builder explanations.
   - builder_message / building_control / planning / structural_calcs / photo_evidence / unknown: extract any discernible facts relevant to a building quote.
3. Tag EACH fact with a source_type from: main_quote, payment_schedule_document, drawing, specification, homeowner_note, builder_message, admin_note, ai_inference, not_found. Do NOT present inference as fact — if inferred, use "ai_inference".
4. Give each fact a short "status" (e.g. "supplied separately", "stated", "missing", "unclear").

OUTPUT — return ONLY one valid JSON object, no markdown fences:
{
  "detected_type": "<one of the allowed types>",
  "summary": "<one plain-English sentence describing this document and what it adds>",
  "facts": [
    { "label": "<short label>", "value": "<verbatim value>", "source_type": "<allowed source>", "status": "<short status>" }
  ]
}
If the document contains no usable facts, return an empty "facts" array and say so in the summary.`;
}

// Build a compact, deterministic text block summarising all supporting-document
// evidence, for use as extra context in the MERGED checklist pass.
export function mergedEvidenceText(extractions: DocExtraction[]): string {
  if (extractions.length === 0) return "";
  const blocks = extractions.map((d) => {
    const facts = d.facts.length === 0
      ? "  (no usable facts extracted)"
      : d.facts.map((f) => `  - ${f.label}: ${f.value} [source: ${f.source_type}; status: ${f.status}]`).join("\n");
    return `DOCUMENT: ${d.file_name}\nDETECTED TYPE: ${docTypeLabel(d.detected_type)}\nSUMMARY: ${d.summary}\nFACTS:\n${facts}`;
  });
  return blocks.join("\n\n");
}

// Merged checklist prompt: the same fixed checklist, but the model is also given
// the supporting-document evidence and told how to treat "supplied separately".
export function buildMergedChecklistPrompt(
  standard: StandardRow,
  checks: CheckRow[],
  supportingEvidence: string,
): string {
  const checkLines = checks
    .map((c) => `${c.check_id} | ${c.check_title}${c.pass_condition ? " \u2014 " + c.pass_condition : ""}`)
    .join("\n");

  return `You are a QUOTE CHECK EVIDENCE ENGINE for UK residential building quotes.

You are checking the uploaded MAIN QUOTE against the fixed ProGrafter "${standard.standard_name}" (version ${standard.version}), AND you have been given evidence extracted from SUPPORTING DOCUMENTS supplied by the homeowner.

SCOPE OF THIS STANDARD:
Included: ${standard.included_scope || "See checklist"}
${standard.excluded_scope ? "Excluded (sourced separately, do NOT mark as missing): " + standard.excluded_scope : ""}

SUPPORTING DOCUMENT EVIDENCE (already extracted from separate files — treat as reliable homeowner-supplied evidence, not part of the main quote):
${supportingEvidence || "(none)"}

ABSOLUTE RULES:
- Work through the checklist below in the EXACT fixed order. Do not reorder, skip, merge or add checks.
- For EVERY check return exactly ONE verdict: "ADDRESSED", "NEEDS CLARIFICATION", or "MISSING".
    ADDRESSED = the item is clearly covered with adequate detail (in the main quote OR clearly evidenced by a supporting document).
    NEEDS CLARIFICATION = mentioned but vague, an allowance/provisional sum, contradictory, figures do not reconcile, OR only supplied separately and needs written confirmation it forms part of the agreed quote.
    MISSING = not covered by the main quote OR any supporting document.
- When an item is NOT in the main quote but IS evidenced by a supporting document, mark it "NEEDS CLARIFICATION" (not MISSING), set source_type to "builder_confirmed_separately", and note in evidence_quote that it was supplied separately and must be confirmed in writing.
- Quote figures VERBATIM. Never recompute. Do not present inference as fact.
- Items the standard lists as EXCLUDED must NOT be marked MISSING.

Allowed source_type values: "uploaded_quote", "homeowner_form", "builder_confirmed_separately", "admin_note", "ai_inference", "not_found".

THE FIXED CHECKLIST (score every one, in this order):
${checkLines}

Also detect the overall trade the quote appears to be (one word: extension, rewire, bathroom, boiler, or other).

OUTPUT — return ONLY one valid JSON object, no markdown/code fences:
{
  "is_building_quote": boolean,
  "detected_trade": string,
  "figures": { "subtotal": string|null, "vat_rate": string|null, "vat_amount": string|null, "total_incl_vat": string|null },
  "figures_reconcile": boolean,
  "checks": [
    { "check_id": "${checks[0]?.check_id || "XX-01"}", "verdict": "ADDRESSED|NEEDS CLARIFICATION|MISSING", "evidence_quote": string|null, "evidence_location": string|null, "source_type": "uploaded_quote|homeowner_form|builder_confirmed_separately|admin_note|ai_inference|not_found", "confidence": "high|medium|low" }
  ],
  "additional_observations": [ string ]
}
The "checks" array MUST contain one entry for every check id above, in the same order.`;
}

export interface CheckResultLite {
  check_id: string;
  check_title: string;
  section_name: string | null;
  verdict: string;
  source_type: string;
  evidence_quote: string | null;
}

const VERDICT_RANK: Record<string, number> = {
  MISSING: 0,
  "NEEDS CLARIFICATION": 1,
  ADDRESSED: 2,
};

// Compare quote-only vs merged results to find checks improved by supporting docs.
export function diffChecklists(
  quoteOnly: CheckResultLite[],
  merged: CheckResultLite[],
): Array<{ check_id: string; check_title: string; quote_verdict: string; merged_verdict: string; note: string }> {
  const byId = new Map(quoteOnly.map((r) => [r.check_id, r]));
  const improved: Array<{ check_id: string; check_title: string; quote_verdict: string; merged_verdict: string; note: string }> = [];
  for (const m of merged) {
    const q = byId.get(m.check_id);
    if (!q) continue;
    const qr = VERDICT_RANK[q.verdict] ?? 0;
    const mr = VERDICT_RANK[m.verdict] ?? 0;
    if (mr > qr) {
      const suppliedSeparately = m.source_type === "builder_confirmed_separately";
      improved.push({
        check_id: m.check_id,
        check_title: m.check_title,
        quote_verdict: q.verdict,
        merged_verdict: m.verdict,
        note: suppliedSeparately
          ? "Supplied separately — improves confidence, subject to written confirmation."
          : "Clarified by supporting documents.",
      });
    }
  }
  return improved;
}

// Was a payment schedule supplied as a separate document?
export function hasPaymentScheduleDoc(extractions: DocExtraction[]): boolean {
  return extractions.some(
    (d) => d.detected_type === "payment_schedule" && d.facts.length > 0,
  );
}
