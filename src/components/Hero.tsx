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
      .rpc("count_verified_trades")
      .then(({ data }) => {
        if (typeof data === "number") setTradeCount(data);
      });
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden bg-navy"
      style={{ background: "linear-gradient(135deg, #27396A 0%, #0F1F38 100%)" }}
    >
      {/* Ghost GRAFT text */}
      <span className="absolute bottom-8 left-8 font-heading text-[120px] craft:text-[240px] text-cream select-none pointer-events-none leading-none" style={{ opacity: 0.03 }}>
        GRAFT
      </span>

      {/* Vertical divider between homeowner & trade columns */}
      <div className="hidden craft:block absolute top-24 bottom-24 w-px bg-teal/20" style={{ left: "60%" }} />

      <div className="max-w-7xl mx-auto px-6 w-full grid craft:grid-cols-[60fr_40fr] gap-10 craft:gap-12 items-start pt-24 pb-16">
        {/* Left column — HOMEOWNERS (priority) */}
        <div className="relative craft:pr-8">
          <div
            className="bg-cream rounded-[12px] p-6 craft:p-10"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-[2px]" style={{ backgroundColor: "#14A8A1" }} />
              <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: "#14A8A1" }}>
                For Homeowners
              </span>
            </div>
            <h1
              className="font-heading text-[40px] craft:text-[56px] leading-[0.95] mb-5"
              style={{ color: "#27396A" }}
            >
              Post your job first.<br />Verified trades follow.
            </h1>
            <p className="font-body text-[15px] mb-4 font-light max-w-lg" style={{ color: "#1F2937" }}>
              Great trades need great jobs. That's why homeowners are our priority — post for free and we'll bring verified, insured local trades to quote.
            </p>
            <p className="font-body text-[14px] mb-6 leading-relaxed font-light max-w-lg" style={{ color: "#4B5563" }}>
              Anyone can hand you a cheap quote. ProGrafter gives you a 5-check verified trade, a written contract, daily photos from site, staged payments held safe, and every certificate and warranty at the end — the record you'll show friends.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="/post-a-job"
                className="homeowner-cta inline-flex items-center justify-center w-full font-mono text-base px-8 py-4 rounded-xl transition-all duration-200 shadow-md"
                style={{
                  backgroundColor: "#14A8A1",
                  border: "2px solid #14A8A1",
                  color: "#FFFFFF",
                  fontWeight: 700,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#0D9488";
                  e.currentTarget.style.borderColor = "#0D9488";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#14A8A1";
                  e.currentTarget.style.borderColor = "#14A8A1";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Post your job — free
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center w-full font-mono text-sm px-8 py-3 rounded-xl transition-all duration-200"
                style={{
                  backgroundColor: "transparent",
                  border: "2px solid #27396A",
                  color: "#27396A",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#27396A";
                  e.currentTarget.style.color = "#FFFFFF";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#27396A";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                See how it works
              </a>
            </div>
          </div>
        </div>

        {/* Right column — TRADES (secondary) */}
        <div className="craft:pl-8 craft:mt-[80px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">For Tradespeople</span>
          </div>
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-teal/10 border border-teal/30">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
            </span>
            <span className="font-mono text-[11px] text-cream uppercase tracking-wider">
              Now live · Nottinghamshire & East Midlands{tradeCount !== null && tradeCount >= 10 ? ` — ${tradeCount} verified trades registered` : ""}
            </span>
          </div>
          <h2 className="font-heading text-cream text-[36px] craft:text-[48px] leading-[0.95] mb-5">
            Proper grafters<br />
            don't pay to work.
          </h2>
          <p className="font-body text-secondary-text text-base max-w-md mb-4 font-light">
            No monthly fee. No lead fees. No "free trial" that starts charging you later. We only earn when you do.
          </p>
          <p className="font-body text-secondary-text text-sm max-w-md mb-6 font-light">
            7.5% commission only when the job completes and you've been paid — capped at £900 per job. Founding Members (first 50 trades): your first 5 jobs at 6%, permanent badge, personal welcome call from Lee.
          </p>

          <a
            href="/register/trade"
            className="inline-flex items-center justify-center border border-teal text-teal font-mono text-sm px-6 py-3.5 rounded-xl hover:bg-teal hover:text-cream transition-colors"
          >
            Register free — win work
          </a>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-navy/50 backdrop-blur-sm border border-teal/20 rounded-xl px-3 py-3 flex flex-col items-center justify-between text-center">
                <div className="font-heading text-teal text-xl craft:text-2xl leading-none flex items-center justify-center h-7 craft:h-8">{stat.value}</div>
                <div className="font-mono text-[10px] text-secondary-text uppercase mt-2 leading-none">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;
