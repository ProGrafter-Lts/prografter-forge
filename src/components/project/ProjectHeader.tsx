import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, ShieldCheck, Star } from "lucide-react";
import { GreenLeafBadge } from "@/lib/greenTrades";

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

const ProjectHeader = ({
  job,
  tradeName,
  tradeVerified,
  tradeRating,
  homeownerName,
  contractValue,
  progress,
  startDate,
  endDate,
}: ProjectHeaderProps) => {
  const schedule = computeSchedule(startDate, endDate);
  const statusLabel = job.status.replace(/_/g, " ");

  return (
    <div className="bg-white rounded-2xl p-6 border border-navy/10 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-navy text-3xl md:text-4xl flex items-center gap-2">
            {job.title || job.job_type}
            {job.is_green_job && <GreenLeafBadge />}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 font-mono text-xs text-secondary-text">
            <span className="flex items-center gap-1">
              Trade: <span className="text-navy font-semibold">{tradeName}</span>
              {tradeVerified && <ShieldCheck className="w-3.5 h-3.5 text-teal" />}
              {tradeRating > 0 && (
                <span className="flex items-center gap-0.5 text-amber-500">
                  <Star className="w-3 h-3 fill-amber-500" /> {tradeRating.toFixed(1)}
                </span>
              )}
            </span>
            <span>·</span>
            <span>Homeowner: <span className="text-navy font-semibold">{homeownerName}</span></span>
            {schedule && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Day {schedule.current} of {schedule.total}
                  {schedule.overdue && <span className="text-rose-600 font-semibold ml-1">— overdue</span>}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={STATUS_BADGE[job.status] || "bg-navy/10 text-navy"}>
            {statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}
          </Badge>
          {contractValue > 0 && (
            <span className="font-heading text-teal text-2xl">£{contractValue.toLocaleString()}</span>
          )}
        </div>
      </div>
      <div className="mt-4">
        <Progress value={progress} className="h-3 bg-navy/10" />
        <p className="font-mono text-xs text-secondary-text mt-1 text-right">{progress}% complete</p>
      </div>
    </div>
  );
};

export default ProjectHeader;
