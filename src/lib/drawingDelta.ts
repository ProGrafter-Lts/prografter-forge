/**
 * Drawing Intelligence & Delta Module — deterministic ingestion engine.
 *
 * Sandbox-only: sits before the live SiteScout survey (/sitescout-v2) and
 * pre-populates it with mandatory site verification checks. Nothing here is
 * wired into live quoting tools.
 */

export type Confidence = "STATED" | "DERIVED" | "SITE_VERIFICATION_REQUIRED";

export interface DataPoint {
  id: string;
  label: string;
  value: string;
  source: string;
  confidence: Confidence;
  /** Calculation trail for derived values, or the reason verification is needed. */
  basis: string;
}

export interface DeltaClash {
  id: string;
  title: string;
  detail: string;
  /** Structural changes always demand on-site verification. */
  verificationQuestion: string;
}

export interface DrawingAnalysis {
  projectName: string;
  scaleCalibration: string;
  existingFiles: string[];
  proposedFiles: string[];
  stated: DataPoint[];
  derived: DataPoint[];
  clashes: DeltaClash[];
  unverified: DataPoint[];
}

export const CONFIDENCE_META: Record<
  Confidence,
  { label: string; bg: string; fg: string; border: string }
> = {
  STATED: {
    label: "STATED",
    bg: "rgba(34,197,94,0.14)",
    fg: "#4ade80",
    border: "rgba(74,222,128,0.45)",
  },
  DERIVED: {
    label: "DERIVED",
    bg: "rgba(56,189,248,0.14)",
    fg: "#38bdf8",
    border: "rgba(56,189,248,0.45)",
  },
  SITE_VERIFICATION_REQUIRED: {
    label: "SITE VERIFICATION REQUIRED",
    bg: "rgba(249,115,22,0.16)",
    fg: "#fb923c",
    border: "rgba(251,146,60,0.5)",
  },
};

export interface ExtractionStream {
  id: "stated" | "derived" | "delta";
  title: string;
  blurb: string;
  duration: number;
}

export const EXTRACTION_STREAMS: ExtractionStream[] = [
  {
    id: "stated",
    title: "Stated Facts",
    blurb: "Reading written dimensions, annotation text and structural calc span tables…",
    duration: 1100,
  },
  {
    id: "derived",
    title: "Derived Measurements",
    blurb: "Calibrating scale from one stated dimension and solving unwritten lengths…",
    duration: 1200,
  },
  {
    id: "delta",
    title: "The Delta Clash",
    blurb: "Comparing Existing vs Proposed to isolate structural alterations…",
    duration: 1100,
  },
];

/** File types accepted by the strict ingestion filter. */
export const ACCEPTED_EXT = [".pdf", ".dwg", ".dxf", ".rvt", ".ifc", ".png", ".jpg", ".jpeg", ".tif", ".tiff"];
export const IMAGE_EXT = [".png", ".jpg", ".jpeg", ".tif", ".tiff"];

export const ext = (name: string) => name.slice(name.lastIndexOf(".")).toLowerCase();
export const isImageDrawing = (name: string) => IMAGE_EXT.includes(ext(name));
export const isAcceptedDrawing = (name: string) => ACCEPTED_EXT.includes(ext(name));

/**
 * Deterministic analysis of an uploaded existing/proposed drawing set.
 * Scale calibration is anchored on the single stated 6.00m rear wall run.
 */
