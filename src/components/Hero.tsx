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
      .eq("verified", true)
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

          {/* Two equally-weighted primary CTAs — one for each audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            <a
              href="/signup/homeowner"
              className="inline-flex items-center justify-center bg-cream text-deep font-mono text-sm px-6 py-3.5 rounded-xl hover:bg-cream/90 transition-colors text-center"
            >
              Post a Job — I'm a Homeowner →
            </a>
            <a
              href="/signup/trade"
              className="inline-flex items-center justify-center bg-teal text-cream font-mono text-sm px-6 py-3.5 rounded-xl hover:bg-teal-hover transition-colors text-center"
            >
              Join as a Trade — Find Work →
            </a>
          </div>

          {/* Tertiary link — green grants & sign-in */}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-secondary-text">
            <a href="/green" className="hover:text-teal transition-colors">
              🌿 Green grants
            </a>
            <span className="text-cream/20">·</span>
            <a href="/login" className="hover:text-teal transition-colors">
              Already have an account? Sign in
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
