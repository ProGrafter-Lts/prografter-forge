/* ============================================================
   ProGrafter Planning Hub — mock opportunity data + scoring
   Deterministic, no AI. Shared across Planning Hub, Pipeline
   and Project Detail so the workflow feels connected.
   ============================================================ */

export type PipelineStage =
  | "new"
  | "letter_sent"
  | "contacted"
  | "site_visit"
  | "quote_requested"
  | "quote_sent"
  | "negotiation"
  | "won"
  | "lost";

export interface Opportunity {
  id: string;
  projectType: string;
  category:
    | "Single Storey"
    | "Rear Extension"
    | "Two Storey"
    | "Loft"
    | "Garage Conversion"
    | "Renovation"
    | "Commercial"
    | "New Build";
  address: string;
  postcode: string;
  planningRef: string;
  distanceMiles: number;
  planningStatus: "Granted" | "Pending" | "Submitted" | "Awaiting Decision" | "Conditions";
  applicationDate: string; // ISO
  daysOld: number;
  estBuildValue: number;
  tradesRequired: string[];
  description: string;
  stage: PipelineStage;
  saved?: boolean;
  /** scoring factors 0-1 */
  factors: {
    distance: number;
    propertyType: number;
    planningStage: number;
    tradeMatch: number;
    projectSize: number;
    freshness: number;
  };
}

/* ---------------- Scoring ---------------- */

const WEIGHTS = {
  distance: 0.2,
  propertyType: 0.15,
  planningStage: 0.2,
  tradeMatch: 0.2,
  projectSize: 0.15,
  freshness: 0.1,
};

/** Deterministic 0-100 opportunity score from weighted factors. */
export const opportunityScore = (o: Opportunity): number => {
  const f = o.factors;
  const raw =
    f.distance * WEIGHTS.distance +
    f.propertyType * WEIGHTS.propertyType +
    f.planningStage * WEIGHTS.planningStage +
    f.tradeMatch * WEIGHTS.tradeMatch +
    f.projectSize * WEIGHTS.projectSize +
    f.freshness * WEIGHTS.freshness;
  return Math.round(raw * 100);
};

/** 0-5 stars (halves rounded). */
export const opportunityStars = (o: Opportunity): number =>
  Math.round((opportunityScore(o) / 100) * 5 * 2) / 2;

export const scoreTone = (score: number): "success" | "warning" | "neutral" => {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "neutral";
};