export function analyseDrawings(existingFiles: string[], proposedFiles: string[]): DrawingAnalysis {
  const stated: DataPoint[] = [
    {
      id: "s1",
      label: "Rear extension width",
      value: "6.00 m",
      source: "Proposed GA plan — dimension string",
      confidence: "STATED",
      basis: "Written dimension 6000 read directly off the plan.",
    },
    {
      id: "s2",
      label: "Rear extension projection",
      value: "4.00 m",
      source: "Proposed GA plan — dimension string",
      confidence: "STATED",
      basis: "Written dimension 4000 read directly off the plan.",
    },
    {
      id: "s3",
      label: "Structural steel — rear opening",
      value: "203 × 133 × 30 UB, 5.50 m span",
      source: "Structural calcs — beam schedule B1",
      confidence: "STATED",
      basis: "Span table row B1: 5.5 m clear span, 30 kg/m UB, 100mm bearing each end.",
    },
    {
      id: "s4",
      label: "Bi-fold opening",
      value: "3.00 m × 2.10 m",
      source: "Proposed rear elevation — opening schedule",
      confidence: "STATED",
      basis: "Schedule reference W/D-01, written structural opening size.",
    },
    {
      id: "s5",
      label: "Drawing scale",
      value: "1:50 @ A1",
      source: "Title block",
      confidence: "STATED",
      basis: "Scale bar and title block both read 1:50 @ A1.",
    },
  ];

  const derived: DataPoint[] = [
    {
      id: "d1",
      label: "Trench perimeter run",
      value: "24.50 lm",
      source: "Derived from calibrated GA plan",
      confidence: "DERIVED",
      basis: "(6.00 + 4.00) × 2 outer face + 4.50 lm return to existing = 24.50 lm.",
    },
    {
      id: "d2",
      label: "Ground-floor footprint",
      value: "24.00 m²",
      source: "Derived from calibrated GA plan",
      confidence: "DERIVED",
      basis: "6.00 m × 4.00 m = 24.00 m² oversite area.",
    },
    {
      id: "d3",
      label: "Eaves height",
      value: "2.70 m",
      source: "Derived from calibrated rear elevation",
      confidence: "DERIVED",
      basis: "Pixel run 54.0 units × calibration factor 0.050 m/unit = 2.70 m.",
    },
    {
      id: "d4",
      label: "Roofline / rainwater run",
      value: "14.00 lm",
      source: "Derived from calibrated roof plan",
      confidence: "DERIVED",
      basis: "6.00 m eaves × 2 + 2.00 lm verge returns = 14.00 lm fascia and gutter.",
    },
    {
      id: "d5",
      label: "Internal wall area",
      value: "64.80 m²",
      source: "Derived from calibrated GA plan",
      confidence: "DERIVED",
      basis: "24.00 lm internal perimeter × 2.70 m height = 64.80 m² board and skim.",
    },
  ];

  const clashes: DeltaClash[] = [
    {
      id: "c1",
      title: "Wall removal detected at Rear Elevation",
      detail:
        "Existing 3.60 lm load-bearing masonry rear wall is absent on the Proposed plan — replaced by the B1 steel opening.",
      verificationQuestion:
        "Confirm on site: is the rear wall being removed load-bearing masonry, and what is the actual clear opening width?",
    },
    {
      id: "c2",
      title: "Foundation depth not dimensioned",
      detail:
        "No foundation depth is stated on either set, and no NHBC 4.2 tree/soil note appears on the Proposed drawings.",
      verificationQuestion:
        "Confirm on site: soil class, nearest mature tree species and distance, so NHBC 4.2 depth can be fixed.",
    },
    {
      id: "c3",
      title: "Existing drainage run diverted",
      detail:
        "A soil branch shown on the Existing plan is over-built by the Proposed footprint; no new invert level is annotated.",
      verificationQuestion:
        "Confirm on site: existing drainage invert depth and whether the run can be diverted or must be built over.",
    },
  ];

  const unverified: DataPoint[] = [
    {
      id: "u1",
      label: "Foundation depth",
      value: "Not dimensioned",
      source: "Absent from Proposed set & structural calcs",
      confidence: "SITE_VERIFICATION_REQUIRED",
      basis: clashes[1].verificationQuestion,
    },
    {
      id: "u2",
      label: "Rear wall structural status",
      value: "Load-bearing (assumed)",
      source: "Delta clash — Existing vs Proposed",
      confidence: "SITE_VERIFICATION_REQUIRED",
      basis: clashes[0].verificationQuestion,
    },
    {
      id: "u3",
      label: "Drainage invert depth",
      value: "Not annotated",
      source: "Delta clash — Existing vs Proposed",
      confidence: "SITE_VERIFICATION_REQUIRED",
      basis: clashes[2].verificationQuestion,
    },
  ];

  return {
    projectName: "Smedley Close",
    scaleCalibration:
      "Calibrated on stated 6.00 m rear wall → 0.050 m per plan unit (1:50 @ A1 confirmed against scale bar).",
    existingFiles,
    proposedFiles,
    stated,
    derived,
    clashes,
    unverified,
  };
}

/* ---------------- SiteScout injection ---------------- */

export interface InjectedCheck {
  id: string;
  label: string;
  question: string;
  context: string;
}

export interface SiteScoutInjection {
  projectName: string;
  createdAt: string;
  checks: InjectedCheck[];
}

const STORAGE_KEY = "prografter.sitescout.injectedChecks";

export function buildInjection(a: DrawingAnalysis): SiteScoutInjection {
  return {
    projectName: a.projectName,
    createdAt: new Date().toISOString(),
    checks: a.unverified.map((u) => ({
      id: u.id,
      label: u.label,
      question: u.basis,
      context: `${u.value} · ${u.source}`,
    })),
  };
}

export function saveInjection(injection: SiteScoutInjection) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(injection));
  } catch {
    /* storage unavailable — the survey simply shows no injected checks */
  }
}

export function loadInjection(): SiteScoutInjection | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SiteScoutInjection) : null;
  } catch {
    return null;
  }
}

export function clearInjection() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}
