import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Quote = {
  name: string;
  price: string;
  clarity: number;
  verified: boolean;
  breakdown: boolean;
  timescale: string;
  warranty: string;
  recommended?: boolean;
};

const QUOTES: Quote[] = [
  {
    name: "Quote A",
    price: "£42,600",
    clarity: 88,
    verified: true,
    breakdown: true,
    timescale: "10 weeks",
    warranty: "10-year insurance-backed",
    recommended: true,
  },
  {
    name: "Quote B",
    price: "£38,900",
    clarity: 61,
    verified: true,
    breakdown: false,
    timescale: "Not stated",
    warranty: "2-year workmanship",
  },
  {
    name: "Quote C",
    price: "£47,200",
    clarity: 79,
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
    <section className="public-blueprint bg-navy-deep px-6 py-24">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">Compare Quotes</span>
          <span className="border border-cream/25 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cream/70">
            Illustrative example · sample figures
          </span>
        </div>
        <h2 className="type-h2 mb-4 text-cream">
          Not just the cheapest. The clearest.
        </h2>
        <p className="font-body text-cream/70 text-base craft:text-lg max-w-2xl mb-3">
          Quotes for the same job rarely cover the same work. Your project record lists the quotes you
          receive side by side, so you can see what each one actually includes before you judge the price.
        </p>
        <p className="font-body text-cream/60 text-sm max-w-2xl mb-12">
          A Clarity Score comes from the Quote Checker when you upload a quote for review. The figures shown
          here are a worked example, not live platform data.
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
          <Button asChild variant="outline" size="lg" className="border-cream/30 bg-transparent text-cream hover:border-teal hover:bg-transparent hover:text-teal">
            <Link to="/how-it-works">See how matching works</Link>
          </Button>
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
