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
  progress: number;
  estimatedDays?: number;
}

const STATUS_BADGE: Record<string, string> = {
  open: "bg-teal/10 text-teal",
  matched: "bg-blue-100 text-blue-700",
  active: "bg-amber-100 text-amber-700",
  complete: "bg-green-100 text-green-700",
};

const daysSince = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

const ProjectHeader = ({ job, tradeName, tradeVerified, tradeRating, homeownerName, contractValue, progress, estimatedDays }: ProjectHeaderProps) => {
  const currentDay = daysSince(job.created_at);

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
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Day {currentDay}{estimatedDays ? ` of ~${estimatedDays}` : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={STATUS_BADGE[job.status] || "bg-navy/10 text-navy"}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
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
