import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Sunrise,
  PhoneCall,
  CalendarClock,
  PoundSterling,
  MapPin,
  Bell,
  CheckCircle2,
  ArrowRight,
  Phone,
  Check,
  RotateCcw,
  Building2,
  Clock,
  FileText,
  CalendarDays,
  FolderOpen,
  Search,
  Sparkles,
} from "lucide-react";
import Workspace from "@/components/trade/Workspace";

interface QuoteItem {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  job_id?: string;
  jobs: { title: string | null; job_type: string; postcode: string } | null;
}

interface FollowUp {
  id: string;
  planning_alert_id: string;
  contact_status: string;
  next_action_date: string | null;
  note: string | null;
  address: string;
  postcode: string;
  application_type: string;
}

interface JobStarting {
  id: string;
  job_id: string;
  title: string;
  postcode: string;
  planned_start: string;
  stage_name: string;
}

interface Props {
  tradeId: string;
  quotes: QuoteItem[];
  name?: string;
}

const daysSince = (d: string) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000));
const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

const FOLLOWUP_TYPE: Record<string, string> = {
  todo: "planning",
  contacted: "callback",
  quoted: "quote",
  won: "callback",
  dead: "callback",
};

const MAP_LEGEND = [
  { label: "New", color: "#22c55e" },
  { label: "Saved", color: "#3b82f6" },
  { label: "Contact Made", color: "#eab308" },
  { label: "Follow-up Due", color: "#f97316" },
  { label: "Planning Approved", color: "#a855f7" },
  { label: "Quoted", color: "#111827" },
  { label: "Won", color: "#14b8a6" },
  { label: "Lost / Archived", color: "#ef4444" },
];

