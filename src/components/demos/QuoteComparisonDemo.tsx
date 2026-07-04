import { useState } from "react";
import { Check, Minus } from "lucide-react";

type Quote = {
  name: string;
  price: string;
  clarity: number;
  fairness: number;
  verified: boolean;
  breakdown: boolean;
  timescale: string;
  warranty: string;
  recommended?: boolean;
};

const QUOTES: Quote[] = [
  {
    name: "Trade A",
    price: "£42,600",
    clarity: 88,
    fairness: 92,
    verified: true,
    breakdown: true,
    timescale: "10 weeks",
    warranty: "10-year insurance-backed",
    recommended: true,
  },
  {
    name: "Trade B",
    price: "£38,900",
    clarity: 61,
    fairness: 74,
    verified: true,
    breakdown: false,
    timescale: "Not stated",
    warranty: "2-year workmanship",
  },
  {
    name: "Trade C",
    price: "£47,200",
    clarity: 79,
    fairness: 68,
    verified: false,
    breakdown: true,
    timescale: "8 weeks",
    warranty: "12-year structural",
  },
];

const bar = (v: number) =>
  v >= 80 ? "bg-teal" : v >= 65 ? "bg-amber-400" : "bg-rose-400";

const QuoteComparisonDemo = () => {
  const [active, setActive] = useState(0);

  return (
    <section className="bg-navy-deep py-24 px-6" style={{ background: "linear-gradient(135deg, #27396A 0%, #0F1F38 100%)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">Compare Quotes</span>
        </div>
        <h2 className="font-heading text-cream text-[40px] craft:text-[60px] leading-none mb-4">
          Not just the cheapest. The clearest.
        </h2>
        <p className="font-body text-cream/70 text-base craft:text-lg max-w-2xl mb-12">
          ProGrafter scores every matched quote for clarity and fairness — so you can weigh price against
          what you actually get. The lowest number isn&apos;t always the best value.
        </p>

        {/* Selector */}
        <div className="flex gap-2 mb-6">
          {QUOTES.map((q, i) => (
            <button
              key={q.name}
              onClick={() => setActive(i)}
              className={`font-mono text-xs px-4 py-2 rounded-lg border transition-all ${
                active === i
                  ? "bg-teal text-cream border-teal"
                  : "text-cream/60 border-white/15 hover:border-teal/50"
              }`}
            >
              {q.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 craft:grid-cols-3 gap-5">
          {QUOTES.map((q, i) => (
            <div
              key={q.name}
              className={`relative rounded-2xl border backdrop-blur-md p-6 transition-all duration-300 ${
                active === i
                  ? "bg-white/[0.07] border-teal/50 scale-[1.02] shadow-xl shadow-teal/10"
                  : "bg-white/[0.03] border-white/10 opacity-70"
              }`}
            >
              {q.recommended && (
                <span className="absolute -top-3 left-6 font-mono text-[10px] uppercase tracking-widest bg-teal text-cream px-3 py-1 rounded-full">
                  Best value
                </span>
              )}
              <div className="flex items-baseline justify-between mb-5">
                <span className="font-heading text-cream text-2xl">{q.name}</span>
                <span className="font-heading text-cream text-3xl">{q.price}</span>
              </div>

              {[
                { label: "Clarity Score", val: q.clarity },
                { label: "Fairness Score", val: q.fairness },
              ].map((m) => (
                <div key={m.label} className="mb-4">
                  <div className="flex justify-between font-mono text-[11px] text-cream/60 mb-1.5">
                    <span>{m.label}</span>
                    <span>{m.val}/100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bar(m.val)} transition-all duration-700`}
                      style={{ width: active === i ? `${m.val}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}

              <ul className="space-y-2.5 mt-5 border-t border-white/10 pt-5">
                <Row ok={q.verified} label={q.verified ? "5-step verified trade" : "Verification pending"} />
                <Row ok={q.breakdown} label={q.breakdown ? "Full cost breakdown" : "No detailed breakdown"} />
                <Row ok={q.timescale !== "Not stated"} label={`Timescale: ${q.timescale}`} />
                <Row ok label={`Warranty: ${q.warranty}`} />
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <a
            href="/how-it-works"
            className="inline-flex items-center justify-center gap-2 border border-cream/30 text-cream font-mono text-sm px-7 py-3.5 rounded-xl hover:border-teal hover:text-teal transition-colors"
          >
            See how matching works
          </a>
        </div>
      </div>
    </section>
  );
};

const Row = ({ ok, label }: { ok: boolean; label: string }) => (
  <li className="flex items-center gap-2.5 font-body text-sm">
    {ok ? (
      <Check className="w-4 h-4 text-teal shrink-0" />
    ) : (
      <Minus className="w-4 h-4 text-cream/30 shrink-0" />
    )}
    <span className={ok ? "text-cream/80" : "text-cream/40"}>{label}</span>
  </li>
);

export default QuoteComparisonDemo;
