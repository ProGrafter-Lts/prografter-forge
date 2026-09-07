import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, MapPin, Wallet } from "lucide-react";
import heroImage from "@/assets/home/trades-hero.jpg";

const INDICATORS = [
  { icon: Wallet, title: "No Monthly Fees", desc: "You only pay when you win." },
  { icon: MapPin, title: "Local Work", desc: "Jobs near you, sent as they land." },
  { icon: BadgeCheck, title: "Real Homeowners", desc: "Every customer is verified." },
];

const TradeHero = () => {
  return (
    <section className="relative overflow-hidden bg-deep">
      <div className="absolute inset-y-0 right-0 w-full craft:w-[58%]">
        <img
          src={heroImage}
          alt="Tradesperson on a residential building site reviewing job details on a tablet"
          width={1280}
          height={1024}
          className="h-full w-full object-cover opacity-45 craft:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-deep via-deep/85 craft:via-deep/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep/80 via-transparent to-deep/40" />
      </div>

      <div className="hidden craft:block absolute top-32 right-10 text-right pointer-events-none">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-cream/70 leading-relaxed">
          Better Jobs
          <br />
          Fewer Time Wasters
        </p>
        <div className="ml-auto mt-2 w-12 h-[2px] bg-teal" />
      </div>
      <div className="hidden craft:block absolute bottom-24 right-10 pointer-events-none border-l border-cream/20 pl-4">
        {["Match", "Quote", "Win", "Get Paid"].map((s) => (
          <p key={s} className="font-mono text-[10px] uppercase tracking-[0.3em] text-cream/55 leading-loose">
            {s}
          </p>
        ))}
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 pt-32 craft:pt-36 pb-16">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cream/70 mb-5">
            For Tradespeople
          </p>

          <h1 className="font-heading uppercase text-cream text-[42px] craft:text-[76px] leading-[0.92] mb-6">
            More right jobs.
            <br />
            Less time wasted.
          </h1>

          <p className="font-body text-cream/85 text-base craft:text-lg leading-relaxed max-w-xl mb-8">
            No lead fees, no monthly subscription and no bidding wars. Get matched to genuine local
            projects from verified homeowners, quote properly, and only pay commission when the job
            is yours.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-5">
            <Link
              to="/signup/trade"
              className="inline-flex items-center justify-center gap-3 bg-teal text-cream font-body text-sm font-semibold uppercase tracking-wide px-7 py-4 rounded-xl hover:bg-teal-hover transition-all shadow-lg shadow-teal/30 hover:-translate-y-0.5"
            >
              Join Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-3 border border-cream/30 bg-navy/40 text-cream font-body text-sm font-semibold uppercase tracking-wide px-7 py-4 rounded-xl hover:border-teal hover:text-teal transition-colors backdrop-blur-sm"
            >
              See The Costs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <Link
            to="/planning-alerts"
            className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.18em] text-cream underline underline-offset-4 decoration-teal hover:text-teal transition-colors"
          >
            Planning Alerts
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl">
            {INDICATORS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-teal shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <p className="font-body text-[13px] font-semibold uppercase tracking-wide text-cream leading-tight">
                    {title}
                  </p>
                  <p className="font-body text-xs text-cream/65 mt-1 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TradeHero;
