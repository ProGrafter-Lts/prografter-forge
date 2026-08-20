import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDrawerNavigate } from "@/hooks/useDrawerNavigate";
import { Briefcase, MapPin, Clock, ChevronRight, ShieldCheck, Hand, Check } from "lucide-react";
import { markJobMatchSeen } from "@/hooks/useNewJobMatches";
import { registerJobInterest, registerJobViewed } from "@/lib/jobInterest";
import { toast } from "sonner";

interface JobMatch {
  id: string;
  job_id?: string;
  estimated_value: string | null;
  notified_at: string;
  status: string;
  interested_at?: string | null;
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

const JobMatchesList = ({ matches, tradeId }: { matches: JobMatch[]; tradeId?: string }) => {
  const navigate = useNavigate();
  const openDrawer = useDrawerNavigate();
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [interested, setInterested] = useState<Record<string, boolean>>({});
  const visible = verifiedOnly ? matches.filter((m) => m.jobs?.funds_verified) : matches;
  const hasLive = visible.length > 0;

  const markInterested = async (match: JobMatch) => {
    const jobId = match.jobs?.id || match.job_id;
    if (!jobId || !tradeId) return;
    setSavingId(match.id);
    const res = await registerJobInterest({ matchId: match.id, jobId, tradeId });
    setSavingId(null);
    if (!res.ok) {
      toast.error("Couldn't register your interest. Please try again.");
      return;
    }
    setInterested((p) => ({ ...p, [match.id]: true }));
    toast.success("Interest registered — the homeowner can see you're keen.");
  };


  return (
    <section
      className={hasLive ? "rounded-3xl p-5 md:p-7 border-2 border-secondary/50 shadow-lg" : ""}
      style={hasLive ? { backgroundColor: "hsl(var(--secondary) / 0.12)" } : undefined}
    >
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className={`font-heading text-primary ${hasLive ? "text-3xl md:text-4xl" : "text-2xl"}`}>
            New Job Matches
          </h2>
          {hasLive && (
            <p className="font-mono text-xs text-secondary mt-1 uppercase tracking-widest">
              Live homeowner work — respond first, win more
            </p>
          )}
        </div>
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
          <span
            className={
              hasLive
                ? "bg-secondary text-secondary-foreground font-mono text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm"
                : "bg-secondary/10 text-secondary font-mono text-xs px-3 py-1 rounded-full"
            }
          >
            {visible.length} new
          </span>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 border border-primary/10 text-center">
          <Briefcase className="w-10 h-10 text-primary/20 mx-auto mb-3" />
          {verifiedOnly ? (
            <p className="font-mono text-sm text-muted-foreground">
              No funds-verified job matches right now.
            </p>
          ) : (
            <>
              <p className="font-heading text-primary text-lg mb-1">No matched homeowner jobs yet</p>
              <p className="font-mono text-xs text-muted-foreground mb-4 max-w-md mx-auto">
                We'll notify you when suitable homeowner projects appear in your area. In the
                meantime, complete your profile and check the Planning Hub for upcoming local
                opportunities.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => navigate("/dashboard/trade?view=profile")}
                  className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Improve My Matches
                </button>
                <button
                  onClick={() => navigate("/planning-alerts")}
                  className="inline-flex items-center gap-1 border border-secondary/40 text-secondary font-mono text-xs px-4 py-2 rounded-xl hover:bg-secondary/10 transition-colors"
                >
                  View Planning Hub
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((match) => (
            <div key={match.id} className="bg-card rounded-2xl p-5 md:p-6 border border-secondary/30 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-2 flex-wrap">
                <h3 className="font-heading text-primary text-lg leading-tight w-full">
                  {match.jobs?.title || match.jobs?.job_type || "Job"}
                </h3>
                {match.jobs?.funds_verified && (
                  <span className="inline-flex items-center gap-1 bg-secondary/10 text-secondary font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Funds Verified
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 bg-primary/5 text-primary font-mono text-[11px] px-2.5 py-1.5 rounded-full">
                  <MapPin className="w-3 h-3" />
                  {match.jobs?.postcode}
                </span>
                {match.estimated_value && (
                  <span className="inline-flex items-center gap-1.5 bg-secondary/15 text-secondary font-mono text-[11px] font-semibold px-2.5 py-1.5 rounded-full">
                    Est. {match.estimated_value}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 bg-primary/5 text-primary/70 font-mono text-[11px] px-2.5 py-1.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  {timeAgo(match.notified_at)}
                </span>
              </div>

              <p className="font-mono text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-3">
                {match.jobs?.description}
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    const jobId = match.jobs?.id || match.job_id;
                    markJobMatchSeen(match.id);
                    if (jobId) {
                      if (tradeId) void registerJobViewed(jobId, tradeId);
                      openDrawer(`/project/${jobId}`);
                    }
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground font-mono text-sm font-semibold px-5 min-h-[44px] rounded-xl hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                >
                  View &amp; Quote
                  <ChevronRight className="w-3 h-3" />
                </button>

                {match.interested_at || interested[match.id] ? (
                  <span className="w-full sm:w-auto flex items-center justify-center gap-1.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 font-mono text-sm px-5 min-h-[44px] rounded-xl">
                    <Check className="w-3.5 h-3.5" />
                    Interest registered
                  </span>
                ) : (
                  <button
                    disabled={savingId === match.id || !tradeId}
                    onClick={() => void markInterested(match)}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 border border-secondary/40 text-secondary font-mono text-sm font-semibold px-5 min-h-[44px] rounded-xl hover:bg-secondary/10 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Hand className="w-3.5 h-3.5" />
                    {savingId === match.id ? "Saving…" : "I'm interested"}
                  </button>
                )}
              </div>

            </div>
          ))}

        </div>
      )}
    </section>
  );
};

export default JobMatchesList;
