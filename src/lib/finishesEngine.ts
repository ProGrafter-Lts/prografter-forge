/**
 * Ruby — Drylining, Plastering & Finishes Lead.
 * Deterministic board / skim / joinery takeoff.
 * Sandbox-only: nothing here is wired into live quoting tools.
 */

import type { BoqLine } from "./groundworksEngine";

export interface FinishesInputs {
  /** Internal wall area to be boarded (m²) — dot & dab or stud. */
  internalWallArea: number;
  /** Ceiling / floor plan area (m²). */
  ceilingArea: number;
  /** Skirting & architrave linear run (m). */
  skirtingRun: number;
  internalDoors: number;
  twoCoatSkim: boolean;
  /** External monocouche / silicone render area (m²). */
  externalRenderArea: number;
}

export const DEFAULT_FINISHES_INPUTS: FinishesInputs = {
  internalWallArea: 64,
  ceilingArea: 32,
  skirtingRun: 26,
  internalDoors: 3,
  twoCoatSkim: true,
  externalRenderArea: 0,
};

export interface FinishesRates {
  /** 12.5mm plasterboard sheet (2.4 × 1.2m), supplied. */
  boardSheetRate: number;
  /** Board fixing labour, per m². */
  boardFixPerM2: number;
  /** 2-coat Thistle multi-finish skim, per m². */
  skimPerM2: number;
  /** Skirting & architrave supplied and fixed, per lm. */
  skirtingPerLm: number;
  /** Internal door, lining, ironmongery — hung, per door set. */
  doorSetRate: number;
  /** Mist coat + 2 coats emulsion, per m². */
  decorationPerM2: number;
  /** External monocouche / silicone render, per m². */
  renderPerM2: number;
}

export const DEFAULT_FINISHES_RATES: FinishesRates = {
  boardSheetRate: 12.5,
  boardFixPerM2: 9.5,
  skimPerM2: 14,
  skirtingPerLm: 16,
  doorSetRate: 260,
  decorationPerM2: 8.5,
  renderPerM2: 46,
};

export interface FinishesResult {
  totalBoardArea: number;
  boardSheets: number;
  skimArea: number;
  auditNotes: string[];
  boq: BoqLine[];
  netCost: number;
}

const SHEET_COVERAGE = 2.88; // 2.4m × 1.2m
const WASTE = 1.1;
const round2 = (n: number) => Number(n.toFixed(2));

export function runFinishesTakeoff(
  input: FinishesInputs = DEFAULT_FINISHES_INPUTS,
  rates: FinishesRates = DEFAULT_FINISHES_RATES,
): FinishesResult {
  const phase = "Finishes";
  const totalBoardArea = round2(input.internalWallArea + input.ceilingArea);
  const boardSheets = Math.ceil((totalBoardArea * WASTE) / SHEET_COVERAGE);
  const skimArea = totalBoardArea;

  const boq: BoqLine[] = [
    {
      phase,
      description: "12.5mm plasterboard (2.4 × 1.2m sheets) — supplied",
      formula: `ceil((${totalBoardArea} m² × ${WASTE}) ÷ ${SHEET_COVERAGE} m² per sheet)`,
      quantity: boardSheets,
      unit: "sheets",
      rate: rates.boardSheetRate,
      total: round2(boardSheets * rates.boardSheetRate),
    },
    {
      phase,
      description: "Boarding labour — walls dot & dab, ceilings screw-fixed to joists",
      formula: `${input.internalWallArea} m² walls + ${input.ceilingArea} m² ceilings`,
      quantity: totalBoardArea,
      unit: "m²",
      rate: rates.boardFixPerM2,
      total: round2(totalBoardArea * rates.boardFixPerM2),
    },
    {
      phase,
      description: `${input.twoCoatSkim ? "2-coat" : "1-coat"} Thistle multi-finish skim, taped & beaded`,
      formula: `${skimArea} m² skim area`,
      quantity: skimArea,
      unit: "m²",
      rate: input.twoCoatSkim ? rates.skimPerM2 : round2(rates.skimPerM2 * 0.8),
      total: round2(skimArea * (input.twoCoatSkim ? rates.skimPerM2 : rates.skimPerM2 * 0.8)),
    },
    {
      phase,
      description: "Skirting & architrave — supplied, mitred and fixed",
      formula: `${input.skirtingRun} lm run`,
      quantity: round2(input.skirtingRun),
      unit: "lm",
      rate: rates.skirtingPerLm,
      total: round2(input.skirtingRun * rates.skirtingPerLm),
    },
    {
      phase,
      description: "Internal door sets — lining, door, ironmongery hung",
      formula: `${input.internalDoors} no. door sets`,
      quantity: input.internalDoors,
      unit: "no.",
      rate: rates.doorSetRate,
      total: round2(input.internalDoors * rates.doorSetRate),
    },
    {
      phase,
      description: "Decoration — mist coat plus two full coats emulsion",
      formula: `${totalBoardArea} m² finished surface`,
      quantity: totalBoardArea,
      unit: "m²",
      rate: rates.decorationPerM2,
      total: round2(totalBoardArea * rates.decorationPerM2),
    },
  ];

  if (input.externalRenderArea > 0) {
    boq.push({
      phase: "Finishes",
      description: "External monocouche / silicone render — beaded, base & top coat",
      formula: `${input.externalRenderArea} m² external elevation`,
      quantity: round2(input.externalRenderArea),
      unit: "m²",
      rate: rates.renderPerM2,
      total: round2(input.externalRenderArea * rates.renderPerM2),
    });
  }

  const auditNotes: string[] = [
    `Board schedule: ${boardSheets} sheets allowed at ${Math.round((WASTE - 1) * 100)}% cut waste across ${totalBoardArea} m².`,
    "Part E: separating walls and floors require acoustic board / resilient detailing — confirm before ordering standard 12.5mm.",
    "Fire-rated board required to any garage, integral ceiling or protected escape route — a like-for-like standard board swap is a compliance failure.",
    "Drying times: skim must be fully dry before mist coat, and new plaster should not be sealed with vinyl emulsion.",
  ];
  if (!input.twoCoatSkim) {
    auditNotes.push(
      "⚠️ Single-coat skim priced — acceptable over sound existing plaster only, not over fresh board.",
    );
  }

  const netCost = round2(boq.reduce((sum, l) => sum + l.total, 0));
  return { totalBoardArea, boardSheets, skimArea, auditNotes, boq, netCost };
}
