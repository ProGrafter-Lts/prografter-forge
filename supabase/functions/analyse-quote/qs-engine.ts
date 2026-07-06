// Deterministic Quantity Surveyor engine for the Quote Health Check.
//
// This module contains NO AI. It takes a structured Quote Evidence Record
// (extracted by the AI in a separate, facts-only pass) plus the homeowner's
// supplied form context, then:
//   1. validates the evidence for internal contradictions,
//   2. applies fixed QS rules to interpret the evidence,
//   3. computes a deterministic, weighted score.
//
// The same evidence + context ALWAYS produces the same scores. The AI report
// writer must consume the output of this engine and may never contradict it.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

import {
  CATEGORY_WEIGHTS,
  CATEGORY_RUBRICS,
  SCORE_ANCHORS,
  type RubricKey,
} from "./rubric.ts";

export interface QuoteEvidence {
  subtotal: string | null;
  vat_rate: string | null;
  vat_amount: string | null;
  total_incl_vat: string | null;
  project_type: string | null;
  quote_date: string | null;
  quote_pages: number | null;

  payment_terms_found: boolean;
  payment_terms_text: string | null;

  programme_start_found: boolean;
  programme_text: string | null;
  completion_timescale_found: boolean;

  exclusions_found: boolean;
  variation_process_found: boolean;
  warranties_found: boolean;
  certification_handover_found: boolean;

  building_control_mentioned: boolean;
  building_control_allowance_value: string | null;

  scaffold_included: boolean;
  scaffold_duration: string | null;
  welfare_included: boolean;
  welfare_duration: string | null;
  skip_waste_included: boolean;

  facing_brick_allowance_included: boolean;
  facing_brick_details: string | null;

  temporary_works_included: boolean;

  included_scope_items: string[];
  possible_missing_items: string[];

  is_building_quote: boolean;
}

export interface HomeownerContext {
  project_type: string | null;
  expected_items: string[];
  expected_scope: string | null;
  concerns: string | null;
  quote_total: string | null;
  labour_material: string | null;
  payment_supplied: boolean;
  programme_supplied: boolean;
}

export type CategoryStatus =
  | "clear"
  | "missing"
  | "supplied_separately"
  | "builder_confirmed"
  | "project_dependent"
  | "not_applicable"
  | "advisory";

export type CategorySource =
  | "uploaded quote"
  | "homeowner form"
  | "previous project data"
  | "AI inference"
  | "admin note"
  | "builder response";

export interface CategoryScore {
  category: string;
  key: string;
  weight: number;
  quote_score: number;
  confidence_score: number;
  status: CategoryStatus;
  source: CategorySource;
  note: string;
  /** What would move this category's score up (from the rubric). */
  improvement: string;
  /** The fixed anchor definition matching this quote_score. */
  anchor: string;
}

export interface ValidationResult {
  checks: Array<{ rule: string; passed: boolean; detail: string }>;
  contradictions: string[];
  blocked: boolean;
}

export interface ScoringResult {
  breakdown: CategoryScore[];
  document_score: number;
  project_confidence_score: number;
  completeness_pct: number;
  construction_completeness_pct: number;
  commercial_completeness_pct: number;
  overall_readiness_pct: number;
  risk_level: "Low" | "Medium" | "High" | "Critical";
  project_confidence: "Low" | "Medium" | "High";
  certification_readiness: "Ready" | "Needs improvement" | "Not ready";
  comparison_readiness: string;
  recommended_next_step: string;
  assessment: "Ready to Accept" | "Needs Clarification" | "Significant Concerns";
  top_issues: string[];
}

// ---------------------------------------------------------------------------
// Normalisation — never trust the raw AI extraction shape
// ---------------------------------------------------------------------------

const asBool = (v: unknown): boolean => v === true || v === "true" || v === "yes" || v === "Yes";
const asStr = (v: unknown): string | null => {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || /^(not stated|n\/a|none|null|unknown)$/i.test(s)) return null;
  return s;
};
const asArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];

