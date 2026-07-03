import { useMemo, useState } from "react";

const GBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(
    Math.max(0, Math.round(n)),
  );

const RATE = 0.075;
const CAP = 900;

/** Trade commission calculator: shows exactly what a job costs and what you keep. */
const CommissionCalculator = () => {
  const [job, setJob] = useState(4000);

  const { commission, capped, keep } = useMemo(() => {
    const raw = job * RATE;
    const commission = Math.min(raw, CAP);
    return { commission, capped: raw > CAP, keep: job - commission };
  }, [job]);

  return (
    <div className="rounded-2xl bg-white border border-border/60 p-6 craft:p-8 shadow-sm">
      <h3 className="font-heading text-navy text-2xl mb-1">Commission calculator</h3>
      <p className="font-body text-sm text-secondary-text mb-6">
        7.5% only on completed, paid jobs — capped at {GBP(CAP)}.
      </p>

      <label className="font-mono text-xs uppercase tracking-wide text-secondary-text">Job value</label>
      <div className="flex items-center gap-3 mt-2 mb-4">
        <span className="font-heading text-navy text-3xl">{GBP(job)}</span>
      </div>
      <input
        type="range"
        min={200}
        max={40000}
        step={100}
        value={job}
        onChange={(e) => setJob(Number(e.target.value))}
        className="w-full accent-teal"
        aria-label="Job value"
      />
      <div className="flex justify-between font-mono text-[11px] text-secondary-text mt-1 mb-6">
        <span>£200</span>
        <span>£40,000</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-cream border border-border/60 p-4 text-center">
          <div className="font-heading text-navy text-2xl">{GBP(commission)}</div>
          <div className="font-mono text-[11px] text-secondary-text uppercase mt-1">
            ProGrafter fee{capped ? " (capped)" : ""}
          </div>
        </div>
        <div className="rounded-xl bg-teal/10 border border-teal/25 p-4 text-center">
          <div className="font-heading text-teal text-2xl">{GBP(keep)}</div>
          <div className="font-mono text-[11px] text-secondary-text uppercase mt-1">You keep</div>
        </div>
      </div>
      {capped && (
        <p className="font-body text-xs text-secondary-text mt-4">
          On a {GBP(job)} job the raw 7.5% would be {GBP(job * RATE)} — but our {GBP(CAP)} cap saves
          you {GBP(job * RATE - CAP)}.
        </p>
      )}
    </div>
  );
};

export default CommissionCalculator;
