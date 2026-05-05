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
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1B3A5C 0%, #0F1F38 100%)" }}
    >
      {/* Ghost GRAFT text */}
      <span className="absolute bottom-8 left-8 font-heading text-[120px] craft:text-[240px] text-cream select-none pointer-events-none leading-none" style={{ opacity: 0.03 }}>
        GRAFT
      </span>

      {/* Vertical divider between trade & homeowner columns */}
      <div className="hidden craft:block absolute top-24 bottom-24 w-px bg-teal/20" style={{ left: "60%" }} />

      <div className="max-w-7xl mx-auto px-6 w-full grid craft:grid-cols-[60fr_40fr] gap-10 craft:gap-12 items-center pt-24 pb-16">
        {/* Left column — TRADES */}
        <div className="craft:pr-8">
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
              Now live across the UK{tradeCount !== null && tradeCount >= 10 ? ` — ${tradeCount} verified trades registered` : ""}
            </span>
          </div>
          <h1 className="font-heading text-cream text-[48px] craft:text-[72px] leading-[0.95] mb-6">
            Built for<br />
            <span className="text-teal">Proper</span><br />
            Grafters.
          </h1>
          <p className="font-body text-secondary-text text-base craft:text-lg max-w-md mb-6 font-light">
            No monthly fees. No hidden costs. Just a fair commission on the work you win — capped at £900 per job.
          </p>

          <a
            href="/register/trade"
            className="inline-flex items-center justify-center bg-teal text-cream font-mono text-sm px-6 py-3.5 rounded-xl hover:bg-teal-hover transition-colors"
          >
            Join as a Trade — Find Work →
          </a>

          {/* Tertiary links */}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-secondary-text">
            <a href="/green" className="hover:text-teal transition-colors">
              🌿 Green grants
            </a>
            <span className="text-cream/20">·</span>
            <a href="/login" className="hover:text-teal transition-colors">
              Already have an account? Sign in
            </a>
          </div>

          {/* Stats — inline on all sizes for trade column */}
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-navy/50 backdrop-blur-sm border border-teal/20 rounded-xl px-3 py-3 text-center">
                <div className="font-heading text-teal text-xl craft:text-2xl">{stat.value}</div>
                <div className="font-mono text-[10px] text-secondary-text uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — HOMEOWNERS */}
        <div className="relative craft:pl-8">
          <div
            className="bg-white rounded-[12px] p-6 craft:p-8"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-[2px]" style={{ backgroundColor: "#0D9488" }} />
              <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: "#0D9488" }}>
                For Homeowners
              </span>
            </div>
            <h2
              className="font-heading text-[32px] craft:text-[36px] leading-[1] mb-4"
              style={{ color: "#1B3A5C" }}
            >
              Find a <span style={{ color: "#0D9488" }}>Proper Grafter</span>
            </h2>
            <p className="font-body text-[15px] mb-5 font-light" style={{ color: "#1F2937" }}>
              Verified UK trades. Real timelines. Variations signed off in writing. No surprise bills.
            </p>
            <div className="font-mono text-[14px] mb-6 leading-relaxed" style={{ color: "#4B5563" }}>
              £0 to post · Verified trades · Stage payments protected
            </div>
            <a
              href="/post-a-job"
              className="homeowner-cta inline-flex items-center justify-center w-full font-mono text-sm px-6 py-3.5 rounded-xl transition-all duration-200"
              style={{
                backgroundColor: "transparent",
                border: "2px solid #1B3A5C",
                color: "#1B3A5C",
                fontWeight: 700,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#0D9488";
                e.currentTarget.style.borderColor = "#0D9488";
                e.currentTarget.style.color = "#FFFFFF";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "#1B3A5C";
                e.currentTarget.style.color = "#1B3A5C";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Post a Job Free →
            </a>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;
