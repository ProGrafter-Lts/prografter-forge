// Fixed-standard Quote Check engine.
//
// Core principle: AI extracts evidence, the FIXED checklist scores it, the
// report explains the result. The AI must not invent the checklist, reorder
// checks, skip checks, add verdict states or recompute figures.

export type Verdict = "ADDRESSED" | "NEEDS CLARIFICATION" | "MISSING" | "NOT_APPLICABLE";

export const VERDICTS: Verdict[] = ["ADDRESSED", "NEEDS CLARIFICATION", "MISSING", "NOT_APPLICABLE"];

export type SourceType =
  | "uploaded_quote"
  | "homeowner_form"
  | "builder_confirmed_separately"
  | "admin_note"
  | "ai_inference"
  | "not_found";

export interface StandardRow {
  id: string;
  standard_id: string;
  standard_name: string;
  trade_type: string;
  version: string;
  scope_summary: string | null;
  included_scope: string | null;
  excluded_scope: string | null;
}

export interface CheckRow {
  check_id: string;
  display_order: number;
  section_name: string | null;
  check_title: string;
  pass_condition: string | null;
  why_it_matters: string | null;
}

export interface CheckResult {
  check_id: string;
  check_title: string;
  section_name: string | null;
  verdict: Verdict;
  evidence_quote: string | null;
  evidence_location: string | null;
  source_type: SourceType;
  confidence: "high" | "medium" | "low";
  reason_from_standard: string | null;
  homeowner_question: string | null;
}

// --- Standard selection ------------------------------------------------------

// Map a free-text project type to a fixed-standard trade, or null (no fixed
// standard -> General Guidance Mode).
export function tradeFromProjectType(projectType: string | null | undefined): string | null {
  const p = (projectType || "").toLowerCase();
  if (!p) return null;
  if (/bathroom|wet\s?room|en-?suite/.test(p)) return "bathroom";
  if (/rewire|re-wire|electrical|consumer unit/.test(p)) return "rewire";
  if (/boiler|heating|central heating|combi|gas swap/.test(p)) return "boiler";
  if (/extension/.test(p)) return "extension";
  return null;
}

// Detect the trade the QUOTE CONTENT looks like, from extracted signals.
export function tradeFromContent(signals: {
  detected_trade?: string | null;
}): string | null {
  const t = (signals.detected_trade || "").toLowerCase();
  if (/bathroom/.test(t)) return "bathroom";
  if (/rewire|electrical/.test(t)) return "rewire";
  if (/boiler|heating/.test(t)) return "boiler";
  if (/extension/.test(t)) return "extension";
  return null;
}

// --- Scoring (transparent derived score, v1) --------------------------------

export function scoreChecklist(results: CheckResult[]) {
  // Items the AI judges genuinely irrelevant to THIS quote's scope are excluded
  // from scoring entirely — they are neither credited nor penalised, so the
  // score reflects the quote against what actually applies, not an exhaustive
  // 100+ item audit where everything unmentioned drags the score down.
  const applicable = results.filter((r) => r.verdict !== "NOT_APPLICABLE");
  const total = applicable.length;
  const addressed = applicable.filter((r) => r.verdict === "ADDRESSED").length;
  const clarify = applicable.filter((r) => r.verdict === "NEEDS CLARIFICATION").length;
  const missing = applicable.filter((r) => r.verdict === "MISSING").length;
  const notApplicable = results.filter((r) => r.verdict === "NOT_APPLICABLE").length;
  const raw = total > 0 ? ((addressed * 1 + clarify * 0.5) / total) * 100 : 0;
  return {
    total_checks: total,
    addressed_count: addressed,
    clarification_count: clarify,
    missing_count: missing,
    not_applicable_count: notApplicable,
    score: Math.round(raw),
  };
}

// --- Deterministic question + message generation ----------------------------

