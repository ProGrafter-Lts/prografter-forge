import { UserCheck, Bell, FileSignature, Banknote } from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: UserCheck,
    title: "Create your free profile",
    desc: "Add your trade, postcode and insurance. Most accounts are verified within 24 hours.",
  },
  {
    num: "02",
    icon: Bell,
    title: "Get matched to local jobs",
    desc: "We tell you as soon as a relevant project is posted near you. No searching, no chasing.",
  },
  {
    num: "03",
    icon: FileSignature,
    title: "Quote and win",
    desc: "Send a clear, branded quote. The homeowner compares properly and chooses you.",
  },
  {
    num: "04",
    icon: Banknote,
    title: "Complete and get paid",
    desc: "Job done and signed off. 7.5% commission, capped at £900 — you keep the rest.",
  },
];

const TradeStepsSection = () => {
  return (
    <section className="bg-cream py-16 craft:py-24 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col craft:flex-row craft:items-end craft:justify-between gap-4 mb-12">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-teal mb-3">
              Four Simple Steps
            </p>
            <h2 className="font-heading uppercase text-navy text-[38px] craft:text-[56px] leading-none">
              How It Works
            </h2>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-secondary-text leading-relaxed craft:text-right">
            Free to join.
            <br />
            Pay only when you win.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 craft:grid-cols-4 gap-8 craft:gap-0">
          {STEPS.map(({ num, icon: Icon, title, desc }, i) => (
            <div key={num} className={`craft:px-8 ${i > 0 ? "craft:border-l craft:border-navy/12" : "craft:pl-0"}`}>
              <div className="flex items-start justify-between mb-5">
                <Icon className="w-7 h-7 text-teal" strokeWidth={1.5} />
                <span className="font-heading text-[34px] leading-none text-navy/15 select-none">{num}</span>
              </div>
              <h3 className="font-heading uppercase text-navy text-lg leading-tight mb-3">{title}</h3>
              <p className="font-body text-sm text-secondary-text leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TradeStepsSection;