export function normaliseEvidence(raw: Record<string, unknown>): QuoteEvidence {
  return {
    subtotal: asStr(raw.subtotal),
    vat_rate: asStr(raw.vat_rate),
    vat_amount: asStr(raw.vat_amount),
    total_incl_vat: asStr(raw.total_incl_vat ?? raw.total),
    project_type: asStr(raw.project_type),
    quote_date: asStr(raw.quote_date),
    quote_pages: Number.isFinite(Number(raw.quote_pages)) ? Number(raw.quote_pages) : null,

    payment_terms_found: asBool(raw.payment_terms_found),
    payment_terms_text: asStr(raw.payment_terms_text),

    programme_start_found: asBool(raw.programme_start_found),
    programme_text: asStr(raw.programme_text),
    completion_timescale_found: asBool(raw.completion_timescale_found),

    exclusions_found: asBool(raw.exclusions_found),
    variation_process_found: asBool(raw.variation_process_found),
    warranties_found: asBool(raw.warranties_found),
    certification_handover_found: asBool(raw.certification_handover_found),

    building_control_mentioned: asBool(raw.building_control_mentioned),
    building_control_allowance_value: asStr(raw.building_control_allowance_value),

    scaffold_included: asBool(raw.scaffold_included),
    scaffold_duration: asStr(raw.scaffold_duration),
    welfare_included: asBool(raw.welfare_included ?? raw.toilet_welfare_included),
    welfare_duration: asStr(raw.welfare_duration ?? raw.toilet_welfare_duration),
    skip_waste_included: asBool(raw.skip_waste_included),

    facing_brick_allowance_included: asBool(raw.facing_brick_allowance_included),
    facing_brick_details: asStr(raw.facing_brick_details),

    temporary_works_included: asBool(raw.temporary_works_included),

    included_scope_items: asArr(raw.included_scope_items),
    possible_missing_items: asArr(raw.possible_missing_items),

    is_building_quote: raw.is_building_quote === false ? false : true,
  };
}

// ---------------------------------------------------------------------------
// STAGE 2 — Evidence validation
// ---------------------------------------------------------------------------

export function validateEvidence(ev: QuoteEvidence): ValidationResult {
  const checks: ValidationResult["checks"] = [];
  const contradictions: string[] = [];

  const vatShown = !!(ev.vat_rate || ev.vat_amount);

  // VAT cannot be "not applicable" if a VAT rate/amount is shown.
  checks.push({
    rule: "VAT presence implies VAT applies",
    passed: true,
    detail: vatShown
      ? "VAT rate/amount present — VAT clarity must be treated as clear."
      : "No VAT figures found in the quote.",
  });

  // Scaffold included with a duration cannot be flagged missing/unclear.
  if (ev.scaffold_included && ev.scaffold_duration) {
    checks.push({
      rule: "Scaffold included + duration => not missing",
      passed: true,
      detail: `Scaffold included for ${ev.scaffold_duration}.`,
    });
  }
  // Welfare included with duration cannot be flagged missing/unclear.
  if (ev.welfare_included && ev.welfare_duration) {
    checks.push({
      rule: "Welfare included + duration => not missing",
      passed: true,
      detail: `Toilet/welfare included for ${ev.welfare_duration}.`,
    });
  }
  // Building Control allowance => Building Control not missing.
  if (ev.building_control_allowance_value) {
    checks.push({
      rule: "Building Control allowance => not missing",
      passed: true,
      detail: `Building Control allowance of ${ev.building_control_allowance_value}.`,
    });
  }
  // Facing brick allowance => classified as allowance, not missing.
  if (ev.facing_brick_allowance_included) {
    checks.push({
      rule: "Facing brick allowance => allowance included",
      passed: true,
      detail: ev.facing_brick_details || "Facing brick allowance present.",
    });
  }

  // Internal contradictions that block report generation.
  const included = new Set(ev.included_scope_items.map((s) => s.toLowerCase()));
  for (const miss of ev.possible_missing_items) {
    const m = miss.toLowerCase();
    for (const inc of included) {
      if (inc.includes(m) || m.includes(inc)) {
        contradictions.push(
          `"${miss}" is listed as both included and possibly missing.`,
        );
      }
    }
  }
  if (ev.scaffold_included && ev.scaffold_duration) {
    const scaffoldMissing = ev.possible_missing_items.some((m) => /scaffold/i.test(m));
    if (scaffoldMissing) {
      contradictions.push("Scaffold is included with a duration but also listed as missing.");
    }
  }
  if (vatShown) {
    const vatMissing = ev.possible_missing_items.some((m) => /vat/i.test(m));
    if (vatMissing) {
      contradictions.push("VAT is clearly shown but also listed as missing/unclear.");
    }
  }

  return {
    checks,
    contradictions,
    // A single contradiction should not hard-block; we surface it for admin
    // review but still produce a deterministic score. Two or more indicates a
    // genuinely inconsistent extraction worth blocking.
    blocked: contradictions.length >= 2,
  };
}

