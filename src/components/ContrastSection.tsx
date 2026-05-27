const checkatradeRows = [
  { tier: "Approved", radius: "—", monthly: "£30/mo", note: "No leads included" },
  { tier: "Medium", radius: "5-mile radius", monthly: "£299/mo", note: "Limited area" },
  { tier: "Medium", radius: "50-mile radius", monthly: "£1,429/mo", note: "Wider coverage" },
  { tier: "Large", radius: "50-mile radius", monthly: "£1,959/mo", note: "Full coverage" },
];

const examples = [
  {
    job: "£15,000 job",
    rate: "7.5%",
    raw: "£1,125",
    capped: "£900",
    note: "Capped — you save £225",
  },
  {
    job: "£20,000 job",
    rate: "7.5%",
    raw: "£1,500",
    capped: "£900",
    note: "Capped — you save £600",
  },
];

const ContrastSection = () => {
  return (
    <section id="pricing" className="bg-deep py-24 px-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">
            Pricing
          </span>
        </div>
        <h2 className="font-heading text-cream text-[40px] craft:text-[64px] leading-none mb-6">
          Honest Numbers
        </h2>
        <p className="font-body text-secondary-text text-base craft:text-lg max-w-2xl mb-16">
          Checkatrade prices verified April 2026. ProGrafter is free to join,
          free to quote — and capped at £900 per completed job.
        </p>

        <div className="grid craft:grid-cols-2 gap-8 mb-20">
          {/* Checkatrade */}
          <div className="fade-up">
            <h3 className="font-heading text-secondary-text text-2xl mb-2 line-through opacity-60">
              Checkatrade
            </h3>
            <p className="font-mono text-xs text-secondary-text/60 uppercase tracking-widest mb-6">
              Pay whether work comes or not
            </p>

            <div className="border border-cream/10 rounded-md overflow-hidden">
              <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 bg-cream/5">
                <span className="font-mono text-[10px] text-secondary-text uppercase tracking-widest">
                  Plan
                </span>
                <span className="font-mono text-[10px] text-secondary-text uppercase tracking-widest text-right">
                  Cost
                </span>
              </div>
              {checkatradeRows.map((r, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_auto] gap-4 px-4 py-4 border-t border-cream/10 items-center"
                >
                  <div>
                    <div className="font-body text-cream/90 text-sm">
                      {r.tier}{" "}
                      <span className="text-secondary-text">— {r.radius}</span>
                    </div>
                    <div className="font-body text-secondary-text/70 text-xs mt-0.5">
                      {r.note}
                    </div>
                  </div>
                  <span className="font-mono text-sm text-secondary-text line-through">
                    {r.monthly}
                  </span>
                </div>
              ))}
            </div>

            <p className="font-body text-secondary-text/70 text-xs mt-4">
              Annual cost (Large 50-mile):{" "}
              <span className="line-through">£23,508/yr</span> before any work
              wins.
            </p>
          </div>

          {/* ProGrafter */}
          <div className="fade-up">
            <h3 className="font-heading text-teal text-2xl mb-2">ProGrafter</h3>
            <p className="font-mono text-xs text-teal/70 uppercase tracking-widest mb-6">
              Pay only when you win
            </p>

            <div className="border border-teal/30 rounded-md overflow-hidden bg-teal/5">
              <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 bg-teal/10">
                <span className="font-mono text-[10px] text-teal uppercase tracking-widest">
                  Plan
                </span>
                <span className="font-mono text-[10px] text-teal uppercase tracking-widest text-right">
                  Cost
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-4 border-t border-teal/20 items-center">
                <div>
                  <div className="font-body text-cream text-sm">
                    Register & quote
                  </div>
                  <div className="font-body text-cream/60 text-xs mt-0.5">
                    Unlimited quotes, any radius
                  </div>
                </div>
                <span className="font-mono text-sm text-teal font-medium">
                  £0/mo
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-4 border-t border-teal/20 items-center">
                <div>
                  <div className="font-body text-cream text-sm">
                    Commission on completed job
                  </div>
                  <div className="font-body text-cream/60 text-xs mt-0.5">
                    Capped at £900 per job
                  </div>
                </div>
                <span className="font-mono text-sm text-teal font-medium">
                  7.5%
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-4 border-t border-teal/20 items-center">
                <div>
                  <div className="font-body text-cream text-sm">
                    Lock-in
                  </div>
                </div>
                <span className="font-mono text-sm text-teal font-medium">
                  None
                </span>
              </div>
            </div>

            <p className="font-body text-cream/70 text-xs mt-4">
              No work won? <span className="text-teal">You pay £0.</span> Ever.
            </p>
          </div>
        </div>

        {/* Worked examples */}
        <div className="fade-up">
          <h3 className="font-heading text-cream text-2xl craft:text-3xl mb-2">
            Worked examples
          </h3>
          <p className="font-body text-secondary-text text-sm mb-8">
            What ProGrafter actually costs you on real jobs.
          </p>

          <div className="grid craft:grid-cols-2 gap-6">
            {examples.map((e, i) => (
              <div
                key={i}
                className="border border-cream/10 rounded-md p-6 bg-cream/[0.02]"
              >
                <div className="font-mono text-xs text-teal uppercase tracking-widest mb-3">
                  {e.job}
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-body text-secondary-text">
                      {e.rate} commission
                    </span>
                    <span className="font-mono text-secondary-text line-through">
                      {e.raw}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-cream/10 pt-2">
                    <span className="font-body text-cream">You pay</span>
                    <span className="font-mono text-teal font-medium text-lg">
                      {e.capped}
                    </span>
                  </div>
                </div>
                <p className="font-body text-cream/70 text-xs">{e.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContrastSection;
