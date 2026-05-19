import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FolderKanban, MapPin, ChevronRight, MessageSquare } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProjectRow {
  id: string;
  title: string | null;
  job_type: string;
  postcode: string;
  stage: string;
  status: string;
  agreed_price: number | null;
}

const STAGES = ["enquiry", "quoting", "scheduled", "in_progress", "review", "completed"];

const stageProgress = (stage: string) => {
  const idx = STAGES.indexOf(stage);
  return idx === -1 ? 0 : Math.round(((idx + 1) / STAGES.length) * 100);
};

const formatStage = (stage: string) =>
  stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const ActiveProjectsView = ({ tradeId }: { tradeId: string }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("contracts")
        .select("agreed_price, jobs(id, title, job_type, postcode, stage, status)")
        .eq("trade_id", tradeId);

      if (error) {
        console.error("Failed to load projects", error);
        if (!cancelled) {
          setProjects([]);
          setLoading(false);
        }
        return;
      }

      const seen = new Map<string, ProjectRow>();
      (data || []).forEach((row: any) => {
        const job = row.jobs;
        if (!job) return;
        if (!seen.has(job.id)) {
          seen.set(job.id, {
            id: job.id,
            title: job.title,
            job_type: job.job_type,
            postcode: job.postcode,
            stage: job.stage,
            status: job.status,
            agreed_price: row.agreed_price ? Number(row.agreed_price) : null,
          });
        }
      });

      if (!cancelled) {
        setProjects(Array.from(seen.values()));
        setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tradeId]);

  const filtered = projects.filter((p) => {
    if (filter === "all") return true;
    if (filter === "completed") return p.stage === "completed";
    return p.stage !== "completed";
  });

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-primary text-2xl flex items-center gap-2">
          <FolderKanban className="w-5 h-5" /> Active Projects
        </h2>
        <p className="font-mono text-xs text-muted-foreground mt-1">
          Projects you've won. Track stage progress, message homeowners and log site updates.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(["active", "completed", "all"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`font-mono text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-full border transition-colors ${
              filter === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-primary/10 hover:border-primary/30"
            }`}
          >
            {key === "active" ? "Active" : key === "completed" ? "Completed" : "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-card rounded-2xl p-8 border border-primary/10 text-center font-mono text-sm text-muted-foreground">
          Loading projects…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 border border-primary/10 text-center">
          <FolderKanban className="w-10 h-10 text-primary/20 mx-auto mb-3" />
          {projects.length === 0 ? (
            <>
              <p className="font-mono text-sm text-muted-foreground mb-4">
                No active projects yet. Head to Available Jobs to submit your first quote.
              </p>
              <button
                onClick={() => navigate("/dashboard/trade?view=jobs")}
                className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
              >
                Browse Available Jobs
                <ChevronRight className="w-3 h-3" />
              </button>
            </>
          ) : (
            <p className="font-mono text-sm text-muted-foreground">
              Nothing here for this filter.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                <div className="min-w-0">
                  <h3 className="font-heading text-primary text-lg truncate">
                    {project.title || project.job_type}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {project.postcode}
                    </span>
                    {project.agreed_price && (
                      <span className="font-mono text-xs text-secondary font-semibold">
                        £{project.agreed_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <span className="bg-primary/10 text-primary font-mono text-xs px-3 py-1 rounded-full whitespace-nowrap">
                  {formatStage(project.stage)}
                </span>
              </div>

              <Progress value={stageProgress(project.stage)} className="h-2 bg-primary/10" />
              <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                <p className="font-mono text-[10px] text-muted-foreground">
                  {stageProgress(project.stage)}% complete
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Open project
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ActiveProjectsView;
