import { BadgeCheck, Star, SearchCheck } from "lucide-react";

interface Quote {
  id: string;
  amount: number;
  message: string | null;
  status: string;
  trades: { name: string; company_name: string; verified: boolean } | null;
  jobs: { title: string | null; job_type: string } | null;
}

interface QuotesReceivedProps {
  quotes: Quote[];
}

const QuotesReceived = ({ quotes }: QuotesReceivedProps) => {
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
      <div className="space-y-3">
        {quotes.map((q) => (
          <div key={q.id} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
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
                {q.message && (
                  <p className="font-mono text-xs text-muted-foreground mt-2 line-clamp-2">
                    {q.message}
                  </p>
                )}
              </div>
              <div className="text-right ml-4 flex flex-col items-end gap-2">
                <p className="font-heading text-secondary text-2xl">
                  £{Number(q.amount).toLocaleString()}
                </p>
                {q.status === "pending" && (
                  <button className="bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap">
                    Accept Quote
                  </button>
                )}
                <button className="font-mono text-[10px] text-secondary hover:underline">
                  View Profile
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default QuotesReceived;
