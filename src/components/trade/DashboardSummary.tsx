import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CalendarDays,
  Clock,
  FileText,
  FolderKanban,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { computeVaultSummary, type VaultDocument } from "@/lib/tradeVault";
import { isContractedActiveJob } from "@/lib/activeProjects";
import { isTestRecord } from "@/lib/testData";


interface Props {
  tradeId: string;
  /** Opens a dashboard view (?view=…) — same routing the sidebar uses. */
  onOpenView: (view: string) => void;
}

interface SummaryData {
  pipelineActive: number;
  pipelineTodo: number;
  pipelineWaiting: number;
  quotesOutstanding: number;
  quotesValue: number;
  staleQuotes: { id: string; amount: number; days: number }[];
  newMatches: number;
  matchesValue: number;
  docsNeeded: number;
  docsLabel: string;
  nextDate: { date: string; label: string } | null;
  overdueFollowUps: number;
  activeProjects: number;
  activeProjectsValue: number;
}

const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);

const daysAgo = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const DashboardSummary = ({ tradeId, onOpenView }: Props) => {
  const navigate = useNavigate();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const todayIso = new Date().toISOString().slice(0, 10);

      const [shortlistRes, quotesRes, matchesRes, vaultRes, contractsRes, tradeRes] = await Promise.all([
        supabase
          .from("planning_alert_shortlist")
          .select("contact_status, next_action_date")
          .eq("trade_id", tradeId),
        supabase
          .from("quotes")
          .select("id, amount, status, created_at, is_test, jobs(is_test)")
          .eq("trade_id", tradeId)
          .eq("status", "pending"),

        supabase
          .from("job_matches")
          .select("id, status, interested_at, estimated_value, jobs(is_test)")
          .eq("trade_id", tradeId)
          .eq("status", "notified"),
        supabase.from("tradevault_documents").select("*").eq("trade_id", tradeId),
        supabase
          .from("contracts")
          .select("job_id, total_value_incl_vat_pence, total_value_excl_vat_pence")
          .eq("trade_id", tradeId),
        supabase.from("trades").select("trade_type").eq("id", tradeId).maybeSingle(),
      ]);

      const jobIds = (contractsRes.data || []).map((c: any) => c.job_id).filter(Boolean);
      const [stagesRes, jobsRes] = await Promise.all([
        jobIds.length
          ? supabase
              .from("project_stages")
              .select("stage_name, planned_start")
              .in("job_id", jobIds)
              .gte("planned_start", todayIso)
              .order("planned_start", { ascending: true })
              .limit(1)
          : { data: [] as any[] },
        jobIds.length
          ? supabase.from("jobs").select("id, stage").in("id", jobIds)
          : { data: [] as any[] },
      ]);

      if (cancelled) return;

      const shortlist = shortlistRes.data || [];
      const pipelineTodo = shortlist.filter((r: any) => r.contact_status === "todo").length;
      const pipelineWaiting = shortlist.filter((r: any) => r.contact_status === "contacted").length;
      const pipelineQuoted = shortlist.filter((r: any) => r.contact_status === "quoted").length;
      const overdueFollowUps = shortlist.filter(
        (r: any) => r.next_action_date && r.next_action_date <= todayIso,
      ).length;

      // Test/demo quotes are excluded from every aggregate on this dashboard.
      const quotes = (quotesRes.data || []).filter((q: any) => !isTestRecord(q));
      const quotesValue = quotes.reduce((s: number, q: any) => s + Number(q.amount || 0), 0);

      // Every live quote is surfaced from day 0; day 5+ escalates to a chase-up.
      const staleQuotes = quotes
        .map((q: any) => ({ id: q.id, amount: Number(q.amount || 0), days: daysAgo(q.created_at) }))
        .sort((a, b) => b.days - a.days);

      // Must match src/hooks/useNewJobMatches.tsx exactly: notified, non-test,
      // no interested_at. Otherwise the sidebar badge and this tile disagree.
      const matches = (matchesRes.data || []).filter((m: any) => !isTestRecord(m));
      const unactioned = matches.filter((m: any) => !m.interested_at);
      const matchesValue = unactioned.reduce(
        (s: number, m: any) => s + Number(m.estimated_value || 0),
        0,
      );

      const vault = computeVaultSummary((vaultRes.data as VaultDocument[]) || [], tradeRes.data?.trade_type);
      const docsNeeded = vault.missingRequired.length + vault.expiredRequiredDocs.length;

      const nextShortlist = shortlist
        .map((r: any) => r.next_action_date)
        .filter((d: string | null): d is string => !!d && d >= todayIso)
        .sort()[0];
      const nextStage = (stagesRes.data || [])[0] as any;

      let nextDate: SummaryData["nextDate"] = null;
      if (nextShortlist && (!nextStage || nextShortlist <= nextStage.planned_start)) {
        nextDate = { date: nextShortlist, label: "Lead follow-up due" };
      } else if (nextStage) {
        nextDate = { date: nextStage.planned_start, label: nextStage.stage_name || "Project stage" };
      }

      const contractsByJobId = new Map((contractsRes.data || []).map((c: any) => [c.job_id, c]));
      const activeProjectRows = (jobsRes.data || []).filter(isContractedActiveJob);
      const activeProjects = activeProjectRows.length;
      const activeProjectsValue = activeProjectRows.reduce((sum: number, job: any) => {
        const c = contractsByJobId.get(job.id);
        if (!c) return sum;
        const pence = c.total_value_incl_vat_pence ?? c.total_value_excl_vat_pence;
        return sum + (pence ? Number(pence) / 100 : 0);
      }, 0);

      setData({
        pipelineActive: pipelineTodo + pipelineWaiting + pipelineQuoted,
        pipelineTodo,
        pipelineWaiting,
        quotesOutstanding: quotes.length,
        quotesValue,
        staleQuotes,
        newMatches: unactioned.length,
        matchesValue,
        docsNeeded,
        docsLabel: `${vault.requiredUploaded} of ${vault.requiredTotal} required documents in place`,
        nextDate,
        overdueFollowUps,
        activeProjects,
        activeProjectsValue,
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tradeId]);

  if (loading || !data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 space-y-3"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  type Prompt = {
    key: string;
    icon: typeof FileText;
    tone: string;
    tag: string;
    headline: string;
    detail: string;
    metric?: string;
    cta: string;
    onClick: () => void;
  };

  const prompts: Prompt[] = [];
  const overdueQuotes = data.staleQuotes.filter((q) => q.days >= 5);

  data.staleQuotes.slice(0, 2).forEach((q) => {
    const overdue = q.days >= 5;
    prompts.push({
      key: `quote-${q.id}`,
      icon: FileText,
      tone: overdue ? "#FCD34D" : "#38BDF8",
      tag: overdue ? "Chase up" : "Awaiting decision",
      headline: overdue
        ? `${gbp(q.amount)} quote has gone quiet`
        : `${gbp(q.amount)} quote is with the homeowner`,
      detail: overdue
        ? `Sent ${q.days} days ago · no response yet`
        : q.days === 0
          ? "Sent today · awaiting their decision"
          : `Sent ${q.days} day${q.days === 1 ? "" : "s"} ago · awaiting their decision`,
      metric: `${q.days}d`,
      cta: "Open quotes",
      onClick: () => onOpenView("quotes"),
    });
  });
  if (data.overdueFollowUps > 0)
    prompts.push({
      key: "followups",
      icon: Clock,
      tone: "#FB923C",
      tag: "Due today",
      headline: `${data.overdueFollowUps} ${data.overdueFollowUps === 1 ? "lead is" : "leads are"} due a follow-up`,
      detail: "Scheduled follow-up date has arrived",
      metric: String(data.overdueFollowUps),
      cta: "Open pipeline",
      onClick: () => onOpenView("pipeline"),
    });
  if (data.newMatches > 0)
    prompts.push({
      key: "matches",
      icon: Search,
      tone: "#1AC2BA",
      tag: "New work",
      headline: `${data.newMatches} new job ${data.newMatches === 1 ? "match" : "matches"} awaiting action`,
      detail:
        data.matchesValue > 0
          ? `${gbp(data.matchesValue)} estimated value on the table`
          : "Respond before they go to another trade",
      metric: String(data.newMatches),
      cta: "View matches",
      onClick: () => onOpenView("jobs"),
    });
  if (data.pipelineTodo > 0)
    prompts.push({
      key: "tocontact",
      icon: FolderKanban,
      tone: "#8B5CF6",
      tag: "Not contacted",
      headline: `${data.pipelineTodo} saved ${data.pipelineTodo === 1 ? "lead has" : "leads have"} had no contact`,
      detail: "Sitting in your pipeline with no first call made",
      metric: String(data.pipelineTodo),
      cta: "Open pipeline",
      onClick: () => onOpenView("pipeline"),
    });
  if (data.docsNeeded > 0)
    prompts.push({
      key: "docs",
      icon: ShieldCheck,
      tone: "#3B82F6",
      tag: "Compliance",
      headline: `${data.docsNeeded} ${data.docsNeeded === 1 ? "document" : "documents"} missing or expired`,
      detail: data.docsLabel,
      metric: String(data.docsNeeded),
      cta: "Open TradeVault",
      onClick: () => onOpenView("tradevault"),
    });


  type Card = {
    key: string;
    label: string;
    icon: typeof FolderKanban;
    accent: string;
    value: string;
    unit: string;
    sub: string;
    cta: string;
    onClick: () => void;
    urgency: number;
    alert?: string;
    secondary?: { label: string; onClick: () => void };
  };

  const cards: Card[] = [
    {
      key: "pipeline",
      label: "Pipeline",
      icon: FolderKanban,
      accent: "#8B5CF6",
      value: String(data.pipelineActive),
      unit: data.pipelineActive === 1 ? "active lead" : "active leads",
      sub: `${data.pipelineTodo} to contact · ${data.pipelineWaiting} waiting`,
      cta: "Open Pipeline",
      onClick: () => onOpenView("pipeline"),
      urgency: data.overdueFollowUps > 0 ? 3 : data.pipelineTodo > 0 ? 2 : 0,
      alert:
        data.overdueFollowUps > 0
          ? `${data.overdueFollowUps} follow-up${data.overdueFollowUps === 1 ? "" : "s"} due`
          : data.pipelineTodo > 0
            ? `${data.pipelineTodo} not contacted yet`
            : undefined,
    },
    {
      key: "quotes",
      label: "Quotes",
      icon: FileText,
      accent: "#F59E0B",
      value: String(data.quotesOutstanding),
      unit: data.quotesOutstanding === 1 ? "outstanding quote" : "outstanding quotes",
      sub: data.quotesOutstanding > 0 ? `${gbp(data.quotesValue)} awaiting decision` : "No quotes awaiting a decision",
      cta: "Open Quote Builder",
      onClick: () => navigate("/quote-builder/quickbuild"),
      secondary: { label: "View quotes", onClick: () => onOpenView("quotes") },
      urgency: overdueQuotes.length > 0 ? 3 : data.staleQuotes.length > 0 ? 1 : 0,
      alert:
        overdueQuotes.length > 0
          ? `${overdueQuotes.length} chase-up${overdueQuotes.length === 1 ? "" : "s"} overdue`
          : undefined,
    },
    {
      key: "find-work",
      label: "Find Work",
      icon: Search,
      accent: "#1AC2BA",
      value: String(data.newMatches),
      unit: data.newMatches === 1 ? "new match" : "new matches",
      sub:
        data.matchesValue > 0
          ? `${gbp(data.matchesValue)} estimated value`
          : data.newMatches > 0
            ? "Awaiting your response"
            : "No unactioned matches",
      cta: "Open Find Work",
      onClick: () => navigate("/planning-alerts"),
      urgency: data.newMatches > 0 ? 2 : 0,
      alert: data.newMatches > 0 ? "Awaiting your response" : undefined,
    },
    {
      key: "tradevault",
      label: "TradeVault",
      icon: ShieldCheck,
      accent: "#3B82F6",
      value: String(data.docsNeeded),
      unit: data.docsNeeded === 1 ? "document needed" : "documents needed",
      sub: data.docsLabel,
      cta: "Open TradeVault",
      onClick: () => onOpenView("tradevault"),
      urgency: data.docsNeeded > 0 ? 3 : 0,
      alert: data.docsNeeded > 0 ? "Missing or expired documents" : undefined,
    },
    {
      key: "projects",
      label: "Projects",
      icon: Briefcase,
      accent: "#22C55E",
      value: String(data.activeProjects),
      unit: data.activeProjects === 1 ? "active project" : "active projects",
      sub:
        data.activeProjectsValue > 0
          ? `${gbp(data.activeProjectsValue)} contracted value`
          : "No active projects yet",
      cta: "Open Projects",
      onClick: () => onOpenView("projects"),
      urgency: data.activeProjects > 0 ? 1 : 0,
    },
    {
      key: "calendar",
      label: "Calendar",
      icon: CalendarDays,
      accent: "#94A3B8",
      value: data.nextDate ? formatDate(data.nextDate.date) : "—",
      unit: data.nextDate ? "next date" : "nothing scheduled",
      sub: data.nextDate ? data.nextDate.label : "No upcoming dates or deadlines",
      cta: "Open Calendar",
      onClick: () => onOpenView("calendar"),
      urgency: 0,
    },
  ].sort((a, b) => b.urgency - a.urgency);


  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="font-heading text-primary text-2xl">What needs doing today</h2>
          {prompts.length > 0 && (
            <span className="font-mono text-[11px] uppercase tracking-widest text-primary-foreground/50">
              {prompts.length} {prompts.length === 1 ? "action" : "actions"} · top priority first
            </span>
          )}
        </div>
        {prompts.length === 0 ? (
          <div
            className="rounded-2xl px-5 py-6 text-center"
            style={{ backgroundColor: "rgba(26,194,186,0.06)", border: "1px solid rgba(26,194,186,0.25)" }}
          >
            <p className="font-heading text-lg" style={{ color: "#1AC2BA" }}>
              You're all clear
            </p>
            <p className="mt-1 font-mono text-xs text-primary-foreground/60">
              No unactioned matches, quotes or documents right now.
            </p>
          </div>
        ) : (
          <ol className="space-y-2">
            {prompts.slice(0, 5).map((p, i) => (
              <li key={p.key}>
                <button
                  onClick={p.onClick}
                  className="group w-full text-left rounded-2xl px-4 py-4 flex items-center gap-4 transition-all hover:translate-x-[2px]"
                  style={{
                    backgroundColor: i === 0 ? `${p.tone}12` : "rgba(255,255,255,0.035)",
                    border: `1px solid ${i === 0 ? `${p.tone}59` : "rgba(255,255,255,0.08)"}`,
                    borderLeft: `4px solid ${p.tone}`,
                  }}
                >
                  <span
                    className="relative flex items-center justify-center rounded-xl w-11 h-11 shrink-0"
                    style={{ backgroundColor: `${p.tone}1F` }}
                  >
                    <p.icon className="w-5 h-5" style={{ color: p.tone }} strokeWidth={1.75} />
                    <span
                      className="absolute -top-1.5 -left-1.5 flex items-center justify-center rounded-full w-5 h-5 font-mono text-[10px]"
                      style={{ backgroundColor: p.tone, color: "#0B1B2B" }}
                    >
                      {i + 1}
                    </span>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className="inline-block font-mono text-[10px] uppercase tracking-widest"
                      style={{ color: p.tone }}
                    >
                      {p.tag}
                    </span>
                    <span className="block font-heading text-base leading-snug text-primary-foreground">
                      {p.headline}
                    </span>
                    <span className="block font-mono text-xs text-primary-foreground/55 leading-snug mt-0.5">
                      {p.detail}
                    </span>
                  </span>

                  {p.metric && (
                    <span
                      className="hidden sm:block font-heading text-2xl leading-none shrink-0"
                      style={{ color: p.tone }}
                    >
                      {p.metric}
                    </span>
                  )}

                  <span
                    className="inline-flex items-center gap-1 font-mono text-xs shrink-0"
                    style={{ color: p.tone }}
                  >
                    <span className="hidden md:inline">{p.cta}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}

      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const urgent = card.urgency >= 3;
          const attention = card.urgency === 2;
          const tone = urgent ? "#FCD34D" : attention ? card.accent : card.accent;
          return (
          <div
            key={card.key}
            className="rounded-2xl p-5 flex flex-col justify-between"
            style={{
              backgroundColor: urgent
                ? "rgba(252,211,77,0.07)"
                : `${card.accent}0F`,
              border: `1px solid ${urgent ? "rgba(252,211,77,0.35)" : `${card.accent}3D`}`,
              borderLeft: `4px solid ${urgent ? "#FCD34D" : card.accent}`,
              boxShadow: urgent
                ? "0 8px 24px -12px rgba(252,211,77,0.45)"
                : `0 8px 22px -16px ${card.accent}`,
            }}
          >

            <div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center rounded-lg w-7 h-7"
                  style={{ backgroundColor: `${tone}2E`, border: `1px solid ${tone}59` }}
                >
                  <card.icon className="w-4 h-4" style={{ color: tone }} />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: tone }}>
                  {card.label}
                </span>

                {card.alert && (
                  <span
                    className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px]"
                    style={{
                      backgroundColor: urgent ? "rgba(252,211,77,0.18)" : `${card.accent}1F`,
                      color: urgent ? "#FCD34D" : card.accent,
                    }}
                  >
                    {urgent && <AlertCircle className="w-3 h-3" />}
                    {card.alert}
                  </span>
                )}
              </div>
              <div
                className="mt-3 font-heading text-4xl leading-none"
                style={{ color: urgent ? "#FCD34D" : card.urgency === 0 ? "hsl(var(--primary-foreground))" : card.accent }}
              >
                {card.value}
              </div>
              <div className="mt-1 font-mono text-xs text-primary-foreground/70">{card.unit}</div>
              <div className="mt-2 font-mono text-xs text-primary-foreground/50 leading-snug">
                {card.sub}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <button
                onClick={card.onClick}
                className="inline-flex items-center gap-1 font-mono text-xs px-3 py-2 rounded-xl transition-opacity hover:opacity-90"
                style={
                  urgent
                    ? { backgroundColor: "#FCD34D", color: "#1A1A1A" }
                    : card.urgency === 0
                      ? {
                          backgroundColor: `${card.accent}1F`,
                          color: card.accent,
                          border: `1px solid ${card.accent}59`,
                        }
                      : { backgroundColor: `${card.accent}E6`, color: "#FFFFFF" }
                }
              >

                {card.cta}
                <ArrowRight className="w-3 h-3" />
              </button>
              {card.secondary && (
                <button
                  onClick={card.secondary.onClick}
                  className="font-mono text-xs hover:underline"
                  style={{ color: card.accent }}
                >
                  {card.secondary.label}
                </button>
              )}
            </div>
          </div>
          );
        })}

      </section>
    </div>
  );
};

export default DashboardSummary;
