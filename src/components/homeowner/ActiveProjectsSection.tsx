import { useDrawerNavigate } from "@/hooks/useDrawerNavigate";
import { FolderKanban, MapPin, Clock, FileText, Users, SearchCheck, MessageSquarePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isActiveJob } from "@/lib/activeProjects";
import { getStatusBadge } from "@/lib/statusBadge";

interface Job {
  id: string;
  title: string | null;
  job_type: string;
  postcode: string;
  status: string;
  stage: string;
  created_at: string;
}

interface Quote {
  amount: number;
  status: string;
  job_id: string;
}

interface SiteUpdate {
  id: string;
  update_text?: string;
  created_at: string;
  job_id?: string | null;
}

interface Brief {
  job_title?: string | null;
  matched_trade_count?: number | null;
}

interface Props {
  jobs: Job[];
  quoteCounts: Record<string, number>;
  activeJobs?: Job[];
  quotes?: Quote[];
  siteUpdates?: SiteUpdate[];
  briefs?: Brief[];
}

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="font-heading text-primary text-sm truncate mt-0.5">{value}</p>
  </div>
);

const ActiveProjectsSection = ({
  jobs,
  quoteCounts,
  activeJobs: activeJobsProp,
  quotes = [],
  siteUpdates = [],
  briefs = [],
}: Props) => {
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
          const jobQuotes = quotes.filter((q) => q.job_id === job.id);
          const acceptedQuote = jobQuotes.find((q) => q.status === "accepted");
          const latestUpdate = siteUpdates
            .filter((u) => u.job_id === job.id)
            .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0];
          const matchedBrief = briefs.find(
            (b) => b.job_title && job.title && b.job_title === job.title,
          );
          const matchedCount = matchedBrief?.matched_trade_count ?? null;

          const badge =
            count > 0 && job.status === "awaiting_quotes"
              ? getStatusBadge("quote_received")
              : getStatusBadge(job.status);

          const nextAction = acceptedQuote
            ? "Sign contract & schedule works"
            : count > 0
              ? "Review your quote"
              : job.status === "awaiting_quotes"
                ? "Awaiting matched trades"
                : "Track progress";

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
                <Badge style={badge.style} className={`${badge.className} whitespace-nowrap`}>{badge.label}</Badge>
              </div>

              {/* Operational metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-border">
                {matchedCount != null && (
                  <Metric label="Trades matched" value={String(matchedCount)} />
                )}
                <Metric label="Quotes received" value={String(count)} />
                {acceptedQuote ? (
                  <Metric label="Project value" value={`£${Number(acceptedQuote.amount).toLocaleString()}`} />
                ) : (
                  <Metric label="Status" value={badge.label} />
                )}
                <Metric
                  label="Latest update"
                  value={latestUpdate ? timeAgo(latestUpdate.created_at) : "—"}
                />
                <Metric label="Next action" value={nextAction} />
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
                    {count >= 2 ? `Compare ${count} Quotes` : "View Quote"}
                  </button>
                )}
                {count > 0 && !acceptedQuote && (
                  <a
                    href="/quote-checker"
                    className="border border-border text-primary font-mono text-xs px-4 py-2 rounded-xl hover:bg-muted transition-colors inline-flex items-center gap-1.5"
                  >
                    <SearchCheck className="w-3.5 h-3.5" /> Run Quote Check
                  </a>
                )}
                <button
                  disabled
                  aria-disabled="true"
                  title="Coming soon"
                  className="border border-border text-muted-foreground/60 font-mono text-xs px-4 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-not-allowed"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" /> Post Update
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ActiveProjectsSection;
