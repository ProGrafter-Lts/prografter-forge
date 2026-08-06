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
          <div key={quote.id} className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h3 className="font-heading text-primary text-lg leading-tight">
                {quote.jobs?.title || quote.jobs?.job_type || "Job"}
              </h3>
              <span className="bg-yellow-100 text-yellow-700 font-mono text-[10px] px-2 py-0.5 rounded-full shrink-0">
                Pending
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 bg-primary/5 text-primary font-mono text-[11px] px-2.5 py-1.5 rounded-full">
                <MapPin className="w-3 h-3" />
                {quote.jobs?.postcode}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-secondary/15 text-secondary font-mono text-[11px] font-semibold px-2.5 py-1.5 rounded-full">
                £{Number(quote.amount).toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-primary/5 text-primary/70 font-mono text-[11px] px-2.5 py-1.5 rounded-full">
                {timeAgo(quote.created_at)}
              </span>
            </div>

            {isFeatureEnabled("quotePdf") && (
              <div className="mt-4">
                <GenerateQuotePdfButton quoteId={quote.id} />
              </div>
            )}
          </div>

        ))}
      </div>
    )}
  </section>
);

export default QuotesList;
