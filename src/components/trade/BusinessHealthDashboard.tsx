import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  Compass,
  FileText,
  FolderKanban,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCircle,
  Activity,
} from "lucide-react";
import { computeProfileStrength } from "@/lib/tradeProfileStrength";
import type { VaultDocument } from "@/lib/tradeVault";
import { computeVaultSummary } from "@/lib/tradeVault";
import {
  buildSummarySentence,
  computeBoosters,
  computeBusinessHealth,
  computeTasks,
  formatMoney,
  toneForScore,
  TONE_HEX,
  type BusinessHealth,
  type BusinessHealthInput,
  type PriorityNav,
} from "@/lib/businessHealth";

interface Props {
  tradeId: string;
  name?: string;
  tradeType?: string | null;
  verificationStatus?: string | null;
  quotes: any[];
  matches: any[];
  activeProjectsCount: number;
  wonJobs: number;
  marginData: { totalQuoted: number; totalCosts: number; totalReceived: number };
  onNavigate: (target: PriorityNav) => void;
}

const calendarConnected = (tradeId: string) =>
  typeof window !== "undefined" &&
  window.localStorage.getItem(`pg-cal-connected-${tradeId}`) === "1";

const DOT_HEX: Record<string, string> = { red: "#EF4444", orange: "#F59E0B", green: "#14A8A1" };
const TEAL = "#14A8A1";

