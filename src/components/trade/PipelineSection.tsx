import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, ArrowRight, RefreshCw, GitBranch, X, MapPin, CalendarClock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ShortlistStatus } from "./ShortlistStatusControl";
import Workspace from "@/components/trade/Workspace";

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
  color: string;
  filter?: string;
}[] = [
  {
    key: "todo",
    label: "To Contact",
    subtitle: "Haven't reached out yet",
    color: "#94a3b8",
    filter: "todo",
  },
  {
    key: "contacted",
    label: "Waiting",
    subtitle: "Reached out, awaiting response",
    color: "#eab308",
    filter: "contacted",
  },
  {
    key: "planning_approved",
    label: "Planning Approved",
    subtitle: "Approved — ready to approach",
    color: "#a855f7",
  },
  {
    key: "site_visit",
    label: "Site Visit",
    subtitle: "Visit scheduled",
    color: "#14b8a6",
  },
  {
    key: "quoted",
    label: "Quoted",
    subtitle: "Quote submitted, pending decision",
    color: "#60a5fa",
    filter: "quoted",
  },
  {
    key: "won",
    label: "Won",
    subtitle: "Converted in last 90 days",
    color: "#34d399",
    filter: "won",
  },
];


interface StageRow {
  id: string;
  planning_alert_id: string | null;
  note: string | null;
  next_action_date: string | null;
  last_status_change_at: string | null;
  planning_alerts: {
    address: string | null;
    postcode: string | null;
    application_type: string | null;
    description: string | null;
    local_authority: string | null;
  } | null;
}

