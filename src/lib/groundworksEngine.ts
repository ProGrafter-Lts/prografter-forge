/**
 * Ian — Groundworks & Heavy Civils Lead.
 * Phase 1 substructure takeoff engine (deterministic, no AI).
 *
 * Sandbox-only: used by /sitescout-sandbox to calibrate groundworks maths
 * against real invoices. Nothing here is wired into live quoting tools.
 */

export type SoilType = "Clay" | "Sand & Gravel" | "Rock" | "Made Ground";
export type AccessType =
  | "8-Wheel Grab Direct Access"
  | "Narrow Access Skip Only"
  | "Conveyor Required";

export interface GroundworksRates {
  /** Trench excavation & muck-away, per m³ of bulked spoil. */
  excavationPerM3: number;
  /** Alternative basis: per 8-wheel grab load. */
  grabLoadRate: number;
  /** Ready-mix GEN3/C20 concrete, per m³. */
  concretePerM3: number;
  /** 7N high-density trench blocks, supplied and laid, per unit. */
  trenchBlockRate: number;
  /** Compressible clayboard, per linear metre. */
  clayboardPerLm: number;
}

export const DEFAULT_RATES: GroundworksRates = {
  excavationPerM3: 65,
  grabLoadRate: 280,
  concretePerM3: 140,
  trenchBlockRate: 3.4,
  clayboardPerLm: 28,
};

export interface GroundworksDimensions {
  trenchWidth: number;
  concretePourThickness: number;
  bulkingFactor: number;
  grabWagonCapacity: number;
}

export const DEFAULT_DIMENSIONS: GroundworksDimensions = {
  trenchWidth: 0.6,
  concretePourThickness: 0.3,
  bulkingFactor: 1.35,
  grabWagonCapacity: 15,
};

export interface GroundworksInputs {
  projectRef: string;
  trenchLength: number;
  soilType: SoilType;
  treeProximity: number;
  treeSpecies: string;
  accessType: AccessType;
  drainageInvertBaseline: number;
  notes: string;
  /** Below-ground foul/surface water run (lm). */
  drainageRunLength?: number;
  /** SiteScout ground-truth dig depth (m). Overrides the internal rule when set. */
  depthOverride?: number;
  /** SiteScout ground-truth clayboard decision. Overrides the internal rule when set. */
  clayboardOverride?: boolean;
}

export type MuckAwayBasis = "volume" | "grab_loads";

export interface BoqLine {
  phase: string;
  description: string;
  formula: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
}

export interface TakeoffResult {
  digDepth: number;
  clayboardRequired: boolean;
  rawDigVolume: number;
  bulkedMuckVolume: number;
  grabWagonLoads: number;
  concreteVolume: number;
  trenchBlocksQty: number;
  auditNotes: string[];
  boq: BoqLine[];
  netCost: number;
}

const round2 = (n: number) => Number(n.toFixed(2));

