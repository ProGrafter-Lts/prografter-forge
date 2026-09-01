import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export interface PendingContractVariation {
  id: string;
  contract_id: string;
  job_id?: string | null;
  sequence: number;
  title: string;
  description: string;
  cost_change_pence: number;
  commission_pence: number | null;
  programme_impact_days: number;
  status: string;
  homeowner_signed_at: string | null;
}

const gbp = (pence: number) =>
  `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const VariationAlert = ({ variations }: { variations: PendingContractVariation[] }) => {
  const pending = variations.filter((v) => v.status === "pending" && !v.homeowner_signed_at);
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
            <h3 className="font-heading text-primary text-lg">
              Variation #{v.sequence} — {v.title}
            </h3>
            <p className="font-mono text-xs text-muted-foreground mt-1 line-clamp-2">
              {v.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2 font-mono text-xs text-muted-foreground">
              <span>
                Cost change: <span className="text-primary font-medium">{gbp(v.cost_change_pence)}</span>
              </span>
              <span>
                Commission (3.75%):{" "}
                <span className="text-primary font-medium">
                  {gbp(v.commission_pence ?? Math.round(Math.max(v.cost_change_pence, 0) * 0.0375))}
                </span>
              </span>
              {v.programme_impact_days > 0 && (
                <span>
                  Programme impact: <span className="text-amber-600 font-medium">+{v.programme_impact_days} days</span>
                </span>
              )}
            </div>
            {v.job_id && (
              <Link
                to={`/project/${v.job_id}`}
                className="inline-block mt-3 bg-amber-500 text-white font-mono text-xs px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors"
              >
                Review & Sign
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VariationAlert;
