const TradeVerificationExplainer = () => {
  return (
    <section className="bg-deep py-24 px-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">
            Verification
          </span>
        </div>

        <h2 className="font-heading text-cream text-[48px] craft:text-[64px] leading-none mb-16">
          How we verify trades on ProGrafter
        </h2>

        <div className="max-w-3xl space-y-8">
          <p className="font-body text-cream/80 text-base leading-relaxed">
            We don&apos;t require a CSCS card. CSCS cards are a commercial
            construction site requirement — not a domestic trades
            requirement — and making them mandatory would unfairly
            exclude thousands of highly skilled residential specialists.
          </p>

          <p className="font-body text-cream/80 text-base leading-relaxed">
            Instead, we verify what actually matters:
          </p>

          <div className="space-y-6">
            <div className="border-l-2 border-teal/40 pl-6">
              <h3 className="font-heading text-teal text-xl mb-3">
                For electricians and gas engineers
              </h3>
              <div className="font-body text-cream/70 text-sm leading-relaxed space-y-3">
                <p>
                  We verify your Competent Person Scheme registration directly
                  — NICEIC, NAPIT, ELECSA, Gas Safe, or equivalent. Scheme
                  membership proves your competence has already been assessed
                  by your industry body. We don&apos;t require NVQ Level 3 as a
                  separate check — your CPS membership already depends on it.
                </p>
                <p>
                  We understand the ECS Gold Card requirements changed in
                  December 2025. If you are currently registered with NICEIC,
                  NAPIT or ELECSA as a domestic installer or qualified
                  supervisor, you are eligible to apply regardless of which
                  qualification route you used to get there.
                </p>
              </div>
            </div>

            <div className="border-l-2 border-teal/40 pl-6">
              <h3 className="font-heading text-teal text-xl mb-3">
                For all other trades
              </h3>
              <p className="font-body text-cream/70 text-sm leading-relaxed">
                We verify your public liability insurance, trading history,
                and call your client references personally. We then conduct
                a short interview. This is a higher bar than any card check
                — and it&apos;s the right bar for residential work.
              </p>
            </div>
          </div>

          <div className="mt-10 p-6 rounded-xl border border-cream/10 bg-cream/[0.02]">
            <h3 className="font-mono text-xs text-teal uppercase tracking-widest mb-4">
              What we do NOT require
            </h3>
            <ul className="space-y-2 font-body text-cream/60 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-teal mt-0.5">—</span>
                <span>CSCS card (not relevant for domestic work)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal mt-0.5">—</span>
                <span>ECS Gold Card (we verify CPS membership directly)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal mt-0.5">—</span>
                <span>NVQ Level 3 as a standalone requirement</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal mt-0.5">—</span>
                <span>Any qualification that only applies to commercial sites</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TradeVerificationExplainer;