export const STAGE_LABELS: Record<PipelineStage, string> = {
  new: "New Opportunity",
  letter_sent: "Letter Sent",
  contacted: "Contacted",
  site_visit: "Site Visit",
  quote_requested: "Quote Requested",
  quote_sent: "Quote Sent",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export const STAGE_ORDER: PipelineStage[] = [
  "new",
  "letter_sent",
  "contacted",
  "site_visit",
  "quote_requested",
  "quote_sent",
  "negotiation",
  "won",
  "lost",
];

/* ---------------- Mock dataset ---------------- */

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: "op-1001",
    projectType: "Two-storey side extension",
    category: "Two Storey",
    address: "14 Maple Avenue, Guildford",
    postcode: "GU1 3AA",
    planningRef: "GU/2026/1187",
    distanceMiles: 2.1,
    planningStatus: "Granted",
    applicationDate: "2026-07-06",
    daysOld: 5,
    estBuildValue: 185000,
    tradesRequired: ["Bricklayer", "Groundworker", "Roofer", "Plasterer"],
    description:
      "Proposed two-storey side extension to provide an enlarged kitchen/diner at ground floor and an additional bedroom with en-suite above. Includes new pitched roof to match existing.",
    stage: "new",
    factors: { distance: 0.95, propertyType: 0.9, planningStage: 1, tradeMatch: 0.95, projectSize: 0.85, freshness: 0.9 },
  },
  {
    id: "op-1002",
    projectType: "Loft conversion & rear dormer",
    category: "Loft",
    address: "7 Oakfield Road, Woking",
    postcode: "GU22 7PB",
    planningRef: "WO/2026/0942",
    distanceMiles: 5.4,
    planningStatus: "Pending",
    applicationDate: "2026-07-09",
    daysOld: 2,
    estBuildValue: 62000,
    tradesRequired: ["Carpenter", "Roofer", "Plasterer"],
    description:
      "Loft conversion with rear dormer and two front rooflights to create a master bedroom with en-suite. Structural steels to be installed.",
    stage: "letter_sent",
    factors: { distance: 0.7, propertyType: 0.75, planningStage: 0.6, tradeMatch: 0.85, projectSize: 0.6, freshness: 0.95 },
  },
  {
    id: "op-1003",
    projectType: "Full rear renovation & open-plan kitchen",
    category: "Renovation",
    address: "22 Church Lane, Farnham",
    postcode: "GU9 8EX",
    planningRef: "FA/2026/0731",
    distanceMiles: 8.9,
    planningStatus: "Conditions",
    applicationDate: "2026-06-28",
    daysOld: 13,
    estBuildValue: 148000,
    tradesRequired: ["Builder", "Electrician", "Plumber", "Plasterer", "Tiler"],
    description:
      "Internal reconfiguration and single-storey rear extension forming a large open-plan kitchen/family room with bi-fold doors and roof lantern.",
    stage: "contacted",
    factors: { distance: 0.5, propertyType: 0.85, planningStage: 0.8, tradeMatch: 0.7, projectSize: 0.9, freshness: 0.55 },
  },
  {
    id: "op-1004",
    projectType: "Single-storey rear extension",
    category: "Single Storey",
    address: "3 Elmwood Close, Guildford",
    postcode: "GU2 9DL",
    planningRef: "GU/2026/1204",
    distanceMiles: 1.3,
    planningStatus: "Granted",
    applicationDate: "2026-07-10",
    daysOld: 1,
    estBuildValue: 74000,
    tradesRequired: ["Bricklayer", "Groundworker", "Plasterer"],
    description:
      "Single-storey rear extension with flat roof and large picture window to extend the existing living space.",
    stage: "appointment",
    factors: { distance: 1, propertyType: 0.8, planningStage: 1, tradeMatch: 0.9, projectSize: 0.65, freshness: 1 },
  },
  {
    id: "op-1005",
    projectType: "Garage conversion to annexe",
    category: "Garage Conversion",
    address: "45 Highview Road, Aldershot",
    postcode: "GU12 4LP",
    planningRef: "AL/2026/0555",
    distanceMiles: 11.2,
    planningStatus: "Awaiting Decision",
    applicationDate: "2026-07-01",
    daysOld: 10,
    estBuildValue: 38000,
    tradesRequired: ["Builder", "Electrician", "Plumber"],
    description:
      "Conversion of integral garage into a self-contained annexe including new insulation, heating and a shower room.",
    stage: "new",
    factors: { distance: 0.4, propertyType: 0.6, planningStage: 0.5, tradeMatch: 0.75, projectSize: 0.5, freshness: 0.7 },
  },
  {
    id: "op-1006",
    projectType: "New-build detached dwelling",
    category: "New Build",
    address: "Land adj. 9 Beech Drive, Woking",
    postcode: "GU21 5RT",
    planningRef: "WO/2026/0688",
    distanceMiles: 6.7,
    planningStatus: "Granted",
    applicationDate: "2026-06-20",
    daysOld: 21,
    estBuildValue: 520000,
    tradesRequired: ["Groundworker", "Bricklayer", "Roofer", "Electrician", "Plumber", "Plasterer"],
    description:
      "Erection of a four-bedroom detached dwelling with associated parking and landscaping following demolition of existing outbuildings.",
    stage: "quoted",
    factors: { distance: 0.6, propertyType: 1, planningStage: 1, tradeMatch: 0.8, projectSize: 1, freshness: 0.4 },
  },
  {
    id: "op-1007",
    projectType: "Shopfront refurbishment",
    category: "Commercial",
    address: "112 High Street, Guildford",
    postcode: "GU1 3HH",
    planningRef: "GU/2026/1150",
    distanceMiles: 2.8,
    planningStatus: "Submitted",
    applicationDate: "2026-07-08",
    daysOld: 3,
    estBuildValue: 96000,
    tradesRequired: ["Shopfitter", "Electrician", "Glazier"],
    description:
      "Refurbishment of existing retail unit including new shopfront, internal fit-out and signage.",
    stage: "won",
    factors: { distance: 0.9, propertyType: 0.7, planningStage: 0.6, tradeMatch: 0.6, projectSize: 0.7, freshness: 0.85 },
  },
  {
    id: "op-1008",
    projectType: "Two-storey rear & side extension",
    category: "Two Storey",
    address: "18 Riverside Gardens, Godalming",
    postcode: "GU7 1AH",
    planningRef: "GO/2026/0399",
    distanceMiles: 4.2,
    planningStatus: "Granted",
    applicationDate: "2026-07-04",
    daysOld: 7,
    estBuildValue: 210000,
    tradesRequired: ["Bricklayer", "Groundworker", "Roofer", "Electrician", "Plumber"],
    description:
      "Two-storey rear and side extension providing a larger kitchen and utility at ground floor with two additional bedrooms above.",
    stage: "lost",
    factors: { distance: 0.8, propertyType: 0.9, planningStage: 1, tradeMatch: 0.9, projectSize: 0.85, freshness: 0.8 },
  },
];

