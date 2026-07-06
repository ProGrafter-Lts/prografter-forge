import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const flow = [
  { step: "01", label: "Your Quote", desc: "Upload a builder's quote" },
  { step: "02", label: "AI Analysis", desc: "Clarity Score in minutes" },
  { step: "03", label: "Trusted Trade", desc: "5-step verified pros" },
  { step: "04", label: "Successful Project", desc: "Tracked to completion" },
];

const Hero = () => {
  const [tradeCount, setTradeCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .rpc("count_verified_trades")
      .then(({ data }) => {
        if (typeof data === "number") setTradeCount(data);
      });
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #27396A 0%, #0F1F38 100%)" }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-teal/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 -left-32 h-96 w-96 rounded-full bg-teal/10 blur-[120px]" />

      {/* Ghost GRAFT text */}
      <span className="absolute bottom-6 left-6 font-heading text-[120px] craft:text-[220px] text-cream select-none pointer-events-none leading-none" style={{ opacity: 0.03 }}>
        GRAFT
      </span>

      <div className="relative max-w-6xl mx-auto px-6 w-full pt-28 pb-20 text-center">
        {/* Positioning badge */}
        <div className="inline-flex items-center gap-2 mb-7 px-4 py-2 rounded-full bg-white/10 border border-teal/60 backdrop-blur-md shadow-md shadow-teal/20">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
            <span className="text-teal">AI-Powered</span>{" "}
            <span className="text-cream">UK Construction Trust Platform</span>
          </span>
        </div>

        <h1 className="font-heading text-cream text-[44px] craft:text-[80px] leading-[0.95] mb-6 max-w-4xl mx-auto">
          The future of trusted<br className="hidden craft:block" /> construction starts here.
        </h1>

        <p className="font-body text-secondary-text text-base craft:text-xl max-w-2xl mx-auto mb-4 font-light">
          AI-powered quote checking, verified professionals, transparent pricing and smarter
          project management — all in one platform.
        </p>
        <p className="font-body text-cream/60 text-sm max-w-xl mx-auto mb-9 font-light">
          Not another directory. We restore trust to domestic construction through intelligent
          technology, genuine verification and real accountability.
        </p>

        {/* CTAs */}
        <div className="flex flex-col craft:flex-row items-center justify-center gap-4 mb-4">
          <a
            href="/quote-checker"
            className="inline-flex items-center justify-center gap-2 bg-teal text-cream font-mono text-sm px-8 py-4 rounded-xl hover:bg-teal-hover transition-all shadow-lg shadow-teal/30 hover:-translate-y-0.5 w-full craft:w-auto"
          >
            <span className="text-base leading-none">✦</span>
            Upload Your Quote
          </a>
          <a
            href="/signup/trade"
            className="inline-flex items-center justify-center w-full craft:w-auto border border-cream/30 text-cream font-mono text-sm px-8 py-4 rounded-xl hover:border-teal hover:text-teal transition-colors backdrop-blur-sm"
          >
            Join as a Trade
          </a>
        </div>
        <div className="mb-14 font-mono text-xs text-cream/50">
          <a href="/login" className="hover:text-teal transition-colors">Already have an account? Sign in</a>
        </div>

        {/* Flow visualisation */}
        <div className="grid grid-cols-2 craft:grid-cols-4 gap-3 craft:gap-4 max-w-4xl mx-auto">
          {flow.map((f, i) => (
            <div
              key={f.step}
              className="relative rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md px-4 py-5 text-left animate-fade-in"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="font-mono text-[11px] text-teal mb-2">{f.step}</div>
              <div className="font-heading text-cream text-lg leading-tight mb-1">{f.label}</div>
              <div className="font-body text-cream/55 text-xs font-light">{f.desc}</div>
              {i < flow.length - 1 && (
                <span className="hidden craft:block absolute top-1/2 -right-3 -translate-y-1/2 text-teal/60 z-10">→</span>
              )}
            </div>
          ))}
        </div>

        {tradeCount !== null && tradeCount >= 10 && (
          <p className="mt-8 font-mono text-xs text-cream/50">
            {tradeCount} verified trades registered · Nottinghamshire &amp; East Midlands, expanding nationally
          </p>
        )}
      </div>
    </section>
  );
};

export default Hero;
