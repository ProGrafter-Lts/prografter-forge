import { FolderKanban } from "lucide-react";

interface Brief {
  id: string;
  ref: string;
  job_title: string | null;
  status: string | null;
  matched_trade_count?: number | null;
  created_at: string;
}

/**
 * Maps every possible job_brief status to a homeowner-facing section.
 * A brief NEVER disappears — every status resolves to exactly one section here,
 * so when admin advances a brief it simply moves between sections.
 */
type SectionKey =
  | "under_review"
  | "live"
  | "quoted"
  | "accepted"
  | "in_progress"
  | "complete";

const SECTION_ORDER: SectionKey[] = [
  "in_progress",
  "accepted",
  "quoted",
  "live",
  "under_review",
  "complete",
];

const SECTION_META: Record<SectionKey, { title: string; blurb: string; badge: string; badgeClass: string }> = {
  under_review: {
    title: "Received — under review",
    blurb: "We're reviewing your brief before matching it with up to three vetted, local, available trades.",
    badge: "Under review",
    badgeClass: "text-secondary border-secondary/30",
  },
  live: {
    title: "Live — matched to trades, awaiting quotes",
    blurb: "Your brief is live with matched local trades. Quotes will appear here as they come in.",
    badge: "Awaiting quotes",
    badgeClass: "text-blue-700 border-blue-300 bg-blue-50",
  },
  quoted: {
    title: "Quotes received",
    blurb: "Trades have quoted on this job. Review and compare them in Quotes & Quote Checker.",
    badge: "Quotes in",
    badgeClass: "text-secondary border-secondary/30 bg-secondary/5",
  },
  accepted: {
    title: "Quote accepted",
    blurb: "You've accepted a quote. Your project is being set up.",
    badge: "Accepted",
    badgeClass: "text-purple-700 border-purple-300 bg-purple-50",
  },
  in_progress: {
    title: "Work in progress",
    blurb: "Work is underway on this project.",
    badge: "In progress",
    badgeClass: "text-amber-700 border-amber-300 bg-amber-50",
  },
  complete: {
    title: "Completed",
    blurb: "This project has been completed.",
    badge: "Completed",
    badgeClass: "text-green-700 border-green-300 bg-green-50",
  },
};

const statusToSection = (status?: string | null): SectionKey => {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "approved":
    case "published_to_trades":
    case "matched":
      return "live";
    case "quoted":
      return "quoted";
    case "accepted":
      return "accepted";
    case "in_progress":
      return "in_progress";
    case "complete":
    case "completed":
    case "closed":
      return "complete";
    // new / under_review / awaiting_scoping / scoped / null → still being reviewed
    default:
      return "under_review";
  }
};

const MyBriefs = ({ briefs }: { briefs: Brief[] }) => {
  if (!briefs || briefs.length === 0) return null;

  const grouped = new Map<SectionKey, Brief[]>();
  for (const brief of briefs) {
    const key = statusToSection(brief.status);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(brief);
  }

  return (
    <div className="space-y-6">
      {SECTION_ORDER.filter((key) => grouped.has(key)).map((key) => {
        const meta = SECTION_META[key];
        const items = grouped.get(key)!;
        return (
          <div key={key} className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-4">
            <div>
              <h3 className="font-heading text-primary text-lg">{meta.title}</h3>
              <p className="font-mono text-xs text-muted-foreground mt-1">{meta.blurb}</p>
            </div>
            <div className="space-y-3">
              {items.map((brief) => (
                <div key={brief.id} className="rounded-xl border border-border/80 bg-background/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-heading text-primary text-base truncate flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-muted-foreground shrink-0" />
                        {brief.job_title || "Job brief"}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground mt-1">
                        Reference {brief.ref}
                        {key === "live" && (brief.matched_trade_count ?? 0) > 0
                          ? ` · ${brief.matched_trade_count} trade${brief.matched_trade_count! > 1 ? "s" : ""} matched`
                          : ""}
                      </p>
                    </div>
                    <span
                      className={`font-mono text-[11px] border rounded-full px-3 py-1 whitespace-nowrap ${meta.badgeClass}`}
                    >
                      {meta.badge}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MyBriefs;
