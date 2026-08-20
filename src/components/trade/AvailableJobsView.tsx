import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDrawerNavigate } from "@/hooks/useDrawerNavigate";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, MapPin, Clock, ChevronRight, ShieldCheck, Leaf, Hand, Check } from "lucide-react";
import { isGreenTrade } from "@/lib/greenTrades";
import { registerJobInterest, registerJobViewed } from "@/lib/jobInterest";
import { toast } from "sonner";

interface JobMatchRow {
  id: string;
  job_id: string;
  estimated_value: string | null;
  notified_at: string;
  status: string;
  interested_at: string | null;
}


interface JobRow {
  id: string;
  title: string | null;
  job_type: string;
  postcode: string;
  description: string;
  funds_verified: boolean | null;
  is_green_job: boolean | null;
  created_at: string;
}

interface Match extends JobMatchRow {
  job: JobRow | null;
}

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const AvailableJobsView = ({ tradeId }: { tradeId: string }) => {
  const navigate = useNavigate();
  const openDrawer = useDrawerNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [fundsOnly, setFundsOnly] = useState(false);
  const [greenOnly, setGreenOnly] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const markInterested = async (match: Match) => {
    setSavingId(match.id);
    const res = await registerJobInterest({
      matchId: match.id,
      jobId: match.job_id,
      tradeId,
    });
    setSavingId(null);
    if (!res.ok) {
      toast.error("Couldn't register your interest. Please try again.");
      return;
    }
    setMatches((prev) =>
      prev.map((m) => (m.id === match.id ? { ...m, interested_at: new Date().toISOString() } : m)),
    );
    toast.success("Interest registered — you're logged as interested in this job.");
  };



  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data: matchRows, error } = await supabase
        .from("job_matches")
        .select("id, job_id, estimated_value, notified_at, status, interested_at")
        .eq("trade_id", tradeId)
        .eq("status", "notified")
        .order("notified_at", { ascending: false });

      if (error) {
        console.error("Failed to load job matches", error);
        if (!cancelled) {
          setMatches([]);
          setLoading(false);
        }
        return;
      }

      const ids = Array.from(new Set((matchRows || []).map((m) => m.job_id)));
      const { data: jobsRows } = ids.length
        ? await supabase
            .from("jobs")
            .select("id, title, job_type, postcode, description, funds_verified, is_green_job, created_at")
            .in("id", ids)
        : { data: [] as JobRow[] };

      const byId = new Map((jobsRows || []).map((j: any) => [j.id, j as JobRow]));
      const hydrated: Match[] = (matchRows || []).map((m) => ({
        ...m,
        job: byId.get(m.job_id) ?? null,
      }));

      if (!cancelled) {
        setMatches(hydrated);
        setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tradeId]);

  const visible = matches.filter((m) => {
    if (fundsOnly && !m.job?.funds_verified) return false;
    if (greenOnly && !(m.job?.is_green_job || (m.job?.job_type && isGreenTrade(m.job.job_type)))) return false;
    return true;
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-heading text-primary text-2xl flex items-center gap-2">
            <Briefcase className="w-5 h-5" /> Available Jobs
          </h2>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            All open job matches assigned to you. Win the work by submitting a competitive quote.
          </p>
        </div>
        <span className="bg-secondary/10 text-secondary font-mono text-xs px-3 py-1 rounded-full">
          {visible.length} available
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer select-none bg-card border border-primary/10 rounded-xl px-3 py-2">
          <input
            type="checkbox"
            checked={fundsOnly}
            onChange={(e) => setFundsOnly(e.target.checked)}
            className="w-3.5 h-3.5 accent-secondary"
          />
          <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
            Funds verified only
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none bg-card border border-primary/10 rounded-xl px-3 py-2">
          <input
            type="checkbox"
            checked={greenOnly}
            onChange={(e) => setGreenOnly(e.target.checked)}
            className="w-3.5 h-3.5 accent-secondary"
          />
          <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
            Green jobs only
          </span>
        </label>
      </div>

      {loading ? (
        <div className="bg-card rounded-2xl p-8 border border-primary/10 text-center font-mono text-sm text-muted-foreground">
          Loading available jobs…
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 border border-primary/10 text-center">
          <Briefcase className="w-10 h-10 text-primary/20 mx-auto mb-3" />
          {matches.length === 0 ? (
            <>
              <p className="font-heading text-primary text-lg mb-1">
                No matched homeowner jobs yet
              </p>
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
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => navigate("/planning-alerts")}
                  className="inline-flex items-center gap-1 border border-secondary/40 text-secondary font-mono text-xs px-4 py-2 rounded-xl hover:bg-secondary/10 transition-colors"
                >
                  View Planning Hub
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </>
          ) : (
            <p className="font-mono text-sm text-muted-foreground">
              No jobs match your filters. Try clearing them.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((match) => (
            <div
              key={match.id}
              className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-heading text-primary text-lg leading-tight">
                {match.job?.title || match.job?.job_type || "Job"}
              </h3>

              <div className="flex items-center gap-2 flex-wrap mt-2">
                {match.job?.funds_verified && (
                  <span className="inline-flex items-center gap-1 bg-secondary/10 text-secondary font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Funds Verified
                  </span>
                )}
                {(match.job?.is_green_job || (match.job?.job_type && isGreenTrade(match.job.job_type))) && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full">
                    <Leaf className="w-3 h-3" />
                    Green
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 bg-primary/5 text-primary font-mono text-[11px] px-2.5 py-1.5 rounded-full">
                  <MapPin className="w-3 h-3" />
                  {match.job?.postcode}
                </span>
                {match.estimated_value && (
                  <span className="inline-flex items-center gap-1.5 bg-secondary/15 text-secondary font-mono text-[11px] font-semibold px-2.5 py-1.5 rounded-full">
                    Est. {match.estimated_value}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 bg-primary/5 text-primary/70 font-mono text-[11px] px-2.5 py-1.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  Matched {timeAgo(match.notified_at)}
                </span>
              </div>

              <p className="font-mono text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-3">
                {match.job?.description}
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    if (!match.job_id) return;
                    void registerJobViewed(match.job_id, tradeId);
                    openDrawer(`/project/${match.job_id}`);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-1 bg-secondary text-secondary-foreground font-mono text-sm font-semibold px-5 min-h-[44px] rounded-xl hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                >
                  View &amp; Quote
                  <ChevronRight className="w-3 h-3" />
                </button>

                {match.interested_at ? (
                  <span className="w-full sm:w-auto flex items-center justify-center gap-1.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 font-mono text-sm px-5 min-h-[44px] rounded-xl">
                    <Check className="w-3.5 h-3.5" />
                    Interest registered
                  </span>
                ) : (
                  <button
                    disabled={savingId === match.id}
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

export default AvailableJobsView;