export function runSubstructureTakeoff(
  input: GroundworksInputs,
  rates: GroundworksRates = DEFAULT_RATES,
  dims: GroundworksDimensions = DEFAULT_DIMENSIONS,
  muckAwayBasis: MuckAwayBasis = "volume",
): TakeoffResult {
  const auditNotes: string[] = [];

  // 1. Depth & regulation rule (NHBC 4.2 / Part A)
  const clayTreeTrigger = input.soilType === "Clay" && input.treeProximity < 10;
  const digDepth = input.depthOverride ?? (clayTreeTrigger ? 1.8 : 1.0);
  const clayboardRequired = input.clayboardOverride ?? clayTreeTrigger;

  if (clayTreeTrigger) {
    auditNotes.push(
      "⚠️ NHBC 4.2 / Part A Trigger: Foundation deepened to 1.8m due to mature tree in shrinkable clay. Compressible slip layer (Clayboard) added.",
    );
    if (input.treeSpecies.trim()) {
      auditNotes.push(
        `Tree species recorded as ${input.treeSpecies.trim()} at ${input.treeProximity}m — high water-demand species must be verified against NHBC Table 2 zone of influence.`,
      );
    }
  } else {
    auditNotes.push(
      "Standard 1.0m baseline dig applied — no shrinkable-clay/tree interaction detected. Part A minimum bearing depth still subject to site inspection.",
    );
  }

  auditNotes.push(
    "Building Regs Part C: ground gas / contamination screening required before pour where Made Ground is present; DPM and radon barrier detailing to be confirmed.",
  );

  if (input.soilType === "Made Ground") {
    auditNotes.push(
      "⚠️ Made Ground recorded: assume unknown bearing capacity. Trial holes and Building Control engagement required — depth may exceed the calculated figure.",
    );
  }
  if (input.soilType === "Rock") {
    auditNotes.push(
      "Rock recorded: breaker/attachment hire and reduced dig output not included in this Phase 1 net cost.",
    );
  }
  if (input.drainageInvertBaseline > digDepth) {
    auditNotes.push(
      `⚠️ Drainage invert baseline (${input.drainageInvertBaseline}m) is deeper than the foundation dig (${digDepth}m) — Part H interface: local deepening or lintelling over the run required.`,
    );
  }
  if (input.accessType === "Narrow Access Skip Only") {
    auditNotes.push(
      "Narrow access (skip only): grab-wagon efficiency lost. Expect a labour/haulage uplift not captured in the £/m³ base rate.",
    );
  }
  if (input.accessType === "Conveyor Required") {
    auditNotes.push(
      "Conveyor required: allow conveyor hire plus banksman. Muck-away durations will extend beyond the base takeoff.",
    );
  }

  // 2. Dimensional maths
  const rawDigVolume = round2(input.trenchLength * dims.trenchWidth * digDepth);
  const bulkedMuckVolume = Number((rawDigVolume * dims.bulkingFactor).toFixed(2));
  const grabWagonLoads = Math.ceil(bulkedMuckVolume / dims.grabWagonCapacity);
  const concreteVolume = Number(
    (input.trenchLength * dims.trenchWidth * dims.concretePourThickness).toFixed(2),
  );
  const trenchBlocksQty = Math.ceil(
    (input.trenchLength / 0.44) * ((digDepth - dims.concretePourThickness) / 0.215) * 1.05,
  );

  // 3. Bill of quantities
  const boq: BoqLine[] = [];

  if (muckAwayBasis === "grab_loads") {
    boq.push({
      phase: "Substructure",
      description: "Trench excavation & muck-away (8-wheel grab loads)",
      formula: `ceil(${bulkedMuckVolume} m³ ÷ ${dims.grabWagonCapacity} m³)`,
      quantity: grabWagonLoads,
      unit: "loads",
      rate: rates.grabLoadRate,
      total: round2(grabWagonLoads * rates.grabLoadRate),
    });
  } else {
    boq.push({
      phase: "Substructure",
      description: "Trench excavation & muck-away",
      formula: `${input.trenchLength} lm × ${dims.trenchWidth} m × ${digDepth} m × ${dims.bulkingFactor} bulking`,
      quantity: bulkedMuckVolume,
      unit: "m³",
      rate: rates.excavationPerM3,
      total: round2(bulkedMuckVolume * rates.excavationPerM3),
    });
  }

  boq.push({
    phase: "Substructure",
    description: "Ready-mix GEN3/C20 concrete foundation pour",
    formula: `${input.trenchLength} lm × ${dims.trenchWidth} m × ${dims.concretePourThickness} m`,
    quantity: concreteVolume,
    unit: "m³",
    rate: rates.concretePerM3,
    total: round2(concreteVolume * rates.concretePerM3),
  });

  boq.push({
    phase: "Substructure",
    description: "7N high-density trench blocks (supplied & laid)",
    formula: `ceil((${input.trenchLength} ÷ 0.44) × ((${digDepth} − ${dims.concretePourThickness}) ÷ 0.215) × 1.05)`,
    quantity: trenchBlocksQty,
    unit: "no.",
    rate: rates.trenchBlockRate,
    total: round2(trenchBlocksQty * rates.trenchBlockRate),
  });

  if (clayboardRequired) {
    boq.push({
      phase: "Substructure",
      description: "Compressible clayboard slip layer (NHBC 4.2)",
      formula: `${input.trenchLength} lm trench run`,
      quantity: round2(input.trenchLength),
      unit: "lm",
      rate: rates.clayboardPerLm,
      total: round2(input.trenchLength * rates.clayboardPerLm),
    });
  }

  const netCost = round2(boq.reduce((sum, line) => sum + line.total, 0));

  return {
    digDepth,
    clayboardRequired,
    rawDigVolume,
    bulkedMuckVolume,
    grabWagonLoads,
    concreteVolume,
    trenchBlocksQty,
    auditNotes,
    boq,
    netCost,
  };
}
