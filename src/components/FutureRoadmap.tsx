const ROADMAP = [
  { title: "Planning Alerts", desc: "Turn planning applications into genuine opportunities for trades.", status: "In beta" },
  { title: "AI Estimating", desc: "Fast, construction-aware cost estimates from a brief or drawings.", status: "Coming" },
  { title: "Compliance AI & RAMS", desc: "Generate risk assessments and method statements in minutes.", status: "Coming" },
  { title: "Project Intelligence", desc: "Live project health, risk and progress tracking end to end.", status: "Coming" },
  { title: "Material Cost Analysis", desc: "Real-time material pricing to sharpen quotes and budgets.", status: "Planned" },
  { title: "Construction CRM", desc: "A complete client and job pipeline built for trades.", status: "Planned" },
];

const FutureRoadmap = () => {
  return (
    <section className="bg-background py-16 craft:py-24 px-6" id="roadmap">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">The roadmap</span>
            <div className="w-8 h-[2px] bg-teal" />
          </div>
          <h2 className="font-heading text-navy text-[32px] craft:text-[48px] leading-tight max-w-3xl mx-auto">
            We&apos;re building the operating system for UK construction.
          </h2>
          <p className="font-body text-secondary-text max-w-2xl mx-auto mt-4">
            ProGrafter is an ecosystem, not a directory. Here&apos;s what&apos;s next.
          </p>
        </div>

        <div className="grid grid-cols-1 craft:grid-cols-3 gap-4 craft:gap-5">
          {ROADMAP.map((r) => (
            <div
              key={r.title}
              className="rounded-2xl bg-white border border-border/60 p-6 shadow-sm hover:shadow-md hover:border-teal/40 transition-all"
            >
              <span className="inline-block font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal/10 text-teal border border-teal/25 mb-4">
                {r.status}
              </span>
              <h3 className="font-heading text-navy text-xl leading-tight mb-2">{r.title}</h3>
              <p className="font-body text-sm text-body-text leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FutureRoadmap;
