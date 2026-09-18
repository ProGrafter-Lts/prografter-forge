import { Link } from "react-router-dom";
import { Hammer, FileSignature, Radar, ChevronRight, PanelsTopLeft } from "lucide-react";

type TradeCard = {
  icon: typeof Hammer;
  title: string;
  desc: string;
  href?: string;
};

const CARDS: TradeCard[] = [
  {
    icon: Hammer,
    title: "Genuine Local Work",
    desc: "Reviewed project briefs near you, released to suitable trades as coverage allows.",
  },
  {
    icon: FileSignature,
    title: "Quote Properly",
    desc: "See how quotes, work and payments are handled inside a live project.",
    href: "/platform-tour#quoting",
  },
  {
    icon: Radar,
    title: "Planning Alerts",
    desc: "See approved planning applications in your area before the calls start.",
    href: "/planning-intelligence",
  },
  {
    icon: PanelsTopLeft,
    title: "Explore The Tools",
    desc: "See today’s platform and the clearly labelled development roadmap.",
    href: "/platform-tour#live-now",
  },
];

const TradeWaysPanel = () => {
  return (
    <section className="bg-deep px-6 pb-16">
      <div className="max-w-[1400px] mx-auto rounded-2xl border border-cream/10 bg-navy/40 p-8 craft:p-10">
        <div className="flex flex-col craft:flex-row craft:items-end craft:justify-between gap-4 mb-8">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-teal mb-3">
              Marketplace + Optional Tools
            </p>
            <h2 className="font-heading uppercase text-cream text-[32px] craft:text-[44px] leading-none">
               Find work. Use tools when they help.
            </h2>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream/55 leading-relaxed craft:text-right">
            Local density first.
            <br />
            Better-fit opportunities.
          </p>
        </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 craft:grid-cols-4 gap-5">
          {CARDS.map(({ icon: Icon, title, desc, href }) => {
            const content = (
              <>
              <span className="shrink-0 w-11 h-11 rounded-xl bg-teal/12 border border-teal/25 flex items-center justify-center">
                <Icon className="w-5 h-5 text-teal" strokeWidth={1.5} />
              </span>
              <div className="flex-1">
                <h3 className="font-heading uppercase text-cream text-xl leading-tight mb-2">{title}</h3>
                <p className="font-body text-sm text-cream/65 leading-relaxed">{desc}</p>
              </div>
              {href && <ChevronRight className="w-4 h-4 text-cream/40 group-hover:text-teal group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />}
              </>
            );

            return href ? (
              <Link key={title} to={href} className="group flex items-start gap-4 rounded-xl border border-cream/10 bg-cream/[0.04] p-6 hover:border-teal/50 hover:bg-cream/[0.07] transition-all">
                {content}
              </Link>
            ) : (
              <article key={title} className="flex items-start gap-4 rounded-xl border border-cream/10 bg-cream/[0.04] p-6">
                {content}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TradeWaysPanel;
