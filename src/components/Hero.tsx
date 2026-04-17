import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const stats = [
  { value: "£0", label: "Monthly Fee" },
  { value: "7.5%", label: "Commission" },
  { value: "£900", label: "Per Job Cap" },
];

const Hero = () => {
  const [tradeCount, setTradeCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("trades")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => {
        if (typeof count === "number") setTradeCount(count);
      });
  }, []);

  return (
    <section className="relative min-h-screen bg-deep flex items-center overflow-hidden">
      {/* Ghost GRAFT text */}
      <span className="absolute bottom-8 left-8 font-heading text-[120px] craft:text-[240px] text-cream select-none pointer-events-none leading-none" style={{ opacity: 0.03 }}>
        GRAFT
      </span>

      {/* Diagonal teal line */}
      <div className="hidden craft:block absolute top-0 bottom-0 w-[3px] bg-teal" style={{ left: "62%", transform: "skewX(-4deg)" }} />

      <div className="max-w-7xl mx-auto px-6 w-full grid craft:grid-cols-[1fr_0.8fr] gap-12 items-center pt-24 pb-16 craft:pb-16 pb-32">
        {/* Left column */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">For Tradespeople</span>
          </div>
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-teal/10 border border-teal/30">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
            </span>
            <span className="font-mono text-[11px] text-cream uppercase tracking-wider">
              Now live across the UK{tradeCount !== null ? ` — ${tradeCount} verified ${tradeCount === 1 ? "trade" : "trades"} registered` : ""}
            </span>
          </div>
          <h1 className="font-heading text-cream text-[56px] craft:text-[80px] leading-[0.95] mb-6">
            Built for<br />
            <span className="text-teal">Proper</span><br />
            Grafters.
          </h1>
          <p className="font-body text-secondary-text text-lg max-w-md mb-8 font-light">
            No monthly fees. No hidden costs. Just a fair commission on the work you win — capped at £900 per job.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#signup"
              className="inline-block bg-teal text-cream font-mono text-sm px-8 py-3 rounded-xl hover:bg-teal-hover transition-colors"
            >
              Register as a Trade
            </a>
            <a
              href="/green"
              className="inline-block bg-green-600 text-white font-mono text-sm px-8 py-3 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
            >
              🌿 Find Out If You Qualify →
            </a>
          </div>

          {/* Homeowner path */}
          <div className="mt-8 pt-6 border-t border-cream/10 flex flex-wrap items-center gap-x-4 gap-y-3">
            <span className="font-mono text-xs text-secondary-text uppercase tracking-widest">
              Homeowner planning a project?
            </span>
            <a
              href="/post-a-job"
              className="inline-block bg-transparent border-2 border-teal text-teal font-mono text-sm px-6 py-2.5 rounded-xl hover:bg-teal hover:text-cream transition-colors"
            >
              Post a Job Free →
            </a>
          </div>

          {/* Mobile stats — inline (below homeowner CTA) */}
          <div className="craft:hidden mt-8 grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-navy/50 backdrop-blur-sm border border-teal/20 rounded-xl px-3 py-3 text-center">
                <div className="font-heading text-teal text-xl">{stat.value}</div>
                <div className="font-mono text-[10px] text-secondary-text uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — stat cards + rotating circles */}
        <div className="hidden craft:flex relative justify-center items-center min-h-[400px]">
          {/* Concentric circles */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-[280px] h-[280px] rounded-full border border-teal/10 animate-spin-slow" />
            <div className="absolute w-[360px] h-[360px] rounded-full border border-teal/5 animate-spin-slower" />
            <div className="absolute w-[440px] h-[440px] rounded-full border border-teal/[0.03] animate-spin-slowest" />
          </div>

          {/* Floating stat cards */}
          <div className="relative z-10 flex flex-col gap-4">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`bg-navy/50 backdrop-blur-sm border border-teal/20 rounded-xl px-6 py-4 ${
                  i === 0 ? "animate-float" : i === 1 ? "animate-float-delayed" : "animate-float-delayed-2"
                }`}
              >
                <div className="font-heading text-teal text-3xl">{stat.value}</div>
                <div className="font-mono text-xs text-secondary-text uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;
