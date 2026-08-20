// Single source of truth for the live ProGrafter service area.
// Same rule already proven on the Project Cost Guide waitlist capture:
// match the *letter* part of the outcode exactly, so "SM1" does not count as "S".
export const LIVE_AREA_PREFIXES = ["NG", "DE", "LE", "LN", "S", "DN"] as const;

export const normalisePostcode = (pc: string) =>
  (pc || "").trim().toUpperCase().replace(/\s+/g, "");

export const outcodeOf = (pc: string) => {
  const p = normalisePostcode(pc);
  const m = p.match(/^([A-Z]{1,2}\d[A-Z\d]?)/);
  return m ? m[1] : "";
};

export const isInLiveArea = (pc: string | null | undefined) => {
  const out = outcodeOf(pc || "");
  if (!out) return false;
  const letters = out.match(/^[A-Z]+/)?.[0] || "";
  return (LIVE_AREA_PREFIXES as readonly string[]).includes(letters);
};
