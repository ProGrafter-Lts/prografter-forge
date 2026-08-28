/**
 * Drawing & PDF Ingestion — deterministic parse simulation that feeds the
 * 8-agent takeoff engine.
 *
 * Sandbox-only: drives the Drawing Ingestion Zone on /sitescout-sandbox.
 * Nothing here is wired into live quoting tools.
 */

import type { AgentId } from "./agentRegistry";
import type { SuperstructureInputs } from "./superstructureEngine";
import type { MepInputs } from "./mepEngine";
import type { FinishesInputs } from "./finishesEngine";
import type { EnvelopeInputs, PrelimsInputs, SlabInputs } from "./buildPackagesEngine";
import type { GroundTruth } from "./siteScoutGroundTruth";

export interface ScanStep {
  id: number;
  label: string;
  /** Milliseconds this stage runs for in the scanning modal. */
  duration: number;
}

export const SCAN_STEPS: ScanStep[] = [
  { id: 1, label: "Rasterizing PDF sheets & vector text extraction…", duration: 900 },
  {
    id: 2,
    label: "Parsing floor plans & extracting perimeter dimensions (24.5 lm detected)…",
    duration: 1000,
  },
  {
    id: 3,
    label: "Extracting opening schedules (3.0m × 2.1m bi-fold, 4.5 m² windows)…",
    duration: 950,
  },
  {
    id: 4,
    label: "Merging SiteScout ground truth (Shrinkable clay + Oak tree at 6.5m)…",
    duration: 850,
  },
];

export const TOTAL_SCAN_MS = SCAN_STEPS.reduce((s, x) => s + x.duration, 0);

/** A measurement the agents lifted off the sheet, with its calculation trail. */
export interface MarkupRegion {
  id: string;
  agent: AgentId;
  label: string;
  /** Normalised bounding box on the drawing sheet (0–1). */
  x: number;
  y: number;
  w: number;
  h: number;
  value: string;
  formula: string;
  note: string;
}

export interface ExtractedDrawing {
  sheetName: string;
  sheetRef: string;
  scale: string;
  confidence: number;
  trenchLength: number;
  drainageRun: number;
  superInputs: SuperstructureInputs;
  mepInputs: MepInputs;
  finishesInputs: FinishesInputs;
  slabInputs: SlabInputs;
  envelopeInputs: EnvelopeInputs;
  prelimsInputs: PrelimsInputs;
  groundTruthPatch: Partial<GroundTruth>;
  regions: MarkupRegion[];
}