const cardStyle = {
  backgroundColor: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

interface FindWork {
  total: number;
  matching: number;
  highPriority: number;
  rows: { id: string; type: string; location: string; distance: number | null }[];
}

interface PipelineStages {
  new: number;
  waiting: number;
  siteVisits: number;
  quotes: number;
  won: number;
  lost: number;
}

interface ActivityEvent {
  label: string;
  when: number;
  dot: string;
}

const statusLabel = (score: number) =>
  score >= 80 ? "Excellent" : score >= 55 ? "Good" : "Needs Attention";

const money = (n: number) =>
  n >= 1000 ? `£${(Math.round(n / 100) / 10).toLocaleString()}k`.replace(".0k", "k") : `£${Math.round(n).toLocaleString()}`;

const BusinessHealthDashboard = ({
  tradeId,
  name,
  tradeType,
  verificationStatus,
  quotes,
  matches,
  activeProjectsCount,
  wonJobs,
  marginData,
  onNavigate,
}: Props) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<BusinessHealth | null>(null);
  const [input, setInput] = useState<BusinessHealthInput | null>(null);
  const [allQuotes, setAllQuotes] = useState<any[]>([]);
  const [findWork, setFindWork] = useState<FindWork>({ total: 0, matching: 0, highPriority: 0, rows: [] });
  const [stages, setStages] = useState<PipelineStages>({ new: 0, waiting: 0, siteVisits: 0, quotes: 0, won: 0, lost: 0 });
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      const tradeRes = await supabase
        .from("trades")
        .select(
          "id, name, bio, phone, postcode, trade_type, service_radius_miles, public_liability_insurer, insurance_cert_url, business_logo_path, verified, verification_status, gas_safe_number, mcs_number, trustmark_number, cps_registration_number, pas_2030_accredited, fgas_registered, ozev_approved, ciga_registered, inca_certified",
        )
        .eq("id", tradeId)
        .maybeSingle();

      const [vaultRes, specRes, portfolioRes, quotesRes, alertsRes, shortlistRes] = await Promise.all([
        supabase.from("tradevault_documents").select("*").eq("trade_id", tradeId),
        supabase
          .from("trade_specialisms" as any)
          .select("specialism_id", { count: "exact", head: true })
          .eq("trade_id", tradeId),
        supabase
          .from("trade_portfolio_items" as any)
          .select("id", { count: "exact", head: true })
          .eq("trade_id", tradeId),
        supabase.from("quotes").select("id, amount, status, created_at").eq("trade_id", tradeId),
        supabase
          .from("planning_alerts")
          .select("id, application_type, address, postcode, distance_miles, viewed, actioned, created_at")
          .eq("trade_id", tradeId)
          .order("created_at", { ascending: false })
          .limit(60),
        supabase
          .from("planning_alert_shortlist")
          .select("contact_status, last_status_change_at")
          .eq("trade_id", tradeId),
      ]);

      if (cancelled) return;

      const t = tradeRes.data as any;
      if (!t) {
        setLoading(false);
        return;
      }

      const vaultDocs = (vaultRes.data as VaultDocument[]) ?? [];
      const specialismCount = specRes.count ?? 0;
      const portfolioCount = portfolioRes.count ?? 0;
      const quoteRows = (quotesRes.data as any[]) ?? [];
      setAllQuotes(quoteRows);

      // ── Find Work summary ──────────────────────────────────────────────
      const alerts = (alertsRes.data as any[]) ?? [];
      const radius = t.service_radius_miles ?? null;
      const withinRadius = (a: any) =>
        radius == null || a.distance_miles == null || a.distance_miles <= radius;
      const matching = alerts.filter(withinRadius);
      const highPriority = matching.filter(
        (a) => !a.viewed && (a.distance_miles == null || a.distance_miles <= 10),
      );
      setFindWork({
        total: alerts.length,
        matching: matching.length,
        highPriority: highPriority.length,
        rows: matching.slice(0, 3).map((a) => ({
          id: a.id,
          type: a.application_type || "Planning application",
          location: a.postcode || a.address || "—",
          distance: a.distance_miles,
        })),
      });

      // ── Pipeline stage counts ──────────────────────────────────────────
      const shortlist = (shortlistRes.data as any[]) ?? [];
      const count = (s: string) => shortlist.filter((r) => r.contact_status === s).length;
      setStages({
        new: count("todo"),
        waiting: count("contacted"),
        siteVisits: 0,
        quotes: count("quoted"),
        won: count("won"),
        lost: count("dead"),
      });

      const hasQualification =
        !!t.gas_safe_number ||
        !!t.mcs_number ||
        !!t.trustmark_number ||
        !!t.cps_registration_number ||
        t.pas_2030_accredited ||
        t.fgas_registered ||
        t.ozev_approved ||
        t.ciga_registered ||
        t.inca_certified;
      const calConnected = calendarConnected(tradeId);

      const ps = computeProfileStrength({
        bio: t.bio,
        phone: t.phone,
        postcode: t.postcode,
        trade_type: t.trade_type,
        name: t.name,
        service_radius_miles: t.service_radius_miles,
        public_liability_insurer: t.public_liability_insurer,
        insurance_cert_url: t.insurance_cert_url,
        business_logo_path: t.business_logo_path,
        verified: t.verified,
        hasQualification,
        specialismCount,
        portfolioCount,
        calendarConnected: calConnected,
        vaultDocs,
      });

      const won = quoteRows.filter((q) => q.status === "accepted" || q.status === "won").length || wonJobs;
      const lost = quoteRows.filter((q) => q.status === "declined" || q.status === "lost" || q.status === "rejected").length;
      const pending = quoteRows.filter((q) => q.status === "pending").length;
      const totalValue = quoteRows.reduce((s, q) => s + Number(q.amount || 0), 0) || marginData.totalQuoted;

      const buildInput: BusinessHealthInput = {
        pipeline: {
          toContact: count("todo"),
          waiting: count("contacted"),
          quotesSubmitted: quoteRows.length,
          activeProjects: activeProjectsCount,
          wonJobs: won,
        },
        quotes: { submitted: quoteRows.length, won, lost, pending, totalValue },
        vaultDocs,
        profileStrength: ps,
        availability: {
          serviceRadiusMiles: t.service_radius_miles,
          calendarConnected: calConnected,
          activeProjects: activeProjectsCount,
        },
        calendarConnected: calConnected,
        messages: { unread: 0, openConversations: 0, responseRate: null },
        verificationStatus: t.verification_status ?? verificationStatus ?? null,
      };

      // ── Recent Activity (latest 5 real events) ─────────────────────────
      const events: ActivityEvent[] = [];
      quoteRows
        .filter((q) => q.created_at)
        .forEach((q) => {
          const positive = q.status === "accepted" || q.status === "won";
          events.push({
            label: positive
              ? `Quote won — ${money(Number(q.amount || 0))}`
              : `Quote sent — ${money(Number(q.amount || 0))}`,
            when: new Date(q.created_at).getTime(),
            dot: positive ? "green" : "orange",
          });
        });
      shortlist
        .filter((r) => r.last_status_change_at)
        .forEach((r) => {
          events.push({
            label:
              r.contact_status === "won"
                ? "Opportunity marked won"
                : r.contact_status === "contacted"
                ? "Homeowner contacted"
                : r.contact_status === "quoted"
                ? "Opportunity quoted"
                : "Pipeline stage updated",
            when: new Date(r.last_status_change_at).getTime(),
            dot: r.contact_status === "won" ? "green" : "orange",
          });
        });
      vaultDocs
        .filter((d: any) => d.file_url && d.updated_at)
        .forEach((d: any) => {
          events.push({
            label: "TradeVault document uploaded",
            when: new Date(d.updated_at).getTime(),
            dot: "green",
          });
        });
      setActivity(events.sort((a, b) => b.when - a.when).slice(0, 5));

      setInput(buildInput);
      setHealth(computeBusinessHealth(buildInput));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tradeId]);

  if (loading || !health || !input) {
    return (
      <div className="min-h-[30vh] flex items-center justify-center font-mono text-sm text-muted-foreground">
        Reading your business pulse…
      </div>
    );
  }

  const tasks = computeTasks(input);
  const boosters = computeBoosters(input);
  const summary = buildSummarySentence(health, input);
  const toneHex = TONE_HEX[health.tone];

  const vault = computeVaultSummary(input.vaultDocs);
  const pendingAmount = allQuotes
    .filter((q) => q.status === "pending")
    .reduce((s, q) => s + Number(q.amount || 0), 0);
  const avgQuote = input.quotes.submitted ? input.quotes.totalValue / input.quotes.submitted : 0;
  const profileImprovements = input.profileStrength.items.filter((i) => i.state !== "complete").length;
  const vaultPercent =
    vault.requiredTotal > 0 ? Math.round((vault.requiredUploaded / vault.requiredTotal) * 100) : 100;

  // ── Business Snapshot cards ──────────────────────────────────────────
  const snapshot = [
    {
      key: "pipeline-value",
      icon: Briefcase,
      title: "Pipeline Value",
      metric: money(input.quotes.totalValue),
      sub: `Across ${input.quotes.submitted + stages.new + stages.waiting} active opportunit${input.quotes.submitted + stages.new + stages.waiting === 1 ? "y" : "ies"}`,
      target: "pipeline" as PriorityNav,
    },
    {
      key: "quotes-out",
      icon: FileText,
      title: "Quotes Outstanding",
      metric: String(input.quotes.pending),
      sub: input.quotes.pending > 0 ? `${money(pendingAmount)} awaiting decisions` : "No quotes awaiting a decision",
      target: "quotes" as PriorityNav,
    },
    {
      key: "workload",
      icon: FolderKanban,
      title: "Current Workload",
      metric: `${activeProjectsCount} job${activeProjectsCount === 1 ? "" : "s"}`,
      sub: activeProjectsCount > 0 ? "Based on confirmed jobs" : "No confirmed jobs yet",
      target: "pipeline" as PriorityNav,
    },
    {
      key: "profile",
      icon: UserCircle,
      title: "Profile Strength",
      metric: `${input.profileStrength.percent}%`,
      sub: profileImprovements > 0 ? `${profileImprovements} improvement${profileImprovements === 1 ? "" : "s"} available` : "Profile complete",
      target: "profile" as PriorityNav,
    },
  ];

  const quickActions: {
    label: string;
    icon: typeof Search;
    target?: PriorityNav;
    href?: string;
  }[] = [
    { label: "Find Work", icon: Search, target: "find-work" },
    { label: "Create Quote", icon: Plus, href: "/quote-builder/quickbuild" },
    { label: "Open Pipeline", icon: FolderKanban, target: "pipeline" },
    { label: "Calendar", icon: CalendarDays, target: "calendar" },
    { label: "TradeVault", icon: ShieldCheck, target: "tradevault" },
  ];

  const pipelineStages = [
    { label: "New", value: stages.new },
    { label: "Waiting", value: stages.waiting },
    { label: "Site Visits", value: stages.siteVisits },
    { label: "Quotes", value: stages.quotes },
    { label: "Won", value: stages.won },
    { label: "Lost", value: stages.lost },
  ];

  const timeAgo = (ms: number) => {
    const d = Math.floor((Date.now() - ms) / 86400000);
    if (d <= 0) return "Today";
    if (d === 1) return "Yesterday";
    if (d < 7) return `${d}d ago`;
    return `${Math.floor(d / 7)}w ago`;
  };

  const SectionButton = ({ label, target }: { label: string; target: PriorityNav }) => (
    <button
      onClick={() => onNavigate(target)}
      className="inline-flex items-center gap-1.5 font-mono text-xs px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
      style={{ backgroundColor: "rgba(20,168,161,0.15)", color: TEAL }}
    >
      {label}
      <ArrowRight className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <div className="space-y-8">
      {/* 1. BUSINESS PULSE */}
      <section className="rounded-2xl p-6 md:p-8" style={cardStyle}>
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
          <div className="shrink-0 flex flex-col items-center">
            <ScoreRing value={health.overall} color={toneHex} />
          </div>
          <div className="flex-1 space-y-3">
            <p className="font-mono text-xs uppercase tracking-widest text-secondary">Business Pulse</p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="font-heading text-primary text-3xl md:text-4xl leading-tight">
                {health.overall} / 100
              </h1>
              <span
                className="font-mono text-xs uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ color: toneHex, backgroundColor: `${toneHex}1A` }}
              >
                {statusLabel(health.overall)}
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground font-body max-w-2xl">
              <Sparkles className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <p>{summary}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TODAY'S PRIORITIES */}
      {tasks.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-heading text-primary text-2xl">Today's Priorities</h2>
          <div className="rounded-xl overflow-hidden" style={cardStyle}>
            {tasks.map((task, i) => (
              <button
                key={i}
                onClick={() => onNavigate(task.target)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: DOT_HEX[task.dot] }} />
                <span className="font-body text-sm text-primary flex-1">{task.label}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 3. QUICK ACTIONS */}
      <section className="space-y-4">
        <h2 className="font-heading text-primary text-2xl">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={() => (a.href ? navigate(a.href) : onNavigate(a.target!))}
                className="flex flex-col items-center justify-center gap-2 rounded-xl py-5 px-3 transition-colors hover:bg-white/5"
                style={cardStyle}
              >
                <Icon className="w-5 h-5 text-secondary" />
                <span className="font-mono text-xs text-primary text-center">{a.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. BUSINESS SNAPSHOT */}
      <section className="space-y-4">
        <h2 className="font-heading text-primary text-2xl">Business Snapshot</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {snapshot.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                onClick={() => onNavigate(c.target)}
                className="rounded-xl p-5 text-left transition-colors hover:bg-white/5"
                style={cardStyle}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-secondary" />
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{c.title}</p>
                </div>
                <p className="font-heading text-primary text-2xl mb-1">{c.metric}</p>
                <p className="font-body text-xs text-muted-foreground">{c.sub}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. FIND WORK SUMMARY */}
      <section className="space-y-4">
        <h2 className="font-heading text-primary text-2xl">Find Work</h2>
        <div className="rounded-xl p-5 md:p-6" style={cardStyle}>
          {findWork.total === 0 ? (
            <div className="text-center py-6 space-y-3">
              <Compass className="w-6 h-6 text-secondary mx-auto" />
              <p className="font-body text-sm text-muted-foreground">
                No planning matches yet. Adjust your work radius or project preferences to surface opportunities.
              </p>
              <SectionButton label="Find your first opportunity" target="find-work" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="font-heading text-primary text-2xl">{findWork.total}</p>
                  <p className="font-body text-xs text-muted-foreground">Opportunities available</p>
                </div>
                <div>
                  <p className="font-heading text-primary text-2xl">{findWork.matching}</p>
                  <p className="font-body text-xs text-muted-foreground">Match your trade & radius</p>
                </div>
                <div>
                  <p className="font-heading text-primary text-2xl">{findWork.highPriority}</p>
                  <p className="font-body text-xs text-muted-foreground">High-priority opportunities</p>
                </div>
              </div>

              {findWork.rows.length > 0 && (
                <div className="rounded-lg overflow-hidden mb-4" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                  {findWork.rows.map((r, i) => (
                    <button
                      key={r.id}
                      onClick={() => onNavigate("find-work")}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                      style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <MapPin className="w-4 h-4 text-secondary shrink-0" />
                      <span className="font-body text-sm text-primary flex-1 truncate">{r.type}</span>
                      <span className="font-mono text-xs text-muted-foreground shrink-0">{r.location}</span>
                      {r.distance != null && (
                        <span className="font-mono text-xs text-muted-foreground shrink-0">
                          {r.distance.toFixed(1)} mi
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <SectionButton label="Open Find Work" target="find-work" />
                <button
                  onClick={() => onNavigate("find-work")}
                  className="inline-flex items-center gap-1.5 font-mono text-xs px-4 py-2 rounded-lg transition-colors hover:bg-white/5"
                  style={cardStyle}
                >
                  Saved Opportunities
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 6. PIPELINE SUMMARY */}
      <section className="space-y-4">
        <h2 className="font-heading text-primary text-2xl">Pipeline</h2>
        <div className="rounded-xl p-5 md:p-6" style={cardStyle}>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-4">
            {pipelineStages.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-heading text-primary text-2xl">{s.value}</p>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <SectionButton label="Open Pipeline" target="pipeline" />
        </div>
      </section>

      {/* 7. QUOTE PERFORMANCE */}
      <section className="space-y-4">
        <h2 className="font-heading text-primary text-2xl">Quote Performance</h2>
        <div className="rounded-xl p-5 md:p-6" style={cardStyle}>
          {input.quotes.submitted === 0 ? (
            <div className="text-center py-4 space-y-3">
              <p className="font-body text-sm text-muted-foreground">You haven't sent any quotes yet.</p>
              <SectionButton label="Create your first quote" target="quotes" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <Metric label="Sent" value={input.quotes.submitted} />
                <Metric label="Pending" value={input.quotes.pending} />
                <Metric label="Won / Lost" value={`${input.quotes.won} / ${input.quotes.lost}`} />
                <Metric label="Total quoted" value={money(input.quotes.totalValue)} />
              </div>
              <div className="flex items-start gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <p className="font-body text-sm text-muted-foreground">
                  {input.quotes.pending > 0
                    ? `${input.quotes.pending} quotation${input.quotes.pending > 1 ? "s" : ""} worth ${money(pendingAmount)} ${input.quotes.pending > 1 ? "are" : "is"} awaiting a decision. Average quote value ${money(avgQuote)}.`
                    : `No quotes awaiting a decision. Average quote value ${money(avgQuote)}.`}
                </p>
              </div>
              <SectionButton label="Open Quotes" target="quotes" />
            </>
          )}
        </div>
      </section>

      {/* 8. TRADEVAULT HEALTH */}
      <section className="space-y-4">
        <h2 className="font-heading text-primary text-2xl">TradeVault</h2>
        <div className="rounded-xl p-5 md:p-6" style={cardStyle}>
          {vault.requiredTotal === 0 && vault.requiredUploaded === 0 ? (
            <div className="text-center py-4 space-y-3">
              <ShieldCheck className="w-6 h-6 text-secondary mx-auto" />
              <p className="font-body text-sm text-muted-foreground">Start your verification to build homeowner trust.</p>
              <SectionButton label="Start your verification" target="tradevault" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <Metric label="Status" value={vault.verificationStatus} />
                <Metric label="Complete" value={`${vaultPercent}%`} />
                <Metric label="Docs remaining" value={vault.missingRequired.length} />
                <Metric label="Expiring soon" value={vault.expiringSoon} />
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${vaultPercent}%`, backgroundColor: TONE_HEX[toneForScore(vaultPercent)] }}
                />
              </div>
              <SectionButton label="Open TradeVault" target="tradevault" />
            </>
          )}
        </div>
      </section>

      {/* 9. RECENT ACTIVITY */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-secondary" />
          <h2 className="font-heading text-primary text-2xl">Recent Activity</h2>
        </div>
        <div className="rounded-xl overflow-hidden" style={cardStyle}>
          {activity.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground p-5 text-center">
              No recent activity yet. Actions across your pipeline, quotes and TradeVault will appear here.
            </p>
          ) : (
            activity.map((e, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: DOT_HEX[e.dot] }} />
                <span className="font-body text-sm text-primary flex-1">{e.label}</span>
                <span className="font-mono text-[11px] text-muted-foreground shrink-0">{timeAgo(e.when)}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 10. INCREASE YOUR BUSINESS SCORE */}
      {boosters.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-secondary" />
            <h2 className="font-heading text-primary text-2xl">Increase Your Business Score</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {boosters.map((b, i) => (
              <button
                key={i}
                onClick={() => onNavigate(b.target)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-white/5 transition-colors"
                style={cardStyle}
              >
                <span
                  className="font-heading text-sm px-2.5 py-1 rounded-lg shrink-0"
                  style={{ backgroundColor: "rgba(20,168,161,0.15)", color: TEAL }}
                >
                  +{b.points}
                </span>
                <span className="font-body text-sm text-primary flex-1">{b.label}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string | number }) => (
  <div>
    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="font-heading text-primary text-lg truncate">{value}</p>
  </div>
);

const ScoreRing = ({ value, color }: { value: number; color: string }) => {
  const size = 120;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="rotate-90"
        style={{ transformOrigin: "center", fill: "#F5EFE3", fontSize: 30, fontWeight: 700, fontFamily: "inherit" }}
      >
        {value}
      </text>
      <text
        x="50%"
        y="68%"
        dominantBaseline="central"
        textAnchor="middle"
        className="rotate-90"
        style={{ transformOrigin: "center", fill: "rgba(245,239,227,0.5)", fontSize: 11 }}
      >
        / 100
      </text>
    </svg>
  );
};

export default BusinessHealthDashboard;
