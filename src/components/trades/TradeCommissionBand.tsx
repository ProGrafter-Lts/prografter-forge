import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

const POINTS = [
  "No subscription to join, quote, or get paid — ever",
  "Free matching is part of the core platform",
  "Paid tools such as Planning Hub are optional add-ons",
  "No paying for leads that go nowhere",
  "7.5% commission when a job is agreed",
  "Capped at £900, however big the job",
  "Homeowners verified before they reach you",
];

const TradeCommissionBand = () => {
  return (
    <section className="bg-deep py-16 craft:py-24 px-6">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 craft:grid-cols-2 gap-12 craft:gap-16 items-center">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-teal mb-3">
            What It Costs
          </p>
          <h2 className="font-heading uppercase text-cream text-[34px] craft:text-[52px] leading-none mb-5">
            No platform subscription. Ever.
          </h2>
          <p className="font-body text-cream/75 text-base leading-relaxed mb-8 max-w-lg">
            Join, get matched, quote and get paid without a subscription. Optional paid tools are
            separate and opt-in. We only earn commission when you win work.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-3 bg-teal text-cream font-body text-sm font-semibold uppercase tracking-wide px-7 py-4 rounded-xl hover:bg-teal-hover transition-all shadow-lg shadow-teal/30 hover:-translate-y-0.5"
          >
            See Full Pricing
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <ul className="rounded-2xl border border-cream/10 bg-navy/40 p-8 craft:p-10 space-y-4">
          {POINTS.map((p) => (
            <li key={p} className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-lg bg-teal/12 border border-teal/25 flex items-center justify-center mt-0.5">
                <Check className="w-3.5 h-3.5 text-teal" strokeWidth={2} />
              </span>
              <span className="font-body text-sm text-cream/80 leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default TradeCommissionBand;
