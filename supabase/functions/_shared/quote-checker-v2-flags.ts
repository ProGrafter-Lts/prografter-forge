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
  // Electrical/Rewire V2 (42 fields): gate passed 100% agreement, 126/126 ground truth. Signed off.
  electrical_rewire: true,
  // Extension V2 (116 fields): 5x3 gate 100% agreement, 348/348 ground truth
  // under the corrected scaled token budget. Signed off — live.
  extension_building: true,
  // Kitchen V2 (38 fields): gate cleared (weak 100%, medium 100%, strong
  // 97.4%) but NOT signed off — the strong-fixture flip on
  // appliances.integrated_vs_freestanding is being fixed and re-gated.
  // Stays false until Lee gives an explicit go-ahead.
  kitchen: false,
};

export function isV2Enabled(moduleId: string): boolean {
  return QUOTE_CHECKER_V2_ENABLED[moduleId] === true;
}
