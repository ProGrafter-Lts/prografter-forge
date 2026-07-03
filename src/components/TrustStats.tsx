import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Trust & social proof band.
 * Every figure is verifiable. Where a metric is not yet meaningful (below a
 * sensible threshold, or unavailable), we show a trust-focused message instead
 * of an invented number. As real volume grows the messages transition to live
 * counters automatically.
 */

type Metric = {
  key: string;
  label: string;
  /** Trust message shown until the live figure is meaningful. */
  fallback: string;
  /** Minimum value before we show the live number. */
  threshold: number;
  /** Optional suffix, e.g. "+" or "/10". */
  format?: (n: number) => string;
};

const METRICS: Metric[] = [
  { key: "verified_trades", label: "Verified trades", fallback: "5-step verified", threshold: 10, format: (n) => `${n}` },
  { key: "homeowners", label: "Homeowners", fallback: "Every brief reviewed", threshold: 25, format: (n) => `${n}` },
  { key: "quotes_analysed", label: "Quotes analysed", fallback: "AI Quote Checker live", threshold: 10, format: (n) => `${n}` },
  { key: "jobs_completed", label: "Jobs completed", fallback: "Two-way accountability", threshold: 5, format: (n) => `${n}` },
  { key: "avg_clarity", label: "Avg Clarity Score", fallback: "Clarity Scored", threshold: 1, format: (n) => `${n.toFixed(1)}/10` },
];

const CountUp = ({ text }: { text: string }) => {
  return <span>{text}</span>;
};

const TrustStats = () => {
  const [values, setValues] = useState<Record<string, number | null>>({});

  useEffect(() => {
    let active = true;

    const safeCount = async (table: string, filter?: (q: any) => any) => {
      try {
        let q = supabase.from(table as any).select("*", { count: "exact", head: true });
        if (filter) q = filter(q);
        const { count, error } = await q;
        if (error) return null;
        return count ?? 0;
      } catch {
        return null;
      }
    };

    (async () => {
      const verifiedTrades = await Promise.resolve(
        supabase.rpc("count_verified_trades")
      )
        .then(({ data }: any) => (typeof data === "number" ? data : null))
        .catch(() => null);
      const [homeowners, quotes] = await Promise.all([
        safeCount("homeowners"),
        safeCount("quote_checks"),
      ]);
      const verified = verifiedTrades;

      // Average clarity score — best effort; falls back to message if blocked.
      let avgClarity: number | null = null;
      try {
        const { data } = await supabase
          .from("quote_checks" as any)
          .select("document_score")
          .not("document_score", "is", null)
          .limit(500);
        if (Array.isArray(data) && data.length) {
          const scores = data
            .map((r: any) => Number(r.document_score))
            .filter((n) => !Number.isNaN(n));
          if (scores.length) avgClarity = scores.reduce((a, b) => a + b, 0) / scores.length;
        }
      } catch {
        avgClarity = null;
      }

      if (!active) return;
      setValues({
        verified_trades: verified,
        homeowners,
        quotes_analysed: quotes,
        jobs_completed: null,
        avg_clarity: avgClarity,
      });
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="bg-cream py-16 craft:py-24 px-6" id="trust">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">Trust, by the numbers</span>
            <div className="w-8 h-[2px] bg-teal" />
          </div>
          <h2 className="font-heading text-navy text-[32px] craft:text-[48px] leading-tight">
            Every figure verifiable. Nothing inflated.
          </h2>
          <p className="font-body text-secondary-text max-w-2xl mx-auto mt-4">
            Trust is our biggest asset. Where a number isn&apos;t yet meaningful we show what we
            stand for instead — and it becomes a live metric as the platform grows.
          </p>
        </div>

        <div className="grid grid-cols-2 craft:grid-cols-5 gap-4">
          {METRICS.map((m) => {
            const v = values[m.key];
            const showNumber = typeof v === "number" && v >= m.threshold;
            const display = showNumber && m.format ? m.format(v as number) : m.fallback;
            return (
              <div
                key={m.key}
                className="rounded-2xl bg-white border border-border/60 p-6 text-center shadow-sm hover:shadow-md hover:border-teal/40 transition-all"
              >
                <div className={`font-heading text-navy leading-none mb-2 ${showNumber ? "text-4xl craft:text-5xl" : "text-lg craft:text-xl"}`}>
                  <CountUp text={display} />
                </div>
                <div className="font-mono text-[11px] text-secondary-text uppercase tracking-wide">{m.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustStats;
