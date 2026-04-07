const steps = [
  {
    num: "01",
    title: "Post Your Job",
    desc: "Describe what you need done. It takes under two minutes and costs nothing.",
    icon: (
      <svg width="32" height="32" fill="none" stroke="hsl(174 84% 32%)" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Receive Quotes",
    desc: "Get quotes from verified, insured tradespeople in your area. Compare and choose with confidence.",
    icon: (
      <svg width="32" height="32" fill="none" stroke="hsl(174 84% 32%)" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Track Your Project",
    desc: "Follow your project live with daily photo updates, a real-time timeline, and digital variation sign-off.",
    icon: (
      <svg width="32" height="32" fill="none" stroke="hsl(174 84% 32%)" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Receive Your Manual",
    desc: "At completion, receive a full Homeowner Manual — a digital record of everything done to your property.",
    icon: (
      <svg width="32" height="32" fill="none" stroke="hsl(174 84% 32%)" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 7h8M8 11h5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const HomeownersHowItWorks = () => {
  return (
    <section className="bg-card py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">For Homeowners</span>
        </div>
        <h2 className="font-heading text-navy text-[48px] craft:text-[64px] leading-none mb-4">How It Works</h2>
        <p className="font-body text-secondary-text text-sm font-light mb-12 max-w-xl">From posting your job to receiving your Homeowner Manual — we've got you covered.</p>

        <div className="grid craft:grid-cols-4 gap-[2px]">
          {steps.map((step, i) => (
            <div key={step.num} className="relative bg-cream p-8 rounded-xl fade-up" style={{ transitionDelay: `${i * 0.08}s` }}>
              <span className="absolute top-4 right-6 font-heading text-[80px] leading-none text-navy/[0.05] select-none pointer-events-none">
                {step.num}
              </span>
              <div className="mb-4">{step.icon}</div>
              <h3 className="font-heading text-navy text-2xl mb-2">{step.title}</h3>
              <p className="font-body text-secondary-text text-sm font-light leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeownersHowItWorks;
