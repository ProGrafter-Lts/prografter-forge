import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, BookOpen, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { projectPath } from "@/lib/projectNav";

interface Props {
  /** Every job for this homeowner. */
  jobs: any[];
}

/**
 * Completed projects are permanent records, not dead archive cards: each one
 * links straight to the full canonical project (messages, photos, documents,
 * payments, history) and to its Homeowner Manual entry for the property.
 */
const CompletedProjectsSection = ({ jobs }: Props) => {
  const completedJobs = jobs.filter(
    (j) => j.stage === "completed" || j.status === "completed" || j.status === "complete",
  );
  const [completions, setCompletions] = useState<Record<string, any>>({});

  useEffect(() => {
    const ids = completedJobs.map((j) => j.id);
    if (ids.length === 0) return;
    let cancelled = false;
    void supabase
      .from("project_completions")
      .select("job_id, completed_at, final_value_pence")
      .in("job_id", ids)
      .then(({ data }) => {
        if (cancelled) return;
        const map: Record<string, any> = {};
        (data || []).forEach((c: any) => (map[c.job_id] = c));
        setCompletions(map);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedJobs.length]);

  if (completedJobs.length === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="font-heading text-primary text-lg flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Completed Projects
      </h3>
      <div className="space-y-3">
        {completedJobs.map((j) => {
          const c = completions[j.id];
          return (
            <div key={j.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-heading text-foreground text-base truncate">
                    {j.title || j.job_type}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {c?.completed_at
                      ? `Completed ${new Date(c.completed_at).toLocaleDateString("en-GB")}`
                      : "Completed"}
                    {c?.final_value_pence != null
                      ? ` · Final value £${(Number(c.final_value_pence) / 100).toLocaleString("en-GB")}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={projectPath(j.id)}
                    className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 font-mono text-[11px] text-foreground"
                  >
                    Project record <ChevronRight className="w-3 h-3" />
                  </Link>
                  <Link
                    to={`/manual/${j.id}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-secondary px-3 py-1.5 font-mono text-[11px] text-secondary-foreground"
                  >
                    <BookOpen className="w-3 h-3" /> Homeowner Manual
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CompletedProjectsSection;