// Every MISSING generates a question; important NEEDS CLARIFICATION items do too.
export function buildQuestions(results: CheckResult[]) {
  const questions: { check_id: string; question: string; why_it_matters: string | null }[] = [];
  for (const r of results) {
    if (r.verdict === "MISSING" || (r.verdict === "NEEDS CLARIFICATION" && r.confidence !== "low")) {
      const q = r.homeowner_question && r.homeowner_question.trim().length > 0
        ? r.homeowner_question.trim()
        : `Can you confirm how the quote covers "${r.check_title}"?`;
      questions.push({ check_id: r.check_id, question: q, why_it_matters: r.reason_from_standard });
    }
  }
  return questions;
}

export function buildBuilderMessage(
  questions: { check_id: string; question: string }[],
): string {
  if (questions.length === 0) {
    return "Thank you for the quote. It reads as clear and complete against our checklist — we have no outstanding points to raise before deciding.";
  }
  const lines = questions.slice(0, 12).map((q) => `• ${q.question}`);
  return [
    "Thank you for the quote. Before we make a decision, could you please confirm the following points so we fully understand what is included and how the job would be managed?",
    "",
    ...lines,
    "",
    "Once these are confirmed in writing we'll be in a position to move forward. Thank you.",
  ].join("\n");
}

export function verdictSummary(counts: ReturnType<typeof scoreChecklist>): string {
  const { addressed_count, clarification_count, missing_count, not_applicable_count, total_checks, score } = counts;
  const naPart = not_applicable_count > 0 ? ` ${not_applicable_count} not relevant to this quote were excluded.` : "";
  return (
    `Checked against ${total_checks} relevant checks: ${addressed_count} addressed, ` +
    `${clarification_count} need clarification, ${missing_count} missing.${naPart} ` +
    `Quote Check Score ${score}/100.`
  );
}

export const DISCLAIMER =
  "ProGrafter\u2019s Quote Check is guidance only. It checks the uploaded quote against the selected ProGrafter standard and highlights items that appear addressed, need clarification or are missing. It is not a competing quotation, survey, design, legal advice, tax advice or professional inspection. Always ask the contractor and relevant professionals to confirm unclear items in writing before proceeding.";

// --- Extraction prompt -------------------------------------------------------

export function buildExtractionPrompt(standard: StandardRow, checks: CheckRow[]): string {
  const checkLines = checks
    .map((c) => `${c.check_id} | ${c.check_title}${c.pass_condition ? " \u2014 " + c.pass_condition : ""}`)
    .join("\n");

  return `You are a QUOTE CHECK EVIDENCE ENGINE for UK residential building quotes.

You are checking ONE uploaded quote against the fixed ProGrafter "${standard.standard_name}" (version ${standard.version}).

SCOPE OF THIS STANDARD:
Included: ${standard.included_scope || "See checklist"}
${standard.excluded_scope ? "Excluded (sourced separately, do NOT mark as missing): " + standard.excluded_scope : ""}

ABSOLUTE RULES:
- Work through the checklist below in the EXACT fixed order given. Do not reorder, skip, merge or add checks.
- For EVERY check, return exactly ONE verdict: "ADDRESSED", "NEEDS CLARIFICATION", "MISSING", or "NOT_APPLICABLE". No other value.
    ADDRESSED = the quote clearly includes the item with adequate detail.
    NEEDS CLARIFICATION = the quote mentions it but it is vague, an allowance/provisional sum, contradictory, or figures do not reconcile.
    MISSING = the item is genuinely relevant to THIS job but the quote does not mention it at all.
    NOT_APPLICABLE = the item does not apply to THIS specific quote's scope of works, so its absence is not a fault. Examples: a check about an option the homeowner did not choose, a fixture/appliance not part of this job, or work the quote clearly states is out of scope or handled by others.
- CRITICAL — do NOT overuse NOT_APPLICABLE. Only use it when you have positive evidence the item is irrelevant to this job. If an item WOULD normally be expected for a job of this type and is simply absent, it is MISSING, not NOT_APPLICABLE. When in doubt between MISSING and NOT_APPLICABLE, choose MISSING.
- Quote figures and evidence VERBATIM from the document. NEVER recompute, re-round or correct subtotal, VAT, totals, line prices, allowances or quantities. If figures do not reconcile, mark the relevant check NEEDS CLARIFICATION.
- Do not present inference as fact. If no evidence is found AND the item is relevant, source_type MUST be "not_found" and verdict MUST be "MISSING".
- Items the standard lists as EXCLUDED must be marked NOT_APPLICABLE, never MISSING.

Allowed source_type values: "uploaded_quote", "homeowner_form", "builder_confirmed_separately", "admin_note", "ai_inference", "not_found".

THE FIXED CHECKLIST (score every one, in this order):
${checkLines}

Also detect the overall trade the quote appears to be (one word: extension, rewire, bathroom, boiler, or other) so a mismatch with the selected standard can be flagged.

OUTPUT — return ONLY one valid JSON object, no markdown/code fences. Use exactly these keys:
{
  "is_building_quote": boolean,
  "detected_trade": string,
  "figures": { "subtotal": string|null, "vat_rate": string|null, "vat_amount": string|null, "total_incl_vat": string|null },
  "figures_reconcile": boolean,
  "checks": [
    { "check_id": "${checks[0]?.check_id || "XX-01"}", "verdict": "ADDRESSED|NEEDS CLARIFICATION|MISSING|NOT_APPLICABLE", "evidence_quote": string|null, "evidence_location": string|null, "source_type": "uploaded_quote|homeowner_form|builder_confirmed_separately|admin_note|ai_inference|not_found", "confidence": "high|medium|low" }
  ],
  "additional_observations": [ string ]
}
The "checks" array MUST contain one entry for every check id listed above, in the same order.`;
}

