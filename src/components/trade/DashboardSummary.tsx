import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  FileText,
  FolderKanban,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { computeVaultSummary, type VaultDocument } from "@/lib/tradeVault";

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

      const [shortlistRes, quotesRes, matchesRes, vaultRes, contractsRes] = await Promise.all([
        supabase
          .from("planning_alert_shortlist")
          .select("contact_status, next_action_date")
          .eq("trade_id", tradeId),
        supabase
          .from("quotes")
          .select("id, amount, status, created_at")
          .eq("trade_id", tradeId)
          .eq("status", "pending"),
        supabase
          .from("job_matches")
          .select("id, status, interested_at, estimated_value")
          .eq("trade_id", tradeId)
          .eq("status", "notified"),
        supabase.from("tradevault_documents").select("*").eq("trade_id", tradeId),
        supabase.from("contracts").select("job_id").eq("trade_id", tradeId),
      ]);

      const jobIds = (contractsRes.data || []).map((c: any) => c.job_id).filter(Boolean);
      const stagesRes = jobIds.length
        ? await supabase
            .from("project_stages")
            .select("stage_name, planned_start")
            .in("job_id", jobIds)
            .gte("planned_start", todayIso)
            .order("planned_start", { ascending: true })
            .limit(1)
        : { data: [] as any[] };

      if (cancelled) return;

      const shortlist = shortlistRes.data || [];
      const pipelineTodo = shortlist.filter((r: any) => r.contact_status === "todo").length;
      const pipelineWaiting = shortlist.filter((r: any) => r.contact_status === "contacted").length;
      const pipelineQuoted = shortlist.filter((r: any) => r.contact_status === "quoted").length;
      const overdueFollowUps = shortlist.filter(
        (r: any) => r.next_action_date && r.next_action_date <= todayIso,
      ).length;

      const quotes = quotesRes.data || [];
      const quotesValue = quotes.reduce((s: number, q: any) => s + Number(q.amount || 0), 0);
      const staleQuotes = quotes
        .map((q: any) => ({ id: q.id, amount: Number(q.amount || 0), days: daysAgo(q.created_at) }))
        .filter((q) => q.days >= 5)
        .sort((a, b) => b.days - a.days);

      const matches = matchesRes.data || [];
      const unactioned = matches.filter((m: any) => !m.interested_at);
      const matchesValue = unactioned.reduce(
        (s: number, m: any) => s + Number(m.estimated_value || 0),
        0,
      );

      const vault = computeVaultSummary((vaultRes.data as VaultDocument[]) || []);
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

  const prompts: { key: string; text: string; cta: string; onClick: () => void }[] = [];

  data.staleQuotes.slice(0, 2).forEach((q) =>
    prompts.push({
      key: `quote-${q.id}`,
      text: `Follow up: ${gbp(q.amount)} quote sent ${q.days} days ago, no response`,
      cta: "Open quotes",
      onClick: () => onOpenView("quotes"),
    }),
  );
  if (data.newMatches > 0)
    prompts.push({
      key: "matches",
      text: `${data.newMatches} new job ${data.newMatches === 1 ? "match" : "matches"} awaiting action`,
      cta: "View matches",
      onClick: () => onOpenView("jobs"),
    });
  if (data.overdueFollowUps > 0)
    prompts.push({
      key: "followups",
      text: `${data.overdueFollowUps} pipeline ${data.overdueFollowUps === 1 ? "lead is" : "leads are"} due a follow-up today`,
      cta: "Open pipeline",
      onClick: () => onOpenView("pipeline"),
    });
  if (data.pipelineTodo > 0)
    prompts.push({
      key: "tocontact",
      text: `${data.pipelineTodo} saved ${data.pipelineTodo === 1 ? "lead has" : "leads have"} not been contacted yet`,
      cta: "Open pipeline",
      onClick: () => onOpenView("pipeline"),
    });
  if (data.docsNeeded > 0)
    prompts.push({
      key: "docs",
      text: `${data.docsNeeded} ${data.docsNeeded === 1 ? "document" : "documents"} missing or expired in TradeVault`,
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
      urgency: data.staleQuotes.length > 0 ? 3 : 0,
      alert:
        data.staleQuotes.length > 0
          ? `${data.staleQuotes.length} chase-up${data.staleQuotes.length === 1 ? "" : "s"} overdue`
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
        <h2 className="font-heading text-primary text-2xl">What needs doing today</h2>
        {prompts.length === 0 ? (
          <p className="font-mono text-sm text-muted-foreground">
            Nothing overdue — no unactioned matches, quotes or documents right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {prompts.slice(0, 5).map((p) => (
              <li
                key={p.key}
                className="flex items-center justify-between gap-3 flex-wrap rounded-xl px-4 py-3"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="flex items-start gap-2 font-mono text-sm text-primary-foreground/85">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#FCD34D" }} />
                  {p.text}
                </span>
                <button
                  onClick={p.onClick}
                  className="inline-flex items-center gap-1 font-mono text-xs hover:underline"
                  style={{ color: "#1AC2BA" }}
                >
                  {p.cta}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.key}
            className="rounded-2xl p-5 flex flex-col justify-between"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div>
              <div className="flex items-center gap-2">
                <card.icon className="w-4 h-4" style={{ color: "#1AC2BA" }} />
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary-foreground/60">
                  {card.label}
                </span>
              </div>
              <div className="mt-3 font-heading text-4xl leading-none text-primary-foreground">
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
                style={{ backgroundColor: "rgba(13,148,136,0.9)", color: "#FFFFFF" }}
              >
                {card.cta}
                <ArrowRight className="w-3 h-3" />
              </button>
              {"secondary" in card && card.secondary && (
                <button
                  onClick={card.secondary.onClick}
                  className="font-mono text-xs hover:underline"
                  style={{ color: "#1AC2BA" }}
                >
                  {card.secondary.label}
                </button>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default DashboardSummary;
