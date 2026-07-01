/**
 * Shared status-badge styling for the homeowner dashboard.
 *
 * One source of truth so badges are consistent across every card. Colours use
 * the existing ProGrafter palette (Tailwind colour scales already in the design
 * system) with AA-contrast dark text on light fills.
 *
 *  Awaiting Quotes → blue
 *  Quote Received  → teal (secondary)
 *  Action Required → amber
 *  In Progress     → teal (secondary)
 *  Completed       → green
 *  Closed          → grey
 */

export type BadgeTone = "blue" | "teal" | "amber" | "green" | "grey" | "purple";

const TONE_CLASS: Record<BadgeTone, string> = {
  blue: "border-transparent bg-blue-100 text-blue-900 hover:bg-blue-100",
  teal: "border-transparent bg-secondary/20 text-secondary hover:bg-secondary/20",
  amber: "border-transparent bg-amber-200 text-amber-900 hover:bg-amber-200",
  green: "border-transparent bg-green-100 text-green-800 hover:bg-green-100",
  grey: "border-transparent bg-muted text-primary hover:bg-muted",
  purple: "border-transparent bg-purple-200 text-purple-900 hover:bg-purple-200",
};

export function badgeToneClass(tone: BadgeTone): string {
  return TONE_CLASS[tone];
}

export interface StatusBadge {
  label: string;
  tone: BadgeTone;
  className: string;
}

/** Canonical job-status → badge mapping. */
const STATUS_MAP: Record<string, { label: string; tone: BadgeTone }> = {
  awaiting_quotes: { label: "Awaiting Quotes", tone: "blue" },
  matched: { label: "Trade Matched", tone: "blue" },
  quote_received: { label: "Quote Received", tone: "teal" },
  action_required: { label: "Action Required", tone: "amber" },
  in_progress: { label: "In Progress", tone: "teal" },
  review: { label: "In Review", tone: "purple" },
  completed: { label: "Completed", tone: "green" },
  complete: { label: "Completed", tone: "green" },
  closed: { label: "Closed", tone: "grey" },
  cancelled: { label: "Closed", tone: "grey" },
};

function humanise(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Resolve a job status into a labelled, styled badge. */
export function getStatusBadge(status: string): StatusBadge {
  const entry = STATUS_MAP[status] ?? { label: humanise(status), tone: "grey" as BadgeTone };
  return { label: entry.label, tone: entry.tone, className: TONE_CLASS[entry.tone] };
}
