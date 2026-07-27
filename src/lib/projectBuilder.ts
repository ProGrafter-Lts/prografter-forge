// Shared types + helpers for the Construction Project Builder.
// This is the canonical shape that every other ProGrafter module
// (Cost Builder, Project Clarity, Atlas, AI Quote Checker, Business Pulse)
// should read from `project_intelligence_records.builder_data`.

export type TriState = "yes" | "no" | "unknown" | "";

export type BuilderData = {
  // Section 1
  projectType?: string;
  projectTypeOther?: string;

  // Section 2 — Property
  address?: {
    line1?: string;
    city?: string;
    postcode?: string;
  };
  propertyType?: string;
  propertyAge?: string;
  storeys?: string;

  // Section 3 — Dimensions
  dimensions?: {
    width?: string;
    projection?: string;
    height?: string;
    storeys?: string;
    floorArea?: string; // auto-derived
  };

  // Section 4 — Existing structure
  existing?: {
    wallRemoved?: TriState;
    steelRequired?: TriState;
    padstonesRequired?: TriState;
    chimneyAffected?: TriState;
    drainsAffected?: TriState;
    structuralCalcsAvailable?: TriState;
    planningApproved?: TriState;
    buildingRegsStarted?: TriState;
  };

  // Section 5 — Specification
  spec?: {
    externalWall?: string;
    internalWall?: string;
    roofType?: string;
    roofFinish?: string;
  };

  // Section 6 — Glazing
  glazing?: {
    bifoldDoors?: boolean;
    bifoldWidth?: string;
    slidingDoors?: boolean;
    slidingWidth?: string;
    frenchDoors?: boolean;
    roofLantern?: boolean;
    lanternWidth?: string;
    lanternLength?: string;
    rooflights?: string;
    windowQuantity?: string;
    windowQuality?: "standard" | "premium" | "unknown" | "";
  };

  // Section 7 — Internal finish
  finishLevel?: string;

  // Section 8 — Services
  services?: string[];
  servicesOther?: string;

  // Section 9 — External works
  externalWorks?: string[];
  externalWorksOther?: string;

  // Section 10 — Constraints
  constraints?: string[];
};

export const PROJECT_TYPES = [
  "Rear Extension",
  "Side Extension",
  "Wrap Around Extension",
  "Double Storey Extension",
  "Loft Conversion",
  "Garage Conversion",
  "Internal Alteration",
  "Renovation",
  "New Build",
  "Landscaping",
  "Commercial",
  "Other",
] as const;

export const PROPERTY_TYPES = [
  "Detached",
  "Semi Detached",
  "Terraced",
  "Bungalow",
  "Flat",
] as const;

export const FINISH_LEVELS = [
  "Shell Only",
  "First Fix",
  "Plaster Finish",
  "Second Fix",
  "Decoration",
  "Complete Turnkey",
] as const;

export const SERVICE_OPTIONS = [
  "Electrical",
  "Plumbing",
  "Heating",
  "Kitchen",
  "Bathroom",
  "Underfloor Heating",
  "Solar",
  "EV Charger",
  "Air Conditioning",
  "Ventilation",
  "Other",
] as const;

export const EXTERNAL_WORKS_OPTIONS = [
  "Drainage",
  "Patio",
  "Driveway",
  "Landscaping",
  "Retaining Walls",
  "Steps",
  "Fencing",
  "Other",
] as const;

export const CONSTRAINT_OPTIONS = [
  "Side access",
  "Restricted access",
  "Conservation area",
  "Party wall",
  "Trees nearby",
  "Overhead cables",
  "Known poor ground",
  "Existing manholes",
  "Existing services crossing footprint",
  "Unknown",
] as const;

// A pure function used by both the builder and downstream modules.
// Confidence rewards completeness — the more that's answered, the higher.
export function calculateConstructionConfidence(d: BuilderData): number {
  const checks: boolean[] = [
    !!d.projectType,
    !!d.address?.postcode,
    !!d.propertyType,
    !!d.propertyAge,
    !!d.storeys,
    !!d.dimensions?.width && !!d.dimensions?.projection,
    !!d.dimensions?.height,
    !!d.existing?.wallRemoved && d.existing.wallRemoved !== "unknown",
    !!d.existing?.steelRequired && d.existing.steelRequired !== "unknown",
    !!d.existing?.padstonesRequired,
    !!d.existing?.planningApproved,
    !!d.existing?.buildingRegsStarted,
    !!d.spec?.externalWall,
    !!d.spec?.internalWall,
    !!d.spec?.roofType,
    !!d.spec?.roofFinish,
    !!d.glazing?.windowQuality && d.glazing.windowQuality !== "unknown",
    !!d.finishLevel,
    (d.services?.length ?? 0) > 0,
    (d.externalWorks?.length ?? 0) > 0,
    (d.constraints?.length ?? 0) > 0,
  ];
  const answered = checks.filter(Boolean).length;
  return Math.round((answered / checks.length) * 100);
}

export function computeFloorArea(width?: string, projection?: string): string {
  const w = parseFloat(width ?? "");
  const p = parseFloat(projection ?? "");
  if (!isFinite(w) || !isFinite(p) || w <= 0 || p <= 0) return "";
  return (w * p).toFixed(1);
}
