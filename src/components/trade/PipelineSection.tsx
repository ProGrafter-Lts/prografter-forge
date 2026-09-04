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
    label: "Project Value",
    subtitle: "Contracted work under way",
    color: "#34d399",
  },
];

interface ContractedProject {
  jobId: string;
  title: string;
  postcode: string | null;
  stage: string | null;
  value: number | null;
}

const formatGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);


interface StageRow {
  id: string;
  planning_alert_id: string | null;
  note: string | null;
  next_action_date: string | null;
  last_status_change_at: string | null;
  contact_status?: string;
  planning_alerts: {
    address: string | null;
    postcode: string | null;
    application_type: string | null;
    description: string | null;
    local_authority: string | null;
    approved_date?: string | null;
  } | null;
}

const SELECT_COLS =
  "id, planning_alert_id, note, next_action_date, last_status_change_at, contact_status, planning_alerts(address, postcode, application_type, description, local_authority, approved_date)";

/**
 * Derive which pipeline stage a shortlist row sits in.
 * Site Visit and Planning Approved are derived from real lead data:
 *  - Site Visit: an open lead with a scheduled next action date.
 *  - Planning Approved: an open lead whose planning application has an approved date.
 */
const stageForRow = (row: StageRow): keyof Counts | null => {
  const status = row.contact_status;
  if (status === "won") return "won";
  if (status === "dead") return "lost";
  if (status === "quoted") return "quoted";
  const open = status === "todo" || status === "contacted";
  if (!open) return null;
  if (row.next_action_date) return "site_visit";
  if (row.planning_alerts?.approved_date) return "planning_approved";
  return status as keyof Counts;
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
  const [rowsByStage, setRowsByStage] = useState<Partial<Record<keyof Counts, StageRow[]>>>({});
  const [stageError, setStageError] = useState<string | null>(null);
  const [contracted, setContracted] = useState<ContractedProject[]>([]);

  /**
   * The final pipeline stage tracks REAL contracted work, not lead outreach
   * statuses. It uses the same source of truth as the Projects view:
   * the active_projects_for_user RPC + contract values from `contracts`.
   */
  const loadContracted = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) {
      setContracted([]);
      return;
    }
    const { data, error: rpcError } = await supabase.rpc("active_projects_for_user", {
      _user_id: userId,
    });
    if (rpcError) {
      console.error("Failed to load contracted projects", rpcError);
      setContracted([]);
      return;
    }
    const rows = ((data || []) as any[]).filter(
      (r) => r.role === "trade" && r.trade_id === tradeId && r.contract_id,
    );
    const byJob = new Map<string, ContractedProject>();
    const contractIds: string[] = [];
    rows.forEach((r) => {
      if (byJob.has(r.id)) return;
      contractIds.push(r.contract_id);
      byJob.set(r.id, {
        jobId: r.id,
        title: r.title || r.job_type || "Project",
        postcode: r.postcode ?? null,
        stage: r.stage ?? null,
        value: null,
      });
    });
    if (contractIds.length) {
      const { data: contracts } = await supabase
        .from("contracts")
        .select("id, job_id, total_value_incl_vat_pence, total_value_excl_vat_pence")
        .in("id", contractIds);
      (contracts || []).forEach((c: any) => {
        const p = byJob.get(c.job_id);
        if (!p) return;
        const pence = c.total_value_incl_vat_pence ?? c.total_value_excl_vat_pence;
        if (pence != null) p.value = Number(pence) / 100;
      });
    }
    setContracted(Array.from(byJob.values()));
  }, [tradeId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    void loadContracted();


    // Race the query against a 6s timeout so the section never hangs.
    const queryPromise = supabase
      .from("planning_alert_shortlist")
      .select(SELECT_COLS)
      .eq("trade_id", tradeId)
      .order("last_status_change_at", { ascending: false });

    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
      window.setTimeout(
        () => resolve({ data: null, error: { message: "Pipeline lookup timed out" } }),
        6000,
      ),
    );

    const { data, error: queryError } = (await Promise.race([
      queryPromise,
      timeoutPromise,
    ])) as { data: StageRow[] | null; error: { message: string } | null };

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
    const byStage: Partial<Record<keyof Counts, StageRow[]>> = {};
    for (const r of (data ?? []) as StageRow[]) {
      const stage = stageForRow(r);
      if (!stage) continue;
      // Lead outreach statuses never populate the final stage — that stage
      // is driven by signed contracts only.
      if (stage === "won") continue;
      next[stage] += 1;
      (byStage[stage] ||= []).push(r);
    }
    setCounts(next);
    setRowsByStage(byStage);
    setLoading(false);
  }, [tradeId, loadContracted]);

  const openStageDetail = useCallback(
    (key: keyof Counts) => {
      if (openStage === key) {
        setOpenStage(null);
        return;
      }
      setOpenStage(key);
      setStageError(null);
      setStageRows(rowsByStage[key] ?? []);
    },
    [openStage, rowsByStage],
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
    counts.todo +
    counts.contacted +
    counts.planning_approved +
    counts.site_visit +
    counts.quoted +
    counts.won +
    counts.lost;

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
            {stageLoading ? (
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
