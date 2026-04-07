const steps = [
  {
    num: "01",
    title: "Create Your Profile",
    desc: "Set up your trade profile in minutes. Showcase your skills, qualifications, and past work. No fees to join.",
    icon: (
      <svg width="32" height="32" fill="none" stroke="hsl(174 84% 32%)" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M22 11h-6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Get Matched to Local Jobs",
    desc: "We connect you with homeowners in your area who need your exact trade skills. No chasing — jobs come to you.",
    icon: (
      <svg width="32" height="32" fill="none" stroke="hsl(174 84% 32%)" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Quote & Win",
    desc: "Submit your quote directly to the homeowner. No bidding wars — just honest pricing and clear communication.",
    icon: (
      <svg width="32" height="32" fill="none" stroke="hsl(174 84% 32%)" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Complete & Get Paid",
    desc: "Finish the job, get paid directly. We only take 7.5% commission — capped at £900. Zero monthly fees, ever.",
    icon: (
      <svg width="32" height="32" fill="none" stroke="hsl(174 84% 32%)" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const TradesHowItWorks = () => {
  return (
    <section className="bg-cream py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">For Trades</span>
        </div>
        <h2 className="font-heading text-navy text-[48px] craft:text-[64px] leading-none mb-4">How It Works</h2>
        <p className="font-body text-secondary-text text-sm font-light mb-12 max-w-xl">Commission only. Zero monthly fees. You only pay when you earn.</p>

        <div className="grid craft:grid-cols-4 gap-[2px]">
          {steps.map((step, i) => (
            <div key={step.num} className="relative bg-card p-8 rounded-xl fade-up" style={{ transitionDelay: `${i * 0.08}s` }}>
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

export default TradesHowItWorks;
