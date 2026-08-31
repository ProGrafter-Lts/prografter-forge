/**
 * Drawing Intelligence & Delta Module — ingestion contract.
 *
 * IMPORTANT: this module never invents dimensions. Uploading a file only puts
 * the UI into an "Awaiting Backend Extraction" state. Real numbers arrive from
 * the extraction backend. A manual Test Mode payload (48 Thorsby Road) exists
 * purely so the UI can be verified against real decimal values.
 */

export type Confidence = "STATED" | "DERIVED" | "SITE_VERIFICATION_REQUIRED";

/** Keys must match SiteScout survey category keys (see siteScoutCategories). */
export type SiteScoutCategoryKey =
  | "ext_services"
  | "trees"
  | "drainage"
  | "roofline"
  | "alteration_area"
  | "sequencing"
  | "roof"
  | "ground_conditions"
  | "existing_services"
  | "electrical"
  | "access"
  | "handover";

export interface DataPoint {
  id: string;
  label: string;
  value: string;
  source: string;
  confidence: Confidence;
  /** Calculation trail for derived values, or the reason verification is needed. */
  basis: string;
  /** Which SiteScout category this verification belongs inside. */
  category?: SiteScoutCategoryKey;
}

export interface DeltaClash {
  id: string;
  title: string;
  detail: string;
  /** Structural changes always demand on-site verification. */
  verificationQuestion: string;
  category: SiteScoutCategoryKey;
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

export type IngestionState =
  | "IDLE"
  | "AWAITING_BACKEND_EXTRACTION"
  | "TEST_PAYLOAD_LOADED";

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
}

export const EXTRACTION_STREAMS: ExtractionStream[] = [
  {
    id: "stated",
    title: "Stated Facts",
    blurb: "Written dimensions, annotation text and structural calc span tables.",
  },
  {
    id: "derived",
    title: "Derived Measurements",
    blurb: "Scale calibrated from one stated dimension to solve unwritten lengths.",
  },
  {
    id: "delta",
    title: "The Delta Clash",
    blurb: "Existing vs Proposed compared to isolate structural alterations.",
  },
];

/** File types accepted by the strict ingestion filter. */
export const ACCEPTED_EXT = [".pdf", ".dwg", ".dxf", ".rvt", ".ifc", ".png", ".jpg", ".jpeg", ".tif", ".tiff"];
export const IMAGE_EXT = [".png", ".jpg", ".jpeg", ".tif", ".tiff"];

export const ext = (name: string) => name.slice(name.lastIndexOf(".")).toLowerCase();
export const isImageDrawing = (name: string) => IMAGE_EXT.includes(ext(name));
export const isAcceptedDrawing = (name: string) => ACCEPTED_EXT.includes(ext(name));

/* ---------------- Test Mode payload ---------------- */

/**
 * Real 48 Thorsby Road extraction payload. Used only by the manual
 * "Test Mode" button so the UI can be verified against true decimals.
 */
export const THORSBY_TEST_PAYLOAD: DrawingAnalysis = {
  projectName: "48 Thorsby Road",
  scaleCalibration:
    "Calibrated on stated 6.903 m rear wall run → 0.0500 m per plan unit (1:50 @ A1 confirmed against scale bar).",
  existingFiles: [],
  proposedFiles: [],
  stated: [
    {
      id: "s1",
      label: "Rear extension width",
      value: "6.903 m",
      source: "Proposed GA plan — dimension string",
      confidence: "STATED",
      basis: "Written dimension 6903 read directly off the plan.",
    },
    {
      id: "s2",
      label: "Structural rear opening",
      value: "3.400 m",
      source: "Proposed GA plan — opening dimension",
      confidence: "STATED",
      basis: "Written structural opening 3400 read directly off the plan.",
    },
    {
      id: "s3",
      label: "Drawing scale",
      value: "1:50 @ A1",
      source: "Title block",
      confidence: "STATED",
      basis: "Scale bar and title block both read 1:50 @ A1.",
    },
  ],
  derived: [
    {
      id: "d1",
      label: "Rear wall run (external face)",
      value: "6.903 lm",
      source: "Derived from calibrated GA plan",
      confidence: "DERIVED",
      basis: "138.06 plan units × 0.0500 m/unit = 6.903 lm.",
    },
    {
      id: "d2",
      label: "Steel bearing span required",
      value: "3.600 m",
      source: "Derived from stated opening",
      confidence: "DERIVED",
      basis: "3.400 m clear opening + 0.100 m bearing each end = 3.600 m span.",
    },
  ],
  clashes: [
    {
      id: "c1",
      title: "Wall removal detected at Rear Elevation",
      detail:
        "Existing masonry rear wall is absent on the Proposed plan across the 3.400 m opening; no beam schedule reference is annotated.",
      verificationQuestion:
        "Confirm on site: is the rear wall being removed load-bearing masonry, and what is the actual clear opening width?",
      category: "alteration_area",
    },
    {
      id: "c2",
      title: "Foundation depth not dimensioned",
      detail:
        "No foundation depth is stated on either set, and no NHBC 4.2 tree/soil note appears on the Proposed drawings.",
      verificationQuestion:
        "Confirm on site: soil class, nearest mature tree species and distance, so NHBC 4.2 depth can be fixed.",
      category: "ground_conditions",
    },
    {
      id: "c3",
      title: "Existing drainage run diverted",
      detail:
        "A soil branch shown on the Existing plan is over-built by the Proposed footprint; no new invert level is annotated.",
      verificationQuestion:
        "Confirm on site: existing drainage invert depth and whether the run can be diverted or must be built over.",
      category: "drainage",
    },
  ],
  unverified: [
    {
      id: "u1",
      label: "Foundation depth",
      value: "Not dimensioned",
      source: "Absent from Proposed set & structural calcs",
      confidence: "SITE_VERIFICATION_REQUIRED",
      basis:
        "Confirm on site: soil class, nearest mature tree species and distance, so NHBC 4.2 depth can be fixed.",
      category: "ground_conditions",
    },
    {
      id: "u2",
      label: "Rear wall structural status",
      value: "Load-bearing (assumed)",
      source: "Delta clash — Existing vs Proposed",
      confidence: "SITE_VERIFICATION_REQUIRED",
      basis:
        "Confirm on site: is the rear wall being removed load-bearing masonry, and what is the actual clear opening width (drawing states 3.400 m)?",
      category: "alteration_area",
    },
    {
      id: "u3",
      label: "Drainage invert depth",
      value: "Not annotated",
      source: "Delta clash — Existing vs Proposed",
      confidence: "SITE_VERIFICATION_REQUIRED",
      basis:
        "Confirm on site: existing drainage invert depth and whether the run can be diverted or must be built over.",
      category: "drainage",
    },
  ],
};

/** Attach the uploaded filenames to a payload without altering its numbers. */
export function withFiles(
  analysis: DrawingAnalysis,
  existingFiles: string[],
  proposedFiles: string[],
): DrawingAnalysis {
  return { ...analysis, existingFiles, proposedFiles };
}

/* ---------------- SiteScout injection ---------------- */

export interface InjectedCheck {
  id: string;
  label: string;
  question: string;
  context: string;
  category: SiteScoutCategoryKey;
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
      category: u.category ?? "handover",
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
