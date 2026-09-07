import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ctaImage from "@/assets/home/cta-construction.jpg";

const TradeCtaBand = () => {
  return (
    <section className="relative bg-navy py-20 craft:py-24 px-6 overflow-hidden">
      <img
        src={ctaImage}
        alt=""
        aria-hidden="true"
        loading="lazy"
        width={1600}
        height={700}
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(120deg, #1B3A5C 0%, rgba(27,58,92,0.75) 55%, rgba(15,34,56,0.9) 100%)" }}
      />

      <div className="hidden craft:block absolute left-10 top-1/2 -translate-y-1/2 border-l border-cream/20 pl-4 pointer-events-none">
        {["Match", "Quote", "Win", "Get Paid"].map((s) => (
          <p key={s} className="font-mono text-[10px] uppercase tracking-[0.3em] text-cream/55 leading-loose">
            {s}
          </p>
        ))}
        <div className="mt-2 w-10 h-[2px] bg-teal" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cream/75 mb-4">
          Ready For Better Work?
        </p>
        <h2 className="font-heading uppercase text-cream text-[32px] craft:text-[48px] leading-none mb-4">
          Join free and start quoting.
        </h2>
        <p className="font-body text-cream/85 text-base craft:text-lg mb-8">
          Set up your profile in minutes and get matched to real projects near you.
        </p>
        <Link
          to="/signup/trade"
          className="inline-flex items-center gap-3 bg-teal text-cream font-body text-sm font-semibold uppercase tracking-wide px-8 py-4 rounded-xl hover:bg-teal-hover transition-all shadow-lg shadow-teal/30 hover:-translate-y-0.5"
        >
          Join Free
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="mt-6 font-body text-xs text-cream/60">
          Looking to hire instead?{" "}
          <Link to="/" className="underline underline-offset-4 decoration-teal hover:text-teal">
            Visit the homeowner side
          </Link>
        </p>
      </div>
    </section>
  );
};

export default TradeCtaBand;
