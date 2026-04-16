import { AlertTriangle } from "lucide-react";

interface Variation {
  id: string;
  title: string;
  description: string;
  materials_cost: number;
  labour_cost: number;
  programme_impact_days: number;
  status: string;
}

const VariationAlert = ({ variations }: { variations: Variation[] }) => {
  const pending = variations.filter((v) => v.status === "pending");
  if (pending.length === 0) return null;

  return (
    <div className="space-y-3">
      {pending.map((v) => (
        <div
          key={v.id}
          className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex items-start gap-4"
        >
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-heading text-primary text-lg">{v.title}</h3>
            <p className="font-mono text-xs text-muted-foreground mt-1 line-clamp-2">
              {v.description}
            </p>
            <div className="flex items-center gap-4 mt-2 font-mono text-xs text-muted-foreground">
              <span>
                Cost: <span className="text-primary font-medium">£{(v.materials_cost + v.labour_cost).toLocaleString()}</span>
              </span>
              {v.programme_impact_days > 0 && (
                <span>
                  Programme impact: <span className="text-amber-600 font-medium">+{v.programme_impact_days} days</span>
                </span>
              )}
            </div>
            <button className="mt-3 bg-amber-500 text-white font-mono text-xs px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors">
              Review & Sign
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VariationAlert;
