/**
 * Turnkey build packages missing from the original 4-agent takeoff:
 * ground-floor slab & oversite (Ian), glazing & external openings (Caleb/Amy),
 * structural knock-through steel (Caleb), roofline / leadwork / rainwater
 * goods (Caleb/Ruby) and plant hire + site prelims (Ian/Sharon).
 *
 * Deterministic, sandbox-only — drives /sitescout-sandbox.
 */

import type { BoqLine } from "./groundworksEngine";

const round2 = (n: number) => Number(n.toFixed(2));

/* ------------------------------------------------- 1. slab & oversite (Ian) */

export interface SlabInputs {
  /** Internal ground-floor area (m²). */
  floorArea: number;
}

export const DEFAULT_SLAB_INPUTS: SlabInputs = { floorArea: 24 };

export interface SlabRates {
  /** MOT Type 1 granular sub-base, supplied & compacted, per tonne. */
  mot1PerTonne: number;
  /** Sand blinding + 1200g DPM / radon barrier, per m². */
  dpmPerM2: number;
  /** 100mm floor PIR (0.022 W/mK), per 2.4×1.2m sheet. */
  floorPirSheetRate: number;
  /** C25/30 floor slab concrete inc. A252 mesh, per m³. */
  slabConcretePerM3: number;
}

export const DEFAULT_SLAB_RATES: SlabRates = {
  mot1PerTonne: 44,
  dpmPerM2: 4.5,
  floorPirSheetRate: 52,
  slabConcretePerM3: 165,
};

export interface SlabResult {
  mot1Tonnes: number;
  dpmArea: number;
  pirSheets: number;
  slabVolume: number;
  auditNotes: string[];
  boq: BoqLine[];
  netCost: number;
}

export function runSlabTakeoff(
  input: SlabInputs = DEFAULT_SLAB_INPUTS,
  rates: SlabRates = DEFAULT_SLAB_RATES,
): SlabResult {
  const phase = "Substructure";
  const area = Math.max(input.floorArea, 0);

  const mot1Tonnes = round2(area * 0.15 * 2.2);
  const dpmArea = round2(area * 1.15);
  const pirSheets = Math.ceil(area / 2.88);
  const slabVolume = round2(area * 0.1);

  const boq: BoqLine[] = [
    {
      phase,
      description: "MOT Type 1 sub-base to oversite — 150mm laid & whacker compacted",
      formula: `${area} m² × 0.15 m × 2.2 t/m³`,
      quantity: mot1Tonnes,
      unit: "tonnes",
      rate: rates.mot1PerTonne,
      total: round2(mot1Tonnes * rates.mot1PerTonne),
    },
    {
      phase,
      description: "Sand blinding & 1200-gauge DPM / radon barrier (lapped & taped to DPC)",
      formula: `${area} m² × 1.15 laps/upstands`,
      quantity: dpmArea,
      unit: "m²",
      rate: rates.dpmPerM2,
      total: round2(dpmArea * rates.dpmPerM2),
    },
    {
      phase,
      description: "100mm floor PIR insulation (0.022 W/mK) with perimeter edge upstand",
      formula: `ceil(${area} m² ÷ 2.88 m² per 2.4×1.2 sheet)`,
      quantity: pirSheets,
      unit: "sheets",
      rate: rates.floorPirSheetRate,
      total: round2(pirSheets * rates.floorPirSheetRate),
    },
    {
      phase,
      description: "100mm C25/30 floor slab concrete with A252 steel mesh reinforcement",
      formula: `${area} m² × 0.10 m slab depth`,
      quantity: slabVolume,
      unit: "m³",
      rate: rates.slabConcretePerM3,
      total: round2(slabVolume * rates.slabConcretePerM3),
    },
  ];

  const auditNotes = [
    `Part C / Part L oversite: ${area} m² beam-free ground bearing slab — 150mm MOT Type 1, sand blinding, 1200g DPM lapped to the wall DPC, 100mm PIR and a 100mm C25/30 slab on A252 mesh. Target floor U-value ≤ 0.18 W/m²K.`,
    "A252 mesh must be supported on spacers at mid-depth with 400mm laps — confirm slab thickening beneath any internal load-bearing line.",
  ];

  return {
    mot1Tonnes,
    dpmArea,
    pirSheets,
    slabVolume,
    auditNotes,
    boq,
    netCost: round2(boq.reduce((s, l) => s + l.total, 0)),
  };
}