export const getOpportunity = (id: string): Opportunity | undefined =>
  OPPORTUNITIES.find((o) => o.id === id);

/** Format an estimated build value as a compact GBP string. */
export const formatBuildValue = (value: number): string => {
  if (value >= 1000) return `£${Math.round(value / 1000)}k`;
  return `£${value}`;
};

/** Project-type filter options (aligned to card categories). */
export const PROJECT_TYPES: Opportunity["category"][] = [
  "Single Storey",
  "Two Storey",
  "Loft",
  "Garage Conversion",
  "Renovation",
  "Commercial",
  "New Build",
];

/** Planning-status filter options. */
export const PLANNING_STATUSES: Opportunity["planningStatus"][] = [
  "Submitted",
  "Pending",
  "Granted",
];

/** Unique list of every trade referenced across opportunities. */
export const ALL_TRADES: string[] = Array.from(
  new Set(OPPORTUNITIES.flatMap((o) => o.tradesRequired)),
).sort();


/* ---------------- Derived insights (deterministic, no AI) ---------------- */

/** Plain-English summary of the project for the Overview section. */
export const opportunitySummary = (o: Opportunity): string => {
  const trades = o.tradesRequired.length;
  const value = formatBuildValue(o.estBuildValue);
  const stageText =
    o.planningStatus === "Granted"
      ? "Planning permission has been granted, so this job is ready to progress."
      : o.planningStatus === "Conditions"
      ? "Permission is granted subject to conditions — work can proceed once those are discharged."
      : "The application is still working through the planning process.";
  return `${o.description} This is a ${o.category.toLowerCase()} project roughly ${o.distanceMiles} miles away, with an estimated build value of ${value}. It typically needs around ${trades} trades on site. ${stageText}`;
};

/** Rough on-site duration estimate driven by project size. */
export const estimatedTimeline = (o: Opportunity): string => {
  const size = o.factors.projectSize;
  if (size >= 0.9) return "6–9 months on site";
  if (size >= 0.7) return "4–6 months on site";
  if (size >= 0.5) return "10–16 weeks on site";
  return "6–10 weeks on site";
};

/** Estimated competition level based on how fresh and attractive the lead is. */
export const estimatedCompetition = (
  o: Opportunity,
): { level: "Low" | "Medium" | "High"; note: string } => {
  const score = opportunityScore(o);
  if (o.daysOld <= 3 && score >= 75)
    return { level: "Low", note: "Freshly published — few builders have seen this yet." };
  if (o.daysOld <= 7)
    return { level: "Medium", note: "Recently published — worth contacting the owner soon." };
  return { level: "High", note: "Older listing — other builders may already be in touch." };
};

/** Human labels for the six scoring factors used in Opportunity Analysis. */
export const opportunityAnalysis = (
  o: Opportunity,
): { label: string; value: number; note: string }[] => {
  const pct = (n: number) => Math.round(n * 100);
  const band = (n: number) => (n >= 0.8 ? "Excellent" : n >= 0.6 ? "Good" : n >= 0.4 ? "Fair" : "Low");
  return [
    {
      label: "Distance",
      value: pct(o.factors.distance),
      note: `${band(o.factors.distance)} — ${o.distanceMiles} miles from your base.`,
    },
    {
      label: "Project size",
      value: pct(o.factors.projectSize),
      note: `${band(o.factors.projectSize)} — ${formatBuildValue(o.estBuildValue)} estimated build value.`,
    },
    {
      label: "Trade match",
      value: pct(o.factors.tradeMatch),
      note: `${band(o.factors.tradeMatch)} — strong overlap with the trades you offer.`,
    },
    {
      label: "Planning stage",
      value: pct(o.factors.planningStage),
      note: `${band(o.factors.planningStage)} — ${o.planningStatus}.`,
    },
    {
      label: "Estimated competition",
      value: 100 - pct(o.factors.freshness),
      note: estimatedCompetition(o).note,
    },
  ];
};

/** Recommended next action driven by pipeline stage & score. */
export const recommendedAction = (o: Opportunity): string => {
  const score = opportunityScore(o);
  if (score >= 80)
    return "Add this to your pipeline and send an introduction letter to the homeowner today while it's fresh.";
  if (score >= 60)
    return "Save this opportunity and send an introduction letter within the next few days.";
  return "Review the drawings, then decide whether it's worth pursuing for your business.";
};
