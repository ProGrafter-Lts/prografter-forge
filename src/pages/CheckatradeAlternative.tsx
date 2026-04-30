import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight } from "lucide-react";

const frustrations = [
  { title: "Monthly fee regardless of work", body: "You pay every single month — even when the phone goes quiet. Many trades report £40–£100+ per month before a single lead lands." },
  { title: "Pay-per-lead on top of membership", body: "On top of the membership, you're often charged again to contact homeowners — and the same lead can be sold to multiple trades." },
  { title: "Quiet months still cost money", body: "December, January, holiday weeks — the fee doesn't pause. Cash flow takes a beating during the slow periods." },
  { title: "Lead quality and tyre-kickers", body: "Trades complain about price-shoppers, fake postcodes and jobs that vanish after a quote — yet the credit is already gone." },
  { title: "Locked-in contracts", body: "Annual commitments, awkward cancellation processes and rolling renewals make it hard to walk away cleanly." },
  { title: "No project tools after the lead", body: "Once you've paid for the introduction, you're on your own — no quoting, no project management, no documentation." },
];

const steps = [
  { num: "01", title: "Register free", body: "Create your trade profile, upload insurance and ID. Zero cost, zero monthly fee." },
  { num: "02", title: "Get matched to local jobs", body: "Homeowners post projects in your area and trade. We surface the ones that fit your specialisms." },
  { num: "03", title: "Quote and win the work", body: "Use the built-in quoting and project tools. Homeowners see your profile, reviews and verifications." },
  { num: "04", title: "Pay only when paid", body: "7.5% commission on completed work — nothing up front, nothing if the job doesn't go ahead." },
];

const comparisonRows = [
  { label: "Monthly fee", pg: "£0", ct: "£40–£100+", rp: "Subscription tiers" },
  { label: "How you pay", pg: "7.5% commission on completed jobs", ct: "Monthly fee + per-lead credits", rp: "Per-lead credits" },
  { label: "Average cost per job", pg: "Only on completion", ct: "£25–£70 per lead (often shared)", rp: "£15–£60 per lead (often shared)" },
  { label: "Project management tools", pg: "Built in — stages, payments, messaging", ct: "No", rp: "No" },
  { label: "Homeowner documentation", pg: "Digital home manual, certificates, photos", ct: "No", rp: "No" },
  { label: "Planning intelligence", pg: "Live local planning alerts", ct: "No", rp: "No" },
  { label: "Cancel anytime", pg: "Yes — no contract", ct: "Annual contract typical", rp: "Subscription cancel rules" },
];

const faqs = [
  { q: "Is ProGrafter free?", a: "Yes — registering and using ProGrafter is completely free for trades. There are no monthly fees, no per-lead charges and no annual contracts. We only earn when you do." },
  { q: "How does commission work?", a: "When a job completes through the platform, ProGrafter takes a flat 7.5% commission on the agreed job value. If the job doesn't go ahead, you pay nothing." },
  { q: "What trades can join?", a: "Builders, electricians, plumbers, roofers, carpenters, plasterers, decorators, landscapers, heating engineers, tilers and many more. All trades go through ID and insurance verification before going live." },
  { q: "Is it available nationwide?", a: "Yes — ProGrafter is available across the UK. Job volume varies by region, but planning intelligence and homeowner sign-ups cover England, Scotland, Wales and Northern Ireland." },
];

