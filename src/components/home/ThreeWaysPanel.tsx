import { Link } from "react-router-dom";
import { FileText, Search, Home, ChevronRight } from "lucide-react";

const CARDS = [
  {
    icon: FileText,
    title: "Check My Quote",
    desc: "Upload and check your quote for clarity, fairness and red flags.",
    href: "/quote-checker",
  },
  {
    icon: Search,
    title: "Find A Trade",
    desc: "Discover verified trades for your project, matched with care.",
    href: "/post-job-brief",
  },
  {
    icon: Home,
    title: "Manage My Project",
    desc: "Keep quotes, messages and milestones in one place.",
    href: "/dashboard/homeowner",
  },
];

const ThreeWaysPanel = () => {
  return (
    <section className="bg-deep px-6 pb-16">
      <div className="max-w-[1400px] mx-auto rounded-2xl border border-cream/10 bg-navy/40 p-8 craft:p-10">
        <div className="flex flex-col craft:flex-row craft:items-end craft:justify-between gap-4 mb-8">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-teal mb-3">
              Get Started Today
            </p>
            <h2 className="font-heading uppercase text-cream text-[32px] craft:text-[44px] leading-none">
              Three ways to move forward.
            </h2>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream/55 leading-relaxed craft:text-right">
            Simple to use.
            <br />
            Built for homeowners.
          </p>
        </div>

        <div className="grid grid-cols-1 craft:grid-cols-3 gap-5">
          {CARDS.map(({ icon: Icon, title, desc, href }) => (
            <Link
              key={title}
              to={href}
              className="group flex items-start gap-4 rounded-xl border border-cream/10 bg-cream/[0.04] p-6 hover:border-teal/50 hover:bg-cream/[0.07] transition-all"
            >
              <span className="shrink-0 w-11 h-11 rounded-xl bg-teal/12 border border-teal/25 flex items-center justify-center">
                <Icon className="w-5 h-5 text-teal" strokeWidth={1.5} />
              </span>
              <div className="flex-1">
                <h3 className="font-heading uppercase text-cream text-xl leading-tight mb-2">{title}</h3>
                <p className="font-body text-sm text-cream/65 leading-relaxed">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-cream/40 group-hover:text-teal group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ThreeWaysPanel;
