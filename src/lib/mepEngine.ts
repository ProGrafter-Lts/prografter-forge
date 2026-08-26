/**
 * Megan — Building Services & Electrics (MEP) Lead.
 * Deterministic first/second-fix electrical & mechanical takeoff.
 * Sandbox-only: nothing here is wired into live quoting tools.
 */

import type { BoqLine } from "./groundworksEngine";

export interface MepInputs {
  floorArea: number;
  doubleSockets: number;
  lightPoints: number;
  switchPlates: number;
  radiators: number;
  consumerUnitUpgrade: boolean;
  evCharger: boolean;
  underfloorHeating: boolean;
}

export const DEFAULT_MEP_INPUTS: MepInputs = {
  floorArea: 32,
  doubleSockets: 10,
  lightPoints: 8,
  switchPlates: 5,
  radiators: 3,
  consumerUnitUpgrade: true,
  evCharger: false,
  underfloorHeating: false,
};

export interface MepRates {
  /** First fix per point (cable, back box, containment). */
  firstFixPointRate: number;
  /** Second fix per accessory (faceplate, fitting, test). */
  secondFixPointRate: number;
  /** 18th Edition AMD3 metal consumer unit, supplied & installed. */
  consumerUnitRate: number;
  /** Radiator + valves + pipework drop, per unit. */
  radiatorRate: number;
  /** Wet UFH manifold & pipe, per m². */
  ufhPerM2: number;
  /** 7.4kW EV charge point inc. Type A RCBO. */
  evChargerRate: number;
  /** EIC / Part P notification & certification. */
  certificationRate: number;
}

export const DEFAULT_MEP_RATES: MepRates = {
  firstFixPointRate: 42,
  secondFixPointRate: 28,
  consumerUnitRate: 720,
  radiatorRate: 285,
  ufhPerM2: 68,
  evChargerRate: 950,
  certificationRate: 320,
};

export interface MepResult {
  totalPoints: number;
  auditNotes: string[];
  boq: BoqLine[];
  netCost: number;
}

const round2 = (n: number) => Number(n.toFixed(2));

export function runMepTakeoff(
  input: MepInputs = DEFAULT_MEP_INPUTS,
  rates: MepRates = DEFAULT_MEP_RATES,
): MepResult {
  const phase = "MEP";
  const auditNotes: string[] = [];
  const totalPoints = input.doubleSockets + input.lightPoints + input.switchPlates;

  const boq: BoqLine[] = [
    {
      phase,
      description: "First fix — power, lighting & switch drops (cable, boxes, containment)",
      formula: `${input.doubleSockets} sockets + ${input.lightPoints} lights + ${input.switchPlates} switches = ${totalPoints} points`,
      quantity: totalPoints,
      unit: "points",
      rate: rates.firstFixPointRate,
      total: round2(totalPoints * rates.firstFixPointRate),
    },
    {
      phase,
      description: "Second fix — accessories, fittings, terminations & dead/live testing",
      formula: `${totalPoints} points × second-fix rate`,
      quantity: totalPoints,
      unit: "points",
      rate: rates.secondFixPointRate,
      total: round2(totalPoints * rates.secondFixPointRate),
    },
  ];

  if (input.consumerUnitUpgrade) {
    boq.push({
      phase,
      description: "BS 7671 18th Ed. AMD3 metal consumer unit upgrade (SPD + RCBO ways)",
      formula: "1 no. board changeover inc. main bonding verification",
      quantity: 1,
      unit: "item",
      rate: rates.consumerUnitRate,
      total: round2(rates.consumerUnitRate),
    });
    auditNotes.push(
      "⚠️ BS 7671 18th Edition AMD3: metal-clad consumer unit with SPD required. Main protective bonding to gas/water must be verified at 10mm² before energising.",
    );
  } else {
    auditNotes.push(
      "No board upgrade priced — existing consumer unit must be confirmed as metal-clad with adequate spare ways and RCD protection, or a change becomes a variation.",
    );
  }

  if (input.radiators > 0) {
    boq.push({
      phase,
      description: "Radiators, TRVs & pipework drops (mechanical second fix)",
      formula: `${input.radiators} no. × supply + install`,
      quantity: input.radiators,
      unit: "no.",
      rate: rates.radiatorRate,
      total: round2(input.radiators * rates.radiatorRate),
    });
  }

  if (input.underfloorHeating) {
    boq.push({
      phase,
      description: "Wet underfloor heating — manifold, pipe loops & screed interface",
      formula: `${input.floorArea} m² floor area`,
      quantity: input.floorArea,
      unit: "m²",
      rate: rates.ufhPerM2,
      total: round2(input.floorArea * rates.ufhPerM2),
    });
    auditNotes.push(
      "Wet UFH selected: confirm heat-source capacity and screed depth/drying times — this sits on the critical path before finishes.",
    );
  }

  if (input.evCharger) {
    boq.push({
      phase,
      description: "7.4kW EV charge point inc. Type A RCBO & load curtailment",
      formula: "1 no. charge point + DNO notification",
      quantity: 1,
      unit: "item",
      rate: rates.evChargerRate,
      total: round2(rates.evChargerRate),
    });
    auditNotes.push(
      "EV charge point: maximum demand assessment and DNO notification required (Part S / ENA G100 where applicable).",
    );
  }

  boq.push({
    phase,
    description: "Electrical Installation Certificate & Part P building control notification",
    formula: "1 no. certification package",
    quantity: 1,
    unit: "item",
    rate: rates.certificationRate,
    total: round2(rates.certificationRate),
  });

  auditNotes.push(
    `Part P: all new circuits are notifiable. ${totalPoints} points scheduled across ${input.floorArea} m² — confirm circuit split (ring/radial) and cable derating for insulation contact.`,
  );
  if (input.doubleSockets / Math.max(input.floorArea, 1) > 0.5) {
    auditNotes.push(
      "⚠️ Socket density is high for the floor area — check the ring final circuit loading or split onto a second radial.",
    );
  }

  const netCost = round2(boq.reduce((sum, l) => sum + l.total, 0));
  return { totalPoints, auditNotes, boq, netCost };
}
