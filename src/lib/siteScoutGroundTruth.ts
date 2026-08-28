/**
 * Tier 1 — SiteScout Ground Truth Layer.
 *
 * The physical site baseline captured before any drawing is parsed. Every
 * specialist agent inherits from this: it constrains dig depth, muck-away
 * strategy, service upgrades and drainage interfaces.
 *
 * Sandbox-only: drives /sitescout-sandbox. Nothing here is wired into live
 * quoting tools.
 */

import type { AccessType, SoilType } from "./groundworksEngine";

export type SystemType = "Combi" | "System" | "Regular";
export type ConsumerUnitType =
  | "Modern metal 18th Ed."
  | "Plastic (pre-2016)"
  | "Rewireable fuse board";

export interface GroundTruth {
  // Ground & geotechnical
  soilType: SoilType;
  treeSpecies: string;
  treeProximity: number;
  utilitiesCrossingFootprint: boolean;

  // Logistics & boundary
  accessWidth: number;
  distanceToRoad: number;
  overheadCables: boolean;

  // Existing services
  consumerUnitType: ConsumerUnitType;
  spareWays: number;
  boilerOutputKw: number;
  systemType: SystemType;
  drainageInvertDepth: number;
}

export const DEFAULT_GROUND_TRUTH: GroundTruth = {
  soilType: "Clay",
  treeSpecies: "Oak",
  treeProximity: 6.5,
  utilitiesCrossingFootprint: false,
  accessWidth: 2.8,
  distanceToRoad: 12,
  overheadCables: false,
  consumerUnitType: "Plastic (pre-2016)",
  spareWays: 1,
  boilerOutputKw: 24,
  systemType: "Combi",
  drainageInvertDepth: 1.0,
};

/** High water-demand species escalate the NHBC 4.2 zone of influence. */
const HIGH_DEMAND = ["oak", "willow", "poplar", "elm", "eucalyptus"];

export interface DerivedGroundTruth {
  digDepth: number;
  clayboardRequired: boolean;
  accessType: AccessType;
  muckAwayStrategy: string;
  consumerUnitUpgrade: boolean;
  boilerUpgradeLikely: boolean;
  drainageConflict: boolean;
  /** Plain-English rules an agent can quote back in their dialogue. */
  notes: string[];
}

/**
 * Turn the raw survey into the hard rules the agents obey. Deterministic —
 * the same survey always produces the same constraints.
 */
export function deriveGroundTruth(gt: GroundTruth): DerivedGroundTruth {
  const notes: string[] = [];
  const shrinkable = gt.soilType === "Clay";
  const highDemand = HIGH_DEMAND.some((s) => gt.treeSpecies.toLowerCase().includes(s));

  // ---- dig depth ladder (1.0m → 2.4m) ----
  let digDepth = 1.0;
  if (shrinkable && gt.treeProximity <= 15) {
    if (gt.treeProximity <= 5) digDepth = highDemand ? 2.4 : 2.0;
    else if (gt.treeProximity <= 10) digDepth = highDemand ? 2.0 : 1.8;
    else digDepth = highDemand ? 1.8 : 1.4;
    notes.push(
      `NHBC 4.2: ${gt.treeSpecies || "tree"} at ${gt.treeProximity}m in shrinkable clay — foundation deepened to ${digDepth}m${highDemand ? " (high water-demand species)" : ""}.`,
    );
  } else if (gt.soilType === "Made Ground") {
    digDepth = 1.5;
    notes.push(
      "Made Ground recorded: unknown bearing capacity, 1.5m assumed pending trial holes and Building Control sign-off.",
    );
  } else if (gt.soilType === "Rock") {
    notes.push("Rock recorded: 1.0m dig, but breaker hire and reduced output must be allowed.");
  } else {
    notes.push("Standard 1.0m baseline dig — no shrinkable-clay/tree interaction detected.");
  }
  const clayboardRequired = shrinkable && digDepth > 1.0;
  if (clayboardRequired)
    notes.push("Compressible clayboard slip layer required to the full trench run.");

  // ---- access & muck-away strategy ----
  let accessType: AccessType;
  let muckAwayStrategy: string;
  if (gt.accessWidth < 1.2) {
    accessType = "Conveyor Required";
    muckAwayStrategy = `Access ${gt.accessWidth}m: conveyor plus barrow run to a road-side skip at ${gt.distanceToRoad}m. Allow banksman and extended durations.`;
  } else if (gt.accessWidth < 2.5) {
    accessType = "Narrow Access Skip Only";
    muckAwayStrategy = `Access ${gt.accessWidth}m: skip-only muck-away — no grab wagon on the plot. Expect a haulage and labour uplift.`;
  } else {
    accessType = "8-Wheel Grab Direct Access";
    muckAwayStrategy = `Access ${gt.accessWidth}m: 8-wheel grab can reach the dig. Cheapest muck-away route — price on grab loads.`;
  }
  notes.push(muckAwayStrategy);

  if (gt.overheadCables)
    notes.push(
      "⚠️ Overhead cables recorded: GS6 exclusion zone applies — machine height restricted and DNO consultation required before any lifting.",
    );
  if (gt.utilitiesCrossingFootprint)
    notes.push(
      "⚠️ In-ground utilities cross the footprint: hand-dig trial holes and a CAT scan are mandatory before machine excavation.",
    );

  // ---- existing services ----
  const consumerUnitUpgrade =
    gt.consumerUnitType !== "Modern metal 18th Ed." || gt.spareWays < 2;
  if (consumerUnitUpgrade)
    notes.push(
      `Existing board is "${gt.consumerUnitType}" with ${gt.spareWays} spare way(s) — BS 7671 18th Ed. AMD3 metal board changeover priced.`,
    );
  else notes.push("Existing metal board has spare ways — no changeover priced.");

  const boilerUpgradeLikely = gt.boilerOutputKw < 28 && gt.systemType === "Combi";
  if (boilerUpgradeLikely)
    notes.push(
      `Existing ${gt.boilerOutputKw}kW ${gt.systemType} boiler is marginal for the extended heat load — flag an output upgrade as a provisional sum.`,
    );

  const drainageConflict = gt.drainageInvertDepth > digDepth;
  if (drainageConflict)
    notes.push(
      `⚠️ Part H interface: drainage invert at ${gt.drainageInvertDepth}m sits below the ${digDepth}m foundation — local deepening or lintelling over the run required.`,
    );

  return {
    digDepth,
    clayboardRequired,
    accessType,
    muckAwayStrategy,
    consumerUnitUpgrade,
    boilerUpgradeLikely,
    drainageConflict,
    notes,
  };
}

