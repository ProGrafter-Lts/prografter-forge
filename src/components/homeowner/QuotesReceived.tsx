import { BadgeCheck, Star, SearchCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Quote {
  id: string;
  amount: number;
  message: string | null;
  status: string;
  tier_enabled?: boolean;
  budget_price?: number | null;
  budget_description?: string | null;
  standard_price?: number | null;
  standard_description?: string | null;
  premium_price?: number | null;
  premium_description?: string | null;
  selected_tier?: string | null;
  trades: { name: string; company_name: string; verified: boolean } | null;
  jobs: { title: string | null; job_type: string } | null;
}

interface QuotesReceivedProps {
  quotes: Quote[];
  onSelectTier?: (quoteId: string, tier: string, price: number) => void;
}

const TierCard = ({
  tier,
  label,
  price,
  description,
  highlighted,
  badgeText,
  selected,
  onSelect,
}: {
  tier: string;
  label: string;
  price: number | null | undefined;
  description: string | null | undefined;
  highlighted?: boolean;
  badgeText?: string;
  selected: boolean;
  onSelect: () => void;
}) => (
  <div
    className={`rounded-xl p-4 border-2 flex flex-col justify-between ${
      highlighted
        ? "border-secondary bg-secondary/5"
        : "border-border bg-card"
    } ${selected ? "ring-2 ring-secondary ring-offset-2" : ""}`}
  >
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-heading text-xs text-primary uppercase tracking-wider">{label}</h4>
        {badgeText && (
          <Badge className="bg-secondary text-secondary-foreground font-mono text-[9px]">
            {badgeText}
          </Badge>
        )}
      </div>
      <p className="font-heading text-secondary text-2xl mb-2">
        £{Number(price || 0).toLocaleString()}
      </p>
      {description && (
        <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </div>
    <button
      onClick={onSelect}
      className={`mt-3 w-full font-mono text-xs py-2 rounded-lg transition-colors ${
        selected
          ? "bg-secondary text-secondary-foreground"
          : "border border-secondary text-secondary hover:bg-secondary/10"
      }`}
    >
      {selected ? `✓ ${label} Selected` : `Choose ${label}`}
    </button>
  </div>
);

const QuotesReceived = ({ quotes, onSelectTier }: QuotesReceivedProps) => {
  if (quotes.length === 0) {
    return (
      <section>
        <h2 className="font-heading text-primary text-2xl mb-4">Quotes Received</h2>
        <div className="bg-card rounded-2xl p-8 border border-border text-center">
          <SearchCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-mono text-sm text-muted-foreground">
            No quotes yet. Trades will submit quotes once matched to your job.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-heading text-primary text-2xl mb-4">Quotes Received</h2>
      <div className="space-y-4">
        {quotes.map((q) => (
          <div key={q.id} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            {/* Trade info header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-primary text-lg">
                    {q.trades?.name || "Trade"}
                  </h3>
                  {q.trades?.verified && <BadgeCheck className="w-4 h-4 text-secondary" />}
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {q.trades?.company_name} · {q.jobs?.title || q.jobs?.job_type}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="font-mono text-[10px] text-muted-foreground ml-1">(New)</span>
                </div>
              </div>
              {!q.tier_enabled && (
                <div className="text-right">
                  <p className="font-heading text-secondary text-2xl">
                    £{Number(q.amount).toLocaleString()}
                  </p>
                  {q.status === "pending" && (
                    <button className="bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap mt-1">
                      Accept Quote
                    </button>
                  )}
                </div>
              )}
            </div>

            {q.message && (
              <p className="font-mono text-xs text-muted-foreground mb-3">
                {q.message}
              </p>
            )}

            {/* Tier columns */}
            {q.tier_enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                <TierCard
                  tier="budget"
                  label="Budget"
                  price={q.budget_price}
                  description={q.budget_description}
                  selected={q.selected_tier === "budget"}
                  onSelect={() => onSelectTier?.(q.id, "budget", Number(q.budget_price))}
                />
                <TierCard
                  tier="standard"
                  label="Standard"
                  price={q.standard_price}
                  description={q.standard_description}
                  highlighted
                  badgeText="Most Popular"
                  selected={q.selected_tier === "standard"}
                  onSelect={() => onSelectTier?.(q.id, "standard", Number(q.standard_price))}
                />
                <TierCard
                  tier="premium"
                  label="Premium"
                  price={q.premium_price}
                  description={q.premium_description}
                  selected={q.selected_tier === "premium"}
                  onSelect={() => onSelectTier?.(q.id, "premium", Number(q.premium_price))}
                />
              </div>
            )}

            <button className="font-mono text-[10px] text-secondary hover:underline mt-2">
              View Profile
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default QuotesReceived;