/* --------------------------- 2–4. glazing, steel & roofline (Caleb / Ruby) */

export interface EnvelopeInputs {
  /** 3-panel aluminium bi-fold door sets. */
  bifoldSets: number;
  /** uPVC double-glazed casement window units. */
  windowCount: number;
  /** Opening rooflights / Velux flagged on the drawing. */
  rooflights: boolean;
  rooflightCount: number;
  /** Knock-through into the existing house flagged. */
  knockThrough: boolean;
  /** Structural UB span (lm). */
  steelSpan: number;
  /** Fascia / soffit / gutter run (lm). */
  perimeterRun: number;
  /** Code 4 lead flashing run to the abutment wall (lm). */
  abutmentRun: number;
}

export const DEFAULT_ENVELOPE_INPUTS: EnvelopeInputs = {
  bifoldSets: 1,
  windowCount: 2,
  rooflights: true,
  rooflightCount: 2,
  knockThrough: true,
  steelSpan: 3.6,
  perimeterRun: 14,
  abutmentRun: 6,
};

export interface EnvelopeRates {
  /** 3.0m × 2.1m 3-panel aluminium bi-fold, anthracite grey, supplied & fitted. */
  bifoldSetRate: number;
  /** uPVC double-glazed casement unit, supplied & fitted. */
  windowUnitRate: number;
  /** Double-glazed opening rooflight / Velux, supplied & fitted. */
  rooflightRate: number;
  /** 203×133×30 / 254×146×31 structural UB, per lm. */
  steelBeamPerLm: number;
  /** Precast concrete padstone. */
  padstoneRate: number;
  /** Acrow props & Strongboy temporary works hire, 4 weeks. */
  temporaryWorksRate: number;
  /** uPVC fascia & vented soffit, per lm. */
  fasciaSoffitPerLm: number;
  /** Half-round uPVC guttering, downpipes & hopper connections, per lm. */
  rainwaterPerLm: number;
  /** Code 4 milled lead flashing, per lm. */
  leadFlashingPerLm: number;
}

export const DEFAULT_ENVELOPE_RATES: EnvelopeRates = {
  bifoldSetRate: 2850,
  windowUnitRate: 480,
  rooflightRate: 780,
  steelBeamPerLm: 85,
  padstoneRate: 35,
  temporaryWorksRate: 240,
  fasciaSoffitPerLm: 28,
  rainwaterPerLm: 22,
  leadFlashingPerLm: 38,
};

export interface EnvelopeResult {
  auditNotes: string[];
  boq: BoqLine[];
  netCost: number;
}