/** Stage key -> shortlist contact_status it maps to (null = no data source yet). */
const STAGE_STATUS: Partial<Record<keyof Counts, string>> = {
  todo: "todo",
  contacted: "contacted",
  quoted: "quoted",
  won: "won",
};

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
  const [openStage, setOpenStage] = useState<keyof Counts | null>(null);
  const [stageRows, setStageRows] = useState<StageRow[] | null>(null);
  const [stageLoading, setStageLoading] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

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

  const openStageDetail = useCallback(
    async (key: keyof Counts) => {
      if (openStage === key) {
        setOpenStage(null);
        return;
      }
      setOpenStage(key);
      setStageRows(null);
      setStageError(null);
      const status = STAGE_STATUS[key];
      if (!status) return;
      setStageLoading(true);
      const { data, error: rowsError } = await supabase
        .from("planning_alert_shortlist")
        .select(
          "id, planning_alert_id, note, next_action_date, last_status_change_at, planning_alerts(address, postcode, application_type, description, local_authority)",
        )
        .eq("trade_id", tradeId)
        .eq("contact_status", status as any)
        .order("last_status_change_at", { ascending: false });
      setStageLoading(false);
      if (rowsError) {
        setStageError(rowsError.message);
        return;
      }
      setStageRows((data ?? []) as unknown as StageRow[]);
    },
    [openStage, tradeId],
  );

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

  const totalLeads =
    counts.todo + counts.contacted + counts.quoted + counts.won + counts.lost;

  return (
    <Workspace
      icon={GitBranch}
      title="Pipeline"
      subtitle="Every lead, moving left to right toward won work."
      accent="orange"
      surface="1"
      texture="grid"
    >
      {loading ? (
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
          aria-label="Loading pipeline counts"
          aria-busy="true"
        >
          {CARD_DEFS.map((card) => (
            <div
              key={card.key}
              className="premium-card p-4 space-y-2"
            >
              <Skeleton className="h-9 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="premium-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-sans text-sm text-white">
                Couldn't load your pipeline right now.
              </p>
              <p className="font-mono text-xs text-white/55 mt-1">
                {error}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 bg-secondary text-white font-sans font-semibold text-sm px-4 min-h-[44px] rounded-xl hover:opacity-90 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : totalLeads === 0 ? (
        <div className="premium-card p-6 flex items-start gap-4">
          <span className="ws-accent-bg ws-accent-ring rounded-2xl w-11 h-11 flex items-center justify-center shrink-0">
            <GitBranch className="w-5 h-5 ws-accent-fg" strokeWidth={1.75} />
          </span>
          <div>
            <p className="font-sans font-semibold text-white text-base">Your pipeline is empty right now.</p>
            <p className="font-sans text-sm text-white/60 mt-1 max-w-md leading-relaxed">
              Save a planning opportunity or send a quote and it will start flowing through these
              stages automatically.
            </p>
            <button
              onClick={() => navigate("/planning-alerts")}
              className="mt-3 inline-flex items-center gap-2 bg-secondary text-white font-sans font-semibold text-sm px-4 min-h-[44px] rounded-xl hover:opacity-90 transition-colors"
            >
              View Planning Hub
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {CARD_DEFS.map((card, i) => {
            const value = counts[card.key];
            const isZero = value === 0;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => void openStageDetail(card.key)}
                className={`premium-card relative text-left p-4 focus:outline-none focus:ring-2 focus:ring-ring ${
                  openStage === card.key ? "ring-2 ring-ring" : ""
                } ${isZero ? "opacity-70" : ""}`}
                style={{ ["--ws-accent" as any]: "251 146 60" }}
                aria-expanded={openStage === card.key}
                aria-label={`${value} ${card.label} leads. ${card.subtitle}. Tap to see the leads in this stage.`}
              >
                {/* Animated connector to the next stage */}
                {i < CARD_DEFS.length - 1 && (
                  <span
                    className="hidden lg:block absolute top-1/2 -right-3 w-3 h-[2px] -translate-y-1/2"
                    style={{ background: `linear-gradient(90deg, ${card.color}, transparent)` }}
                    aria-hidden
                  />
                )}
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full animate-pin" style={{ backgroundColor: card.color }} />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-white/55">
                    Stage {i + 1}
                  </span>
                </div>
                <div
                  className="font-heading text-4xl leading-none mt-2 animate-count"
                  style={{ color: isZero ? "rgba(255,255,255,0.4)" : card.color }}
                >
                  {value}
                </div>
                <div className="mt-2 font-sans font-semibold text-sm text-white">
                  {card.label}
                </div>
                <div className="mt-1 font-sans text-[11px] text-white/50 leading-snug">
                  {card.subtitle}
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-wider ws-accent-fg">
                  {openStage === card.key ? "Hide leads" : "View leads"}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {openStage && (
        <div className="premium-card mt-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-sans font-semibold text-white">
                {CARD_DEFS.find((c) => c.key === openStage)?.label} —{" "}
                {counts[openStage]} {counts[openStage] === 1 ? "lead" : "leads"}
              </p>
              <p className="font-sans text-xs text-white/55 mt-1">
                {CARD_DEFS.find((c) => c.key === openStage)?.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpenStage(null)}
              aria-label="Close stage detail"
              className="text-white/60 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {!STAGE_STATUS[openStage] ? (
              <p className="font-sans text-sm text-white/60">
                This stage isn't tracked yet — leads move here once site visits and planning
                outcomes are recorded against a lead. Nothing to show for now.
              </p>
            ) : stageLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : stageError ? (
              <p role="alert" className="font-mono text-xs text-destructive">{stageError}</p>
            ) : !stageRows?.length ? (
              <p className="font-sans text-sm text-white/60">No leads sitting in this stage.</p>
            ) : (
              stageRows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      row.planning_alert_id
                        ? `/planning-alerts?alert=${row.planning_alert_id}`
                        : "/planning-alerts",
                    )
                  }
                  className="w-full text-left rounded-xl bg-white/5 hover:bg-white/10 transition-colors p-4"
                >
                  <p className="font-sans font-semibold text-sm text-white">
                    {row.planning_alerts?.address || row.planning_alerts?.application_type || "Lead"}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 font-mono text-[11px] text-white/55">
                    {row.planning_alerts?.postcode && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {row.planning_alerts.postcode}
                      </span>
                    )}
                    {row.next_action_date && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        Next action {row.next_action_date}
                      </span>
                    )}
                    {row.planning_alerts?.local_authority && (
                      <span>{row.planning_alerts.local_authority}</span>
                    )}
                  </div>
                  {row.note && (
                    <p className="font-sans text-xs text-white/60 mt-2 line-clamp-2">{row.note}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </Workspace>
  );
};


export default PipelineSection;