// Remove included/handled items from the AI's "possibly missing" list so the
// downstream report can never contradict the evidence.
export function sanitiseMissingItems(ev: QuoteEvidence): string[] {
  const included = ev.included_scope_items.map((s) => s.toLowerCase());
  const handled: RegExp[] = [];
  if (ev.scaffold_included) handled.push(/scaffold/i);
  if (ev.welfare_included) handled.push(/toilet|welfare/i);
  if (ev.building_control_allowance_value || ev.building_control_mentioned) handled.push(/building control/i);
  if (ev.facing_brick_allowance_included) handled.push(/facing brick|brick/i);
  if (ev.vat_rate || ev.vat_amount) handled.push(/vat/i);
  if (ev.exclusions_found) handled.push(/exclusion/i);
  if (ev.variation_process_found) handled.push(/variation/i);
  if (ev.payment_terms_found) handled.push(/payment/i);

  return ev.possible_missing_items.filter((m) => {
    const lm = m.toLowerCase();
    if (included.some((i) => i.includes(lm) || lm.includes(i))) return false;
    if (handled.some((re) => re.test(m))) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// STAGE 3 + 4 — QS rules engine + deterministic weighted scoring
// ---------------------------------------------------------------------------

const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.round(n)));

export function scoreQuote(ev: QuoteEvidence, ctx: HomeownerContext): ScoringResult {
  const rows: CategoryScore[] = [];

  const push = (
    r: Omit<CategoryScore, "weight" | "improvement" | "anchor"> & { weight?: number },
  ) => {
    // Confidence can never be below the quote score.
    const confidence_score = Math.max(r.quote_score, r.confidence_score);
    // Weight, improvement text and anchor are taken from the fixed rubric so
    // the AI can never re-decide them.
    const weight = CATEGORY_WEIGHTS[r.key as RubricKey] ?? 0;
    const improvement =
      CATEGORY_RUBRICS[r.key as Exclude<RubricKey, "homeowner_decision_safety">]?.improvement ?? "";
    const anchor = SCORE_ANCHORS[Math.max(0, Math.min(10, Math.round(r.quote_score)))];
    rows.push({ ...r, confidence_score, weight, improvement, anchor });
  };


  // 1. VAT clarity — anchors: 0 none / 5 rate OR amount / 7 rate+amount / 9 +inclusive total
  {
    const both = !!(ev.vat_rate && ev.vat_amount);
    const one = !!(ev.vat_rate || ev.vat_amount);
    const q = both && ev.total_incl_vat ? 9 : both ? 7 : one ? 5 : 2;
    push({
      category: "VAT clarity",
      key: "vat_clarity",
      quote_score: q,
      confidence_score: q,
      status: one ? "clear" : "missing",
      source: "uploaded quote",
      note: one
        ? `VAT is shown (${[ev.vat_rate, ev.vat_amount].filter(Boolean).join(", ")}).`
        : "No VAT rate or amount is shown — confirm whether VAT is included, excluded or not applicable.",
    });
  }

  // 2. Physical scope detail — anchors scale with the number of itemised works.
  {
    const n = ev.included_scope_items.length;
    const q = n >= 14 ? 10 : n >= 10 ? 9 : n >= 7 ? 8 : n >= 5 ? 7 : n >= 4 ? 6 : n >= 3 ? 5 : n >= 2 ? 4 : n === 1 ? 2 : 0;
    push({
      category: "Physical scope detail",
      key: "scope_detail",
      quote_score: q,
      confidence_score: ctx.expected_scope ? Math.min(10, q + 1) : q,
      status: n >= 2 ? "clear" : "missing",
      source: "uploaded quote",
      note: `${n} scope item${n === 1 ? "" : "s"} are clearly described in the quote.`,
    });
  }

  // 3. Pricing transparency — anchors: 2 lump sum / 5 total+VAT / 7 subtotal+VAT+total / 9 +sub-totals
  {
    const hasBreakdown = !!(ev.subtotal && ev.total_incl_vat);
    const q = hasBreakdown ? (ev.vat_amount ? 9 : 7) : ev.total_incl_vat ? 5 : 2;
    push({
      category: "Pricing transparency",
      key: "pricing_transparency",
      quote_score: q,
      confidence_score: q,
      status: hasBreakdown ? "clear" : ev.total_incl_vat ? "advisory" : "missing",
      source: "uploaded quote",
      note: hasBreakdown
        ? "Subtotal, VAT and total are shown."
        : ev.total_incl_vat
          ? "A total is shown but a subtotal/VAT breakdown is not clear."
          : "No clear pricing breakdown was found.",
    });
  }

  // 4. Temporary works / site setup (weight: low)
  {
    const scaff = ev.scaffold_included;
    const welf = ev.welfare_included;
    const q = scaff && welf ? 9 : scaff || welf ? 7 : 5;
    push({
      category: "Temporary works / site setup",
      key: "temporary_works",
      weight: 1,
      quote_score: q,
      confidence_score: q,
      status: scaff || welf ? "clear" : "advisory",
      source: "uploaded quote",
      note: scaff || welf
        ? [
            scaff ? `Scaffold included${ev.scaffold_duration ? ` for ${ev.scaffold_duration}` : ""}.` : "",
            welf ? `Toilet/welfare included${ev.welfare_duration ? ` for ${ev.welfare_duration}` : ""}.` : "",
          ].filter(Boolean).join(" ")
        : "Temporary works are not itemised — normal for some projects; confirm if site access/welfare is needed.",
    });
  }

  // 5. Allowances / provisional sums (weight: medium)
  {
    const hasAllowance = ev.building_control_allowance_value || ev.facing_brick_allowance_included;
    const q = hasAllowance ? 8 : 6;
    push({
      category: "Allowances / provisional sums",
      key: "allowances",
      weight: 2,
      quote_score: q,
      confidence_score: q,
      status: hasAllowance ? "clear" : "advisory",
      source: "uploaded quote",
      note: hasAllowance
        ? "Allowances are included (normal, professional practice) — confirm final selection and any cost difference."
        : "No provisional allowances found — confirm any client-selected items are covered.",
    });
  }

  // 6. Payment structure (weight: medium) — a clarification item, not a
  // document-quality catastrophe, so the missing floor is 3 (not 0-2).
  {
    const inQuote = ev.payment_terms_found;
    const q = inQuote ? 9 : 3;
    const conf = inQuote ? 9 : ctx.payment_supplied ? 7 : 3;
    push({
      category: "Payment structure",
      key: "payment_structure",
      weight: 1.5,
      quote_score: q,
      confidence_score: conf,
      status: inQuote ? "clear" : ctx.payment_supplied ? "supplied_separately" : "missing",
      source: inQuote ? "uploaded quote" : ctx.payment_supplied ? "homeowner form" : "uploaded quote",
      note: inQuote
        ? "A payment schedule/terms are present in the quote."
        : ctx.payment_supplied
          ? "No payment schedule in the uploaded quote. Payment information supplied separately — confirm in writing with the builder."
          : "No payment schedule is visible in the uploaded quote — this is a key item to clarify.",
    });
  }

  // 7. Programme / timescale (weight: medium)
  {
    const inQuote = ev.programme_start_found || ev.completion_timescale_found;
    const q = inQuote ? 9 : 3;
    const conf = inQuote ? 9 : ctx.programme_supplied ? 7 : 3;
    push({
      category: "Programme / timescale",
      key: "programme_timescale",
      weight: 1,
      quote_score: q,
      confidence_score: conf,
      status: inQuote ? "clear" : ctx.programme_supplied ? "supplied_separately" : "missing",
      source: inQuote ? "uploaded quote" : ctx.programme_supplied ? "homeowner form" : "uploaded quote",
      note: inQuote
        ? "A start date/completion or programme is indicated."
        : ctx.programme_supplied
          ? "No programme in the uploaded quote. Timing supplied separately — confirm in writing."
          : "No start/completion date or programme is stated — ask for an estimated start, finish and broad programme.",
    });
  }

  // 8. Variations process (weight: medium)
  {
    const q = ev.variation_process_found ? 9 : 3;
    push({
      category: "Variations process",
      key: "variations_process",
      weight: 1,
      quote_score: q,
      confidence_score: q,
      status: ev.variation_process_found ? "clear" : "missing",
      source: "uploaded quote",
      note: ev.variation_process_found
        ? "A process for changes/variations is described."
        : "No variations/change process is described — a key item to agree before work starts.",
    });
  }

  // 9. Certification / handover (weight: low-medium)
  {
    const has = ev.certification_handover_found || ev.warranties_found;
    const q = has ? 8 : 4;
    push({
      category: "Certification / handover",
      key: "certification_handover",
      weight: 1,
      quote_score: q,
      confidence_score: q,
      status: has ? "clear" : "missing",
      source: "uploaded quote",
      note: has
        ? "Certificates/warranties or handover arrangements are mentioned."
        : "Certificates, warranties and handover are not clearly addressed — confirm what will be provided.",
    });
  }

  // 10. Exclusions clarity (weight: low-medium)
  {
    const q = ev.exclusions_found ? 8 : 3;
    push({
      category: "Exclusions clarity",
      key: "exclusions_clarity",
      weight: 1,
      quote_score: q,
      confidence_score: q,
      status: ev.exclusions_found ? "clear" : "advisory",
      source: "uploaded quote",
      note: ev.exclusions_found
        ? "The quote states what is excluded."
        : "No exclusions are listed — ask the builder to confirm what is NOT included.",
    });
  }

  // 11. Homeowner decision safety — a derived meta-indicator shown to the user
  // but EXCLUDED from the weighted document score (weight 0) so it never
  // double-counts the commercial-control gaps that already feed it.
  {
    const controls = rows.filter((r) =>
      ["payment_structure", "variations_process", "programme_timescale", "exclusions_clarity"].includes(r.key),
    );
    const q = clamp10(controls.reduce((s, r) => s + r.quote_score, 0) / controls.length);
    const conf = clamp10(controls.reduce((s, r) => s + r.confidence_score, 0) / controls.length);
    push({
      category: "Homeowner decision safety",
      key: "homeowner_decision_safety",
      weight: 0,
      quote_score: q,
      confidence_score: conf,
      status: q >= 7 ? "clear" : q >= 4 ? "advisory" : "missing",
      source: "uploaded quote",
      note: "Overall confidence that a homeowner can safely make a decision from this quote's commercial/project-control detail.",
    });
  }

  // --- Weighted headline scores (0-100) ---
  const totalWeight = rows.reduce((s, r) => s + r.weight, 0);
  const weighted = (pick: (r: CategoryScore) => number) =>
    Math.round((rows.reduce((s, r) => s + pick(r) * r.weight, 0) / (totalWeight * 10)) * 100);

  const document_score = weighted((r) => r.quote_score);
  let project_confidence_score = weighted((r) => r.confidence_score);
  if (project_confidence_score < document_score) project_confidence_score = document_score;

  // --- Split completeness into two homeowner-friendly metrics ---
  const CONSTRUCTION_KEYS = ["vat_clarity", "scope_detail", "pricing_transparency", "temporary_works", "allowances"];
  const COMMERCIAL_KEYS = ["payment_structure", "programme_timescale", "variations_process", "certification_handover", "exclusions_clarity"];
  const avgPct = (keys: string[]) => {
    const grp = rows.filter((r) => keys.includes(r.key));
    if (!grp.length) return 0;
    return Math.round((grp.reduce((s, r) => s + r.quote_score, 0) / (grp.length * 10)) * 100);
  };
  const construction_completeness_pct = avgPct(CONSTRUCTION_KEYS);
  const commercial_completeness_pct = avgPct(COMMERCIAL_KEYS);
  // Overall Quote Readiness — the true weighted headline (construction +
  // commercial combined via the rubric weights). Kept as a named metric so the
  // report can show it alongside the two split completeness scores.
  const overall_readiness_pct = document_score;

  // Legacy single completeness metric (kept for backward compatibility).
  const completeness_pct = Math.round(
    (rows.filter((r) => r.quote_score >= 6).length / rows.length) * 100,
  );

  // Risk from the key controls.
  const paymentRow = rows.find((r) => r.key === "payment_structure")!;
  const variationsRow = rows.find((r) => r.key === "variations_process")!;
  const criticalMissing =
    paymentRow.quote_score <= 2 && variationsRow.quote_score <= 2;
  let risk_level: ScoringResult["risk_level"];
  if (document_score >= 80) risk_level = "Low";
  else if (document_score >= 60) risk_level = "Medium";
  else if (document_score >= 40 || !criticalMissing) risk_level = "High";
  else risk_level = "Critical";

  const project_confidence: ScoringResult["project_confidence"] =
    project_confidence_score >= 75 ? "High" : project_confidence_score >= 45 ? "Medium" : "Low";

  const vatRow = rows.find((r) => r.key === "vat_clarity")!;
  const certification_readiness: ScoringResult["certification_readiness"] =
    document_score >= 85 &&
    ev.exclusions_found &&
    ev.payment_terms_found &&
    ev.variation_process_found &&
    vatRow.quote_score >= 9 &&
    (ev.programme_start_found || ev.completion_timescale_found)
      ? "Ready"
      : document_score >= 65
        ? "Needs improvement"
        : "Not ready";

  const comparison_readiness =
    document_score >= 80 ? "Ready to compare" : document_score >= 55 ? "Partially ready" : "Not ready to compare";

  const recommended_next_step =
    risk_level === "Critical"
      ? "Do not proceed until major omissions are resolved."
      : risk_level === "High"
        ? "Request a revised quote before proceeding."
        : risk_level === "Medium"
          ? "Clarify key items before accepting."
          : "Safe to proceed subject to minor clarification.";

  const assessment: ScoringResult["assessment"] =
    document_score >= 80 ? "Ready to Accept" : document_score >= 55 ? "Needs Clarification" : "Significant Concerns";

  // Top issues — the lowest-scoring genuine gaps (commercial controls first).
  const COMMERCIAL_KEYS2 = ["payment_structure", "programme_timescale", "variations_process", "certification_handover", "exclusions_clarity"];
  const top_issues = rows
    .filter((r) => r.quote_score <= 5 && r.key !== "homeowner_decision_safety")
    .sort((a, b) => {
      const ac = COMMERCIAL_KEYS2.includes(a.key) ? 0 : 1;
      const bc = COMMERCIAL_KEYS2.includes(b.key) ? 0 : 1;
      return ac - bc || a.quote_score - b.quote_score;
    })
    .slice(0, 3)
    .map((r) => r.note);

  return {
    breakdown: rows.map(({ key: _key, weight: _weight, ...rest }) => ({ ...rest, key: _key, weight: _weight })),
    document_score,
    project_confidence_score,
    completeness_pct,
    construction_completeness_pct,
    commercial_completeness_pct,
    overall_readiness_pct,
    risk_level,
    project_confidence,
    certification_readiness,
    comparison_readiness,
    recommended_next_step,
    assessment,
    top_issues,
  };
}