/** Empty-state coaching block — guides rather than reports. */
const Coach = ({ icon: Icon, title, hint }: { icon: any; title: string; hint: string }) => (
  <div className="premium-card p-6 flex items-start gap-4">
    <span className="ws-accent-bg ws-accent-ring rounded-2xl w-11 h-11 flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5 ws-accent-fg" strokeWidth={1.75} />
    </span>
    <div>
      <p className="font-sans font-semibold text-white text-base">{title}</p>
      <p className="font-sans text-sm text-white/60 mt-1 leading-relaxed">{hint}</p>
    </div>
  </div>
);

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const MorningBriefing = ({ tradeId, quotes, name }: Props) => {
  const navigate = useNavigate();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [jobsSoon, setJobsSoon] = useState<JobStarting[]>([]);
  const [planningNew, setPlanningNew] = useState(0);
  const [planningApproved, setPlanningApproved] = useState(0);
  const [planningSaved, setPlanningSaved] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Follow-ups due (planning pipeline leads with a next action date up to today)
      const shortlistRes = await supabase
        .from("planning_alert_shortlist")
        .select("id, planning_alert_id, contact_status, next_action_date, note")
        .eq("trade_id", tradeId)
        .not("next_action_date", "is", null)
        .lte("next_action_date", todayEnd.toISOString())
        .order("next_action_date", { ascending: true });

      const rows = (shortlistRes.data ?? []).filter(
        (r: any) => r.contact_status !== "won" && r.contact_status !== "dead",
      );
      const alertIds = rows.map((r: any) => r.planning_alert_id);
      let alertsById = new Map<string, any>();
      if (alertIds.length) {
        const { data: alerts } = await supabase
          .from("planning_alerts")
          .select("id, address, postcode, application_type")
          .in("id", alertIds);
        alertsById = new Map((alerts ?? []).map((a: any) => [a.id, a]));
      }
      const fus: FollowUp[] = rows.map((r: any) => {
        const a = alertsById.get(r.planning_alert_id) ?? {};
        return {
          id: r.id,
          planning_alert_id: r.planning_alert_id,
          contact_status: r.contact_status,
          next_action_date: r.next_action_date,
          note: r.note,
          address: a.address ?? "Planning lead",
          postcode: a.postcode ?? "",
          application_type: a.application_type ?? "Planning opportunity",
        };
      });

      // Jobs starting soon (within 14 days) from this trade's contracted jobs
      const contractRes = await supabase.from("contracts").select("job_id").eq("trade_id", tradeId);
      const jobIds = Array.from(new Set((contractRes.data ?? []).map((c: any) => c.job_id).filter(Boolean)));
      let jobsStarting: JobStarting[] = [];
      if (jobIds.length) {
        const in14 = new Date();
        in14.setDate(in14.getDate() + 14);
        const stageRes = await supabase
          .from("project_stages")
          .select("id, job_id, stage_name, planned_start, status, jobs(id, title, postcode)")
          .in("job_id", jobIds)
          .not("planned_start", "is", null)
          .gte("planned_start", new Date().toISOString().slice(0, 10))
          .lte("planned_start", in14.toISOString().slice(0, 10))
          .neq("status", "complete")
          .order("planned_start", { ascending: true });
        const seen = new Set<string>();
        jobsStarting = (stageRes.data ?? [])
          .filter((s: any) => {
            if (seen.has(s.job_id)) return false;
            seen.add(s.job_id);
            return true;
          })
          .map((s: any) => ({
            id: s.id,
            job_id: s.job_id,
            title: s.jobs?.title ?? "Project",
            postcode: s.jobs?.postcode ?? "",
            planned_start: s.planned_start,
            stage_name: s.stage_name,
          }));
      }

      // Planning opportunity counts
      const [newRes, approvedRes, savedRes] = await Promise.all([
        supabase
          .from("planning_alerts")
          .select("id", { count: "exact", head: true })
          .eq("trade_id", tradeId)
          .eq("viewed", false),
        supabase
          .from("planning_alerts")
          .select("id", { count: "exact", head: true })
          .eq("trade_id", tradeId)
          .not("approved_date", "is", null),
        supabase
          .from("planning_alert_shortlist")
          .select("id", { count: "exact", head: true })
          .eq("trade_id", tradeId),
      ]);

      if (cancelled) return;
      setFollowUps(fus);
      setJobsSoon(jobsStarting);
      setPlanningNew(newRes.count ?? 0);
      setPlanningApproved(approvedRes.count ?? 0);
      setPlanningSaved(savedRes.count ?? 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tradeId]);

  const rescheduleFollowUp = async (fu: FollowUp) => {
    const next = new Date();
    next.setDate(next.getDate() + 3);
    const iso = next.toISOString().slice(0, 10);
    await supabase.from("planning_alert_shortlist").update({ next_action_date: iso }).eq("id", fu.id);
    setFollowUps((prev) => prev.filter((f) => f.id !== fu.id));
    toast({ title: "Rescheduled", description: "Follow-up moved to 3 days from now." });
  };

  const completeFollowUp = async (fu: FollowUp) => {
    await supabase.from("planning_alert_shortlist").update({ next_action_date: null }).eq("id", fu.id);
    setFollowUps((prev) => prev.filter((f) => f.id !== fu.id));
    toast({ title: "Marked complete", description: "Nice work — one less thing to chase." });
  };

  const pendingQuotes = quotes.filter((q) => q.status === "pending");

  const briefingCards = [
    {
      key: "followups",
      label: "Follow-ups Due",
      value: followUps.length,
      hint: "Due today",
      icon: PhoneCall,
      cta: "View Follow-ups",
      onClick: () => document.getElementById("mb-followups")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    {
      key: "jobs",
      label: "Jobs Starting Soon",
      value: jobsSoon.length,
      hint: "Next 14 days",
      icon: CalendarClock,
      cta: "View Calendar",
      onClick: () => document.getElementById("mb-jobs")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    {
      key: "quotes",
      label: "Quotes Waiting",
      value: pendingQuotes.length,
      hint: "Sent, not decided",
      icon: PoundSterling,
      cta: "Chase Quotes",
      onClick: () => document.getElementById("mb-quotes")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    {
      key: "planning",
      label: "Planning Opportunities",
      value: planningNew,
      hint: "In your work radius",
      icon: MapPin,
      cta: "View Planning Hub",
      onClick: () => navigate("/planning-alerts"),
    },
  ];

  const quickActions = [
    { icon: FileText, label: "Start Quote", onClick: () => navigate("/dashboard/trade?view=jobs") },
    { icon: MapPin, label: "Planning Hub", onClick: () => navigate("/planning-alerts") },
    { icon: CalendarDays, label: "Calendar", onClick: () => document.getElementById("mb-jobs")?.scrollIntoView({ behavior: "smooth", block: "start" }) },
    { icon: FolderOpen, label: "TradeVault", onClick: () => navigate("/dashboard/trade?view=tradevault") },
  ];

  return (
    <div className="space-y-8">
      {/* ============ MORNING BRIEFING (hero) ============ */}
      <Workspace
        icon={Sunrise}
        title={`${greeting()}${name ? `, ${name.split(" ")[0]}` : ""}`}
        subtitle="Your next best actions to keep work moving today."
        accent="teal"
        surface="2"
        texture="grid"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {briefingCards.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={c.onClick}
              className="premium-card ws-accent-teal text-left p-6 flex flex-col justify-between min-h-[168px]"
            >
              <div className="flex items-start justify-between">
                <span className="ws-accent-bg ws-accent-ring rounded-2xl w-12 h-12 flex items-center justify-center">
                  <c.icon className="w-6 h-6 ws-accent-fg" strokeWidth={1.75} />
                </span>
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/45 mt-1">
                  {c.hint}
                </p>
              </div>
              <div className="mt-4">
                <p className="font-heading text-white text-5xl leading-none animate-count">
                  {loading ? "–" : c.value}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-sans text-sm text-white/70">{c.label}</p>
                  <ArrowRight className="w-4 h-4 ws-accent-fg" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Quick action chips */}
        <div className="flex flex-wrap gap-3 mt-6">
          {quickActions.map((a) => (
            <button key={a.label} type="button" onClick={a.onClick} className="action-chip ws-accent-teal">
              <a.icon className="w-5 h-5 ws-accent-fg" strokeWidth={1.75} />
              <span className="text-sm">{a.label}</span>
            </button>
          ))}
        </div>
      </Workspace>

      {/* ============ FOLLOW-UPS DUE TODAY ============ */}
      <Workspace
        id="mb-followups"
        icon={PhoneCall}
        title="Follow-ups Due Today"
        subtitle="Already-engaged customers and opportunities — chase these first."
        accent="teal"
        surface="1"
        texture="crosses"
      >
        {followUps.length === 0 ? (
          <Coach
            icon={CheckCircle2}
            title="You have no follow-ups due today."
            hint="Great opportunity to contact recent planning approvals in your area before a competitor does."
          />
        ) : (
          <div className="space-y-3">
            {followUps.map((fu) => (
              <div key={fu.id} className="premium-card ws-accent-teal p-5">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 ws-accent-fg" />
                  <h3 className="font-sans font-semibold text-white text-base leading-tight">{fu.address}</h3>
                  <span className="font-mono text-[10px] uppercase tracking-wider ws-accent-bg ws-accent-fg px-2 py-0.5 rounded-full">
                    {FOLLOWUP_TYPE[fu.contact_status] ?? "callback"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-white/55 mb-4">
                  <span>{fu.application_type}</span>
                  {fu.postcode && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {fu.postcode}
                    </span>
                  )}
                  {fu.next_action_date && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {daysSince(fu.next_action_date) === 0 ? "Due today" : `${daysSince(fu.next_action_date)}d overdue`}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate("/planning-alerts")}
                    className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground font-sans font-semibold text-sm px-4 min-h-[44px] rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <Phone className="w-4 h-4" />
                    Call Now
                  </button>
                  <button
                    onClick={() => completeFollowUp(fu)}
                    className="inline-flex items-center gap-1.5 border border-white/12 font-sans text-sm px-4 min-h-[44px] rounded-xl text-white/85 hover:border-secondary/50 transition-colors"
                  >
                    <Check className="w-4 h-4 ws-accent-fg" />
                    Mark Complete
                  </button>
                  <button
                    onClick={() => rescheduleFollowUp(fu)}
                    className="inline-flex items-center gap-1.5 border border-white/12 font-sans text-sm px-4 min-h-[44px] rounded-xl text-white/85 hover:border-secondary/50 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 ws-accent-fg" />
                    Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Workspace>

      {/* ============ JOBS STARTING SOON ============ */}
      <Workspace
        id="mb-jobs"
        icon={CalendarClock}
        title="Jobs Starting Soon"
        subtitle="Projects kicking off within the next 14 days."
        accent="green"
        surface="1"
        texture="grid"
      >
        {jobsSoon.length === 0 ? (
          <Coach
            icon={CalendarClock}
            title="No jobs start this week."
            hint="Consider contacting homeowners whose planning has recently been approved to line up your next start date."
          />
        ) : (
          <div className="space-y-3">
            {jobsSoon.map((j) => {
              const dLeft = daysUntil(j.planned_start);
              return (
                <div key={j.id} className="premium-card ws-accent-green p-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-sans font-semibold text-white text-base">{j.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-white/55 mt-1">
                      {j.postcode && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {j.postcode}
                        </span>
                      )}
                      <span>{new Date(j.planned_start).toLocaleDateString("en-GB")}</span>
                      <span className="ws-accent-fg font-semibold">
                        {dLeft <= 0 ? "Starts today" : `Starts in ${dLeft} day${dLeft === 1 ? "" : "s"}`}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-white/45 mt-2">
                      Prep: confirm materials & access for "{j.stage_name}".
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/project/${j.job_id}`)}
                    className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground font-sans font-semibold text-sm px-4 min-h-[44px] rounded-xl hover:opacity-90 transition-opacity"
                  >
                    View Job
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Workspace>

      {/* ============ QUOTES AWAITING DECISION ============ */}
      <Workspace
        id="mb-quotes"
        icon={PoundSterling}
        title="Quote Centre"
        subtitle="Quotes you've sent that haven't been accepted or rejected yet."
        accent="gold"
        surface="1"
        texture="contour"
      >
        {pendingQuotes.length === 0 ? (
          <Coach
            icon={FileText}
            title="No quotes awaiting a decision right now."
            hint="When you win a matched job or a planning lead, send a quote here and track every follow-up in one place."
          />
        ) : (
          <div className="space-y-3">
            {pendingQuotes.map((q) => (
              <div key={q.id} className="premium-card ws-accent-gold p-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-sans font-semibold text-white text-base">{q.jobs?.title || q.jobs?.job_type || "Job"}</h3>
                  <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-white/55 mt-1">
                    {q.jobs?.postcode && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {q.jobs.postcode}
                      </span>
                    )}
                    <span>Sent {new Date(q.created_at).toLocaleDateString("en-GB")}</span>
                    <span className="ws-accent-fg font-semibold">{daysSince(q.created_at)}d since sent</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-heading text-white text-2xl">£{Number(q.amount).toLocaleString()}</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => navigate(q.job_id ? `/project/${q.job_id}` : "/dashboard/trade?view=jobs")}
                      className="inline-flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground font-sans font-semibold text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
                    >
                      Follow Up
                    </button>
                    <button
                      onClick={() => navigate(q.job_id ? `/project/${q.job_id}` : "/dashboard/trade?view=jobs")}
                      className="inline-flex items-center justify-center gap-1.5 border border-white/12 font-sans text-sm px-4 py-2 rounded-xl text-white/85 hover:border-secondary/50 transition-colors"
                    >
                      View Quote
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Workspace>

      {/* ============ PLANNING HUB (showpiece GIS module) ============ */}
      <Workspace
        icon={Bell}
        title="Planning Hub"
        subtitle="Live opportunities and approvals near you — GIS view of your work radius."
        accent="blue"
        surface="3"
        texture="crosses"
        action={
          <button
            onClick={() => navigate("/planning-alerts")}
            className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground font-sans font-semibold text-sm px-5 min-h-[44px] rounded-xl hover:opacity-90 transition-opacity"
          >
            Open Planning Hub
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      >
        {/* Live counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            { label: "New in radius", value: planningNew },
            { label: "Recently approved", value: planningApproved },
            { label: "Saved opportunities", value: planningSaved },
            { label: "Follow-ups from pipeline", value: followUps.length },
          ].map((s) => (
            <div key={s.label} className="premium-card ws-accent-blue p-4">
              <p className="font-heading text-white text-3xl leading-none animate-count">{loading ? "–" : s.value}</p>
              <p className="font-mono text-[11px] text-white/55 mt-2 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>

        {/* GIS map preview with radius + pulsing pins */}
        <div className="premium-card ws-accent-blue overflow-hidden !p-0">
          <div className="relative h-64 blueprint-grid" style={{ background: "radial-gradient(circle at 50% 55%, #12345c 0%, #0d223f 70%)" }}>
            {/* Radius circle */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/40"
              style={{ width: 240, height: 240, background: "radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)" }}
            />
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/20"
              style={{ width: 150, height: 150 }}
            />
            {/* Centre datum */}
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-300 animate-pin" style={{ ["--pin" as any]: "96 165 250" }} />
            {[
              { top: "26%", left: "34%", color: "#22c55e", rgb: "34 197 94" },
              { top: "60%", left: "40%", color: "#f97316", rgb: "249 115 22" },
              { top: "40%", left: "60%", color: "#3b82f6", rgb: "59 130 246" },
              { top: "66%", left: "62%", color: "#a855f7", rgb: "168 85 247" },
              { top: "34%", left: "70%", color: "#14b8a6", rgb: "20 184 166" },
              { top: "56%", left: "28%", color: "#eab308", rgb: "234 179 8" },
            ].map((p, i) => (
              <span
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white/80 animate-pin"
                style={{ top: p.top, left: p.left, backgroundColor: p.color, ["--pin" as any]: p.rgb, animationDelay: `${i * 0.3}s` }}
              />
            ))}
            {/* Quick search */}
            <div className="absolute top-3 left-3 right-3 flex items-center gap-2">
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur border border-white/12 rounded-full px-3 py-2 flex-1 max-w-xs">
                <Search className="w-4 h-4 text-white/60" />
                <span className="font-mono text-[11px] text-white/55">Search postcode or street…</span>
              </div>
              <span className="font-mono text-[10px] text-white/60 bg-black/30 backdrop-blur border border-white/12 rounded-full px-3 py-2">
                Live map coming soon
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
              {MAP_LEGEND.map((l) => (
                <span key={l.label} className="inline-flex items-center gap-1.5 font-mono text-[10px] text-white/60">
                  <span className="w-2.5 h-2.5 rounded-full border border-white/60" style={{ backgroundColor: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate("/planning-alerts")} className="action-chip ws-accent-blue">
                <Sparkles className="w-5 h-5 ws-accent-fg" strokeWidth={1.75} />
                <span className="text-sm">Nearby Opportunities</span>
              </button>
              <button onClick={() => navigate("/planning-alerts")} className="action-chip ws-accent-blue">
                <CheckCircle2 className="w-5 h-5 ws-accent-fg" strokeWidth={1.75} />
                <span className="text-sm">Recent Approvals</span>
              </button>
            </div>
          </div>
        </div>
      </Workspace>
    </div>
  );
};

export default MorningBriefing;
