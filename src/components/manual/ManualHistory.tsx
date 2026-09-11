import { History, Home } from "lucide-react";
import { Link } from "react-router-dom";

export interface ManualHistoryEvent {
  date: string | null;
  label: string;
  detail?: string;
}

export interface PropertyProjectRow {
  id: string;
  title: string | null;
  job_type: string;
  completed_at: string | null;
  final_value_pence: number | null;
}

/**
 * Section 8 — permanent project history for this property. Built from records
 * ProGrafter already holds (contract, stages, approved variations, completion)
 * and lists every other completed project at the SAME property, so one property
 * accumulates history over time.
 */
const ManualHistory = ({
  events,
  propertyProjects,
  currentJobId,
}: {
  events: ManualHistoryEvent[];
  propertyProjects: PropertyProjectRow[];
  currentJobId: string;
}) => {
  const others = propertyProjects.filter((p) => p.id !== currentJobId);

  return (
    <section id="history" className="bg-card rounded-2xl border border-border p-6 mb-6">
      <h2 className="font-heading text-primary text-xl mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-secondary" />
        8. Project History
      </h2>

      {events.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">No recorded project events yet.</p>
      ) : (
        <ol className="space-y-3">
          {events.map((e, i) => (
            <li key={i} className="flex items-start gap-3 border-l-2 border-secondary/40 pl-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {e.date ? new Date(e.date).toLocaleDateString("en-GB") : "Date not recorded"}
                </p>
                <p className="font-mono text-xs text-foreground">{e.label}</p>
                {e.detail && <p className="font-mono text-[11px] text-muted-foreground">{e.detail}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}

      {others.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
            <Home className="w-3 h-3" /> Other completed projects at this property
          </h3>
          <ul className="space-y-2">
            {others.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/manual/${p.id}`}
                  className="font-mono text-xs text-secondary hover:underline"
                >
                  {p.title || p.job_type}
                  {p.completed_at ? ` — completed ${new Date(p.completed_at).toLocaleDateString("en-GB")}` : ""}
                  {p.final_value_pence != null
                    ? ` · £${(p.final_value_pence / 100).toLocaleString("en-GB")}`
                    : ""}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default ManualHistory;
