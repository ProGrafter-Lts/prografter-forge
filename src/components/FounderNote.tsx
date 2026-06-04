const FounderNote = () => {
  return (
    <section id="why-i-built-it" className="bg-deep py-20 px-6 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <div className="fade-up">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">
              Why I Built It
            </span>
          </div>

          {/* Heading */}
          <h2 className="font-heading text-cream text-[42px] craft:text-[56px] leading-none mb-6">
            Built by a working builder.<br />
            <span className="text-teal">Not a tech firm.</span>
          </h2>

          {/* Body */}
          <p className="font-body text-secondary-text text-base font-light leading-relaxed">
            I'm Lee. I've been a builder for twenty-seven years, since I was
            sixteen — residential development sites, refurbs and extensions
            across Nottinghamshire. I also qualified as an electrician in 2013.
            ProGrafter is built to fix the things that gave me restless nights
            on the tools: quoting that drags on for weeks, communication that
            falls apart mid-build, variations agreed verbally that turn into
            arguments over money, and getting paid late despite the work being
            signed off. Every one of those has a structural fix — and that's
            what this platform is.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FounderNote;
