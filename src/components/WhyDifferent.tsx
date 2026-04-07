const comparisons = [
  {
    others: "Pay £300–£400/month whether work comes or not",
    prografter: "£0 until a job completes. Then 7.5%.",
  },
  {
    others: "Get matched, then left alone",
    prografter: "Matched AND managed, start to finish",
  },
  {
    others: "No project documentation",
    prografter: "Full live project record",
  },
  {
    others: "Disputes with no paper trail",
    prografter: "Every change signed off digitally",
  },
  {
    others: "Homeowner gets nothing at the end",
    prografter: "Homeowner Manual delivered at completion",
  },
];

const WhyDifferent = () => {
  return (
    <section className="bg-deep py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">The Difference</span>
        </div>
        <h2 className="font-heading text-cream text-[48px] craft:text-[64px] leading-none mb-16">
          Every Other Platform. Then ProGrafter.
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
          <div className="fade-up">
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
