const comparisons = [
  {
    others: 'Sell you "leads" you pay for whether they hire you or not',
    prografter: "Free to post a job. Free to quote a job.",
  },
  {
    others: '"Free trials" that start charging you a subscription',
    prografter: "7.5% only on completion, capped at £900. No subscription, ever.",
  },
  {
    others: "A directory — then they walk away",
    prografter: "A written contract, staged payments held safe, and a Homeowner Manual at the end.",
  },
  {
    others: "Price promises, with nothing protecting the customer behind them",
    prografter: "Fair to the homeowner. Fair to the trade. We only earn when you do.",
  },
];

const WhyDifferent = () => {
  return (
    <section className="bg-deep py-24 px-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">The Difference</span>
        </div>
        <h2 className="font-heading text-cream text-[48px] craft:text-[64px] leading-none mb-16">
          The difference, plainly.
        </h2>

        <div className="grid craft:grid-cols-2 gap-8">
          {/* Other platforms */}
          <div className="fade-up">
            <h3 className="font-heading text-secondary-text text-2xl mb-6 line-through opacity-60">Other Platforms</h3>
            <div className="space-y-4">
              {comparisons.map((c, i) => (
                <div key={i} className="flex items-start gap-3 border-b border-cream/10 pb-3">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs shrink-0 mt-0.5">✕</span>
                  <span className="font-body text-secondary-text text-sm">{c.others}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ProGrafter */}
          <div className="fade-up rounded-xl border-2 border-teal/60 p-6 bg-teal/[0.04]">
            <h3 className="font-heading text-teal text-2xl mb-6">ProGrafter</h3>
            <div className="space-y-4">
              {comparisons.map((c, i) => (
                <div key={i} className="flex items-start gap-3 border-b border-cream/10 pb-3">
                  <span className="w-6 h-6 rounded-full bg-teal/20 flex items-center justify-center text-teal text-xs shrink-0 mt-0.5">✓</span>
                  <span className="font-body text-cream/80 text-sm">{c.prografter}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyDifferent;
