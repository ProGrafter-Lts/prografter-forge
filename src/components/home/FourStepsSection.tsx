import { FileText, Search, Scale, Home } from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: FileText,
    title: "Tell us about your project",
    desc: "Share a few details about what you're planning — big or small.",
  },
  {
    num: "02",
    icon: Search,
    title: "Check your quote or request trades",
    desc: "Upload a quote for review or find verified trades for your project.",
  },
  {
    num: "03",
    icon: Scale,
    title: "Compare clearly",
    desc: "See like-for-like information so you can choose with confidence.",
  },
  {
    num: "04",
    icon: Home,
    title: "Start with confidence",
    desc: "Get to work with a verified trade and manage your project in one place.",
  },
];

const FourStepsSection = () => {
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
            From plan to progress.
            <br />
            It&apos;s a clearer process.
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

export default FourStepsSection;
