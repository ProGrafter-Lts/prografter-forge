const comparisons = [
  { feature: "Monthly subscription", old: "£400/mo", pro: "£0/mo" },
  { feature: "Commission cap", old: "None", pro: "£900/year" },
  { feature: "Transparent pricing", old: false, pro: true },
  { feature: "No lock-in contracts", old: false, pro: true },
  { feature: "Verified local leads", old: false, pro: true },
];

const ContrastSection = () => {
  return (
    <section id="pricing" className="bg-deep py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">Pricing</span>
        </div>
        <h2 className="font-heading text-cream text-[48px] craft:text-[64px] leading-none mb-16">Honest Numbers</h2>

        <div className="grid craft:grid-cols-2 gap-8">
          {/* Old way */}
          <div className="fade-up">
            <h3 className="font-heading text-secondary-text text-2xl mb-6 line-through opacity-60">The Old Way</h3>
            <div className="space-y-4">
              {comparisons.map((c) => (
                <div key={c.feature} className="flex items-center justify-between border-b border-cream/10 pb-3">
                  <span className="font-body text-secondary-text text-sm">{c.feature}</span>
                  {typeof c.old === "boolean" ? (
                    <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs">✕</span>
                  ) : (
                    <span className="font-mono text-sm text-secondary-text line-through">{c.old}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ProGrafter */}
          <div className="fade-up">
            <h3 className="font-heading text-teal text-2xl mb-6">ProGrafter</h3>
            <div className="space-y-4">
              {comparisons.map((c) => (
                <div key={c.feature} className="flex items-center justify-between border-b border-cream/10 pb-3">
                  <span className="font-body text-cream/80 text-sm">{c.feature}</span>
                  {typeof c.pro === "boolean" ? (
                    <span className="w-6 h-6 rounded-full bg-teal/20 flex items-center justify-center text-teal text-xs">✓</span>
                  ) : (
                    <span className="font-mono text-sm text-teal font-medium">{c.pro}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContrastSection;
