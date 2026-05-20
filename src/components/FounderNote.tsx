import { ArrowRight } from "lucide-react";

const FounderNote = () => {
  return (
    <section className="bg-deep py-20 px-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="grid craft:grid-cols-2 gap-12 items-center">
          {/* Image placeholder — Lee can drop a photo here later */}
          <div className="fade-up order-2 craft:order-1">
            <div
              className="rounded-xl border aspect-[4/5] craft:aspect-square flex items-center justify-center"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <span className="font-mono text-xs text-cream/30 uppercase tracking-widest">
                Founder photo
              </span>
            </div>
          </div>

          {/* Text */}
          <div className="fade-up order-1 craft:order-2">
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
            <p className="font-body text-secondary-text text-base font-light leading-relaxed mb-6">
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

            {/* Link */}
            <a
              href="/about"
              className="inline-flex items-center gap-2 font-mono text-sm text-teal hover:text-teal-hover transition-colors group"
            >
              Read the full story
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FounderNote;
