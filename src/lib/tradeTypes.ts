import { RENEWABLE_TRADE_TYPES } from "@/lib/greenTrades";

/**
 * Canonical general trade types offered at sign-up and in profile editing.
 * "Other" is always last and REQUIRES a free-text value (trade_type_other).
 */
export const GENERAL_TRADE_TYPES = [
  "Electrician",
  "Plumber",
  "Gas Engineer",
  "Builder",
  "Roofer",
  "Plasterer",
  "Carpenter",
  "Tiler",
  "Decorator",
  "Scaffolder",
  "Landscaper",
  "Other",
] as const;

export { RENEWABLE_TRADE_TYPES };

export const OTHER_TRADE_TYPE = "Other";

export const isOtherTradeType = (tradeType: string | null | undefined) =>
  (tradeType ?? "").trim().toLowerCase() === "other";

/**
 * A trade type selection is only valid when a real trade is chosen, or when
 * "Other" is chosen AND a meaningful free-text description is supplied.
 */
export const tradeTypeSelectionError = (
  tradeType: string | null | undefined,
  tradeTypeOther: string | null | undefined,
): string | null => {
  const t = (tradeType ?? "").trim();
  if (!t) return "Select your trade type";
  if (!isOtherTradeType(t)) return null;
  const other = (tradeTypeOther ?? "").trim();
  if (other.length < 3) return "Tell us what trade you do (at least 3 characters)";
  if (isOtherTradeType(other)) return "Please describe your actual trade, not 'Other'";
  return null;
};
