// Central source of truth for trade banding + verification routes.
// Used by signup (to gate which verification path a trade can take) and admin
// (to show the right register links).

export type TradeBand = "legally_gated" | "scheme_preferred" | "competence_assessed";
export type VerificationRoute = "registered" | "qualified" | "time_served";

export type RegistrationScheme =
  | "gas_safe"
  | "niceic"
  | "napit"
  | "elecsa"
  | "mcs"
  | "ozev"
  | "oftec"
  | "fensa"
  | "certass";

export interface TradeBandConfig {
  band: TradeBand;
  /** Mandatory scheme(s) — at least one must be provided when band !== competence_assessed */
  required?: RegistrationScheme[];
  /** Helper text shown under the registration capture */
  helper?: string;
}

const norm = (t: string) => t.toLowerCase().trim();

export const REGISTER_URLS: Record<RegistrationScheme, (n: string) => string> = {
  gas_safe: (n) => `https://www.gassaferegister.co.uk/find-an-engineer/results/?registrationNumber=${encodeURIComponent(n)}`,
  niceic: (n) => `https://niceic.com/find-a-contractor?Search=${encodeURIComponent(n)}`,
  napit: (n) => `https://napit.org.uk/find-an-installer/?term=${encodeURIComponent(n)}`,
  elecsa: (n) => `https://www.elecsa.co.uk/find-a-contractor/?term=${encodeURIComponent(n)}`,
  mcs: (n) => `https://mcscertified.com/find-an-installer/?Keyword=${encodeURIComponent(n)}`,
  ozev: () => `https://www.gov.uk/government/publications/electric-vehicle-homecharge-scheme-approved-chargepoint-model-list`,
  oftec: (n) => `https://www.oftec.org/consumers/find-a-technician?term=${encodeURIComponent(n)}`,
  fensa: (n) => `https://www.fensa.org.uk/find-an-installer?Search=${encodeURIComponent(n)}`,
  certass: (n) => `https://www.certass.co.uk/find-an-installer/?search=${encodeURIComponent(n)}`,
};

export const SCHEME_LABEL: Record<RegistrationScheme, string> = {
  gas_safe: "Gas Safe Register",
  niceic: "NICEIC",
  napit: "NAPIT",
  elecsa: "ELECSA",
  mcs: "MCS",
  ozev: "OZEV-authorised installer",
  oftec: "OFTEC",
  fensa: "FENSA",
  certass: "CERTASS",
};

/** Classify a free-text trade type into a band + required schemes. */
export const classifyTrade = (tradeType: string | null | undefined): TradeBandConfig => {
  const t = norm(tradeType || "");

  // BAND 1 — legally gated
  if (t.includes("gas engineer") || t === "gas") return { band: "legally_gated", required: ["gas_safe"], helper: "Your 7-digit Gas Safe registration number." };
  if (t.includes("electrician")) return { band: "legally_gated", required: ["niceic", "napit", "elecsa"], helper: "Your Competent Person Scheme registration (NICEIC, NAPIT or ELECSA)." };
  if (t.includes("solar") || t.includes("heat pump") || t.includes("biomass")) return { band: "legally_gated", required: ["mcs"], helper: "Your MCS certification number." };
  if (t.includes("ev") || t.includes("charger") || t.includes("charge point")) return { band: "legally_gated", required: ["ozev"], helper: "Your OZEV-authorised installer reference." };
  if (t.includes("oil")) return { band: "legally_gated", required: ["oftec"], helper: "Your OFTEC registration number." };

  // BAND 2 — scheme-preferred
  if (t.includes("window") || t.includes("door")) return { band: "scheme_preferred", required: ["fensa", "certass"], helper: "Your FENSA or CERTASS number — or declare you notify building control per job." };

  // BAND 3 — competence-assessed (default for any other recognised trade and unknown)
  return { band: "competence_assessed" };
};

/** Trade types we always show as Band 3 choices in the route screen. */
export const COMPETENCE_ASSESSED_TYPES = [
  "Plumber", "Bricklayer", "Builder", "Carpenter", "Plasterer", "Tiler",
  "Roofer", "Decorator", "Landscaper",
];

export const isLegallyGated = (tradeType: string | null | undefined) =>
  classifyTrade(tradeType).band === "legally_gated";

export const isCompetenceAssessed = (tradeType: string | null | undefined) =>
  classifyTrade(tradeType).band === "competence_assessed";
