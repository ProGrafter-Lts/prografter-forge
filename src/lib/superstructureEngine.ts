/**
 * Caleb — Superstructure, Masonry & Roof Lead.
 * Phase 2 above-DPC takeoff engine (deterministic, no AI).
 *
 * Receives the foundation perimeter baseline (wall length) directly from Ian's
 * Phase 1 substructure takeoff. Sandbox-only: nothing here is wired into live
 * quoting tools.
 */

import type { BoqLine } from "./groundworksEngine";

export type BrickFormat = "65mm Metric (60/m²)" | "73mm Imperial (52/m²)";
export type RoofType =
  | "Duo-Pitch Gable (30°)"
  | "Mono-Pitch Lean-To (15°)"
  | "Flat Roof GRP/Warm Roof";
export type RoofCovering =
  | "Interlocking Concrete Pantiles"
  | "Natural Slate"
  | "Plain Clay Tiles";

export interface SuperstructureInputs {
  brickFormat: BrickFormat;
  wallHeight: number;
  bifoldWidth: number;
  bifoldHeight: number;
  windowOpeningsArea: number;
  roofType: RoofType;
  roofCovering: RoofCovering;
}

export const DEFAULT_SUPER_INPUTS: SuperstructureInputs = {
  brickFormat: "65mm Metric (60/m²)",
  wallHeight: 2.7,
  bifoldWidth: 3.0,
  bifoldHeight: 2.1,
  windowOpeningsArea: 4.5,
  roofType: "Duo-Pitch Gable (30°)",
  roofCovering: "Interlocking Concrete Pantiles",
};

export interface SuperstructureRates {
  /** Facing brickwork outer leaf, inc. mortar & ties, per brick. */
  facingBrickRate: number;
  /** 100mm 7N dense concrete blockwork inner leaf (laid), per block. */
  denseBlockRate: number;
  /** 100mm full-fill PIR insulation (0.022 W/mK), per sheet. */
  pirSheetRate: number;
  /** Heavy duty bi-fold lintel (Catnic/IG) inc. padstones, per item. */
  bifoldLintelRate: number;
  /** Cut timber roof carcass (C24 timbers & plates), per m² of roof. */
  roofCarcassPerM2: number;
  /** Roof tile covering, membrane & battens, per m² of roof. */
  roofCoveringPerM2: number;
}

export const DEFAULT_SUPER_RATES: SuperstructureRates = {
  facingBrickRate: 1.65,
  denseBlockRate: 3.2,
  pirSheetRate: 48,
  bifoldLintelRate: 385,
  roofCarcassPerM2: 38,
  roofCoveringPerM2: 46,
};

export interface SuperstructureDimensions {
  /** Blocks per m² of net wall area. */
  blocksPerM2: number;
  /** Wall ties per m². */
  tiesPerM2: number;
  /** Coverage of a single PIR sheet (2.4m × 1.2m). */
  pirSheetCoverage: number;
  /** Masonry waste factor. */
  masonryWaste: number;
  /** Roof cut waste factor. */
  roofWaste: number;
  /** Roof projection / span depth (m). */
  roofProjection: number;
  /** Tiles per m² of true roof surface. */
  tilesPerM2: number;
  /** Rafter centres (m). */
  rafterCentres: number;
  /** Rafter length per run (m). */
  rafterLength: number;
}

export const DEFAULT_SUPER_DIMENSIONS: SuperstructureDimensions = {
  blocksPerM2: 10,
  tiesPerM2: 2.5,
  pirSheetCoverage: 2.88,
  masonryWaste: 1.05,
  roofWaste: 1.1,
  roofProjection: 4.2,
  tilesPerM2: 10.5,
  rafterCentres: 0.4,
  rafterLength: 3.6,
};

export interface SuperstructureResult {
  wallLength: number;
  grossWallArea: number;
  totalOpeningsArea: number;
  netWallArea: number;
  brickFactor: number;
  facingBricksQty: number;
  denseBlocksQty: number;
  wallTiesQty: number;
  cavityInsulationSheets: number;
  pitchDegrees: number;
  pitchMultiplier: number;
  roofPlanArea: number;
  trueRoofSurfaceArea: number;
  roofTilesQty: number;
  ridgeLength: number;
  c24RafterLinearM: number;
  auditNotes: string[];
  boq: BoqLine[];
  netCost: number;
}

