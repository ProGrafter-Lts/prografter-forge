import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  PoundSterling,
} from "lucide-react";
import {
  buildProjectActions,
  formatPence,
  HEALTH_LABEL,
  type ProjectSnapshot,
} from "@/lib/projectSpine";
import projectPlaceholder from "@/assets/dashboard/hero-project.jpg";

const dateLabel = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "To be confirmed";

const HEALTH_STYLE: Record<ProjectSnapshot["health"], string> = {
  on_programme: "bg-secondary/15 text-secondary border-secondary/30",
  attention: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  delayed: "bg-destructive/15 text-destructive border-destructive/30",
};

/**
 * HOMEOWNER PROJECT-FIRST PANEL.
 * "What is happening with my project?" — reads the shared project spine, so it
 * always agrees with the trade's operational view of the same project.
 */
const ProjectFocusCard = ({ snapshot }: { snapshot: ProjectSnapshot }) => {
  const navigate = useNavigate();
  const actions = buildProjectActions(snapshot, "homeowner");
  const update = snapshot.latestUpdate;

  const todayLine =
    update?.work_completed ||
    update?.update_text ||
    "No site update posted yet.";
  const nextLine =
    update?.tomorrow_plan ||
    (snapshot.nextStage ? `Next up: ${snapshot.nextStage.stage_name}.` : "Your trade will post the next step here.");

  const thumb =
    (Array.isArray(update?.photo_urls) && update?.photo_urls?.[0]) || projectPlaceholder;

  return (
    <section className="space-y-4">
      {/* Project header — the dominant element on the dashboard */}
      <div className="ho-hero">
        <img src={projectPlaceholder} alt="" aria-hidden="true" className="ho-img" />
        <div className="ho-veil" />
        <div className="ho-content p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <img
                src={thumb}
                alt=""
                aria-hidden="true"
                className="hidden sm:block w-28 h-24 object-cover rounded-xl border border-white/10 shrink-0"
              />
              <div className="min-w-0">
                <p className="ho-metric-label font-mono">Active project</p>
                <h2 className="font-heading text-primary text-2xl md:text-3xl mt-1 uppercase tracking-tight">
                  {snapshot.title}
                </h2>
                {(snapshot.address || snapshot.postcode) && (
                  <p className="font-mono text-xs text-muted-foreground mt-1">
                    {[snapshot.address, snapshot.postcode].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
            <span className={`font-mono text-[11px] px-3 py-1.5 rounded-full border ${HEALTH_STYLE[snapshot.health]}`}>
              {HEALTH_LABEL[snapshot.health]}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="ho-metric-label font-mono">Current stage</p>
              <p className="font-heading text-primary text-lg mt-1">
                {snapshot.currentStage?.stage_name ?? (snapshot.stages.length ? "All stages complete" : "Being set up")}
              </p>
            </div>
            <div>
              <p className="ho-metric-label font-mono">Expected completion</p>
              <p className="font-heading text-primary text-lg mt-1">{dateLabel(snapshot.expectedCompletion)}</p>
            </div>
            <div>
              <p className="ho-metric-label font-mono">Project value</p>
              <p className="font-heading text-primary text-lg mt-1">{formatPence(snapshot.currentProjectValuePence)}</p>
            </div>
            <div>
              <p className="ho-metric-label font-mono">Progress</p>
              <p className="font-heading text-primary text-lg mt-1">{snapshot.progressPercent}%</p>
            </div>
          </div>

          <div className="ho-progress">
            <span style={{ width: `${Math.max(0, Math.min(100, snapshot.progressPercent))}%` }} />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="ho-panel ho-panel-quiet p-4">
              <p className="ho-metric-label font-mono">Today</p>
              <p className="font-mono text-sm text-primary mt-1 leading-relaxed">{todayLine}</p>
            </div>
            <div className="ho-panel ho-panel-quiet p-4">
              <p className="ho-metric-label font-mono">Next</p>
              <p className="font-mono text-sm text-primary mt-1 leading-relaxed">{nextLine}</p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/project/${snapshot.jobId}`)}
            className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
          >
            Open project <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Action required — only when something is genuinely waiting */}
      {actions.length > 0 && (
        <div className="ho-panel ho-panel-amber p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Action required
          </p>
          <div className="mt-3 space-y-2">
            {actions.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(a.to)}
                className="w-full flex items-center justify-between gap-3 text-left rounded-xl border border-border px-4 py-3 hover:border-secondary/40 transition-colors"
              >
                <span>
                  <span className="font-mono text-sm text-primary block">{a.label}</span>
                  {a.detail && <span className="font-mono text-xs text-muted-foreground">{a.detail}</span>}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Latest site update */}
      <div className="ho-panel p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" /> Latest site update
        </p>
        {!update ? (
          <p className="font-mono text-sm text-muted-foreground mt-3">
            Your trade's daily updates will appear here once work begins.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="font-mono text-xs text-muted-foreground">
              {dateLabel(update.entry_date ?? update.created_at)}
              {update.stage_name ? ` · ${update.stage_name}` : ""}
              {update.trade_name ? ` · ${update.trade_name}` : ""}
            </p>
            {update.work_completed && <p className="font-mono text-sm text-primary">{update.work_completed}</p>}
            {!update.work_completed && update.update_text && (
              <p className="font-mono text-sm text-primary">{update.update_text}</p>
            )}
            {update.issues_found && (
              <p className="font-mono text-sm text-amber-400">Issue noted: {update.issues_found}</p>
            )}
            {update.delay_reason && (
              <p className="font-mono text-sm text-destructive">Delay: {update.delay_reason}</p>
            )}
            {Array.isArray(update.photo_urls) && update.photo_urls.length > 0 && (
              <div className="flex gap-2 flex-wrap pt-1">
                {update.photo_urls.slice(0, 4).map((u) => (
                  <img key={u} src={u} alt="Site update" className="w-20 h-20 object-cover rounded-lg border border-border" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upcoming + financial position */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="ho-panel p-5 space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <CalendarClock className="w-3.5 h-3.5" /> Upcoming
          </p>
          <Row label="Next milestone" value={snapshot.nextStage?.stage_name ?? "—"} />
          <Row label="Planned start" value={dateLabel(snapshot.nextStage?.planned_start)} />
          <Row
            label="Next payment"
            value={
              snapshot.nextPaymentStage
                ? `${snapshot.nextPaymentStage.stage_name} · ${formatPence(
                    Math.round(Number(snapshot.nextPaymentStage.payment_amount ?? 0) * 100),
                  )}`
                : "None scheduled"
            }
          />
        </div>

        <div className="ho-panel p-5 space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <PoundSterling className="w-3.5 h-3.5" /> Project financial position
          </p>
          <Row label="Original contract" value={formatPence(snapshot.contractValuePence)} />
          <Row label="Approved variations" value={formatPence(snapshot.approvedVariationsPence)} />
          <Row label="Current project value" value={formatPence(snapshot.currentProjectValuePence)} strong />
          <Row label="Paid to date" value={formatPence(snapshot.paidPence)} />
          <Row
            label="Remaining"
            value={formatPence(
              snapshot.currentProjectValuePence != null
                ? snapshot.currentProjectValuePence - snapshot.paidPence
                : null,
            )}
          />
        </div>
      </div>

      {snapshot.progressPercent === 100 && (
        <div className="ho-panel ho-panel-accent p-5 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-secondary" />
          <p className="font-mono text-sm text-primary">
            Every stage is complete — your project documents stay available in your manual.
          </p>
        </div>
      )}
    </section>
  );
};

const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="font-mono text-xs text-muted-foreground">{label}</span>
    <span className={`font-mono text-sm ${strong ? "text-secondary" : "text-primary"}`}>{value}</span>
  </div>
);

export default ProjectFocusCard;
