import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const beliefs = [
  { num: "01", text: "Trades should only pay when they earn" },
  { num: "02", text: "Homeowners deserve to see their project every day" },
  { num: "03", text: "Every construction job deserves a proper paper trail" },
];

const About = () => {
  return (
    <div className="min-h-screen bg-deep">
      <SEO
        title="About ProGrafter — Built by a Qualified Electrician for Trades & Homeowners"
        description="ProGrafter was founded by Lee Palfreeman after 20 years as a qualified electrician. A commission-only marketplace built to give trades and homeowners a fair deal."
        path="/about"
      />
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <span className="absolute -bottom-8 right-0 font-heading text-[160px] craft:text-[280px] text-cream select-none pointer-events-none leading-none" style={{ opacity: 0.03 }}>
          ABOUT
        </span>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">Our Story</span>
          </div>
          <h1 className="font-heading text-cream text-[44px] craft:text-[88px] leading-[0.95] max-w-4xl">
            Built by someone<br />
            who's been on<br />
            <span className="text-teal">both sides.</span>
          </h1>
        </div>
      </section>

      {/* Founding story */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="border-l-2 border-teal pl-8 craft:pl-12 space-y-6 font-body text-cream/80 text-lg leading-relaxed font-light">
            <p>
              I spent 20 years as a qualified electrician. In that time I watched good
              tradespeople pay hundreds of pounds every month to lead platforms — whether
              work came in or not.
            </p>
            <p>
              I watched homeowners sign contracts worth tens of thousands of pounds with
              no idea what was actually in them, and no way to track what was happening
              on their property once work started.
            </p>
            <p className="text-cream font-normal">
              Nobody was fixing either problem. So I did.
            </p>
            <p>
              ProGrafter was built from home, in my spare time, from{" "}
              <span className="text-teal font-mono">£153</span> in setup costs.
              Commission-only marketplace. Zero monthly fees. Live project tracking.
              AI Quote Checker. Green Grant matching.
            </p>
            <p className="font-mono text-sm text-secondary-text uppercase tracking-wider pt-4">
              Live since April 2026 · prografter.co.uk
            </p>
          </div>
        </div>
      </section>

      {/* Founder card */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="bg-navy/40 border border-teal/20 rounded-2xl p-8 craft:p-12 relative overflow-hidden">
            <span className="absolute -top-6 -right-4 font-heading text-[120px] text-teal select-none pointer-events-none leading-none" style={{ opacity: 0.06 }}>
              LP
            </span>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-8 h-[2px] bg-teal" />
              <span className="font-mono text-xs text-teal uppercase tracking-widest">The Founder</span>
            </div>
            <div className="grid craft:grid-cols-[auto_1fr] gap-x-12 gap-y-4 relative z-10">
              <h2 className="font-heading text-cream text-[40px] craft:text-[56px] leading-none craft:col-span-2 mb-4">
                Lee Palfreeman
              </h2>
              <FounderRow label="Title" value="Founder, ProGrafter Ltd" />
              <FounderRow label="Background" value="20 years as a qualified electrician" />
              <FounderRow label="Location" value="United Kingdom" />
              <FounderRow
                label="Email"
                value={
                  <a href="mailto:hello@prografter.co.uk" className="text-teal hover:underline">
                    hello@prografter.co.uk
                  </a>
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* The mission */}
      <section className="px-6 py-20 border-t border-cream/5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">The Mission</span>
            <div className="w-8 h-[2px] bg-teal" />
          </div>
          <p className="font-heading text-cream text-[32px] craft:text-[48px] leading-tight">
            A fair deal for trades.<br />
            A fair deal for homeowners.<br />
            <span className="text-teal">One platform. Both sides protected.</span>
          </p>
        </div>
      </section>

      {/* Three core beliefs */}
      <section className="px-6 py-20 border-t border-cream/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">Three Core Beliefs</span>
            <div className="w-8 h-[2px] bg-teal" />
          </div>
          <div className="grid craft:grid-cols-3 gap-6">
            {beliefs.map((b) => (
              <div
                key={b.num}
                className="bg-navy/40 border border-cream/10 rounded-2xl p-8 hover:border-teal/40 transition-colors group"
              >
                <div className="font-heading text-teal text-5xl mb-6 group-hover:translate-x-1 transition-transform">
                  {b.num}
                </div>
                <p className="font-body text-cream text-xl leading-snug">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const FounderRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <>
    <span className="font-mono text-xs text-secondary-text uppercase tracking-widest pt-1">
      {label}
    </span>
    <span className="font-body text-cream text-base">{value}</span>
  </>
);

export default About;
