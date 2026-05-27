import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight } from "lucide-react";

const ctTiers = [
  { tier: "Approved", price: "£30/mo", note: "Listing only — leads still cost extra." },
  { tier: "Medium 5-mile", price: "£299/mo", note: "Before you've earned a single penny." },
  { tier: "Medium 50-mile", price: "£1,429/mo", note: "£17,148 a year, fixed cost." },
  { tier: "Large 50-mile", price: "£1,959/mo", note: "£23,508 a year — that's a small van's worth." },
];

const comparisonRows = [
  { feature: "Monthly fee", pg: "£0", ct: "£30 – £1,959" },
  { feature: "Cost per lead", pg: "£0 — leads are free", ct: "Often shared with up to 5 trades; credits on top of the membership" },
  { feature: "Commission", pg: "7.5% on completed jobs only", ct: "None — but you've already paid the membership" },
  { feature: "Lead exclusivity", pg: "Homeowner-controlled — up to 5 quotes, homeowner selects who they work with", ct: "Shared with multiple trades" },
  { feature: "Variation sign-off", pg: "Built-in homeowner approval flow", ct: "No tooling — handled off-platform" },
  { feature: "Standardised contract", pg: "Built-in, solicitor-reviewed contract on every job", ct: "No contract tooling provided", ctBad: true },
  { feature: "Escrow payment protection", pg: "Stripe milestone payments — funds held until stage complete", ct: "Payment handled off-platform", ctBad: true },
  { feature: "Dispute mediation", pg: "ProGrafter mediates with full documented evidence trail", ct: "Disputes handled between trade and homeowner directly", ctBad: true },
  { feature: "Verification process", pg: "5-point verification: ID, insurance, qualification, Companies House, reference — all checked before going live", ct: "ID and document checks, paid tier" },
  { feature: "Cap on charges", pg: "£900 maximum per job, ever", ct: "No cap — fees scale with tier and lead spend" },
];

