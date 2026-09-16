/**
 * Canonical public commercial terms.
 *
 * The Pricing page is the authoritative page for commercial terms; this module
 * is the single source for the figures themselves so that every public summary
 * agrees. Change the numbers here only — never hard-code a different rate or
 * cap in a page or component.
 */
export const COMMISSION_RATE_PERCENT = 7.5;
export const COMMISSION_CAP_GBP = 900;

export const COMMISSION_RATE_LABEL = `${COMMISSION_RATE_PERCENT}%`;
export const COMMISSION_CAP_LABEL = `£${COMMISSION_CAP_GBP.toLocaleString("en-GB")}`;

/** "7.5% commission after a completed job has been paid" */
export const COMMISSION_SENTENCE = `${COMMISSION_RATE_LABEL} commission after a completed job has been paid`;

/** "capped at £900" */
export const COMMISSION_CAP_SENTENCE = `capped at ${COMMISSION_CAP_LABEL}`;

/** Short summary bullets other public pages may reuse. */
export const PRICING_SUMMARY_POINTS = [
  "£0 to join",
  "No lead fees",
  `Commission only after completed paid work (${COMMISSION_RATE_LABEL})`,
  `Maximum commission per job: ${COMMISSION_CAP_LABEL}`,
];
