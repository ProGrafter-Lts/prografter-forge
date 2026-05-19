import { PoundSterling, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MarginData {
  totalQuoted: number;
  totalCosts: number;
  totalReceived: number;
}

const LiveMarginWidget = ({ totalQuoted, totalCosts, totalReceived }: MarginData) => {
  const margin = totalQuoted - totalCosts;
  const marginPct = totalQuoted > 0 ? Math.round((margin / totalQuoted) * 100) : 0;
  const outstanding = totalQuoted - totalReceived;
  // Undefined margin when there's no quoting/cost activity yet — showing
  // "£0 / 0%" misleads new accounts into thinking they earned nothing.
  const hasMarginData = totalQuoted > 0 || totalCosts > 0;

  const MarginIcon = margin > 0 ? TrendingUp : margin < 0 ? TrendingDown : Minus;
  const marginColor = margin > 0 ? "text-green-600" : margin < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <section>
      <h2 className="font-heading text-primary text-2xl mb-4">Live Margin</h2>
      <div className="bg-card rounded-2xl p-6 border border-primary/10 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Quoted */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Quoted</p>
            <p className="font-heading text-2xl text-primary">£{totalQuoted.toLocaleString()}</p>
          </div>

          {/* Costs */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Costs</p>
            <p className="font-heading text-2xl text-primary">£{totalCosts.toLocaleString()}</p>
          </div>

          {/* Margin */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Margin</p>
            {hasMarginData ? (
              <>
                <div className="flex items-center gap-2">
                  <MarginIcon className={`w-5 h-5 ${marginColor}`} />
                  <p className={`font-heading text-2xl ${marginColor}`}>
                    £{Math.abs(margin).toLocaleString()}
                  </p>
                </div>
                <p className={`font-mono text-xs ${marginColor}`}>{marginPct}%</p>
              </>
            ) : (
              <p className="font-heading text-2xl text-muted-foreground">—</p>
            )}
          </div>

          {/* Received */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Payments Received</p>
            <p className="font-heading text-2xl text-secondary">£{totalReceived.toLocaleString()}</p>
            {outstanding > 0 && (
              <p className="font-mono text-xs text-muted-foreground">
                £{outstanding.toLocaleString()} outstanding
              </p>
            )}
          </div>
        </div>

        {/* Visual bar */}
        <div className="mt-6 space-y-2">
          <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-primary/5">
            {totalQuoted > 0 && (
              <>
                <div
                  className="bg-destructive/70 rounded-l-full transition-all"
                  style={{ width: `${(totalCosts / totalQuoted) * 100}%` }}
                  title="Costs"
                />
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${(Math.max(0, margin) / totalQuoted) * 100}%` }}
                  title="Margin"
                />
              </>
            )}
          </div>
          <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-destructive/70 inline-block" /> Costs
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Margin
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveMarginWidget;
