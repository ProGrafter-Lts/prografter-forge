const rows = [
  {
    old: "Pay £300–£400/month whether work comes or not",
    pro: "£0 until a job completes. Then 7.5%.",
  },
  {
    old: "Get matched, then left alone",
    pro: "Matched AND managed, start to finish",
  },
  {
    old: "Disputes with no paper trail",
    pro: "Every change signed off digitally",
  },
  {
    old: "Homeowner gets nothing at the end",
    pro: "Homeowner Manual delivered at completion",
  },
];

const OldWayContrast = () => {
  return (
    <section className="bg-deep py-24 px-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">
            The Difference
          </span>
        </div>
        <h2 className="font-heading text-cream text-[40px] craft:text-[64px] leading-none mb-16">
          The Old Way vs ProGrafter
        </h2>

        <div className="grid craft:grid-cols-2 gap-8 mb-16">
          {/* Old Way */}
          <div className="fade-up">
            <h3 className="font-heading text-secondary-text text-2xl mb-6 line-through opacity-60">
              The Old Way
            </h3>
            <div className="space-y-4">
              {rows.map((r, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 border-b border-cream/10 pb-3"
                >
                  <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs shrink-0 mt-0.5">
                    ✕
                  </span>
                  <span className="font-body text-secondary-text text-sm">
                    {r.old}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ProGrafter */}
          <div className="fade-up">
            <h3 className="font-heading text-teal text-2xl mb-6">ProGrafter</h3>
            <div className="space-y-4">
              {rows.map((r, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 border-b border-cream/10 pb-3"
                >
                  <span className="w-6 h-6 rounded-full bg-teal/20 flex items-center justify-center text-teal text-xs shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span className="font-body text-cream/80 text-sm">
                    {r.pro}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Callout */}
        <div className="fade-up border border-teal/30 bg-teal/5 rounded-lg p-8 craft:p-12 mb-10 text-center">
          <p className="font-heading text-cream text-[28px] craft:text-[44px] leading-tight">
            One homeowner.{" "}
            <span className="text-secondary-text line-through opacity-70">
              Eight builders.
            </span>{" "}
            <span className="text-teal">One winner.</span>
          </p>
        </div>

        {/* Closing */}
        <p className="fade-up font-heading text-cream/90 text-xl craft:text-3xl text-center max-w-3xl mx-auto leading-snug">
          If a platform makes money when you lose,{" "}
          <span className="text-teal">it's not on your side.</span>
        </p>
      </div>
    </section>
  );
};

export default OldWayContrast;
