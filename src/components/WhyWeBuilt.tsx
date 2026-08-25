const WhyWeBuilt = () => {
  return (
    <section
      className="relative overflow-hidden py-20 craft:py-28 px-6 bg-navy"
      style={{ background: "linear-gradient(135deg, #27396A 0%, #0F1F38 100%)" }}
    >
      <div className="pointer-events-none absolute -top-20 right-0 h-80 w-80 rounded-full bg-teal/15 blur-[120px]" />
      <div className="relative max-w-3xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">Why we built ProGrafter</span>
          <div className="w-8 h-[2px] bg-teal" />
        </div>
        <h2 className="font-heading text-cream text-[30px] craft:text-[46px] leading-[1.05] mb-8">
          Someone finally on your side.
        </h2>
        <div className="space-y-6 font-body text-cream/85 text-lg craft:text-xl font-light leading-relaxed">
          <p>
            After decades working in construction, we saw the same thing over and over — homeowners
            handed wildly different quotations with no way to judge them, good tradespeople losing
            work to poor competitors, and trust draining out of the industry.
          </p>
          <p>
            ProGrafter was built to change that — not by selling more leads, but by making
            construction fairer, clearer and more transparent for everyone.
          </p>
        </div>
        <p className="mt-10 font-mono text-sm text-teal">— Founder, ProGrafter</p>
      </div>
    </section>
  );
};

export default WhyWeBuilt;
