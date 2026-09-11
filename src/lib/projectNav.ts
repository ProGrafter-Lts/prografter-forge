/**
 * Standardised navigation to the ONE canonical project record.
 *
 * Every surface (homeowner dashboard, trade dashboard, messages, briefings,
 * project lists) must route through here so a project always opens at the same
 * URL shape, with the same tab/panel vocabulary, and — when opened from a
 * dashboard — as a slide-over that preserves the underlying page and its
 * scroll position (project context is never lost).
 */

import { useCallback } from "react";
import { useDrawerNavigate } from "@/hooks/useDrawerNavigate";

export type ProjectTab =
  | "overview"
  | "messages"
  | "photos"
  | "payments"
  | "documents"
  | "activity"
  | "variations";

/** Canonical URL for a project, optionally deep-linked to one tab. */
export const projectPath = (jobId: string, tab?: ProjectTab) =>
  tab && tab !== "overview" ? `/project/${jobId}?tab=${tab}` : `/project/${jobId}`;

/** Canonical URL for a project panel (contract workspace and friends). */
export const projectPanelPath = (jobId: string, panel: string) =>
  `/project/${jobId}?panel=${panel}`;

/**
 * Open the canonical project over the current dashboard, keeping that page
 * mounted underneath so closing returns exactly where the user was.
 */
export function useOpenProject() {
  const openDrawer = useDrawerNavigate();
  return useCallback(
    (jobId: string, tab?: ProjectTab) => openDrawer(projectPath(jobId, tab)),
    [openDrawer],
  );
}
