// Server-side rollout switch for the Pass 0/1/2 Quote Checker rebuild.
//
// This is the ACTUAL gate — flip a category to true only after it clears the
// consistency gate (scripts/quote-checker-consistency-gate.mjs, >=95% field
// agreement across 5 runs on all 3 reference quotes, logged in
// quote_check_consistency_tests). Mirrors src/lib/featureFlags.ts's pattern
// of "flip in code, redeploy" — there is no remote-config system in this
// codebase, and this stays consistent with that.
//
// src/lib/featureFlags.ts's `quoteCheckerV2Landscaping` flag is a separate,
// frontend-only flag (for any future UI indicator) and does not itself gate
// anything server-side — this map is what run-paid-module-check actually
// checks.
export const QUOTE_CHECKER_V2_ENABLED: Record<string, boolean> = {
  landscaping_driveway: true,
  boiler_heating: true,
  bathroom: true,
};

export function isV2Enabled(moduleId: string): boolean {
  return QUOTE_CHECKER_V2_ENABLED[moduleId] === true;
}
