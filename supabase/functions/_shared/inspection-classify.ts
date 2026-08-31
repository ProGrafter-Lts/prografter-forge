// Deterministic three-state classifier for Building Control site inspection
// reports. Pure functions only — no imports, no network — so the exact same
// module runs inside the edge function and inside the vitest suite.
//
// Never binary: a report is CLEAR, HOLD or MIXED. MIXED is always routed to
// manual review and is tagged distinctly from HOLD.

export type InspectionClassification = "CLEAR" | "HOLD" | "MIXED";

export interface InspectionParseInput {
  /** Structured "Required actions" rows from THIS inspection. */
  requiredActions?: string[];
  /** Structured rows carried over "from previous inspections". */
  previousRequiredActions?: string[];
  /** Free-text inspector narrative. */
  narrative?: string;
}

export interface InspectionClassificationResult {
  classification: InspectionClassification;
  reason: string;
  requiredActions: string[];
  previousRequiredActions: string[];
  openItems: string[];
  resolvedItems: string[];
  clearPhrases: string[];
  unableToAssess: string[];
  /** Everything the trade must action, deduped — used verbatim in notifications. */
  outstanding: string[];
}

// --- phrase banks -----------------------------------------------------------

/** Explicit "nothing to raise" language. */
const CLEAR_PATTERNS: RegExp[] = [
  /\bno adverse comments?\b/i,
  /\bno further comments?\b/i,
  /\bno comments?\b/i,
  /\bno issues?\b/i,
  /\bno defects?\b/i,
  /\bno contraventions?\b/i,
  /\bno action(?:s)? required\b/i,
  /\bnothing (?:further )?(?:to raise|outstanding)\b/i,
  /\bfound (?:to be )?satisfactory\b/i,
  /\bwork(?:s)? (?:is|are|was|were) satisfactory\b/i,
  /\binspection (?:passed|satisfactory)\b/i,
];

/** Inspector could not form a judgement — always a hold, never a pass. */
const UNABLE_PATTERNS: RegExp[] = [
  /\bunable to (?:check|inspect|assess|verify|confirm|comment)\b/i,
  /\b(?:full |complete )?check cannot be (?:carried out|completed|undertaken)\b/i,
  /\bcannot be (?:fully )?(?:assessed|checked|verified)\b/i,
  /\bcould not be (?:assessed|checked|inspected|verified)\b/i,
  /\bnot able to (?:check|assess|inspect|verify)\b/i,
  /\bno(?:t)? (?:details?|information|drawings?|calculations?) (?:were |was |been )?(?:received|available|provided)\b/i,
  /\bawaiting (?:details?|drawings?|calculations?|information)\b/i,
  /\buntil the details? are received\b/i,
];

/** Open / instructional language — an item the inspector still wants done. */
const OPEN_PATTERNS: RegExp[] = [
  /\bplease (?:address|confirm|refer|provide|ensure|supply|arrange|note|forward|submit)\b/i,
  /\bto be (?:added|provided|installed|fitted|completed|replaced|removed|confirmed|checked|carried out|rectified)\b/i,
  /\bmust be\b/i,
  /\bshould be\b/i,
  /\bwill (?:need|require)\b/i,
  /\bneeds? to be\b/i,
  /\brequires?\b/i,
  /\brequired (?:to|before|prior)\b/i,
  /\bensure that\b/i,
  /\bnot yet\b/i,
  /\boutstanding\b/i,
  /\bstill (?:to|required|outstanding|needed)\b/i,
  /\bdamp risk\b/i,
  /\bcontravention\b/i,
  /\bdoes not comply\b/i,
  /\bnon[- ]compliant\b/i,
];

/** Language showing a previously-raised item has been closed out. */
const RESOLVED_PATTERNS: RegExp[] = [
  /\bnow (?:replaced|provided|installed|fitted|completed|corrected|rectified|in place|satisfactory)\b/i,
  /\b(?:has|have) (?:now )?been (?:replaced|provided|installed|fitted|completed|corrected|rectified)\b/i,
  /\b(?:provided|installed|fitted|replaced|completed|corrected|rectified)\s*,\s*(?:fully|correctly|satisfactor)/i,
  /\b(?:fully|correctly) (?:nailed|fixed|installed|fitted|sealed|supported)\b/i,
  /\bpreviously (?:raised|noted).{0,40}\b(?:resolved|complete|completed|actioned)\b/i,
  /\b(?:now )?resolved\b/i,
  /\bitem(?:s)? closed\b/i,
];

