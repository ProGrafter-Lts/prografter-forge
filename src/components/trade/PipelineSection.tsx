import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ShortlistStatus } from "./ShortlistStatusControl";

interface Props {
  tradeId: string;
}

type Counts = Record<
  "todo" | "contacted" | "awaiting_planning" | "planning_approved" | "site_visit" | "quoted" | "won" | "lost",
  number
>;

const CARD_DEFS: {
  key: keyof Counts;
  label: string;
  subtitle: string;
  tone: string;
  filter?: string;
}[] = [
  {
    key: "todo",
    label: "To Contact",
    subtitle: "Haven't reached out yet",
    tone: "bg-muted/40 text-foreground border-border",
    filter: "todo",
  },
  {
    key: "contacted",
    label: "Waiting for Reply",
    subtitle: "Reached out, awaiting response",
    tone: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    filter: "contacted",
  },
  {
    key: "awaiting_planning",
    label: "Awaiting Planning Decision",
    subtitle: "Application still under review",
    tone: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  },
  {
    key: "planning_approved",
    label: "Planning Approved",
    subtitle: "Approved — ready to approach",
    tone: "bg-purple-500/10 text-purple-700 border-purple-500/30",
  },
  {
    key: "site_visit",
    label: "Site Visit Booked",
    subtitle: "Visit scheduled",
    tone: "bg-teal-500/10 text-teal-700 border-teal-500/30",
  },
  {
    key: "quoted",
    label: "Quoted",
    subtitle: "Quote submitted, pending decision",
    tone: "bg-primary/10 text-primary border-primary/30",
    filter: "quoted",
  },
  {
    key: "won",
    label: "Won",
    subtitle: "Converted in last 90 days",
    tone: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    filter: "won",
  },
  {
    key: "lost",
    label: "Lost",
    subtitle: "Archived or lost leads",
    tone: "bg-destructive/10 text-destructive border-destructive/30",
    filter: "dead",
  },
];

const PipelineSection = ({ tradeId }: Props) => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Counts>({
    todo: 0,
    contacted: 0,
    awaiting_planning: 0,
    planning_approved: 0,
    site_visit: 0,
    quoted: 0,
    won: 0,
    lost: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // Race the query against a 6s timeout so the section never hangs.
    const queryPromise = supabase
      .from("planning_alert_shortlist")
      .select("contact_status, last_status_change_at")
      .eq("trade_id", tradeId);

    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
      window.setTimeout(
        () => resolve({ data: null, error: { message: "Pipeline lookup timed out" } }),
        6000,
      ),
    );

    const { data, error: queryError } = (await Promise.race([
      queryPromise,
      timeoutPromise,
    ])) as { data: { contact_status: string; last_status_change_at: string | null }[] | null; error: { message: string } | null };

    if (queryError) {
      console.error("Failed to load pipeline counts", queryError);
      setError(queryError.message ?? "Couldn't load pipeline");
      setLoading(false);
      return;
    }

    const next: Counts = {
      todo: 0,
      contacted: 0,
      awaiting_planning: 0,
      planning_approved: 0,
      site_visit: 0,
      quoted: 0,
      won: 0,
      lost: 0,
    };
    for (const r of data ?? []) {
      const status = r.contact_status as ShortlistStatus;
      if (status === "todo" || status === "contacted" || status === "quoted") {
        next[status] += 1;
      } else if (status === "dead") {
        next.lost += 1;
      } else if (status === "won") {
        if (r.last_status_change_at && r.last_status_change_at >= ninetyDaysAgo) {
          next.won += 1;
        }
      }
    }
    setCounts(next);
    setLoading(false);
  }, [tradeId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const totalLeads = counts.todo + counts.contacted + counts.quoted + counts.won;

  const header = (
    <div>
      <h2
        id="pipeline-heading"
        className="font-heading text-primary text-xl uppercase tracking-wider"
      >
        Your Pipeline
      </h2>
      <p className="font-mono text-xs text-muted-foreground mt-1">
        Leads you're working on
      </p>
    </div>
  );

  return (
    <section aria-labelledby="pipeline-heading" className="space-y-3">
      {header}

      {loading ? (
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          aria-label="Loading pipeline counts"
          aria-busy="true"
        >
          {CARD_DEFS.map((card) => (
            <div
              key={card.key}
              className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2"
            >
              <Skeleton className="h-9 w-12" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-sans text-sm text-foreground">
                Couldn't load your pipeline right now.
              </p>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                {error}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 bg-secondary text-white font-mono text-xs px-4 py-2 rounded-xl hover:bg-secondary/90 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      ) : totalLeads === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center space-y-3">
          <p className="font-heading text-primary text-base">No leads in your pipeline yet</p>
          <p className="font-sans text-sm text-muted-foreground max-w-md mx-auto">
            Save planning opportunities or submit quotes for matched jobs to start building your
            pipeline.
          </p>
          <button
            onClick={() => navigate("/planning-alerts")}
            className="inline-flex items-center gap-2 bg-secondary text-white font-mono text-xs px-4 py-2 rounded-xl hover:bg-secondary/90 transition-colors"
          >
            View Planning Intelligence
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CARD_DEFS.map((card) => {
            const value = counts[card.key];
            const isZero = value === 0;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() =>
                  navigate(
                    `/dashboard/trade?pipeline=${encodeURIComponent(card.key)}#planning-alerts-list`,
                  )
                }
                className={`text-left rounded-2xl border p-4 transition-all hover:shadow-sm hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring ${card.tone} ${
                  isZero ? "opacity-70" : ""
                }`}
                aria-label={`${value} ${card.label} leads. ${card.subtitle}. Click to filter.`}
              >
                <div
                  className={`font-heading text-3xl md:text-4xl leading-none ${
                    isZero ? "text-muted-foreground" : ""
                  }`}
                >
                  {value}
                </div>
                <div className="mt-2 font-mono text-[11px] uppercase tracking-wider">
                  {card.label}
                </div>
                <div className="mt-1 font-sans text-[11px] text-muted-foreground leading-snug">
                  {card.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default PipelineSection;