const faqs = [
  { q: "Is ProGrafter actually free?", a: "Yes. Registering, building your profile, getting verified and quoting are all free. There's no monthly fee, no credit packs and no lock-in. We only earn when you complete a job through the platform." },
  { q: "How do I get verified?", a: "Upload photo ID, your public liability insurance certificate and any trade-specific qualifications (Gas Safe, NICEIC, etc.). Our team reviews submissions and you'll typically be live within 1 working day." },
  { q: "What if I don't get any jobs?", a: "You pay nothing. There is no minimum spend, no \"visibility\" upgrade and no penalty for quiet months. Quoting is free, and 7.5% only applies to jobs that actually complete." },
  { q: "How is commission calculated?", a: "7.5% of the agreed job value, capped at £900 per job. So a £3,000 kitchen costs £225; a £20,000 extension is capped at £900 — never more, regardless of job size." },
  { q: "What happens with variations?", a: "Variations go through an in-platform approval flow: you log the change, the homeowner approves, and the agreed value updates. Commission is calculated on the final, signed-off value — no awkward conversations after the fact." },
];

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "The Checkatrade Alternative That Doesn't Charge You To Find Work",
  description: "ProGrafter is the UK Checkatrade alternative — no monthly fees, 7.5% commission only when a job completes, capped at £900 per job.",
  author: { "@type": "Person", name: "Lee Palfreeman" },
  publisher: {
    "@type": "Organization",
    name: "ProGrafter Ltd",
    logo: { "@type": "ImageObject", url: "https://prografter.co.uk/favicon.ico" },
  },
  datePublished: "2026-05-03",
  dateModified: "2026-05-03",
  mainEntityOfPage: "https://prografter.co.uk/checkatrade-alternative",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const CheckatradeAlternative = () => {
  return (
    <div className="min-h-screen bg-deep">
      <SEO
        title="Checkatrade Alternative: Pay Only When You Win Work"
        description="Tired of paying £299–£1,959/month to Checkatrade before earning a penny? ProGrafter is the UK alternative — no monthly fees, 7.5% on completed jobs."
        path="/checkatrade-alternative"
        ogType="article"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">Checkatrade Alternative</span>
          </div>
          <h1 className="font-heading text-cream text-[40px] craft:text-[80px] leading-[0.95] max-w-4xl">
            The Checkatrade alternative that<br />
            <span className="text-teal">doesn't charge you to find work.</span>
          </h1>
          <p className="font-body text-cream/70 mt-8 max-w-2xl text-lg font-light">
            Checkatrade can cost up to <strong className="text-cream">£1,959 a month</strong> before a single homeowner picks up the phone. ProGrafter is £0 to join, and 7.5% only when a job completes — capped at £900.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button asChild size="lg" className="bg-teal hover:bg-teal/90 text-deep font-mono uppercase tracking-wider">
              <Link to="/register/trade">
                Register as a Trade Free <ArrowRight className="ml-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-2 border-cream text-cream hover:bg-cream hover:text-navy font-mono uppercase tracking-wider">
              <Link to="/#pricing">See the numbers</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problem with Checkatrade pricing */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-6xl mx-auto">
          <span className="font-mono text-xs text-teal uppercase tracking-widest">01 / The Problem</span>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mt-3 mb-8 max-w-3xl">
            You're paying<br />
            <span className="text-teal">before</span> you earn.
          </h2>
          <div className="prose prose-invert max-w-3xl mb-12">
            <p className="font-body text-cream/70 text-lg leading-relaxed">
              Checkatrade has four main paid tiers, and the headline numbers are eye-watering. The cheapest tier doesn't get you much — and the busy ones cost more per month than most trades take home in a quiet week.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ctTiers.map((t) => (
              <div key={t.tier} className="border border-cream/10 p-6 bg-cream/[0.02]">
                <p className="font-mono text-[10px] text-cream/50 uppercase tracking-wider mb-2">{t.tier}</p>
                <p className="font-heading text-cream text-3xl mb-3">{t.price}</p>
                <p className="font-mono text-cream/60 text-xs leading-relaxed">{t.note}</p>
              </div>
            ))}
          </div>
          <p className="font-mono text-cream/40 text-xs mt-6">
            Pricing as published by Checkatrade in 2026; varies by region and tier.
          </p>
        </div>
      </section>

      {/* The ProGrafter model */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-6xl mx-auto">
          <span className="font-mono text-xs text-teal uppercase tracking-widest">02 / The Fix</span>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mt-3 mb-8 max-w-3xl">
            The ProGrafter model.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-cream/10 p-6 bg-cream/[0.02]">
              <p className="font-heading text-teal text-5xl mb-4">£0</p>
              <h3 className="font-heading text-cream text-xl mb-2">to join</h3>
              <p className="font-mono text-cream/60 text-sm leading-relaxed">No subscription, no credit packs, no upfront spend. Register, get verified, start quoting.</p>
            </div>
            <div className="border border-cream/10 p-6 bg-cream/[0.02]">
              <p className="font-heading text-teal text-5xl mb-4">7.5%</p>
              <h3 className="font-heading text-cream text-xl mb-2">on completion only</h3>
              <p className="font-mono text-cream/60 text-sm leading-relaxed">A single, transparent commission charged only when the homeowner signs the job off as complete.</p>
            </div>
            <div className="border border-cream/10 p-6 bg-cream/[0.02]">
              <p className="font-heading text-teal text-5xl mb-4">£900</p>
              <h3 className="font-heading text-cream text-xl mb-2">cap per job</h3>
              <p className="font-mono text-cream/60 text-sm leading-relaxed">Win a £30,000 extension and you still pay £900 — not 7.5% of the lot. Big jobs reward the trade, not the platform.</p>
            </div>
          </div>
          <p className="font-body text-cream/70 mt-10 max-w-3xl text-lg leading-relaxed">
            Want to see how that maps to a real job? <Link to="/quote-checker" className="text-teal underline">Try the Quote Checker →</Link> or read the <Link to="/#pricing" className="text-teal underline">Honest Numbers section</Link>.
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-6xl mx-auto">
          <span className="font-mono text-xs text-teal uppercase tracking-widest">03 / Side By Side</span>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mt-3 mb-12 max-w-3xl">
            Checkatrade vs<br />ProGrafter.
          </h2>
          <div className="overflow-x-auto border border-cream/10">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="bg-cream/[0.04] text-cream uppercase tracking-wider text-xs">
                  <th className="text-left p-4 w-1/3">Feature</th>
                  <th className="text-left p-4 text-teal">ProGrafter</th>
                  <th className="text-left p-4">Checkatrade</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((r, i) => (
                  <tr key={r.feature} className={i % 2 === 0 ? "bg-cream/[0.01]" : ""}>
                    <td className="p-4 text-cream font-medium align-top">{r.feature}</td>
                    <td className="p-4 text-cream/90 align-top">
                      <span className="inline-flex items-start gap-2">
                        <Check className="text-teal shrink-0 mt-0.5 h-4 w-4" />
                        {r.pg}
                      </span>
                    </td>
                    <td className="p-4 text-cream/60 align-top">
                      <span className="inline-flex items-start gap-2">
                        <X className="text-destructive shrink-0 mt-0.5 h-4 w-4" />
                        {r.ct}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Founder context */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-3xl mx-auto">
          <span className="font-mono text-xs text-teal uppercase tracking-widest">04 / Why I Built It</span>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mt-3 mb-8">
            "I lost money on lead-gen platforms, so I built this."
          </h2>
          <div className="font-body text-cream/70 text-lg space-y-5 leading-relaxed">
            <p>
              I'm Lee, an electrician 20 years in. Like a lot of trades, I tried Checkatrade, MyBuilder and Rated People — and watched the membership and credit fees stack up while the leads were sold to four other people in the group chat before I'd even read them.
            </p>
            <p>
              ProGrafter is the platform I built for trades like me — no monthly fees, no ghost leads, no platform taking more than its fair share.
            </p>
          </div>
          <Link to="/about" className="inline-flex items-center gap-2 mt-8 font-mono text-sm text-teal hover:text-teal-hover">
            Read the full breakdown on the About page <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mb-6">
            Stop paying<br />for <span className="text-teal">silence.</span>
          </h2>
          <p className="font-body text-cream/70 max-w-xl mx-auto mb-10 text-lg">
            Free to register. Free to quote. 7.5% on completion only — capped at £900.
          </p>
          <Button asChild size="lg" className="bg-teal hover:bg-teal/90 text-deep font-mono uppercase tracking-wider">
            <Link to="/register/trade">
              Register as a Trade Free <ArrowRight className="ml-1" />
            </Link>
          </Button>
          <p className="font-mono text-cream/40 text-xs mt-6">
            Doing green work? See <Link to="/green" className="text-teal underline">green grants &amp; certified trades</Link>.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-4xl mx-auto">
          <span className="font-mono text-xs text-teal uppercase tracking-widest">05 / FAQ</span>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mt-3 mb-12">
            Quick answers.
          </h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <details key={f.q} className="group border border-cream/10 bg-cream/[0.02] p-6">
                <summary className="cursor-pointer list-none flex justify-between items-center font-heading text-cream text-xl gap-4">
                  {f.q}
                  <span className="text-teal font-mono text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="font-body text-cream/70 text-base leading-relaxed mt-4">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CheckatradeAlternative;
