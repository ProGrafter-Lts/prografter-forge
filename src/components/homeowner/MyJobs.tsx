import { useNavigate } from "react-router-dom";
import { MapPin, FolderKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatStatusLabel } from "@/lib/statusLabel";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-secondary/10 text-secondary",
  matched: "bg-blue-100 text-blue-700",
  active: "bg-amber-100 text-amber-700",
  complete: "bg-green-100 text-green-700",
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

interface Job {
  id: string;
  title: string | null;
  job_type: string;
  postcode: string;
  status: string;
  created_at: string;
}

const MyJobs = ({ jobs }: { jobs: Job[] }) => {
  const navigate = useNavigate();

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-heading text-primary text-2xl">All Posted Jobs</h2>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Every job you've posted on ProGrafter, in any status.
          </p>
        </div>
        <a
          href="/post-a-job"
          className="font-mono text-xs text-secondary hover:opacity-80 transition-opacity"
        >
          + Post Another Job
        </a>
      </div>
      {jobs.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 border border-border text-center">
          <FolderKanban className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-mono text-sm text-muted-foreground">You haven't posted any jobs yet.</p>
          <a
            href="/post-a-job"
            className="inline-block mt-4 bg-secondary text-secondary-foreground font-mono text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
          >
            Post a Job
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => navigate(`/project/${job.id}`)}
              className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center justify-between cursor-pointer hover:border-secondary/30 hover:shadow-md transition-all"
            >
              <div>
                <h3 className="font-heading text-primary text-lg">{job.title || job.job_type}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {job.postcode}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{timeAgo(job.created_at)}</span>
                </div>
              </div>
              <Badge className={STATUS_COLORS[job.status] || "bg-muted text-primary"}>
                {formatStatusLabel(job.status)}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default MyJobs;
