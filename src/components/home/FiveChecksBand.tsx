import { Link } from "react-router-dom";
import { User, ShieldCheck, FileText, Briefcase, Star, ArrowRight } from "lucide-react";

const CHECKS = [
  { icon: User, title: "Identity", desc: "We verify who they are." },
  { icon: ShieldCheck, title: "Insurance", desc: "We check they're covered." },
  { icon: FileText, title: "Qualifications", desc: "We confirm their skills." },
  { icon: Briefcase, title: "Business Details", desc: "We verify they're genuine." },
  { icon: Star, title: "Reviews & Conduct", desc: "We monitor their track record." },
];

const FiveChecksBand = () => {
  return (
    <section className="bg-navy py-16 craft:py-20 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col craft:flex-row craft:items-end craft:justify-between gap-4 mb-10">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-teal mb-3">
              Trusted From The Ground Up
            </p>
            <h2 className="font-heading uppercase text-cream text-[34px] craft:text-[48px] leading-none">
              Five checks. Every trade. No exceptions.
            </h2>
          </div>
          <Link
            to="/trade-verification"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-cream/70 hover:text-teal transition-colors craft:text-right leading-relaxed"
          >
            A higher standard
            <br className="hidden craft:block" />
            for a better build
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 craft:grid-cols-5 gap-5">
          {CHECKS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-cream/10 bg-cream/[0.04] p-6 hover:border-teal/40 transition-colors"
            >
              <Icon className="w-6 h-6 text-teal mb-6" strokeWidth={1.5} />
              <h3 className="font-heading uppercase text-cream text-lg leading-tight mb-1.5">{title}</h3>
              <p className="font-body text-sm text-cream/65 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FiveChecksBand;
