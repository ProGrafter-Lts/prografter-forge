/**
 * Elizabeth — Quality Assurance & Safety Lead (compliance checklist)
 * and Sharon — Site Logistics & Handover (sequencing plan).
 * Deterministic, cross-trade. Sandbox-only.
 */

import type { TakeoffResult } from "./groundworksEngine";
import type { SuperstructureResult } from "./superstructureEngine";
import type { MepResult } from "./mepEngine";
import type { FinishesResult } from "./finishesEngine";

export type ComplianceState = "required" | "attention" | "info";

export interface ComplianceItem {
  part: string;
  title: string;
  detail: string;
  state: ComplianceState;
  owner: string;
}

export interface LogisticsItem {
  week: string;
  activity: string;
  detail: string;
}

export function buildComplianceChecklist(args: {
  ground: TakeoffResult | null;
  superstructure: SuperstructureResult | null;
  mep: MepResult | null;
  finishes: FinishesResult | null;
}): ComplianceItem[] {
  const { ground, superstructure, mep } = args;
  const items: ComplianceItem[] = [];

  items.push({
    part: "Part A",
    title: "Structure — foundation depth & bearing",
    detail: ground
      ? `Dig depth ${ground.digDepth}m adopted${ground.clayboardRequired ? " under the NHBC 4.2 shrinkable clay / tree trigger, with a compressible slip layer" : " as the standard baseline"}. Pre-pour inspection by Building Control required before concrete is ordered.`
      : "Run the takeoff to fix the foundation depth before booking the pre-pour inspection.",
    state: ground?.clayboardRequired ? "attention" : "required",
    owner: "Ian / Elizabeth",
  });

  items.push({
    part: "Part C",
    title: "Ground contamination, DPM & cavity trays",
    detail:
      "Radon/ground-gas screening and DPM lapped to DPC. Cavity trays with stop-ends and weep vents over every structural opening.",
    state: "required",
    owner: "Ian / Caleb",
  });

  items.push({
    part: "Part L",
    title: "Fabric thermal performance",
    detail: superstructure
      ? `100mm full-fill PIR across ${superstructure.netWallArea} m² net wall targeting U ≤ 0.18 W/m²K. Openings total ${superstructure.totalOpeningsArea} m² — glazing allowance to be evidenced.`
      : "Run the takeoff to evidence the fabric U-values and glazing allowance.",
    state: "required",
    owner: "Caleb / Elizabeth",
  });

  items.push({
    part: "Part H",
    title: "Drainage interface",
    detail: ground && ground.digDepth
      ? "Confirm invert levels against the foundation dig; local deepening or lintelling required where a run passes under the footing. Air test before backfill."
      : "Confirm invert levels against the foundation dig before backfill.",
    state: "attention",
    owner: "Ian",
  });

  items.push({
    part: "Part P / BS 7671",
    title: "Electrical certification",
    detail: mep
      ? `${mep.totalPoints} points scheduled. EIC issued and notified to Building Control; consumer unit compliance verified to 18th Edition AMD3.`
      : "Electrical scope not yet calculated.",
    state: "required",
    owner: "Megan",
  });

  items.push({
    part: "Part E",
    title: "Sound insulation & separating elements",
    detail:
      "Acoustic board / resilient bars where separating habitable rooms; no standard-board substitution without a re-check.",
    state: "info",
    owner: "Ruby / Elizabeth",
  });

  items.push({
    part: "Part B",
    title: "Fire — protected routes & fire-rated board",
    detail:
      "30-minute rated board to integral garage, escape route ceilings and beneath habitable loft space. Interlinked alarms tested at handover.",
    state: "required",
    owner: "Ruby / Elizabeth",
  });

  items.push({
    part: "CDM 2015",
    title: "Principal contractor duties",
    detail:
      "F10 notification where the job exceeds 30 days or 500 person-days. Construction phase plan, welfare and excavation shoring in place from day one.",
    state: "attention",
    owner: "Elizabeth / Sharon",
  });

  return items;
}

export function buildLogisticsPlan(args: {
  ground: TakeoffResult | null;
  superstructure: SuperstructureResult | null;
  accessType: string;
}): LogisticsItem[] {
  const { ground, superstructure, accessType } = args;
  return [
    {
      week: "Week 0",
      activity: "Mobilisation & welfare",
      detail: `Set up welfare, heras line, skip/grab bay and material compound. Access recorded as ${accessType} — confirm wagon swept path and any permit before the first delivery.`,
    },
    {
      week: "Week 1",
      activity: "Muckaway & concrete",
      detail: ground
        ? `${ground.grabWagonLoads} grab loads out (${ground.bulkedMuckVolume} m³ bulked), then ${ground.concreteVolume} m³ ready-mix booked with 48h notice to the plant.`
        : "Run the takeoff to size the muckaway and concrete deliveries.",
    },
    {
      week: "Week 2–3",
      activity: "Masonry deliveries",
      detail: superstructure
        ? `${superstructure.facingBricksQty} bricks and ${superstructure.denseBlocksQty} blocks in staged packs — no more than two lifts on site at once to keep the working area clear.`
        : "Stage brick and block packs to match the lift programme.",
    },
    {
      week: "Week 4",
      activity: "Roof & weathertight",
      detail: superstructure
        ? `${superstructure.roofTilesQty} tiles plus membrane and battens to arrive once the wall plate is strapped. Scaffold handover inspection before loading out.`
        : "Roof coverings to follow the wall-plate strap-down and scaffold inspection.",
    },
    {
      week: "Week 5–6",
      activity: "First fix & board",
      detail:
        "MEP first fix, then insulation and board — plasterboard delivered dry and stacked on edge, never flat on a damp slab.",
    },
    {
      week: "Week 7–8",
      activity: "Finishes, snag & handover",
      detail:
        "Skim dry-out, decoration, second fix. Handover pack: EIC, gas/heating commissioning, Building Control completion certificate, warranties and O&M photos.",
    },
  ];
}
