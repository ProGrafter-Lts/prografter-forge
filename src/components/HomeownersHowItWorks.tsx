const steps = [
  {
    num: "01",
    title: "Verified trades",
    desc: "5-check standard: ID, qualifications, insurance, Companies House, references. Every check logged per trade.",
  },
  {
    num: "02",
    title: "A real contract",
    desc: "Every job has a written contract. Variations agreed in writing before work starts.",
  },
  {
    num: "03",
    title: "Money protected",
    desc: "Staged payments held safe until each milestone is signed off. The trade gets paid; you stay protected.",
  },
  {
    num: "04",
    title: "Full Homeowner Manual",
    desc: "Every certificate, warranty and photo at completion. The record you'll show friends — and your insurer.",
  },
];

const HomeownersHowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-cream py-24 px-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">Trust</span>
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
              <span className="absolute top-2 right-4 craft:top-4 craft:right-6 font-heading text-[48px] craft:text-[80px] leading-none text-navy/[0.05] select-none pointer-events-none">
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
