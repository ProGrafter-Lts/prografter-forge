import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { localBusinessJsonLd } from "@/lib/seoSchemas";

const myBuilderLeads = [
  { month: "Month 1", leads: 3, cost: "£105", won: "0" },
  { month: "Month 2", leads: 4, cost: "£140", won: "0" },
  { month: "Month 3", leads: 2, cost: "£70", won: "0" },
  { month: "Month 4", leads: 3, cost: "£105", won: "0" },
  { month: "Month 5", leads: 3, cost: "£105", won: "0" },
  { month: "Month 6", leads: 3, cost: "£100", won: "0" },
];

const featureComparison = [
  { feature: "Monthly fees", mybuilder: "£35+ per lead", prografter: "£0" },
  { feature: "Pay only when you earn", mybuilder: "No", prografter: "Yes — 7.5% commission (capped at £900 per job)" },
  { feature: "Live project tracking", mybuilder: "No", prografter: "Yes — homeowners see daily updates" },
  { feature: "AI Quote Checker", mybuilder: "No", prografter: "Yes — 43-point review for £9" },
  { feature: "Green Grant matching", mybuilder: "No", prografter: "Yes — built in" },
  { feature: "Stage-based payments", mybuilder: "No", prografter: "Yes — released on completion" },
  { feature: "Verified trade only", mybuilder: "Partial", prografter: "Yes — insurance + ID checked" },
];

const beliefs = [
  { num: "01", text: "Trades should only pay when they earn" },
  { num: "02", text: "Homeowners deserve to see their project every day" },
  { num: "03", text: "Every construction job deserves a proper paper trail" },
];

const About = () => {
  return (
    <AppShell>
      <SEO
        title="About ProGrafter — Built by a Qualified Electrician for Trades & Homeowners"
        description="ProGrafter was founded by Lee Palfreeman, a qualified electrician of 20 years, after losing 18 leads and £625 to a competing platform without winning a single job."
        path="/about"
        jsonLd={localBusinessJsonLd}
      />

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
          </div>
        </div>
      </section>

      {/* The MyBuilder breaking point */}
      <section className="px-6 py-20 border-t border-cream/5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">The Breaking Point</span>
          </div>
          <h2 className="font-heading text-cream text-[36px] craft:text-[56px] leading-[0.95] mb-10 max-w-3xl">
            Six months on MyBuilder.<br />
            <span className="text-teal">Eighteen leads. Zero jobs.</span>
          </h2>

          <div className="space-y-6 font-body text-cream/80 text-lg leading-relaxed font-light mb-12">
            <p>
              Before I built ProGrafter, I tried to grow my electrical business through MyBuilder.
              I paid for every lead up front — whether the homeowner replied, whether they were
              serious, whether the job even existed.
            </p>
            <p>
              Here's exactly what six months looked like:
            </p>
          </div>

          {/* Lead table */}
          <div className="bg-navy/40 border border-cream/10 rounded-2xl overflow-hidden mb-12">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cream/10 bg-deep/40">
                  <th className="text-left font-mono text-xs text-teal uppercase tracking-widest px-6 py-4">Period</th>
                  <th className="text-left font-mono text-xs text-teal uppercase tracking-widest px-6 py-4">Leads bought</th>
                  <th className="text-left font-mono text-xs text-teal uppercase tracking-widest px-6 py-4">Cost</th>
                  <th className="text-left font-mono text-xs text-teal uppercase tracking-widest px-6 py-4">Jobs won</th>
                </tr>
              </thead>
              <tbody>
                {myBuilderLeads.map((row) => (
                  <tr key={row.month} className="border-b border-cream/5 last:border-b-0">
                    <td className="font-body text-cream px-6 py-4">{row.month}</td>
                    <td className="font-mono text-cream/80 px-6 py-4">{row.leads}</td>
                    <td className="font-mono text-cream/80 px-6 py-4">{row.cost}</td>
                    <td className="font-mono text-cream/60 px-6 py-4">{row.won}</td>
                  </tr>
                ))}
                <tr className="bg-teal/5">
                  <td className="font-heading text-cream uppercase tracking-wider text-sm px-6 py-5">Total</td>
                  <td className="font-mono text-cream px-6 py-5">18</td>
                  <td className="font-mono text-teal text-lg px-6 py-5">£625</td>
                  <td className="font-mono text-cream px-6 py-5">0</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pull quote */}
          <figure className="relative my-16 px-8 craft:px-16">
            <span className="absolute -top-8 -left-2 craft:-left-6 font-heading text-[120px] craft:text-[200px] text-teal select-none pointer-events-none leading-none" style={{ opacity: 0.15 }}>
              "
            </span>
            <blockquote className="relative z-10 font-heading text-cream text-[28px] craft:text-[44px] leading-[1.05]">
              I paid <span className="text-teal">£625</span> in MyBuilder fees<br />
              across 18 leads and<br />
              <span className="text-teal">won nothing.</span>
            </blockquote>
            <figcaption className="font-mono text-xs text-secondary-text uppercase tracking-widest mt-6 pl-1">
              — Lee Palfreeman, Founder
            </figcaption>
          </figure>

          <div className="space-y-6 font-body text-cream/80 text-lg leading-relaxed font-light">
            <p>
              Most of those leads were already gone before I got the notification. Some weren't
              real jobs at all. Some homeowners had already chosen a trade and were just price
              checking.
            </p>
            <p className="text-cream font-normal">
              And every single month, the bill came in regardless.
            </p>
            <p>
              That was the moment I decided: if nobody else was going to build a fair platform,
              I would.
            </p>
          </div>
        </div>
      </section>

      {/* Features comparison */}
      <section className="px-6 py-20 border-t border-cream/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">What I Built Instead</span>
          </div>
          <h2 className="font-heading text-cream text-[36px] craft:text-[56px] leading-[0.95] mb-12 max-w-3xl">
            ProGrafter vs<br />
            <span className="text-teal">the lead-fee model.</span>
          </h2>

          <div className="bg-navy/40 border border-cream/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cream/10 bg-deep/40">
                  <th className="text-left font-mono text-xs text-teal uppercase tracking-widest px-6 py-4">Feature</th>
                  <th className="text-left font-mono text-xs text-cream/50 uppercase tracking-widest px-6 py-4">MyBuilder / Checkatrade</th>
                  <th className="text-left font-mono text-xs text-teal uppercase tracking-widest px-6 py-4">ProGrafter</th>
                </tr>
              </thead>
              <tbody>
                {featureComparison.map((row) => (
                  <tr key={row.feature} className="border-b border-cream/5 last:border-b-0">
                    <td className="font-body text-cream px-6 py-5 align-top">{row.feature}</td>
                    <td className="font-body text-cream/50 px-6 py-5 align-top">{row.mybuilder}</td>
                    <td className="font-body text-cream px-6 py-5 align-top">{row.prografter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="font-body text-cream/80 text-lg leading-relaxed font-light mt-10">
            ProGrafter was built from home, in my spare time, from{" "}
            <span className="text-teal font-mono">£153</span> in setup costs.
            Commission-only marketplace. Zero monthly fees. Live project tracking.
            AI Quote Checker. Green Grant matching.
          </p>
          <p className="font-mono text-sm text-secondary-text uppercase tracking-wider pt-4">
            Live since April 2026 · prografter.co.uk
          </p>
        </div>
      </section>

      {/* Founder card */}
      <section className="px-6 py-20 border-t border-cream/5">
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

    </AppShell>
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