// Merge AI verdicts with the fixed standard (standard is the source of truth for
// order, titles, reasons and questions).
export function assembleResults(
  checks: CheckRow[],
  aiChecks: Array<Record<string, unknown>>,
): CheckResult[] {
  const byId = new Map<string, Record<string, unknown>>();
  for (const a of aiChecks) {
    const id = String(a.check_id || "").trim().toUpperCase();
    if (id) byId.set(id, a);
  }
  return checks.map((c) => {
    const a = byId.get(c.check_id.toUpperCase()) || {};
    let verdict = String(a.verdict || "MISSING").toUpperCase().trim() as Verdict;
    if (verdict === ("NOT APPLICABLE" as Verdict) || verdict === ("N/A" as Verdict) || verdict === ("NA" as Verdict)) verdict = "NOT_APPLICABLE";
    if (!VERDICTS.includes(verdict)) verdict = "MISSING";
    let source = String(a.source_type || "not_found") as SourceType;
    const evidence = typeof a.evidence_quote === "string" && a.evidence_quote.trim() ? a.evidence_quote.trim() : null;
    // Enforce: no evidence => not_found + MISSING
    if (verdict === "MISSING") source = "not_found";
    if (!evidence && verdict === "ADDRESSED") verdict = "NEEDS CLARIFICATION";
    let confidence = String(a.confidence || "medium").toLowerCase();
    if (!["high", "medium", "low"].includes(confidence)) confidence = "medium";
    return {
      check_id: c.check_id,
      check_title: c.check_title,
      section_name: c.section_name,
      verdict,
      evidence_quote: evidence,
      evidence_location: typeof a.evidence_location === "string" ? a.evidence_location : null,
      source_type: source,
      confidence: confidence as "high" | "medium" | "low",
      reason_from_standard: c.why_it_matters,
      homeowner_question: verdict === "MISSING" || verdict === "NEEDS CLARIFICATION"
        ? `Regarding ${c.check_title}: can you confirm this is included and how it will be handled? (${c.why_it_matters || ""})`.trim()
        : null,
    };
  });
}

// --- Deterministic HTML report (used for on-screen gate + PDF) ---------------

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const verdictClass = (v: Verdict) =>
  v === "ADDRESSED" ? "v-addressed" : v === "NEEDS CLARIFICATION" ? "v-clarify" : "v-missing";

