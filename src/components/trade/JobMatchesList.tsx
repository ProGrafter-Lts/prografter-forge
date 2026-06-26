import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDrawerNavigate } from "@/hooks/useDrawerNavigate";
import { Briefcase, MapPin, Clock, ChevronRight, ShieldCheck } from "lucide-react";

interface JobMatch {
  id: string;
  job_id?: string;
  estimated_value: string | null;
  notified_at: string;
  status: string;
  jobs: {
    id?: string;
    title: string | null;
    job_type: string;
    postcode: string;
    description: string;
    funds_verified?: boolean | null;
  } | null;
}

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const JobMatchesList = ({ matches }: { matches: JobMatch[] }) => {
  const navigate = useNavigate();
  const openDrawer = useDrawerNavigate();
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const visible = verifiedOnly ? matches.filter((m) => m.jobs?.funds_verified) : matches;

  return (
    <section>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="font-heading text-primary text-2xl">New Job Matches</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-3.5 h-3.5 accent-secondary cursor-pointer"
            />
            <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
              Funds Verified only
            </span>
          </label>
          <span className="bg-secondary/10 text-secondary font-mono text-xs px-3 py-1 rounded-full">
            {visible.length} new
          </span>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 border border-primary/10 text-center">
          <Briefcase className="w-10 h-10 text-primary/20 mx-auto mb-3" />
          <p className="font-mono text-sm text-muted-foreground">
            {verifiedOnly
              ? "No funds-verified job matches right now."
              : "No new job matches yet. We'll notify you when relevant jobs appear in your area."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((match) => (
            <div key={match.id} className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading text-primary text-lg">
                      {match.jobs?.title || match.jobs?.job_type || "Job"}
                    </h3>
                    {match.jobs?.funds_verified && (
                      <span className="inline-flex items-center gap-1 bg-secondary/10 text-secondary font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        Funds Verified
                      </span>
                    )}
                  </div>
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
                <button
                  onClick={() => {
                    const jobId = match.jobs?.id || match.job_id;
                    if (jobId) openDrawer(`/project/${jobId}`);
                  }}
                  className="flex items-center gap-1 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap ml-4 shadow-sm cursor-pointer"
                >
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
};

export default JobMatchesList;
