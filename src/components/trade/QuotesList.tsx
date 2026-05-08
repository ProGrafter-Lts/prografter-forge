import { PoundSterling, MapPin } from "lucide-react";
import GenerateQuotePdfButton from "./GenerateQuotePdfButton";
import { isFeatureEnabled } from "@/lib/featureFlags";

interface Quote {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  jobs: {
    title: string | null;
    job_type: string;
    postcode: string;
  } | null;
}

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const QuotesList = ({ quotes }: { quotes: Quote[] }) => (
  <section>
    <h2 className="font-heading text-primary text-2xl mb-4">My Quotes</h2>

    {quotes.length === 0 ? (
      <div className="bg-card rounded-2xl p-8 border border-primary/10 text-center">
        <PoundSterling className="w-10 h-10 text-primary/20 mx-auto mb-3" />
        <p className="font-mono text-sm text-muted-foreground">
          No pending quotes. Browse job matches to submit your first quote.
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {quotes.map((quote) => (
          <div key={quote.id} className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-heading text-primary text-lg">
                {quote.jobs?.title || quote.jobs?.job_type || "Job"}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {quote.jobs?.postcode}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {timeAgo(quote.created_at)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="font-heading text-secondary text-xl">
                £{Number(quote.amount).toLocaleString()}
              </p>
              <span className="bg-yellow-100 text-yellow-700 font-mono text-[10px] px-2 py-0.5 rounded-full">
                Pending
              </span>
              {isFeatureEnabled("quotePdf") && <GenerateQuotePdfButton quoteId={quote.id} />}
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
);

export default QuotesList;
