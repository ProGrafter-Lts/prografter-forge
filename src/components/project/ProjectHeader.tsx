import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, ShieldCheck, Star } from "lucide-react";
import { GreenLeafBadge } from "@/lib/greenTrades";
import { formatStatusLabel } from "@/lib/statusLabel";
import heroProject from "@/assets/dashboard/hero-project.jpg";

interface ProjectHeaderProps {
  job: {
    title: string | null;
    job_type: string;
    status: string;
    is_green_job: boolean;
    created_at: string;
  };
  tradeName: string;
  tradeVerified: boolean;
  tradeRating: number;
  /** Number of published reviews backing the rating. Zero = not yet rated. */
  tradeReviewCount?: number;
  homeownerName: string;
  contractValue: number;
  /** 0–100 — derived from completed stages on the parent page. */
  progress: number;
  /** Project start (e.g. earliest stage planned_start, or contract activation). */
  startDate?: string | null;
  /** Project end (latest stage planned_end). */
  endDate?: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  open: "bg-teal/10 text-teal",
  matched: "bg-blue-100 text-blue-700",
  active: "bg-amber-100 text-amber-700",
  in_progress: "bg-amber-100 text-amber-700",
  complete: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
};

const dayDiff = (a: Date, b: Date) =>
  Math.floor((a.getTime() - b.getTime()) / 86400000);

const computeSchedule = (start?: string | null, end?: string | null) => {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  const total = Math.max(1, dayDiff(e, s) + 1);
  const elapsed = Math.max(0, dayDiff(new Date(), s) + 1);
  if (elapsed > total) {
    return { current: total, total, overdue: true };
  }
  return { current: elapsed, total, overdue: false };
};

/** Small labelled fact used along the bottom of the hero. */
const HeroFact = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="min-w-0">
    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </p>
    <div className="mt-1 flex flex-wrap items-center gap-1.5 font-body text-sm font-semibold text-foreground">
      {children}
    </div>
  </div>
);

const ProjectHeader = ({
  job,
  tradeName,
  tradeVerified,
  tradeRating,
  tradeReviewCount = 0,
  homeownerName,
  contractValue,
  progress,
  startDate,
  endDate,
}: ProjectHeaderProps) => {
  const schedule = computeSchedule(startDate, endDate);
  const statusLabel = formatStatusLabel(job.status);

  return (
    <div className="td-surface">
      <img
        src={heroProject}
        alt=""
        aria-hidden="true"
        width={1600}
        height={900}
        className="td-img"
      />
      <div className="td-veil" />
      <div className="td-content p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-teal-300">
              Residential project
            </p>
            <h1 className="font-heading text-3xl md:text-5xl uppercase tracking-wide text-foreground flex items-center gap-3 mt-2">
              {job.title || job.job_type}
              {job.is_green_job && <GreenLeafBadge />}
            </h1>
            {schedule && (
              <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                Day {schedule.current} of {schedule.total}
                {schedule.overdue && (
                  <span className="text-rose-400 font-semibold">— overdue</span>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <Badge className={STATUS_BADGE[job.status] || "bg-navy/10 text-navy"}>
              {statusLabel}
            </Badge>
            {contractValue > 0 && (
              <span className="font-heading text-teal-300 text-3xl md:text-4xl">
                £{contractValue.toLocaleString()}
              </span>
            )}
            <p className="td-note hidden md:block font-normal text-sm mt-2">
              Real projects. Real progress.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 pt-5">
          <HeroFact label="Trade">
            <span className="truncate">{tradeName}</span>
            {tradeVerified && <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />}
          </HeroFact>
          <HeroFact label="Homeowner">
            <span className="truncate">{homeownerName}</span>
          </HeroFact>
          <HeroFact label="Rating">
            {tradeReviewCount > 0 && tradeRating > 0 ? (
              <span className="flex items-center gap-1 text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {tradeRating.toFixed(1)}
                <span className="text-muted-foreground font-normal">
                  ({tradeReviewCount})
                </span>
              </span>
            ) : (
              <span className="italic font-normal text-muted-foreground">
                Awaiting first review
              </span>
            )}
          </HeroFact>
          <HeroFact label="Progress">
            <span>{progress}%</span>
          </HeroFact>
        </div>

        <div className="mt-4">
          <Progress value={progress} className="h-2.5 bg-white/10" />
          <div className="flex items-center justify-between gap-3 mt-2">
            <p className="td-note md:hidden font-normal text-xs">
              Plans. People. Progress.
            </p>
            <p className="hidden md:block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
              Plans. People. Progress.
            </p>
            <p className="font-mono text-xs text-muted-foreground text-right">
              {progress}% of payment milestones complete
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;
