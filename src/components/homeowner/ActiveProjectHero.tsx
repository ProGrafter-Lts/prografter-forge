import { useNavigate } from "react-router-dom";
import { useDrawerNavigate } from "@/hooks/useDrawerNavigate";
import { MapPin, Clock, BadgeCheck, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const STAGES = ["enquiry", "quoting", "scheduled", "in_progress", "review", "completed"];

interface ActiveProjectHeroProps {
  project: {
    id: string;
    title: string | null;
    job_type: string;
    postcode: string;
    stage: string;
    description: string;
    created_at: string;
  };
  tradeName?: string;
  tradeVerified?: boolean;
  tradeRating?: number;
}

const ActiveProjectHero = ({ project, tradeName, tradeVerified, tradeRating = 0 }: ActiveProjectHeroProps) => {
  const navigate = useNavigate();
  const openDrawer = useDrawerNavigate();
  const stageIdx = STAGES.indexOf(project.stage);
  const progress = stageIdx === -1 ? 0 : Math.round(((stageIdx + 1) / STAGES.length) * 100);
  const dayNumber = Math.floor((Date.now() - new Date(project.created_at).getTime()) / 86400000);
  const formatStage = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className="font-heading text-primary text-2xl">
            {project.title || project.job_type}
          </h2>
          <p className="font-mono text-xs text-muted-foreground mt-1 line-clamp-2">
            {project.description}
          </p>
        </div>
        <Badge className="bg-secondary/10 text-secondary ml-4">
          {formatStage(project.stage)}
        </Badge>
      </div>

      {tradeName && (
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-sm text-primary font-medium">{tradeName}</span>
          {tradeVerified && <BadgeCheck className="w-4 h-4 text-secondary" />}
          {tradeRating > 0 && (
            <span className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${i < tradeRating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
                />
              ))}
            </span>
          )}
        </div>
      )}

      <Progress value={progress} className="h-3 bg-muted" />
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {project.postcode}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Day {dayNumber}
          </span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{progress}% complete</span>
      </div>

      <button
        onClick={() => openDrawer(`/project/${project.id}`)}
        className="mt-4 bg-secondary text-secondary-foreground font-mono text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
      >
        View Project
      </button>
    </div>
  );
};

export default ActiveProjectHero;