const CheckatradeAlternative = () => {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-deep">
      <SEO
        title="Best Checkatrade Alternative for UK Trades in 2026 — ProGrafter"
        description="ProGrafter charges zero monthly fees to trades — 7.5% commission only when a job completes. See why thousands of UK trades are choosing ProGrafter over Checkatrade."
        path="/checkatrade-alternative"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <span
          className="absolute -bottom-8 right-0 font-heading text-[160px] craft:text-[280px] text-cream select-none pointer-events-none leading-none"
          style={{ opacity: 0.03 }}
        >
          SWITCH
        </span>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">Checkatrade Alternative</span>
          </div>
          <h1 className="font-heading text-cream text-[44px] craft:text-[88px] leading-[0.95] max-w-4xl">
            The Checkatrade<br />
            alternative trades<br />
            <span className="text-teal">are switching to.</span>
          </h1>
          <p className="font-mono text-cream/70 mt-8 max-w-2xl text-base">
            Zero monthly fees. No per-lead credits. No annual contract. You only pay when a job completes — 7.5% commission, that's it.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button asChild size="lg" className="bg-teal hover:bg-teal/90 text-deep font-mono uppercase tracking-wider">
              <Link to="/register/trade">
                Register Free — No Monthly Fees <ArrowRight className="ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why trades are leaving Checkatrade */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-xs text-teal uppercase tracking-widest">01 / The Problem</span>
          </div>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mb-12 max-w-3xl">
            Why trades are<br />leaving Checkatrade.
          </h2>
          <ul className="grid md:grid-cols-2 gap-6">
            {frustrations.map((f) => (
              <li key={f.title} className="border border-cream/10 p-6 bg-cream/[0.02]">
                <div className="flex gap-3 items-start">
                  <X className="text-destructive shrink-0 mt-1" />
                  <div>
                    <h3 className="font-heading text-cream text-2xl mb-2">{f.title}</h3>
                    <p className="font-mono text-cream/60 text-sm leading-relaxed">{f.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How ProGrafter works */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-xs text-teal uppercase tracking-widest">02 / The Fix</span>
          </div>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mb-12 max-w-3xl">
            How ProGrafter<br />works.
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="border border-cream/10 p-6 bg-cream/[0.02]">
                <div className="font-heading text-teal text-5xl mb-4">{s.num}</div>
                <h3 className="font-heading text-cream text-2xl mb-3">{s.title}</h3>
                <p className="font-mono text-cream/60 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-xs text-teal uppercase tracking-widest">03 / Side By Side</span>
          </div>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mb-12 max-w-3xl">
            ProGrafter vs<br />Checkatrade vs<br />Rated People.
          </h2>
          <div className="overflow-x-auto border border-cream/10">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="bg-cream/[0.04] text-cream uppercase tracking-wider text-xs">
                  <th className="text-left p-4 w-1/4">Feature</th>
                  <th className="text-left p-4 text-teal">ProGrafter</th>
                  <th className="text-left p-4">Checkatrade</th>
                  <th className="text-left p-4">Rated People</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((r, i) => (
                  <tr key={r.label} className={i % 2 === 0 ? "bg-cream/[0.01]" : ""}>
                    <td className="p-4 text-cream font-medium align-top">{r.label}</td>
                    <td className="p-4 text-cream/90 align-top">
                      <span className="inline-flex items-start gap-2">
                        <Check className="text-teal shrink-0 mt-0.5 h-4 w-4" />
                        {r.pg}
                      </span>
                    </td>
                    <td className="p-4 text-cream/60 align-top">{r.ct}</td>
                    <td className="p-4 text-cream/60 align-top">{r.rp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-mono text-cream/40 text-xs mt-4">
            Comparison based on publicly available pricing and trade-reported figures as of 2026. Competitor pricing may vary by region and tier.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-xs text-teal uppercase tracking-widest">04 / FAQ</span>
          </div>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mb-12">
            Quick answers.
          </h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <details key={f.q} className="group border border-cream/10 bg-cream/[0.02] p-6">
                <summary className="cursor-pointer list-none flex justify-between items-center font-heading text-cream text-xl">
                  {f.q}
                  <span className="text-teal font-mono text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="font-mono text-cream/70 text-sm leading-relaxed mt-4">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 border-t border-cream/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-cream text-[36px] craft:text-[72px] leading-[1] mb-6">
            Stop paying<br />for <span className="text-teal">silence.</span>
          </h2>
          <p className="font-mono text-cream/60 max-w-xl mx-auto mb-10">
            No monthly fee. No per-lead credits. No contract. You only pay when you get paid.
          </p>
          <Button asChild size="lg" className="bg-teal hover:bg-teal/90 text-deep font-mono uppercase tracking-wider">
            <Link to="/register/trade">
              Register Free — No Monthly Fees <ArrowRight className="ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CheckatradeAlternative;
