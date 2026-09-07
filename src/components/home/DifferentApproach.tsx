import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import blueprint from "@/assets/home/blueprint-lines.jpg";

const POINTS = [
  "Clear scopes, not vague listings",
  "Controlled matching, not open directories",
  "Verified trades, not unverified sign-ups",
  "Better accountability, from quote to completion",
];

const DifferentApproach = () => {
  return (
    <section className="relative bg-navy py-16 craft:py-20 px-6 overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-[45%] hidden craft:block pointer-events-none">
        <img
          src={blueprint}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={1024}
          height={768}
          className="h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/60 to-transparent" />
      </div>

      <div className="hidden craft:block absolute top-1/3 right-16 pointer-events-none">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream/70 leading-relaxed -rotate-3">
          A clearer
          <br />
          brighter way
          <br />
          to build
        </p>
        <div className="mt-2 w-12 h-[2px] bg-teal" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto grid grid-cols-1 craft:grid-cols-2 gap-10 craft:gap-16 items-start">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-teal mb-3">
            A Different Approach
          </p>
          <h2 className="font-heading uppercase text-cream text-[30px] craft:text-[44px] leading-[1.02] mb-5">
            Not Checkatrade. Not MyBuilder. Not Rated People.
          </h2>
          <p className="font-body text-cream/80 text-base leading-relaxed max-w-lg mb-8">
            ProGrafter is built for homeowners who want more than just a list of names. We focus on clear
            scopes, controlled matching and better accountability — so you can build with confidence.
          </p>
          <Link
            to="/about"
            className="inline-flex items-center gap-3 bg-teal text-cream font-body text-sm font-semibold uppercase tracking-wide px-7 py-3.5 rounded-xl hover:bg-teal-hover transition-all shadow-lg shadow-teal/25 hover:-translate-y-0.5"
          >
            Find Out More
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <ul className="space-y-4 craft:border-l craft:border-cream/12 craft:pl-12">
          {POINTS.map((p) => (
            <li key={p} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal shrink-0" strokeWidth={1.75} />
              <span className="font-body text-sm text-cream/85">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default DifferentApproach;