export function runEnvelopeTakeoff(
  input: EnvelopeInputs = DEFAULT_ENVELOPE_INPUTS,
  rates: EnvelopeRates = DEFAULT_ENVELOPE_RATES,
): EnvelopeResult {
  const phase = "Superstructure";
  const boq: BoqLine[] = [];
  const auditNotes: string[] = [];

  if (input.bifoldSets > 0) {
    boq.push({
      phase,
      description:
        "3.0m × 2.1m 3-panel aluminium bi-fold door set — anthracite grey, supplied & fitted",
      formula: `${input.bifoldSets} Nr door set inc. cill, trickle vents & make-good`,
      quantity: input.bifoldSets,
      unit: "Nr",
      rate: rates.bifoldSetRate,
      total: round2(input.bifoldSets * rates.bifoldSetRate),
    });
  }
  if (input.windowCount > 0) {
    boq.push({
      phase,
      description: "uPVC double-glazed casement window units (A-rated, FENSA registered)",
      formula: `${input.windowCount} Nr × supplied & fitted`,
      quantity: input.windowCount,
      unit: "Nr",
      rate: rates.windowUnitRate,
      total: round2(input.windowCount * rates.windowUnitRate),
    });
    auditNotes.push(
      "Glazing: FENSA/Competent Person registration required for all replacement and new window units, with Part F trickle ventilation to each openable light.",
    );
  }
  if (input.rooflights && input.rooflightCount > 0) {
    boq.push({
      phase,
      description: "Double-glazed opening rooflights / Velux — inc. flashing kit & timber trimming",
      formula: `${input.rooflightCount} Nr rooflights`,
      quantity: input.rooflightCount,
      unit: "Nr",
      rate: rates.rooflightRate,
      total: round2(input.rooflightCount * rates.rooflightRate),
    });
  }

  if (input.knockThrough) {
    const beamTotal = round2(input.steelSpan * rates.steelBeamPerLm);
    boq.push({
      phase,
      description:
        "Structural steel universal beam (203×133×30 / 254×146×31 UB) to knock-through opening",
      formula: `${input.steelSpan} lm × £${rates.steelBeamPerLm}/lm (SE-designed section)`,
      quantity: round2(input.steelSpan),
      unit: "lm",
      rate: rates.steelBeamPerLm,
      total: beamTotal,
    });
    boq.push({
      phase,
      description: "Precast concrete padstones to steel bearings",
      formula: "2 Nr padstones, min. 150mm end bearing each side",
      quantity: 2,
      unit: "Nr",
      rate: rates.padstoneRate,
      total: round2(2 * rates.padstoneRate),
    });
    boq.push({
      phase,
      description: "Acrow props & Strongboy temporary works hire (4-week duration)",
      formula: "1 Nr temporary works package — 4 weeks",
      quantity: 1,
      unit: "item",
      rate: rates.temporaryWorksRate,
      total: round2(rates.temporaryWorksRate),
    });
    auditNotes.push(
      `⚠️ Knock-through: ${input.steelSpan} lm UB requires a structural engineer's calculation, Building Control notification, 2 Nr padstones and a propped/needled temporary support scheme before breaking out (Part A).`,
    );
  }

  if (input.perimeterRun > 0) {
    boq.push({
      phase,
      description: "Eurocell/Freefoam uPVC fascia & vented soffit boards to roofline",
      formula: `${input.perimeterRun} lm roofline run`,
      quantity: round2(input.perimeterRun),
      unit: "lm",
      rate: rates.fasciaSoffitPerLm,
      total: round2(input.perimeterRun * rates.fasciaSoffitPerLm),
    });
    boq.push({
      phase,
      description:
        "Half-round uPVC guttering, downpipes & rainwater hopper / drainage connections",
      formula: `${input.perimeterRun} lm gutter run inc. stop-ends, outlets & shoe`,
      quantity: round2(input.perimeterRun),
      unit: "lm",
      rate: rates.rainwaterPerLm,
      total: round2(input.perimeterRun * rates.rainwaterPerLm),
    });
    auditNotes.push(
      "Roofline: continuous 10mm vented soffit required to a cold roof void; rainwater must discharge to an existing or new surface-water connection (Part H) — not to a soakaway within 5m of the foundation.",
    );
  }
  if (input.abutmentRun > 0) {
    boq.push({
      phase,
      description: "Code 4 milled lead flashing & soakers to abutment wall (chased & pointed)",
      formula: `${input.abutmentRun} lm abutment run`,
      quantity: round2(input.abutmentRun),
      unit: "lm",
      rate: rates.leadFlashingPerLm,
      total: round2(input.abutmentRun * rates.leadFlashingPerLm),
    });
  }

  return {
    auditNotes,
    boq,
    netCost: round2(boq.reduce((s, l) => s + l.total, 0)),
  };
}

/* ------------------------------- 5. plant hire & site prelims (Ian/Sharon) */

export interface PrelimsInputs {
  diggerWeeks: number;
  dumperWeeks: number;
  skipCount: number;
  siteSetup: boolean;
  /** Scaffold to the working elevation(s) — 8-week hire period. */
  scaffolding: boolean;
  /** Building Control full plans + structural engineer calculations. */
  statutoryFees: boolean;
}

export const DEFAULT_PRELIMS_INPUTS: PrelimsInputs = {
  diggerWeeks: 2,
  dumperWeeks: 2,
  skipCount: 3,
  siteSetup: true,
  scaffolding: true,
  statutoryFees: true,
};