const round2 = (n: number) => Number(n.toFixed(2));

const pitchFor = (roofType: RoofType) =>
  roofType === "Duo-Pitch Gable (30°)" ? 30 : roofType === "Mono-Pitch Lean-To (15°)" ? 15 : 0;

export function runSuperstructureTakeoff(
  /** Foundation perimeter baseline handed over from Ian. */
  wallLength: number,
  input: SuperstructureInputs = DEFAULT_SUPER_INPUTS,
  rates: SuperstructureRates = DEFAULT_SUPER_RATES,
  dims: SuperstructureDimensions = DEFAULT_SUPER_DIMENSIONS,
): SuperstructureResult {
  const auditNotes: string[] = [];

  // 1. Masonry & wall area maths
  const grossWallArea = round2(wallLength * input.wallHeight);
  const totalOpeningsArea = round2(
    input.bifoldWidth * input.bifoldHeight + input.windowOpeningsArea,
  );
  const netWallArea = Number((grossWallArea - totalOpeningsArea).toFixed(2));
  const brickFactor = input.brickFormat === "65mm Metric (60/m²)" ? 60 : 52;

  const facingBricksQty = Math.ceil(netWallArea * brickFactor * dims.masonryWaste);
  const denseBlocksQty = Math.ceil(netWallArea * dims.blocksPerM2 * dims.masonryWaste);
  const wallTiesQty = Math.ceil(netWallArea * dims.tiesPerM2 * 1.1);
  const cavityInsulationSheets = Math.ceil(netWallArea / dims.pirSheetCoverage);

  // 2. Roof dimensional & pitch maths
  const pitchDegrees = pitchFor(input.roofType);
  const pitchMultiplier = Number((1 / Math.cos(pitchDegrees * (Math.PI / 180))).toFixed(3));
  const roofPlanArea = round2((wallLength / 2) * dims.roofProjection);
  const trueRoofSurfaceArea = Number(
    (roofPlanArea * pitchMultiplier * dims.roofWaste).toFixed(2),
  );
  const roofTilesQty = Math.ceil(trueRoofSurfaceArea * dims.tilesPerM2);
  const ridgeLength = round2(wallLength / 2);
  const c24RafterLinearM = Number(
    ((wallLength / dims.rafterCentres) * dims.rafterLength * dims.masonryWaste).toFixed(2),
  );

  // 3. Audit notes
  auditNotes.push(
    `Part L thermal check: 100mm full-fill PIR cavity insulation @ 0.022 W/mK specified across ${netWallArea} m² of net wall — target U-value ≤ 0.18 W/m²K achieved for a 100mm blockwork inner leaf with a fully-filled cavity.`,
  );
  auditNotes.push(
    `⚠️ Structural opening: ${input.bifoldWidth}m × ${input.bifoldHeight}m bi-fold requires a heavy-duty Catnic/IG box lintel with minimum 150mm end bearing on concrete padstones, plus a cavity tray and stop-ends with weep vents over the full opening width + 150mm each side (Part C / Part A).`,
  );
  auditNotes.push(
    `Roof geometry: ${input.roofType} — pitch multiplier 1 ÷ cos(${pitchDegrees}°) = ${pitchMultiplier}. Plan area ${roofPlanArea} m² → true surface ${trueRoofSurfaceArea} m² inclusive of ${Math.round((dims.roofWaste - 1) * 100)}% cut waste.`,
  );
  auditNotes.push(
    `Covering: ${input.roofCovering} on breathable membrane and treated counter-battens. C24 rafters at ${dims.rafterCentres * 1000}mm centres, ridge board and twin wall plates strapped down — span/section to be confirmed against TRADA span tables.`,
  );
  if (input.roofType === "Flat Roof GRP/Warm Roof") {
    auditNotes.push(
      "Flat roof selected: pitch multiplier 1.0. Warm-roof build-up (tapered insulation, min 1:80 fall) supersedes tile/batten items — verify the covering line rate against a GRP/single-ply quote.",
    );
  }
  if (input.roofCovering === "Natural Slate") {
    auditNotes.push(
      "Natural slate recorded: unit coverage differs materially from pantiles. Adjust the tiles/m² constant and covering rate before relying on this figure.",
    );
  }
  if (totalOpeningsArea / grossWallArea > 0.25) {
    auditNotes.push(
      "⚠️ Glazing/opening area exceeds 25% of the elevation — Part L notional glazing allowance likely breached. A SAP/U-value trade-off calculation will be required.",
    );
  }

  // 4. Bill of quantities
  const phase = "Superstructure";
  const boq: BoqLine[] = [
    {
      phase,
      description: `Facing brickwork outer leaf — ${input.brickFormat} (inc. mortar & ties)`,
      formula: `ceil(${netWallArea} m² × ${brickFactor}/m² × ${dims.masonryWaste})`,
      quantity: facingBricksQty,
      unit: "no.",
      rate: rates.facingBrickRate,
      total: round2(facingBricksQty * rates.facingBrickRate),
    },
    {
      phase,
      description: "100mm 7N dense concrete blockwork inner leaf (laid)",
      formula: `ceil(${netWallArea} m² × ${dims.blocksPerM2}/m² × ${dims.masonryWaste})`,
      quantity: denseBlocksQty,
      unit: "no.",
      rate: rates.denseBlockRate,
      total: round2(denseBlocksQty * rates.denseBlockRate),
    },
    {
      phase,
      description: "100mm full-fill PIR cavity insulation (0.022 W/mK)",
      formula: `ceil(${netWallArea} m² ÷ ${dims.pirSheetCoverage} m² per 2.4×1.2 sheet)`,
      quantity: cavityInsulationSheets,
      unit: "sheets",
      rate: rates.pirSheetRate,
      total: round2(cavityInsulationSheets * rates.pirSheetRate),
    },
    {
      phase,
      description: `Structural Catnic/IG box lintel & padstones — ${input.bifoldWidth}m bi-fold opening`,
      formula: `1 no. lintel over ${input.bifoldWidth}m × ${input.bifoldHeight}m opening + cavity tray`,
      quantity: 1,
      unit: "item",
      rate: rates.bifoldLintelRate,
      total: round2(rates.bifoldLintelRate),
    },
    {
      phase,
      description: `Cut timber roof carcass — C24 rafters (${dims.rafterCentres * 1000}mm centres), ridge board & wall plates`,
      formula: `${trueRoofSurfaceArea} m² true roof surface · ${c24RafterLinearM} lm C24 timber`,
      quantity: trueRoofSurfaceArea,
      unit: "m²",
      rate: rates.roofCarcassPerM2,
      total: round2(trueRoofSurfaceArea * rates.roofCarcassPerM2),
    },
    {
      phase,
      description: `${input.roofCovering}, breathable membrane, treated counter-battens & ridge tiles`,
      formula: `${trueRoofSurfaceArea} m² × £/m² · ${roofTilesQty} tiles @ ${dims.tilesPerM2}/m² · ${ridgeLength} lm ridge`,
      quantity: trueRoofSurfaceArea,
      unit: "m²",
      rate: rates.roofCoveringPerM2,
      total: round2(trueRoofSurfaceArea * rates.roofCoveringPerM2),
    },
  ];

  const netCost = round2(boq.reduce((sum, line) => sum + line.total, 0));

  return {
    wallLength,
    grossWallArea,
    totalOpeningsArea,
    netWallArea,
    brickFactor,
    facingBricksQty,
    denseBlocksQty,
    wallTiesQty,
    cavityInsulationSheets,
    pitchDegrees,
    pitchMultiplier,
    roofPlanArea,
    trueRoofSurfaceArea,
    roofTilesQty,
    ridgeLength,
    c24RafterLinearM,
    auditNotes,
    boq,
    netCost,
  };
}
