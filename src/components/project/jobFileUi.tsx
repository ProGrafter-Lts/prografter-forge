import type { ReactNode } from "react";
import { TONE_CLASSES } from "@/lib/tradeVault";

/**
 * Shared presentation kit for the job-file surfaces (Documents, Photos /
 * Site Diary, Activity).
 *
 * Nothing new is invented here — it composes the patterns that already exist
 * elsewhere in the platform:
 *  · `.dashboard-dark`   (src/index.css) — the navy dashboard theme used by
 *    TradeDashboard, HomeownerDashboard, PlanningAlerts and AppShell.
 *  · `TONE_CLASSES`      (src/lib/tradeVault.ts) — the Approved / Missing /
 *    Pending badge tones used across TradeVault.
 *  · `border-l-4` accent cards — the notice-card treatment used by
 *    QuickBuildReview, CalendarConnect and GreenSchemesBreakdown.
 */

export type JobFileTone =
  | "green"
  | "amber"
  | "red"
  | "grey"
  | "teal"
  | "sky"
  | "indigo"
  | "purple"
  | "orange";

/** Badge classes — TradeVault tones, extended with the extra hues the
 *  activity feed needs, following exactly the same bg/text/border recipe. */
export const JOB_FILE_TONE_CLASSES: Record<JobFileTone, string> = {
  ...(TONE_CLASSES as Record<string, string>),
  teal: "bg-teal-500/15 text-teal-600 border-teal-500/30",
  sky: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  indigo: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
  purple: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  orange: "bg-orange-500/15 text-orange-600 border-orange-500/30",
} as Record<JobFileTone, string>;

/** Left-border accent colour per tone (TradeVault-style status colouring). */
export const JOB_FILE_ACCENT: Record<JobFileTone, string> = {
  green: "border-l-emerald-500",
  amber: "border-l-amber-500",
  red: "border-l-red-500",
  grey: "border-l-border",
  teal: "border-l-teal-500",
  sky: "border-l-sky-500",
  indigo: "border-l-indigo-500",
  purple: "border-l-purple-500",
  orange: "border-l-orange-500",
};

/** Icon colour per tone — matches the `text-*-600` icon convention. */
export const JOB_FILE_ICON_TONE: Record<JobFileTone, string> = {
  green: "text-emerald-600",
  amber: "text-amber-600",
  red: "text-red-600",
  grey: "text-muted-foreground",
  teal: "text-teal-600",
  sky: "text-sky-600",
  indigo: "text-indigo-600",
  purple: "text-purple-600",
  orange: "text-orange-600",
};

/** Dark navy surface wrapper — same theme class the dashboards use. */
export const JobFilePanel = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={`dashboard-dark rounded-2xl p-4 md:p-5 space-y-4 ${className}`}>{children}</div>
);

/** Card with the status-coloured left border used across the platform. */
export const AccentCard = ({
  tone = "grey",
  children,
  className = "",
}: {
  tone?: JobFileTone;
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-card border border-border border-l-4 ${JOB_FILE_ACCENT[tone]} rounded-xl p-4 ${className}`}
  >
    {children}
  </div>
);

/** Status / category pill — identical recipe to the TradeVault status badge. */
export const TonePill = ({
  tone = "grey",
  children,
  className = "",
}: {
  tone?: JobFileTone;
  children: ReactNode;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${JOB_FILE_TONE_CLASSES[tone]} ${className}`}
  >
    {children}
  </span>
);

/** Section header — `font-heading` title + tone-coloured lucide icon + count. */
export const SectionHeading = ({
  icon,
  title,
  count,
  action,
}: {
  icon: ReactNode;
  title: string;
  count?: number;
  action?: ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3 mb-3">
    <h3 className="font-heading text-xl text-foreground flex items-center gap-2">
      {icon}
      {title}
      {count !== undefined && (
        <span className="font-mono text-[10px] text-muted-foreground">({count})</span>
      )}
    </h3>
    {action}
  </div>
);

/** Empty state — matches the dashed placeholder used by PlanningAlerts. */
export const JobFileEmpty = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
    <div className="flex justify-center mb-3 text-muted-foreground">{icon}</div>
    <p className="font-mono text-sm text-muted-foreground">{children}</p>
  </div>
);
