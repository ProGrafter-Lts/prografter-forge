import { FolderKanban, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

interface ActiveProject {
  id: string;
  title: string | null;
  job_type: string;
  postcode: string;
  stage: string;
}

const STAGES = ["enquiry", "quoting", "scheduled", "in_progress", "review", "completed"];

const getStageProgress = (stage: string) => {
  const idx = STAGES.indexOf(stage);
  return idx === -1 ? 0 : Math.round(((idx + 1) / STAGES.length) * 100);
};

const formatStage = (stage: string) =>
  stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const ActiveProjectsList = ({ projects }: { projects: ActiveProject[] }) => {
  const navigate = useNavigate();
  return (
  <section>
    <h2 className="font-heading text-primary text-2xl mb-4">Active Projects</h2>

    {projects.length === 0 ? (
      <div className="bg-card rounded-2xl p-8 border border-primary/10 text-center">
        <FolderKanban className="w-10 h-10 text-primary/20 mx-auto mb-3" />
        <p className="font-heading text-primary text-lg mb-1">No active projects yet</p>
        <p className="font-mono text-xs text-muted-foreground mb-4 max-w-md mx-auto">
          Projects you win through ProGrafter will appear here with milestones, documents, messages,
          payment stages and site updates.
        </p>
        <button
          onClick={() => navigate("/dashboard/trade?view=jobs")}
          className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          Browse Available Jobs
        </button>
      </div>
    ) : (
      <div className="space-y-3">
        {projects.map((project) => (
          <div key={project.id} className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-heading text-primary text-lg">
                  {project.title || project.job_type}
                </h3>
                <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {project.postcode}
                </span>
              </div>
              <span className="bg-primary/10 text-primary font-mono text-xs px-3 py-1 rounded-full">
                {formatStage(project.stage)}
              </span>
            </div>
            <Progress value={getStageProgress(project.stage)} className="h-2 bg-primary/10" />
            <p className="font-mono text-[10px] text-muted-foreground mt-1 text-right">
              {getStageProgress(project.stage)}% complete
            </p>
          </div>
        ))}
      </div>
    )}
  </section>
  );
};

export default ActiveProjectsList;