// --- helpers ----------------------------------------------------------------

function matchAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

/** Split narrative into sentences / bullet lines, preserving readable text. */
export function splitStatements(narrative: string): string[] {
  return narrative
    .replace(/\r/g, "")
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z0-9])/g)
    .map((s) => s.replace(/^[\s•\-*\u2022]+/, "").trim())
    .filter((s) => s.length > 2);
}

function clean(list: string[] | undefined): string[] {
  return (list ?? [])
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length > 0);
}

function dedupe(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** A sentence is a question the inspector posed back to the trade. */
function isQuestion(sentence: string): boolean {
  return /\?\s*$/.test(sentence.trim());
}

// --- classifier -------------------------------------------------------------

export function classifyInspection(input: InspectionParseInput): InspectionClassificationResult {
  const requiredActions = dedupe(clean(input.requiredActions));
  const previousRequiredActions = dedupe(clean(input.previousRequiredActions));
  const statements = splitStatements(input.narrative ?? "");

  const openItems: string[] = [];
  const resolvedItems: string[] = [];
  const clearPhrases: string[] = [];
  const unableToAssess: string[] = [];

  for (const s of statements) {
    const unable = matchAny(s, UNABLE_PATTERNS);
    const open = matchAny(s, OPEN_PATTERNS) || isQuestion(s);
    const resolved = matchAny(s, RESOLVED_PATTERNS);
    const isClear = matchAny(s, CLEAR_PATTERNS);

    if (unable) unableToAssess.push(s);
    // An "open" cue anywhere in a sentence wins over resolved-sounding wording
    // in the SAME sentence — half-done is not done.
    if (open) openItems.push(s);
    else if (resolved) resolvedItems.push(s);
    if (isClear && !open && !unable) clearPhrases.push(s);
  }

  const tableHasEntries = requiredActions.length > 0 || previousRequiredActions.length > 0;
  const outstanding = dedupe([...requiredActions, ...previousRequiredActions, ...unableToAssess, ...openItems]);

  // 1. Resolved AND open language in the same report → MIXED (manual review).
  if (resolvedItems.length > 0 && (openItems.length > 0 || tableHasEntries)) {
    return {
      classification: "MIXED",
      reason:
        `Report contains ${resolvedItems.length} resolved item(s) alongside ` +
        `${openItems.length} open item(s)` +
        (tableHasEntries ? ` and ${requiredActions.length + previousRequiredActions.length} required action(s)` : "") +
        ". Routed to manual review — never auto-released.",
      requiredActions, previousRequiredActions, openItems, resolvedItems, clearPhrases, unableToAssess, outstanding,
    };
  }

  // 2. Anything unresolved → HOLD.
  if (tableHasEntries || unableToAssess.length > 0 || openItems.length > 0) {
    const reasons: string[] = [];
    if (tableHasEntries) {
      reasons.push(`${requiredActions.length + previousRequiredActions.length} required action(s) in the structured table`);
    }
    if (unableToAssess.length > 0) reasons.push(`${unableToAssess.length} inability-to-assess statement(s)`);
    if (openItems.length > 0) reasons.push(`${openItems.length} open/instructional item(s)`);
    return {
      classification: "HOLD",
      reason: `Hold: ${reasons.join("; ")}.`,
      requiredActions, previousRequiredActions, openItems, resolvedItems, clearPhrases, unableToAssess, outstanding,
    };
  }

  // 3. Explicit clear language, empty table, nothing open → CLEAR.
  if (clearPhrases.length > 0) {
    return {
      classification: "CLEAR",
      reason: `Clear: empty required-actions table and explicit clear language ("${clearPhrases[0]}").`,
      requiredActions, previousRequiredActions, openItems, resolvedItems, clearPhrases, unableToAssess, outstanding,
    };
  }

  // 4. No explicit clear statement — never assume a pass.
  return {
    classification: "HOLD",
    reason: "Hold: no explicit clear statement found in the narrative. A pass is never inferred from silence.",
    requiredActions, previousRequiredActions, openItems, resolvedItems, clearPhrases, unableToAssess, outstanding,
  };
}
