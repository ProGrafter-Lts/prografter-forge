const steps = [
  {
    num: "01",
    title: "Create Your Free Profile",
    desc: "Upload your insurance cert, select your trade type, enter your postcode, and write a short bio. Verified in under 24 hours.",
  },
  {
    num: "02",
    title: "Get Matched to Local Jobs",
    desc: "We notify you the moment a relevant job is posted within 20 miles of your location. No searching, no chasing.",
  },
  {
    num: "03",
    title: "Quote & Win",
    desc: "Submit your quote directly. The homeowner reviews profiles, reads reviews, and chooses you. Project begins.",
  },
  {
    num: "04",
    title: "Complete & Get Paid",
    desc: "Job done. Homeowner confirms completion. 7.5% commission (max £900) — you keep the rest. Paid directly.",
  },
];

const TradesHowItWorks = () => {
  return (
    <section className="bg-deep py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">For Tradespeople</span>
        </div>
        <h2 className="font-heading text-cream text-[48px] craft:text-[64px] leading-none mb-16">
          Win Work. Pay Nothing Until You Earn.
        </h2>

        <div className="grid craft:grid-cols-4 gap-0">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className="relative p-8 fade-up"
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <span className="absolute top-4 right-6 font-heading text-[80px] leading-none text-cream/[0.04] select-none pointer-events-none">
                {step.num}
              </span>
              <span className="font-mono text-xs text-teal tracking-widest mb-4 block">{step.num}</span>
              <h3 className="font-heading text-cream text-2xl mb-3">{step.title}</h3>
              <p className="font-body text-cream/60 text-sm font-light leading-relaxed">{step.desc}</p>
              <div className="mt-6 w-full h-[1px] bg-teal/20" />
            </div>
          ))}
        </div>

        <div className="mt-16 text-center fade-up">
          <p className="font-heading text-teal text-[36px] craft:text-[48px] leading-none">
            £0 monthly fee. Ever.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TradesHowItWorks;
