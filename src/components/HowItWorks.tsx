const steps = [
  {
    num: "01",
    title: "Sign Up",
    desc: "Create your free profile in under two minutes. No card required, no commitment.",
    icon: (
      <svg width="32" height="32" fill="none" stroke="#0D9488" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M22 11h-6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Get Matched",
    desc: "We connect you with homeowners in your area who need your specific trade skills.",
    icon: (
      <svg width="32" height="32" fill="none" stroke="#0D9488" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Get Paid",
    desc: "Complete the job, get paid directly. We only take 7.5% — capped at £900 a year.",
    icon: (
      <svg width="32" height="32" fill="none" stroke="#0D9488" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-cream py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">Process</span>
        </div>
        <h2 className="font-heading text-navy text-[48px] craft:text-[64px] leading-none mb-12">How It Works</h2>

        <div className="grid craft:grid-cols-3 gap-[2px] bg-cream">
          {steps.map((step) => (
            <div key={step.num} className="relative bg-card p-8 rounded-[4px] fade-up">
              {/* Ghost number */}
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

export default HowItWorks;