export function buildFixedReportHtml(opts: {
  standard: StandardRow;
  counts: ReturnType<typeof scoreChecklist>;
  results: CheckResult[];
  figures: { subtotal: unknown; vat_rate: unknown; vat_amount: unknown; total_incl_vat: unknown };
  figures_reconcile: boolean;
  questions: { check_id: string; question: string; why_it_matters: string | null }[];
  builderMessage: string;
  additionalObservations: string[];
  mismatch: boolean;
  documentScore?: number;
  projectConfidenceScore?: number;
  supportingDocs?: Array<{
    file_name: string;
    detected_type_label: string;
    key_facts: string[];
    affected_report: boolean;
    affected_reason: string | null;
  }>;
  improvedChecks?: Array<{ check_id: string; check_title: string; quote_verdict: string; merged_verdict: string; note: string }>;
  paymentSuppliedSeparately?: boolean;
  paymentImproved?: boolean;
}): string {
  const { standard, counts, results, figures, questions, builderMessage, additionalObservations, mismatch } = opts;
  const supportingDocs = opts.supportingDocs || [];
  const improvedChecks = opts.improvedChecks || [];
  const documentScore = opts.documentScore ?? counts.score;
  const projectConfidenceScore = opts.projectConfidenceScore ?? counts.score;
  const hasSupporting = supportingDocs.length > 0;
  const grouped = new Map<string, CheckResult[]>();
  for (const r of results) {
    const s = r.section_name || "General";
    if (!grouped.has(s)) grouped.set(s, []);
    grouped.get(s)!.push(r);
  }
  const addressed = results.filter((r) => r.verdict === "ADDRESSED");
  const clarify = results.filter((r) => r.verdict === "NEEDS CLARIFICATION");
  const missing = results.filter((r) => r.verdict === "MISSING");
  const notApplicable = results.filter((r) => r.verdict === "NOT_APPLICABLE");

  const list = (arr: CheckResult[]) =>
    arr.length === 0
      ? "<p class='muted'>None.</p>"
      : "<ul>" + arr.map((r) => `<li><strong>${esc(r.check_id)}</strong> ${esc(r.check_title)}</li>`).join("") + "</ul>";

  const questionsHtml = questions.length === 0
    ? "<p class='muted'>No outstanding questions \u2014 the quote reads as complete against this standard.</p>"
    : "<ol>" + questions.map((q) =>
        `<li><strong>${esc(q.check_id)}</strong> ${esc(q.question)}${q.why_it_matters ? `<br/><span class='muted'>Why it matters: ${esc(q.why_it_matters)}</span>` : ""}</li>`,
      ).join("") + "</ol>";

  const checklistHtml = [...grouped.entries()].map(([section, rows]) =>
    `<h3 class="qr-appendix-h3">${esc(section)}</h3>` +
    `<table class="checklist"><thead><tr><th>ID</th><th>Check</th><th>Verdict</th><th>Evidence</th></tr></thead><tbody>` +
    rows.map((r) =>
      `<tr><td>${esc(r.check_id)}</td><td>${esc(r.check_title)}</td>` +
      `<td class="${verdictClass(r.verdict)}">${esc(r.verdict)}</td>` +
      `<td>${r.evidence_quote ? esc(r.evidence_quote) : "<span class='muted'>Not found</span>"}</td></tr>`,
    ).join("") +
    `</tbody></table>`,
  ).join("");

  const obsHtml = additionalObservations.length === 0
    ? ""
    : `<h2>Additional Observations</h2><p class='muted'>These are outside the fixed checklist and do not affect the score.</p><ul>` +
      additionalObservations.map((o) => `<li>${esc(o)}</li>`).join("") + "</ul>";

  const mismatchHtml = mismatch
    ? `<div class="mismatch">Project type mismatch flagged for review \u2014 the quote content may not match the selected standard.</div>`
    : "";

  // Two-score band: Document Score (quote only) vs Project Pack Confidence (merged).
  const scoreBandHtml = hasSupporting
    ? `<div class="qr-score-band qr-two-score">
  <div class="qr-score"><span class="qr-score-num">${documentScore}</span><span class="qr-score-den">/100</span><div class="qr-score-label">Quote Document Score<br/><span class="muted">Main quote only</span></div></div>
  <div class="qr-score"><span class="qr-score-num">${projectConfidenceScore}</span><span class="qr-score-den">/100</span><div class="qr-score-label">Project Pack Confidence<br/><span class="muted">Quote + supporting documents</span></div></div>
  <div class="qr-counts">
    <div class="qc addressed"><span>${counts.addressed_count}</span> Addressed</div>
    <div class="qc clarify"><span>${counts.clarification_count}</span> Need clarification</div>
    <div class="qc missing"><span>${counts.missing_count}</span> Missing</div>
  </div>
</div>`
    : `<div class="qr-score-band">
  <div class="qr-score"><span class="qr-score-num">${counts.score}</span><span class="qr-score-den">/100</span><div class="qr-score-label">Quote Check Score</div></div>
  <div class="qr-counts">
    <div class="qc addressed"><span>${counts.addressed_count}</span> Addressed</div>
    <div class="qc clarify"><span>${counts.clarification_count}</span> Need clarification</div>
    <div class="qc missing"><span>${counts.missing_count}</span> Missing</div>
  </div>
</div>`;

  // Payment-structure note when supplied separately.
  const paymentHtml = opts.paymentSuppliedSeparately
    ? `<div class="qr-supplied-note"><strong>Payment structure:</strong> Payment schedule is not visible in the main quote, but a payment structure has been supplied separately. Confirm with the builder that this payment schedule forms part of the agreed quote/contract.<br/><span class="muted">Quote Document Score: needs clarification / missing from main quote. Project Pack Confidence Score: supplied separately \u2014 improves confidence, subject to written confirmation.</span></div>`
    : "";

  // Supporting Documents Reviewed section.
  const supportingHtml = hasSupporting
    ? `<h2>Supporting Documents Reviewed</h2>` +
      supportingDocs.map((d) =>
        `<div class="qr-support-doc"><p><strong>${esc(d.file_name)}</strong> &mdash; detected as ${esc(d.detected_type_label)}</p>` +
        (d.key_facts.length ? `<ul>${d.key_facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : "<p class='muted'>No usable facts extracted.</p>") +
        `<p class="muted">${d.affected_report ? "Used in: Project Pack Confidence Score." : "Not used"}${d.affected_reason ? ` &mdash; ${esc(d.affected_reason)}` : ""}</p></div>`,
      ).join("")
    : "";

  // What improved because of supporting documents.
  const improvedHtml = improvedChecks.length
    ? `<h2>Improved by supporting documents</h2><ul>` +
      improvedChecks.map((c) =>
        `<li><strong>${esc(c.check_id)}</strong> ${esc(c.check_title)}: <em>${esc(c.quote_verdict)}</em> &rarr; <em>${esc(c.merged_verdict)}</em><br/><span class="muted">${esc(c.note)}</span></li>`,
      ).join("") + "</ul>"
    : "";

  return `<div class="qr-report">
${mismatchHtml}
<div class="qr-checked">Checked against: ${esc(standard.standard_name)} \u00b7 Version ${esc(standard.version)}</div>
${scoreBandHtml}
${paymentHtml}
<h2>Verdict summary</h2>
<p>${esc(verdictSummary(counts))}</p>
<h2>Figures (as stated in the quote)</h2>
<table class="figures"><tbody>
<tr><td>Subtotal</td><td>${esc(figures.subtotal ?? "not stated")}</td></tr>
<tr><td>VAT</td><td>${esc(figures.vat_amount ?? figures.vat_rate ?? "not stated")}</td></tr>
<tr><td>Total</td><td>${esc(figures.total_incl_vat ?? "not stated")}</td></tr>
</tbody></table>
${opts.figures_reconcile ? "" : "<p class='muted'>The figures shown in the quote do not reconcile and should be confirmed by the contractor.</p>"}
<h2>What looks addressed</h2>${list(addressed)}
<h2>What needs clarification</h2>${list(clarify)}
<h2>What is missing</h2>${list(missing)}
${improvedHtml}
${supportingHtml}
<h2>Top questions to ask the builder</h2>${questionsHtml}
<h2>Suggested message to builder</h2><pre class="builder-msg">${esc(builderMessage)}</pre>
<h2>Full checklist results</h2>${checklistHtml}
${obsHtml}
<h2>Disclaimer</h2><p class="muted">${esc(DISCLAIMER)}</p>
</div>`;
}
