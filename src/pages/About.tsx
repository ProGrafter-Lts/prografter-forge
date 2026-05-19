import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import { localBusinessJsonLd } from "@/lib/seoSchemas";

const About = () => {
  return (
    <AppShell>
      <SEO
        title="About ProGrafter — How It Works"
        description="ProGrafter verifies every trade five ways before their profile goes live. Digital contracts, escrow payments, and a Homeowner Manual protect both sides."
        path="/about"
        jsonLd={localBusinessJsonLd}
      />

      <div className="bg-deep">
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <span
          className="absolute -bottom-8 right-0 font-heading text-[160px] craft:text-[280px] text-cream select-none pointer-events-none leading-none"
          style={{ opacity: 0.03 }}
        >
          ABOUT
        </span>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">
              How It Works
            </span>
          </div>
          <h1 className="font-heading text-cream text-[44px] craft:text-[88px] leading-[0.95] max-w-4xl">
            Built for fairness.
            <br />
            <span className="text-teal">Both sides protected.</span>
          </h1>
        </div>
      </section>

      {/* How the platform works */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">
              The Platform
            </span>
          </div>
          <h2 className="font-heading text-cream text-[36px] craft:text-[56px] leading-[0.95] mb-10">
            How the platform works
          </h2>
          <div className="space-y-6 font-body text-cream/80 text-lg leading-relaxed font-light">
            <p>
              Every trade on ProGrafter is verified five ways before their
              profile goes live: identity confirmed, insurance verified,
              qualifications checked with the issuing body, Companies House
              status confirmed, references called. No exceptions.
            </p>
            <p>
              Every project runs on a digital contract drafted by a UK
              construction solicitor. Stage payments are held in escrow via
              Stripe Connect and released only when each milestone is signed off
              by the homeowner. Variations to scope are signed off in writing
              before any extra work starts — no surprise bills. At completion,
              the homeowner receives a Homeowner Manual: every certificate,
              photo, warranty and spec in one searchable record.
            </p>
            <p className="text-cream font-normal">
              Both sides stay on the same page through the build. Both sides
              walk away with what was agreed.
            </p>
          </div>
        </div>
      </section>

      {/* How we make money */}
      <section className="px-6 py-16 border-t border-cream/5">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">
              Our Model
            </span>
          </div>
          <h2 className="font-heading text-cream text-[36px] craft:text-[56px] leading-[0.95] mb-8">
            How we make money
          </h2>
          <div className="space-y-6 font-body text-cream/90 text-lg leading-relaxed font-light">
            <p>
              Homeowners pay nothing to use ProGrafter. Posting a job is free.
              Receiving quotes is free. The Homeowner Manual is free.
            </p>
            <p>
              Trades pay 7.5% commission on completed jobs only, capped at £900
              per project — no monthly fees, no lead fees, nothing before the
              work is finished. If we don&apos;t earn the trade work, the trade
              owes us nothing. The first 50 verified trades to join lock in a
              permanent 6% commission rate as Founding Members.
            </p>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="px-6 pt-4 pb-20">
        <div className="max-w-4xl mx-auto grid craft:grid-cols-2 gap-6">
          <div className="bg-navy border border-teal/30 rounded-2xl p-8 craft:p-10 hover:border-teal transition-colors">
            <div className="font-mono text-xs text-teal uppercase tracking-widest mb-4">
              For Tradespeople
            </div>
            <p className="font-body text-cream text-lg leading-relaxed mb-3">
              See the verification standard and join the Founding Member cohort.
              The first 50 verified trades lock in 6% commission for life.<sup className="text-teal">*</sup>
            </p>
            <p className="font-body text-cream/70 text-xs leading-relaxed mb-6">
              * 6% Founding Member rate applies to the first 50 verified trades.
              Rate applies to all jobs completed through the ProGrafter platform.
            </p>
            <a
              href="/register/trade"
              className="inline-flex items-center gap-2 font-mono text-sm text-teal hover:text-teal-hover transition-colors"
            >
              Register as a trade
              <span aria-hidden="true">→</span>
            </a>
          </div>

          <div className="bg-navy border border-teal/30 rounded-2xl p-8 craft:p-10 hover:border-teal transition-colors">
            <div className="font-mono text-xs text-teal uppercase tracking-widest mb-4">
              For Homeowners
            </div>
            <p className="font-body text-cream text-lg leading-relaxed mb-6">
              Post your project free. Get quotes from verified, insured local
              trades. Every job protected by the ProGrafter contract and escrow
              payment system.
            </p>
            <a
              href="/post-a-job"
              className="inline-flex items-center gap-2 font-mono text-sm text-teal hover:text-teal-hover transition-colors"
            >
              Post a job
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Company info */}
      <section className="px-6 py-12 border-t border-cream/5">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-xs text-secondary-text uppercase tracking-widest">
            ProGrafter Ltd · Company 17124130 · ICO ZC114018
          </p>
        </div>
      </section>
      </div>
    </AppShell>
  );
};

export default About;
