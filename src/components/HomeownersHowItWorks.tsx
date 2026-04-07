const steps = [
  {
    num: "01",
    title: "Post Your Job Free",
    desc: "Describe the work, upload photos, set your budget. Takes 3 minutes. Costs nothing.",
  },
  {
    num: "02",
    title: "Receive Verified Quotes",
    desc: "Get quotes from verified, insured local trades. Compare profiles, reviews, and prices before you decide.",
  },
  {
    num: "03",
    title: "Track Your Project Live",
    desc: "Daily photo updates from site, a live timeline showing every stage, and direct messaging with your tradesperson.",
  },
  {
    num: "04",
    title: "Receive Your Manual",
    desc: "At completion, a full PDF document: every material used, every certificate, every warranty. Yours to keep forever.",
  },
];

const HomeownersHowItWorks = () => {
  return (
    <section className="bg-cream py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">For Homeowners</span>
        </div>
        <h2 className="font-heading text-navy text-[48px] craft:text-[64px] leading-none mb-16">
          Your Project. Fully Visible. Fully Protected.
        </h2>

        <div className="grid craft:grid-cols-4 gap-[2px]">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className="relative bg-card p-8 rounded-xl fade-up"
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <span className="absolute top-4 right-6 font-heading text-[80px] leading-none text-navy/[0.05] select-none pointer-events-none">
                {step.num}
              </span>
              <span className="font-mono text-xs text-teal tracking-widest mb-4 block">{step.num}</span>
              <h3 className="font-heading text-navy text-2xl mb-3">{step.title}</h3>
              <p className="font-body text-secondary-text text-sm font-light leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeownersHowItWorks;
