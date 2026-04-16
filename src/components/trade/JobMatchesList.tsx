import { Briefcase, MapPin, Clock, ChevronRight } from "lucide-react";

interface JobMatch {
  id: string;
  estimated_value: string | null;
  notified_at: string;
  status: string;
  jobs: {
    title: string | null;
    job_type: string;
    postcode: string;
    description: string;
  } | null;
}

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const JobMatchesList = ({ matches }: { matches: JobMatch[] }) => (
  <section>
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-heading text-primary text-2xl">New Job Matches</h2>
      <span className="bg-secondary/10 text-secondary font-mono text-xs px-3 py-1 rounded-full">
        {matches.length} new
      </span>
    </div>

    {matches.length === 0 ? (
      <div className="bg-card rounded-2xl p-8 border border-primary/10 text-center">
        <Briefcase className="w-10 h-10 text-primary/20 mx-auto mb-3" />
        <p className="font-mono text-sm text-muted-foreground">
          No new job matches yet. We'll notify you when relevant jobs appear in your area.
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {matches.map((match) => (
          <div key={match.id} className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-heading text-primary text-lg">
                  {match.jobs?.title || match.jobs?.job_type || "Job"}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {match.jobs?.postcode}
                  </span>
                  {match.estimated_value && (
                    <span className="font-mono text-xs text-secondary font-semibold">
                      Est. {match.estimated_value}
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {timeAgo(match.notified_at)}
                  </span>
                </div>
                <p className="font-mono text-xs text-muted-foreground mt-2 line-clamp-2">
                  {match.jobs?.description}
                </p>
              </div>
              <button className="flex items-center gap-1 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap ml-4 shadow-sm">
                View & Quote
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
);

export default JobMatchesList;
