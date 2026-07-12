import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  ArrowRight,
  Briefcase,
  CalendarDays,
  FileText,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { computeProfileStrength } from "@/lib/tradeProfileStrength";
import type { VaultDocument } from "@/lib/tradeVault";
import { computeVaultSummary } from "@/lib/tradeVault";
import {
  buildBriefing,
  buildSummarySentence,
  computeBoosters,
  computeBusinessHealth,
  computeTasks,
  formatMoney,
  greeting,
  TONE_HEX,
  toneForScore,
  type BusinessHealth,
  type BusinessHealthInput,
  type PriorityNav,
} from "@/lib/businessHealth";

interface Props {
  tradeId: string;
  name?: string;
  verificationStatus?: string | null;
  quotes: any[]; // pending quotes (from dashboard)
  allQuotesCount?: number;
  matches: any[];
  activeProjectsCount: number;
  wonJobs: number;
  marginData: { totalQuoted: number; totalCosts: number; totalReceived: number };
  onNavigate: (target: PriorityNav) => void;
}

const calendarConnected = (tradeId: string) =>
  typeof window !== "undefined" &&
  window.localStorage.getItem(`pg-cal-connected-${tradeId}`) === "1";

interface CardMeta {
  key: string;
  label: string;
  value: string | number;
}

const DOT_HEX: Record<string, string> = { red: "#EF4444", orange: "#F59E0B", green: "#14A8A1" };

