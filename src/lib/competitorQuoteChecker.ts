/**
 * Stage 3 — Competitor "Quote Checker".
 *
 * Cross-examines a pasted competitor quotation against the builder's own
 * measured Bill of Quantities and reports which priced packages the competitor
 * has not mentioned at all. Deterministic keyword matching — no AI, no guessing.
 *
 * Sandbox-only: drives /sitescout-sandbox.
 */

import type { MasterBoqLine } from "./procurementEngine";

export interface CheckerCategory {
  /** BoQ category label as produced by categoryForLine(). */
  category: string;
  /** Words/phrases that would indicate the competitor has covered it. */
  keywords: string[];
  /** Plain-English risk if it is genuinely absent from their price. */
  risk: string;
}

export const CHECKER_CATEGORIES: CheckerCategory[] = [
  {
    category: "Structural Steel",
    keywords: ["steel", "rsj", "ub ", "beam", "lintel", "padstone"],
    risk: "Structural steel, padstones and temporary propping are unpriced — a five-figure variation risk mid-build.",
  },
  {
    category: "Excavation & Muck-Away",
    keywords: ["excavat", "dig", "muck", "grab", "spoil", "arisings"],
    risk: "Excavation and muck-away are excluded — spoil removal is charged as an extra once the dig is open.",
  },
  {
    category: "Waste Management",
    keywords: ["skip", "waste", "tip", "permit", "removal of rubbish"],
    risk: "Skips and waste transfer permits are not allowed for — legally required duty-of-care documentation.",
  },
  {
    category: "Statutory Fees & Design",
    keywords: ["building control", "building regs", "structural engineer", "full plans", "calculations"],
    risk: "Building control and structural engineering fees are not included — payable by the homeowner.",
  },
  {
    category: "Concrete",
    keywords: ["concrete", "ready-mix", "readymix", "foundation pour", "c25", "footing"],
    risk: "Foundation concrete volume is not stated — no way to verify the depth being priced.",
  },
  {
    category: "Ground-Floor Slab & Oversite",
    keywords: ["slab", "oversite", "mot type 1", "sub-base", "dpm", "radon", "mesh"],
    risk: "Ground-floor slab build-up (sub-base, DPM, insulation, mesh) is unpriced.",
  },
  {
    category: "Thermal Insulation",
    keywords: ["insulation", "pir", "kingspan", "celotex", "u-value"],
    risk: "Insulation is not specified — a Part L compliance failure at completion.",
  },
  {
    category: "Below-Ground Drainage",
    keywords: ["drain", "manhole", "invert", "soil pipe", "gully"],
    risk: "Below-ground drainage alterations are excluded — Part H works will be charged separately.",
  },
  {
    category: "Glazing & External Openings",
    keywords: ["bi-fold", "bifold", "window", "door set", "glazing", "rooflight", "velux"],
    risk: "Glazing and external openings are not itemised — specification and cost are unverifiable.",
  },
  {
    category: "Roofline & Rainwater Goods",
    keywords: ["fascia", "soffit", "gutter", "downpipe", "rainwater", "roofline"],
    risk: "Roofline and rainwater goods are missing — commonly added as an extra at second fix.",
  },
  {
    category: "Roof Covering",
    keywords: ["tile", "slate", "pantile", "roof covering", "grp", "felt"],
    risk: "Roof covering is not specified — no way to compare like for like.",
  },
  {
    category: "Leadwork",
    keywords: ["lead", "flashing", "soaker", "abutment"],
    risk: "Code 4 leadwork to the abutment is unpriced — a common source of later leaks and extras.",
  },
  {
    category: "Access & Scaffolding",
    keywords: ["scaffold", "access tower", "edge protection"],
    risk: "Scaffolding is excluded — typically £1,200–£2,500 added later.",
  },
  {
    category: "Plant Hire & Site Prelims",
    keywords: ["digger", "dumper", "plant", "portaloo", "welfare", "heras", "site setup"],
    risk: "Plant hire and site welfare are not allowed for — required under CDM 2015.",
  },
  {
    category: "Power & Lighting",
    keywords: ["electric", "socket", "lighting", "first fix", "second fix", "wiring"],
    risk: "Electrical first and second fix are unpriced.",
  },
  {
    category: "Certification",
    keywords: ["certif", "part p", "notif", "eicr", "gas safe", "test"],
    risk: "Notifiable works certification is not included — required for sale or remortgage.",
  },
  {
    category: "Plastering & Render",
    keywords: ["plaster", "skim", "render", "boarding", "drylining", "plasterboard"],
    risk: "Plastering and render are excluded from the price.",
  },
  {
    category: "Overheads, Supervision & Profit",
    keywords: ["overhead", "profit", "management", "supervision", "prelims"],
    risk: "No allowance for site supervision — usually a sign the quote is a materials estimate, not a contract price.",
  },
];

export interface CheckerFinding {
  category: string;
  ourValue: number;
  covered: boolean;
  risk: string;
}

export interface CompetitorCheckResult {
  competitorTotal: number | null;
  ourTotal: number;
  difference: number | null;
  findings: CheckerFinding[];
  missing: CheckerFinding[];
  covered: CheckerFinding[];
  /** Value of our priced work the competitor never mentions. */
  unpricedValue: number;
  /** Their price plus the value of everything they have not mentioned. */
  trueLikelyCost: number | null;
  wordCount: number;
}

/** Pulls the largest £ figure out of the pasted quote — usually the headline total. */
export function extractCompetitorTotal(text: string): number | null {
  const matches = text.match(/£\s?[\d,]+(?:\.\d{1,2})?/g);
  if (!matches?.length) return null;
  const values = matches
    .map((m) => Number(m.replace(/[£,\s]/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  return values.length ? Math.max(...values) : null;
}

export function checkCompetitorQuote(
  boq: MasterBoqLine[],
  competitorText: string,
  customerQuoteTotal: number,
): CompetitorCheckResult {
  const haystack = competitorText.toLowerCase();
  const totals = new Map<string, number>();
  for (const l of boq) totals.set(l.category, (totals.get(l.category) ?? 0) + l.total);

  const findings: CheckerFinding[] = CHECKER_CATEGORIES.filter((c) => (totals.get(c.category) ?? 0) > 0)
    .map((c) => ({
      category: c.category,
      ourValue: Number((totals.get(c.category) ?? 0).toFixed(2)),
      covered: c.keywords.some((k) => haystack.includes(k)),
      risk: c.risk,
    }))
    .sort((a, b) => b.ourValue - a.ourValue);

  const missing = findings.filter((f) => !f.covered);
  const covered = findings.filter((f) => f.covered);
  const unpricedValue = Number(missing.reduce((s, f) => s + f.ourValue, 0).toFixed(2));
  const competitorTotal = extractCompetitorTotal(competitorText);

  return {
    competitorTotal,
    ourTotal: Number(customerQuoteTotal.toFixed(2)),
    difference:
      competitorTotal === null ? null : Number((customerQuoteTotal - competitorTotal).toFixed(2)),
    findings,
    missing,
    covered,
    unpricedValue,
    trueLikelyCost:
      competitorTotal === null ? null : Number((competitorTotal + unpricedValue).toFixed(2)),
    wordCount: competitorText.trim() ? competitorText.trim().split(/\s+/).length : 0,
  };
}
