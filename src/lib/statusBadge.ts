import type { CSSProperties } from "react";

/**
 * Shared status-badge styling for the homeowner dashboard.
 *
 * One source of truth so badges are consistent across every card. Colours are
 * supplied as INLINE styles (not Tailwind text-*-900 utilities) because the dark
 * dashboard theme lightens dark text utilities, which would destroy contrast on
 * light badge fills. Inline styles guarantee AA-contrast dark text.
 *
 *  Awaiting Quotes → blue
 *  Quote Received  → teal
 *  Action Required → amber
 *  In Progress     → teal
 *  Completed       → green
 *  Closed          → grey
 */

export type BadgeTone = "blue" | "teal" | "amber" | "green" | "grey" | "purple" | "red";

const TONE_STYLE: Record<BadgeTone, CSSProperties> = {
  blue: { backgroundColor: "#dbeafe", color: "#1e3a8a" },
  teal: { backgroundColor: "#99f6e4", color: "#115e59" },
  amber: { backgroundColor: "#fde68a", color: "#78350f" },
  green: { backgroundColor: "#bbf7d0", color: "#14532d" },
  grey: { backgroundColor: "#e5e7eb", color: "#374151" },
  purple: { backgroundColor: "#e9d5ff", color: "#581c87" },
  red: { backgroundColor: "#fecaca", color: "#7f1d1d" },
};

export function badgeToneStyle(tone: BadgeTone): CSSProperties {
  return TONE_STYLE[tone];
}

export interface StatusBadge {
  label: string;
  tone: BadgeTone;
  /** Inline style — apply to the badge element to survive theme overrides. */
  style: CSSProperties;
  /** Keeps the badge from inheriting hover-driven colour swaps. */
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
  return {
    label: entry.label,
    tone: entry.tone,
    style: TONE_STYLE[entry.tone],
    className: "border-transparent",
  };
}
