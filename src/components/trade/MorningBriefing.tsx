import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Sunrise,
  PhoneCall,
  CalendarClock,
  CalendarPlus,
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
} from "lucide-react";

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

const SectionHeading = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2">
      <Icon className="w-5 h-5 text-secondary" />
      <h2 className="font-heading text-primary text-xl uppercase tracking-wider">{title}</h2>
    </div>
    {subtitle && <p className="font-mono text-xs text-muted-foreground mt-1">{subtitle}</p>}
  </div>
);

const MorningBriefing = ({ tradeId, quotes }: Props) => {
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
      label: "Quotes Awaiting Decision",
      value: pendingQuotes.length,
      hint: "Sent, not decided",
      icon: PoundSterling,
      cta: "Chase Quotes",
      onClick: () => document.getElementById("mb-quotes")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    {
      key: "planning",
      label: "New Planning Opportunities",
      value: planningNew,
      hint: "In your work radius",
      icon: Bell,
      cta: "View Planning Hub",
      onClick: () => navigate("/planning-alerts"),
    },
  ];

  return (
    <div className="space-y-10">
      {/* MORNING BRIEFING */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <Sunrise className="w-6 h-6 text-secondary" />
          <h2 className="font-heading text-primary text-2xl uppercase tracking-wider">Morning Briefing</h2>
        </div>
        <p className="font-mono text-xs text-muted-foreground mb-4">
          Your next best actions to keep work moving.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {briefingCards.map((c) => (
            <div
              key={c.key}
              className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{c.hint}</p>
                  <p className="font-heading text-primary text-4xl leading-none mt-1">
                    {loading ? "–" : c.value}
                  </p>
                  <p className="font-mono text-xs text-foreground mt-2">{c.label}</p>
                </div>
                <c.icon className="w-6 h-6 text-secondary shrink-0" />
              </div>
              <button
                onClick={c.onClick}
                className="mt-4 inline-flex items-center gap-1 self-start bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                {c.cta}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FOLLOW-UPS DUE TODAY */}
      <section id="mb-followups" className="scroll-mt-24">
        <SectionHeading icon={PhoneCall} title="Follow-ups Due Today" subtitle="Already-engaged customers and opportunities — chase these first." />
        {followUps.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 border border-secondary/20 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-secondary shrink-0" />
            <p className="font-mono text-sm text-foreground">No follow-ups due today. You're up to date.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {followUps.map((fu) => (
              <div key={fu.id} className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-secondary" />
                  <h3 className="font-heading text-primary text-base leading-tight">{fu.address}</h3>
                  <span className="font-mono text-[10px] uppercase tracking-wider bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                    {FOLLOWUP_TYPE[fu.contact_status] ?? "callback"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground mb-4">
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
                    className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Now
                  </button>
                  <button
                    onClick={() => completeFollowUp(fu)}
                    className="inline-flex items-center gap-1.5 bg-card border border-primary/10 font-mono text-xs px-4 py-2.5 rounded-xl text-foreground hover:border-secondary/40 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-secondary" />
                    Mark Complete
                  </button>
                  <button
                    onClick={() => rescheduleFollowUp(fu)}
                    className="inline-flex items-center gap-1.5 bg-card border border-primary/10 font-mono text-xs px-4 py-2.5 rounded-xl text-foreground hover:border-secondary/40 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-secondary" />
                    Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* JOBS STARTING SOON */}
      <section id="mb-jobs" className="scroll-mt-24">
        <SectionHeading icon={CalendarClock} title="Jobs Starting Soon" subtitle="Projects kicking off within the next 14 days." />
        {jobsSoon.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 border border-primary/10 text-center">
            <p className="font-mono text-sm text-muted-foreground">No jobs starting in the next 14 days.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobsSoon.map((j) => {
              const dLeft = daysUntil(j.planned_start);
              return (
                <div key={j.id} className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-primary text-base">{j.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground mt-1">
                      {j.postcode && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {j.postcode}
                        </span>
                      )}
                      <span>{new Date(j.planned_start).toLocaleDateString("en-GB")}</span>
                      <span className="text-secondary font-semibold">
                        {dLeft <= 0 ? "Starts today" : `Starts in ${dLeft} day${dLeft === 1 ? "" : "s"}`}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-muted-foreground mt-2">
                      Prep: confirm materials & access for "{j.stage_name}".
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/project/${j.job_id}`)}
                    className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                  >
                    View Job
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* QUOTES AWAITING DECISION */}
      <section id="mb-quotes" className="scroll-mt-24">
        <SectionHeading icon={PoundSterling} title="Quotes Awaiting Decision" subtitle="Quotes you've sent that haven't been accepted or rejected yet." />
        {pendingQuotes.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 border border-primary/10 text-center">
            <p className="font-mono text-sm text-muted-foreground">No quotes awaiting a decision right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingQuotes.map((q) => (
              <div key={q.id} className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading text-primary text-base">{q.jobs?.title || q.jobs?.job_type || "Job"}</h3>
                  <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground mt-1">
                    {q.jobs?.postcode && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {q.jobs.postcode}
                      </span>
                    )}
                    <span>Sent {new Date(q.created_at).toLocaleDateString("en-GB")}</span>
                    <span className="text-secondary font-semibold">{daysSince(q.created_at)}d since sent</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-heading text-secondary text-xl">£{Number(q.amount).toLocaleString()}</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => navigate("/planning-alerts")}
                      className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
                    >
                      Follow Up
                    </button>
                    <button
                      onClick={() => navigate(q.jobs ? `/quote-report/${q.id}` : "#")}
                      className="inline-flex items-center gap-1.5 bg-card border border-primary/10 font-mono text-xs px-4 py-2 rounded-xl text-foreground hover:border-secondary/40 transition-colors"
                    >
                      View Quote
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PLANNING HUB PREVIEW */}
      <section className="scroll-mt-24">
        <SectionHeading icon={Bell} title="Planning Hub" subtitle="Live opportunities and approvals near you." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            { label: "New in radius", value: planningNew },
            { label: "Recently approved", value: planningApproved },
            { label: "Saved opportunities", value: planningSaved },
            { label: "Follow-ups from pipeline", value: followUps.length },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl p-4 border border-primary/10 shadow-sm">
              <p className="font-heading text-primary text-3xl leading-none">{loading ? "–" : s.value}</p>
              <p className="font-mono text-[11px] text-muted-foreground mt-2 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Map preview placeholder with legend */}
        <div className="bg-card rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
          <div className="relative h-48 bg-primary/5">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(13,148,136,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.15) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            {[
              { top: "22%", left: "18%", color: "#22c55e" },
              { top: "55%", left: "30%", color: "#f97316" },
              { top: "38%", left: "52%", color: "#3b82f6" },
              { top: "68%", left: "62%", color: "#a855f7" },
              { top: "30%", left: "78%", color: "#14b8a6" },
              { top: "60%", left: "84%", color: "#eab308" },
            ].map((p, i) => (
              <span
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow"
                style={{ top: p.top, left: p.left, backgroundColor: p.color }}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-[11px] text-muted-foreground bg-background/70 px-3 py-1 rounded-full">
                Live map coming soon
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
              {MAP_LEGEND.map((l) => (
                <span key={l.label} className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full border border-white/60" style={{ backgroundColor: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
            <button
              onClick={() => navigate("/planning-alerts")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground font-mono text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Open Planning Hub
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MorningBriefing;