/** Sample pack — 6.0 × 4.0m single-storey rear extension, Smedley Close. */
export const SAMPLE_DRAWING_PACK: ExtractedDrawing = {
  sheetName: "Smedley Close Extension — Proposed Plans & Elevations",
  sheetRef: "SMC-PL-101 Rev C",
  scale: "1:50 @ A1",
  confidence: 96,
  trenchLength: 24.5,
  drainageRun: 14,
  superInputs: {
    brickFormat: "65mm Metric (60/m²)",
    wallHeight: 2.7,
    bifoldWidth: 3.0,
    bifoldHeight: 2.1,
    windowOpeningsArea: 4.5,
    roofType: "Duo-Pitch Gable (30°)",
    roofCovering: "Interlocking Concrete Pantiles",
  },
  mepInputs: {
    floorArea: 24,
    doubleSockets: 12,
    lightPoints: 9,
    switchPlates: 6,
    radiators: 3,
    consumerUnitUpgrade: true,
    evCharger: false,
    underfloorHeating: false,
  },
  finishesInputs: {
    internalWallArea: 64.8,
    ceilingArea: 24,
    skirtingRun: 20,
    internalDoors: 2,
    twoCoatSkim: true,
    externalRenderArea: 28,
  },
  slabInputs: { floorArea: 24 },
  envelopeInputs: {
    bifoldSets: 1,
    windowCount: 2,
    rooflights: true,
    rooflightCount: 2,
    knockThrough: true,
    steelSpan: 5.5,
    perimeterRun: 20,
    abutmentRun: 6,
  },
  prelimsInputs: {
    diggerWeeks: 2,
    dumperWeeks: 2,
    skipCount: 3,
    siteSetup: true,
    scaffolding: true,
    statutoryFees: true,
  },
  groundTruthPatch: {
    soilType: "Clay",
    treeSpecies: "Oak",
    treeProximity: 6.5,
    drainageInvertDepth: 1.0,
  },
  regions: [
    {
      id: "perimeter",
      agent: "ian",
      label: "Rear perimeter run",
      x: 0.08,
      y: 0.18,
      w: 0.62,
      h: 0.1,
      value: "24.5 lm",
      formula: "(6.0m + 4.0m) × 2 outer face + 4.5 lm return to existing = 24.5 lm trench perimeter",
      note: "Drives trench excavation, muck-away volume, trench-block substructure and cavity fill.",
    },
    {
      id: "footprint",
      agent: "ian",
      label: "Ground-floor footprint",
      x: 0.14,
      y: 0.32,
      w: 0.44,
      h: 0.3,
      value: "24.0 m²",
      formula: "6.0m × 4.0m = 24.0 m² oversite → MOT1 24 × 0.15 × 2.2 = 7.92 t, slab 2.40 m³",
      note: "Sets sub-base, DPM/radon barrier, floor PIR sheet count and C25/30 slab volume.",
    },
    {
      id: "bifold",
      agent: "caleb",
      label: "Bi-fold opening (rear elevation)",
      x: 0.2,
      y: 0.63,
      w: 0.32,
      h: 0.09,
      value: "3.0m × 2.1m",
      formula: "3.0 × 2.1 = 6.30 m² deducted from gross wall area; 1 Nr 3-panel alu bi-fold set",
      note: "Anthracite grey, supplied & fitted, inc. cill, trickle vents and make-good.",
    },
    {
      id: "windows",
      agent: "caleb",
      label: "Casement window schedule",
      x: 0.62,
      y: 0.4,
      w: 0.24,
      h: 0.14,
      value: "4.5 m² / 2 Nr",
      formula: "2 Nr uPVC DG casements = 4.5 m² openings deducted from masonry, lintels priced over",
      note: "Openings deducted before facing brick and inner block quantities are generated.",
    },
    {
      id: "steel",
      agent: "caleb",
      label: "Knock-through structural opening",
      x: 0.14,
      y: 0.5,
      w: 0.3,
      h: 0.07,
      value: "3.6 lm UB",
      formula: "3.6 lm × £85/lm 203×133×30 UB + 2 Nr precast padstones @ £35",
      note: "Acrow props & Strongboy temporary works allowed for a 4-week duration.",
    },
    {
      id: "roofline",
      agent: "caleb",
      label: "Roofline & rainwater goods",
      x: 0.08,
      y: 0.74,
      w: 0.58,
      h: 0.08,
      value: "14 lm",
      formula: "14 lm fascia/vented soffit @ £28/lm + 14 lm half-round gutter & downpipes @ £22/lm",
      note: "Abutment lead run measured separately at 6 lm Code 4 milled lead.",
    },
    {
      id: "utility",
      agent: "megan",
      label: "Utility connection point",
      x: 0.72,
      y: 0.68,
      w: 0.18,
      h: 0.12,
      value: "CU + 27 points",
      formula: "12 sockets + 9 lights + 6 switches = 27 points first & second fix; board changeover",
      note: "SiteScout logged a plastic pre-2016 board with 1 spare way — changeover priced.",
    },
    {
      id: "internal",
      agent: "ruby",
      label: "Internal finished surfaces",
      x: 0.34,
      y: 0.36,
      w: 0.22,
      h: 0.18,
      value: "88.8 m²",
      formula: "64.8 m² internal walls + 24.0 m² ceiling = 88.8 m² board & 2-coat skim",
      note: "20 lm skirting/architrave and 2 internal door sets scheduled off the same plan.",
    },
  ],
};

/**
 * Derives an extraction from an uploaded file. The geometry engine is
 * deterministic — an uploaded sheet is matched against the sample pack and
 * flagged for manual confirmation of any dimension the agents could not read.
 */
export function extractFromFile(file: File): ExtractedDrawing {
  return {
    ...SAMPLE_DRAWING_PACK,
    sheetName: file.name,
    sheetRef: "Uploaded sheet — dimensions to confirm",
    confidence: 88,
  };
}
