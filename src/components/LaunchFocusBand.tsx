import { Link } from "react-router-dom";
import { ArrowRight, MapPin, ShieldCheck, TrendingUp } from "lucide-react";

const SIGNALS = [
  { value: "1", label: "active verified trade" },
  { value: "1", label: "live project" },
  { value: "Early", label: "homeowner enquiries" },
  { value: "Growing", label: "trade applications" },
];

const LaunchFocusBand = () => (
  <section className="bg-cream px-6 py-16 craft:py-20">
    <div className="mx-auto grid max-w-[1400px] gap-10 craft:grid-cols-[1.05fr_0.95fr] craft:items-center">
      <div>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-teal">Focused launch</p>
        <h2 className="font-heading text-[34px] uppercase leading-none text-navy craft:text-[48px]">
          Building density before distance.
        </h2>
        <p className="mt-5 max-w-xl font-body text-base leading-relaxed text-secondary-text">
          We are currently prioritising Nottinghamshire and the East Midlands so local matching stays
          responsive and standards stay high. We will expand county by county as verified coverage grows.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-teal" /><p className="text-sm text-body-text">A strong local base first</p></div>
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal" /><p className="text-sm text-body-text">Quality before volume</p></div>
          <div className="flex items-start gap-3"><TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-teal" /><p className="text-sm text-body-text">National demand held as coverage grows</p></div>
        </div>
        <Link to="/how-it-works" className="mt-7 inline-flex items-center gap-2 font-body text-sm font-semibold text-teal hover:text-teal-hover">
          See how matching works <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="rounded-xl border border-navy/10 bg-white p-6 shadow-sm craft:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-secondary-text">Current platform position</p>
        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
          {SIGNALS.map((signal) => (
            <div key={signal.label} className="bg-white p-5">
              <p className="font-heading text-3xl text-navy">{signal.value}</p>
              <p className="mt-1 text-xs leading-relaxed text-secondary-text">{signal.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm leading-relaxed text-secondary-text">
          Additional trades have applied, including some outside the current core area. Early members can stay ready on the free core platform while local demand develops.
        </p>
        <div className="mt-5 border-t border-border pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-secondary-text">Evidence as the network grows</p>
          <p className="mt-2 text-sm text-body-text">Verified reviews, completed-project photography and larger live statistics will appear here when there is enough real evidence to publish.</p>
        </div>
      </div>
    </div>
  </section>
);

export default LaunchFocusBand;