/**
 * Stage 1 output — the locked "Site Risk & Ground Condition Summary" appended
 * to the head of the quotation so the builder's assumptions are on record.
 */
export function buildSiteRiskSummary(gt: GroundTruth, d: DerivedGroundTruth): string[] {
  return [
    `Ground conditions: ${gt.soilType}${gt.soilType === "Clay" ? " (shrinkable)" : ""}. Foundations priced to ${d.digDepth}m dig depth${d.clayboardRequired ? " with compressible clayboard to the full trench run" : ""}.`,
    `Vegetation: ${gt.treeSpecies || "no significant tree"}${gt.treeSpecies ? ` recorded at ${gt.treeProximity}m from the works — NHBC 4.2 zone of influence applied` : " within the zone of influence"}.`,
    `Site access: ${gt.accessWidth}m clear access, ${gt.distanceToRoad}m to the highway — ${d.accessType}. ${d.muckAwayStrategy}`,
    `Existing services: ${gt.consumerUnitType} with ${gt.spareWays} spare way(s) — ${d.consumerUnitUpgrade ? "consumer unit changeover included" : "no changeover required"}. Existing ${gt.boilerOutputKw}kW ${gt.systemType} boiler${d.boilerUpgradeLikely ? " flagged as marginal for the extended heat load" : " assessed as adequate"}.`,
    `Drainage: existing invert recorded at ${gt.drainageInvertDepth}m${d.drainageConflict ? " — below the foundation formation level; local deepening or lintelling over the run is required and priced as a provisional item" : " — no conflict with the foundation formation level"}.`,
    gt.utilitiesCrossingFootprint
      ? "In-ground utilities cross the footprint: hand-dug trial holes and a CAT scan precede all machine excavation."
      : "No in-ground utilities recorded crossing the footprint at survey stage.",
    gt.overheadCables
      ? "Overhead cables present: GS6 exclusion zone applies, machine height restricted and DNO consultation required."
      : "No overhead cables recorded over the working area.",
  ];
}

/** Ground-risk exclusions stated on the face of the quotation. */
export function buildRiskExclusions(gt: GroundTruth, d: DerivedGroundTruth): string[] {
  return [
    `Excavation is priced to ${d.digDepth}m. Any deeper formation instructed by Building Control is a measured extra at the agreed day-rate.`,
    "Unrecorded obstructions — old foundations, wells, tanks, contaminated ground or rock — are excluded and priced on discovery.",
    gt.soilType === "Made Ground"
      ? "Made Ground: bearing capacity is unproven pending trial holes; engineered solutions are excluded."
      : "Groundwater ingress requiring pumping or dewatering is excluded.",
    "Asbestos survey, removal and licensed disposal are excluded.",
    "Statutory undertaker charges for new or diverted service connections are excluded.",
  ];
}