export interface PrelimsRates {
  /** 1.5t/3t mini-digger hire, per week. */
  diggerPerWeek: number;
  /** 1t high-tip tracked site dumper hire, per week. */
  dumperPerWeek: number;
  /** Site setup, portaloo (8 weeks), heras fencing & signage — lump sum. */
  siteSetupLumpSum: number;
  /** 8-yard general mixed waste skip. */
  skipRate: number;
  /** Scaffold erect, 8-week hire & dismantle — lump sum. */
  scaffoldLumpSum: number;
  /** Building Control full plans + SE calculations — lump sum. */
  statutoryFeesLumpSum: number;
}

export const DEFAULT_PRELIMS_RATES: PrelimsRates = {
  diggerPerWeek: 320,
  dumperPerWeek: 210,
  siteSetupLumpSum: 950,
  skipRate: 290,
  scaffoldLumpSum: 1850,
  statutoryFeesLumpSum: 1150,
};

export interface PrelimsResult {
  auditNotes: string[];
  boq: BoqLine[];
  netCost: number;
}

export function runPrelimsTakeoff(
  input: PrelimsInputs = DEFAULT_PRELIMS_INPUTS,
  rates: PrelimsRates = DEFAULT_PRELIMS_RATES,
): PrelimsResult {
  const phase = "Prelims";
  const boq: BoqLine[] = [];

  if (input.diggerWeeks > 0) {
    boq.push({
      phase,
      description: "1.5t/3t mini-digger hire inc. delivery, collection & breaker attachment",
      formula: `${input.diggerWeeks} weeks × £${rates.diggerPerWeek}/week`,
      quantity: input.diggerWeeks,
      unit: "weeks",
      rate: rates.diggerPerWeek,
      total: round2(input.diggerWeeks * rates.diggerPerWeek),
    });
  }
  if (input.dumperWeeks > 0) {
    boq.push({
      phase,
      description: "1t high-tip tracked site dumper hire",
      formula: `${input.dumperWeeks} weeks × £${rates.dumperPerWeek}/week`,
      quantity: input.dumperWeeks,
      unit: "weeks",
      rate: rates.dumperPerWeek,
      total: round2(input.dumperWeeks * rates.dumperPerWeek),
    });
  }
  if (input.siteSetup) {
    boq.push({
      phase,
      description: "Site setup — portaloo hire (8 weeks), heras fencing & safety signage",
      formula: "1 Nr lump sum prelims package",
      quantity: 1,
      unit: "item",
      rate: rates.siteSetupLumpSum,
      total: round2(rates.siteSetupLumpSum),
    });
  }
  if (input.skipCount > 0) {
    boq.push({
      phase,
      description: "8-yard general mixed waste skips (demolition, timber & packaging)",
      formula: `${input.skipCount} Nr × £${rates.skipRate}/skip inc. permit`,
      quantity: input.skipCount,
      unit: "Nr",
      rate: rates.skipRate,
      total: round2(input.skipCount * rates.skipRate),
    });
  }

  if (input.scaffolding) {
    boq.push({
      phase,
      description: "Scaffold to working elevations — erect, 8-week hire, alter & dismantle",
      formula: "1 Nr scaffold package inc. handover certificate & weekly inspections",
      quantity: 1,
      unit: "item",
      rate: rates.scaffoldLumpSum,
      total: round2(rates.scaffoldLumpSum),
    });
  }
  if (input.statutoryFees) {
    boq.push({
      phase,
      description:
        "Building Control full plans application & structural engineer's calculations",
      formula: "1 Nr statutory fees & design package",
      quantity: 1,
      unit: "item",
      rate: rates.statutoryFeesLumpSum,
      total: round2(rates.statutoryFeesLumpSum),
    });
  }

  const auditNotes = [
    `Prelims: plant hire priced at ${input.diggerWeeks}-week digger and ${input.dumperWeeks}-week dumper durations — any programme slip is a variation. Skip permits required where placed on the highway.`,
    "CDM 2015: welfare provision (portaloo), heras perimeter and signage are non-negotiable on a domestic notifiable project.",
  ];

  return { auditNotes, boq, netCost: round2(boq.reduce((s, l) => s + l.total, 0)) };
}