const cardStyle = {
  backgroundColor: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const BusinessHealthDashboard = ({
  tradeId,
  name,
  verificationStatus,
  quotes,
  matches,
  activeProjectsCount,
  wonJobs,
  marginData,
  onNavigate,
}: Props) => {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<BusinessHealth | null>(null);
  const [input, setInput] = useState<BusinessHealthInput | null>(null);
  const [allQuotes, setAllQuotes] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      const tradeRes = await supabase
        .from("trades")
        .select(
          "id, name, bio, phone, postcode, trade_type, service_radius_miles, public_liability_insurer, insurance_cert_url, business_logo_path, verified, verification_status, verified_on_prografter_at, gas_safe_number, mcs_number, trustmark_number, cps_registration_number, pas_2030_accredited, fgas_registered, ozev_approved, ciga_registered, inca_certified",
        )
        .eq("id", tradeId)
        .maybeSingle();

      const [vaultRes, specRes, portfolioRes, quotesRes] = await Promise.all([
        supabase.from("tradevault_documents").select("*").eq("trade_id", tradeId),
        supabase
          .from("trade_specialisms" as any)
          .select("specialism_id", { count: "exact", head: true })
          .eq("trade_id", tradeId),
        supabase
          .from("trade_portfolio_items" as any)
          .select("id", { count: "exact", head: true })
          .eq("trade_id", tradeId),
        supabase.from("quotes").select("id, amount, status").eq("trade_id", tradeId),
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
          toContact: matches.length,
          waiting: pending,
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
        Assessing your business health…
      </div>
    );
  }

  const tasks = computeTasks(input);
  const boosters = computeBoosters(input);
  const briefing = buildBriefing(health, input);
  const summary = buildSummarySentence(health, input);
  const toneHex = TONE_HEX[health.tone];

  const vault = computeVaultSummary(input.vaultDocs);
  const scoreByKey = Object.fromEntries(health.modules.map((m) => [m.key, m.score]));

  const cards: {
    key: string;
    title: string;
    icon: LucideIcon;
    score: number;
    metrics: CardMeta[];
    insight: string;
    cta: string;
    target: PriorityNav;
  }[] = [
    {
      key: "pipeline",
      title: "Pipeline Health",
      icon: Briefcase,
      score: scoreByKey.pipeline,
      metrics: [
        { key: "contact", label: "To contact", value: input.pipeline.toContact },
        { key: "waiting", label: "Waiting", value: input.pipeline.waiting },
        { key: "active", label: "Active projects", value: input.pipeline.activeProjects },
        { key: "won", label: "Won jobs", value: input.pipeline.wonJobs },
      ],
      insight:
        input.pipeline.toContact > 0
          ? `You have ${input.pipeline.toContact} warm lead${input.pipeline.toContact > 1 ? "s" : ""} waiting for a response. Following these up today is likely to produce the highest return.`
          : "No leads awaiting a first response — a good day to source new opportunities in Find Work.",
      cta: "Open Pipeline",
      target: "pipeline",
    },
    {
      key: "quotes",
      title: "Quote Performance",
      icon: FileText,
      score: scoreByKey.quotes,
      metrics: [
        { key: "submitted", label: "Submitted", value: input.quotes.submitted },
        { key: "pending", label: "Pending", value: input.quotes.pending },
        { key: "won", label: "Won", value: input.quotes.won },
        { key: "value", label: "Total quoted", value: formatMoney(input.quotes.totalValue) },
      ],
      insight:
        input.quotes.submitted === 0
          ? "You haven't submitted any quotes yet. Winning your first quote will sharpen your conversion insight."
          : `Average quote value ${formatMoney(input.quotes.submitted ? input.quotes.totalValue / input.quotes.submitted : 0)}. Balancing high-value jobs with quicker wins keeps cashflow steady.`,
      cta: "View Quotes",
      target: "quotes",
    },
    {
      key: "tradevault",
      title: "TradeVault Health",
      icon: ShieldCheck,
      score: scoreByKey.tradevault,
      metrics: [
        { key: "status", label: "Status", value: vault.verificationStatus },
        { key: "uploaded", label: "Required", value: `${vault.requiredUploaded}/${vault.requiredTotal}` },
        { key: "expiring", label: "Expiring", value: vault.expiringSoon },
        { key: "expired", label: "Expired", value: vault.expired },
      ],
      insight:
        vault.missingRequired.length > 0
          ? `Uploading ${vault.missingRequired.length} remaining document${vault.missingRequired.length > 1 ? "s" : ""} will complete verification and activate automatic renewal reminders.`
          : "All required documents are in place. ProGrafter will remind you before anything expires.",
      cta: "Open TradeVault",
      target: "tradevault",
    },
    {
      key: "profile",
      title: "Profile Strength",
      icon: UserCircle,
      score: scoreByKey.profile,
      metrics: input.profileStrength.items
        .filter((i) => ["bio", "specialisms", "radius", "photos"].includes(i.key))
        .map((i) => ({ key: i.key, label: i.label, value: i.state === "complete" ? "✓" : "—" })),
      insight:
        input.profileStrength.percent < 80
          ? "Profiles with a complete biography and specialisms receive noticeably more homeowner engagement."
          : "Your profile is strong — homeowners can clearly see what you do and where you work.",
      cta: "Edit Profile",
      target: "profile",
    },
    {
      key: "calendar",
      title: "Calendar Health",
      icon: CalendarDays,
      score: scoreByKey.calendar,
      metrics: [
        { key: "connected", label: "Connected", value: input.calendarConnected ? "Yes" : "No" },
        { key: "events", label: "Upcoming", value: 0 },
        { key: "visits", label: "Site visits", value: 0 },
        { key: "milestones", label: "Payment dates", value: 0 },
      ],
      insight: input.calendarConnected
        ? "No upcoming site visits are scheduled. Booking visits within 48 hours of a request improves quote success."
        : "Connect your calendar to sync site visits, quote deadlines and payment milestones.",
      cta: input.calendarConnected ? "Open Calendar" : "Connect Calendar",
      target: "calendar",
    },
    {
      key: "messages",
      title: "Communication",
      icon: MessageSquare,
      score: scoreByKey.messages,
      metrics: [
        { key: "unread", label: "Unread", value: 0 },
        { key: "open", label: "Open chats", value: 0 },
        { key: "rate", label: "Response rate", value: "—" },
        { key: "avg", label: "Avg reply", value: "—" },
      ],
      insight: "Fast responses increase homeowner confidence. Aim to reply within a few hours during working days.",
      cta: "Open Messages",
      target: "messages",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero — greeting + health score */}
      <section className="rounded-2xl p-6 md:p-8" style={cardStyle}>
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
          {/* Score ring */}
          <div className="shrink-0 flex flex-col items-center">
            <ScoreRing value={health.overall} color={toneHex} />
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mt-3">
              Business Health Score
            </p>
          </div>

          <div className="flex-1 space-y-3">
            <p className="font-mono text-xs uppercase tracking-widest text-secondary">
              {greeting()}, {(name || "Trade").split(" ")[0]}
            </p>
            <h1 className="font-heading text-primary text-3xl md:text-4xl leading-tight">
              How healthy is your business today?
            </h1>
            <div className="flex items-start gap-2 text-sm text-muted-foreground font-body max-w-2xl">
              <Sparkles className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <p>{summary}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Priorities */}
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
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: DOT_HEX[task.dot] }}
              />
              <span className="font-body text-sm text-primary flex-1">{task.label}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {/* Daily AI Briefing */}
      <section className="rounded-2xl p-6" style={{ ...cardStyle, borderColor: "rgba(20,168,161,0.35)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-secondary" />
          <h2 className="font-heading text-primary text-xl">Daily AI Briefing</h2>
        </div>
        <p className="font-body text-sm text-primary mb-2">
          {greeting()} {(name || "there").split(" ")[0]}. Today's focus:
        </p>
        <ul className="space-y-1.5 mb-4">
          {briefing.focus.map((f, i) => (
            <li key={i} className="flex items-start gap-2 font-body text-sm text-muted-foreground">
              <span className="text-secondary mt-0.5">•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <div
          className="rounded-lg p-3 flex items-start gap-2"
          style={{ backgroundColor: "rgba(20,168,161,0.10)" }}
        >
          <TrendingUp className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-secondary mb-0.5">
              Your single most valuable action today
            </p>
            <p className="font-body text-sm text-primary">{briefing.singleAction}</p>
          </div>
        </div>
      </section>

      {/* Dashboard cards grid */}
      <section className="space-y-4">
        <h2 className="font-heading text-primary text-2xl">Business Snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            const tone = toneForScore(card.score);
            return (
              <div key={card.key} className="rounded-xl p-5 flex flex-col" style={cardStyle}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-secondary" />
                    <h3 className="font-heading text-primary text-lg">{card.title}</h3>
                  </div>
                  <span
                    className="font-mono text-sm font-bold px-2.5 py-1 rounded-lg"
                    style={{ color: TONE_HEX[tone], backgroundColor: `${TONE_HEX[tone]}1A` }}
                  >
                    {card.score}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {card.metrics.map((m) => (
                    <div key={m.key}>
                      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {m.label}
                      </p>
                      <p className="font-heading text-primary text-base truncate">{m.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 mb-4 flex-1">
                  <Sparkles className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                  <p className="font-body text-xs text-muted-foreground leading-relaxed">{card.insight}</p>
                </div>
                <button
                  onClick={() => onNavigate(card.target)}
                  className="w-full flex items-center justify-center gap-1.5 font-mono text-xs py-2 rounded-lg transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "rgba(20,168,161,0.15)", color: "#14A8A1" }}
                >
                  {card.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Score breakdown */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-secondary" />
          <h2 className="font-heading text-primary text-2xl">Score Breakdown</h2>
        </div>
        <div className="rounded-xl p-5 space-y-3" style={cardStyle}>
          {health.modules.map((m) => (
            <div key={m.key} className="flex items-center gap-3">
              <span className="font-body text-sm text-primary w-28 shrink-0">{m.label}</span>
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${m.score}%`, backgroundColor: TONE_HEX[toneForScore(m.score)] }}
                />
              </div>
              <span className="font-mono text-sm text-primary w-10 text-right">{m.score}</span>
              <span className="font-mono text-[11px] text-muted-foreground w-10 text-right">
                {Math.round(m.weight * 100)}%
              </span>
            </div>
          ))}
          <div className="flex items-center gap-3 pt-3 border-t border-white/10">
            <span className="font-heading text-primary text-base w-28 shrink-0">Overall</span>
            <div className="flex-1" />
            <span className="font-heading text-lg w-10 text-right" style={{ color: toneHex }}>
              {health.overall}
            </span>
            <span className="w-10" />
          </div>
        </div>
      </section>

      {/* Improve your score */}
      {boosters.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-secondary" />
            <h2 className="font-heading text-primary text-2xl">Increase your Business Score</h2>
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
                  style={{ backgroundColor: "rgba(20,168,161,0.15)", color: "#14A8A1" }}
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

const ScoreRing = ({ value, color }: { value: number; color: string }) => {
  const size = 120;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.10)"
        strokeWidth={stroke}
      />
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
