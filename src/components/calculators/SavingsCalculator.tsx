import { useMemo, useState } from "react";

const GBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(
    Math.max(0, Math.round(n)),
  );

const RATE = 0.075;
const CAP = 900;

/**
 * Savings calculator — compares ProGrafter's commission-only model against a
 * typical lead-based platform (monthly fee + per-lead charges). Figures are
 * user-adjustable and clearly illustrative of common industry pricing.
 */
const SavingsCalculator = () => {
  const [jobsPerMonth, setJobsPerMonth] = useState(3);
  const [avgJob, setAvgJob] = useState(2000);
  const [monthlyFee, setMonthlyFee] = useState(80);
  const [leadsPerJob, setLeadsPerJob] = useState(6);
  const [costPerLead, setCostPerLead] = useState(25);

  const { pgYear, otherYear, saving } = useMemo(() => {
    const perJobCommission = Math.min(avgJob * RATE, CAP);
    const pgYear = perJobCommission * jobsPerMonth * 12;

    const leadCostMonthly = jobsPerMonth * leadsPerJob * costPerLead;
    const otherYear = (monthlyFee + leadCostMonthly) * 12;

    return { pgYear, otherYear, saving: otherYear - pgYear };
  }, [jobsPerMonth, avgJob, monthlyFee, leadsPerJob, costPerLead]);

  const Field = ({
    label,
    value,
    set,
    min,
    max,
    step,
    prefix,
  }: {
    label: string;
    value: number;
    set: (n: number) => void;
    min: number;
    max: number;
    step: number;
    prefix?: string;
  }) => (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <label className="font-mono text-xs uppercase tracking-wide text-secondary-text">{label}</label>
        <span className="font-heading text-navy text-lg">
          {prefix}
          {value.toLocaleString("en-GB")}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="w-full accent-teal"
        aria-label={label}
      />
    </div>
  );

  return (
    <div className="rounded-2xl bg-white border border-border/60 p-6 craft:p-8 shadow-sm">
      <h3 className="font-heading text-navy text-2xl mb-1">Savings calculator</h3>
      <p className="font-body text-sm text-secondary-text mb-6">
        Compare ProGrafter's commission-only model with a typical monthly-fee + pay-per-lead site.
      </p>

      <div className="space-y-5 mb-7">
        <Field label="Jobs won / month" value={jobsPerMonth} set={setJobsPerMonth} min={1} max={30} step={1} />
        <Field label="Average job value" value={avgJob} set={setAvgJob} min={200} max={20000} step={100} prefix="£" />
        <div className="pt-2 border-t border-border/50">
          <p className="font-mono text-[11px] uppercase tracking-wide text-secondary-text mb-3">Typical lead-site costs</p>
          <div className="space-y-5">
            <Field label="Monthly fee" value={monthlyFee} set={setMonthlyFee} min={0} max={200} step={5} prefix="£" />
            <Field label="Leads bought / job" value={leadsPerJob} set={setLeadsPerJob} min={1} max={12} step={1} />
            <Field label="Cost per lead" value={costPerLead} set={setCostPerLead} min={2} max={50} step={1} prefix="£" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-cream border border-border/60 p-4 text-center">
          <div className="font-heading text-navy text-2xl">{GBP(otherYear)}</div>
          <div className="font-mono text-[11px] text-secondary-text uppercase mt-1">Lead site / year</div>
        </div>
        <div className="rounded-xl bg-cream border border-border/60 p-4 text-center">
          <div className="font-heading text-navy text-2xl">{GBP(pgYear)}</div>
          <div className="font-mono text-[11px] text-secondary-text uppercase mt-1">ProGrafter / year</div>
        </div>
      </div>

      <div className="rounded-xl bg-teal/10 border border-teal/25 p-5 text-center mt-3">
        <div className="font-heading text-teal text-3xl">{saving > 0 ? GBP(saving) : GBP(0)}</div>
        <div className="font-mono text-[11px] text-secondary-text uppercase mt-1">
          {saving > 0 ? "Estimated yearly saving" : "No upfront risk either way"}
        </div>
      </div>
      <p className="font-body text-xs text-secondary-text mt-4">
        {saving > 0
          ? "Illustrative of common lead-based pricing models, not a statement about any named competitor."
          : "At high job volumes commission can exceed lead fees — but you pay nothing until a job completes and you've been paid, with a £900 per-job cap and no money at risk on leads that never convert."}
      </p>
    </div>
  );
};

export default SavingsCalculator;
