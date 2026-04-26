/**
 * Single source of truth for whether a job/project is "active".
 *
 * A project is active when:
 *   - it has not been marked completed or cancelled, AND
 *   - it has progressed beyond the public-listing stage (i.e. quote accepted,
 *     contract being signed, or work in progress).
 *
 * Use {@link isActiveJob} on any record that has a `stage` and `status`.
 * Both homeowner and trade dashboards must use this — never re-derive locally.
 */

export type JobLike = {
  stage?: string | null;
  status?: string | null;
};

const COMPLETED_STAGES = new Set(["completed", "complete", "cancelled", "draft"]);
const COMPLETED_STATUSES = new Set(["completed", "complete", "cancelled", "closed"]);

/** A "live" pre-quote project still listed for trades to see. */
const PRE_LIVE_STAGES = new Set(["enquiry", "quoting"]);

/** Stages that always count as active engagement (work happening). */
const ACTIVE_STAGES = new Set(["scheduled", "in_progress", "review"]);

/** Statuses that imply the project is live regardless of stage. */
const ACTIVE_STATUSES = new Set(["in_progress", "matched", "active"]);

/**
 * True if the job is in any pre-completion state — including "open for quotes".
 * Use this for the homeowner "Active Projects" list (they want to see open jobs).
 */
export const isActiveJob = (j: JobLike): boolean => {
  const stage = (j.stage || "").toLowerCase();
  const status = (j.status || "").toLowerCase();
  if (COMPLETED_STAGES.has(stage)) return false;
  if (COMPLETED_STATUSES.has(status)) return false;
  if (ACTIVE_STAGES.has(stage)) return true;
  if (ACTIVE_STATUSES.has(status)) return true;
  if (PRE_LIVE_STAGES.has(stage)) return true;
  // Default: open jobs still count as active for the homeowner.
  return status === "open" || status === "awaiting_quotes";
};

/**
 * Stricter test for a project that has actually been won/contracted.
 * Use this for the trade "Active Projects" stats (they don't have open jobs).
 */
export const isContractedActiveJob = (j: JobLike): boolean => {
  const stage = (j.stage || "").toLowerCase();
  const status = (j.status || "").toLowerCase();
  if (COMPLETED_STAGES.has(stage)) return false;
  if (COMPLETED_STATUSES.has(status)) return false;
  return ACTIVE_STAGES.has(stage) || ACTIVE_STATUSES.has(status);
};
