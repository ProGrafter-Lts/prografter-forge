import { useNavigate } from "react-router-dom";
import { useDrawerNavigate } from "@/hooks/useDrawerNavigate";
import { FolderKanban, MapPin, Clock, FileText, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isActiveJob } from "@/lib/activeProjects";
import { formatStatusLabel } from "@/lib/statusLabel";

interface Job {
  id: string;
  title: string | null;
  job_type: string;
  postcode: string;
  status: string;
  stage: string;
  created_at: string;
}

interface Props {
  jobs: Job[];
  quoteCounts: Record<string, number>;
  /** Optional pre-filtered active jobs from the server RPC. When provided this is
   *  used as the authoritative list; otherwise we fall back to client-side
   *  derivation via isActiveJob. */
  activeJobs?: Job[];
}

// Active stages handled centrally in src/lib/activeProjects.ts

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  awaiting_quotes: { label: "Awaiting Quotes", className: "bg-amber-100 text-amber-800" },
  matched: { label: "Trade Matched", className: "bg-blue-100 text-blue-800" },
  in_progress: { label: "In Progress", className: "bg-secondary/15 text-secondary" },
  review: { label: "In Review", className: "bg-purple-100 text-purple-800" },
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const ActiveProjectsSection = ({ jobs, quoteCounts, activeJobs: activeJobsProp }: Props) => {
  const navigate = useNavigate();
  const openDrawer = useDrawerNavigate();

  const activeJobs = activeJobsProp ?? jobs.filter(isActiveJob);

  if (activeJobs.length === 0) {
    return (
      <section>
        <h2 className="font-heading text-primary text-2xl mb-4">Active Projects</h2>
        <div className="bg-card rounded-2xl p-8 border border-border text-center">
          <FolderKanban className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-mono text-sm text-muted-foreground">
            No active projects yet. Post a job to get started!
          </p>
          <a
            href="/post-a-job"
            className="inline-block mt-4 bg-secondary text-secondary-foreground font-mono text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
          >
            Post a Job
          </a>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-heading text-primary text-2xl mb-4">Active Projects</h2>
      <div className="space-y-3">
        {activeJobs.map((job) => {
          const count = quoteCounts[job.id] ?? 0;
          const badge =
            count > 0 && job.status === "awaiting_quotes"
              ? { label: `${count} Quote${count > 1 ? "s" : ""} Received`, className: "bg-secondary/15 text-secondary" }
              : STATUS_BADGE[job.status] ??
                { label: formatStatusLabel(job.status), className: "bg-muted text-primary" };

          return (
            <div
              key={job.id}
              className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:border-secondary/30 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-primary text-lg truncate">
                    {job.title || job.job_type}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {job.postcode}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> Posted {timeAgo(job.created_at)}
                    </span>
                  </div>
                </div>
                <Badge className={`${badge.className} whitespace-nowrap`}>{badge.label}</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button
                  onClick={() => openDrawer(`/project/${job.id}`)}
                  className="bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm inline-flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> View Project
                </button>
                {count > 0 && (
                  <button
                    onClick={() => openDrawer(`/project/${job.id}/compare`)}
                    className="border border-secondary/40 text-secondary font-mono text-xs px-4 py-2 rounded-xl hover:bg-secondary/5 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    {count >= 2 ? `Compare ${count} Quotes` : `View Quote`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ActiveProjectsSection;
