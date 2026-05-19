import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, X } from "lucide-react";

const tiers = [
  { tier: "Approved", price: "£30/mo", annual: "£360/yr", note: "Listing only — leads still cost extra." },
  { tier: "Medium 5-mile", price: "£299/mo", annual: "£3,588/yr", note: "Local visibility on the paid list." },
  { tier: "Medium 50-mile", price: "£1,429/mo", annual: "£17,148/yr", note: "Regional coverage tier." },
  { tier: "Large 50-mile", price: "£1,959/mo", annual: "£23,508/yr", note: "Top-of-list, regional reach." },
];

const breakeven = [
  { tier: "Approved (£30/mo)", jobs: "1 job/mo", maths: "£30 fee ÷ £400 average profit" },
  { tier: "Medium 5-mile (£299/mo)", jobs: "~1 job/mo", maths: "£299 fee ÷ £400 average profit" },
  { tier: "Medium 50-mile (£1,429/mo)", jobs: "~4 jobs/mo", maths: "£1,429 fee ÷ £400 average profit" },
  { tier: "Large 50-mile (£1,959/mo)", jobs: "~5 jobs/mo", maths: "£1,959 fee ÷ £400 average profit" },
];

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Is Checkatrade Worth It? An Honest Look At The Numbers",
  description: "Is Checkatrade worth £299–£1,959/month for UK trades? An honest review by an electrician of 20 years, with real numbers, and the platform he built as the alternative.",
  author: { "@type": "Person", name: "Lee Palfreeman" },
  publisher: {
    "@type": "Organization",
    name: "ProGrafter Ltd",
    logo: { "@type": "ImageObject", url: "https://prografter.co.uk/favicon.ico" },
  },
  datePublished: "2026-05-03",
  dateModified: "2026-05-03",
  mainEntityOfPage: "https://prografter.co.uk/is-checkatrade-worth-it",
};

const IsCheckatradeWorthIt = () => {
  return (
    <div className="min-h-screen bg-deep">
      <SEO
        title="Is Checkatrade Worth It in 2026? An Honest Trade Review — ProGrafter"
        description="Is Checkatrade worth £299–£1,959/month for UK trades? An honest review by an electrician of 20 years, with real numbers, and the platform he built as the alternative."
        path="/is-checkatrade-worth-it"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">Honest Trade Review · {new Date().getFullYear()}</span>
          </div>
          <h1 className="font-heading text-cream text-[40px] craft:text-[80px] leading-[0.95] max-w-4xl">
            Is Checkatrade worth it?<br />
            <span className="text-teal">An honest look at the numbers.</span>
          </h1>
          <p className="font-body text-cream/70 mt-8 max-w-2xl text-lg font-light">
            <strong className="text-cream">Short answer:</strong> it depends on how much work you're winning. <strong className="text-cream">Long answer:</strong> below.
          </p>
        </div>
      </section>

      {/* Pricing breakdown */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-6xl mx-auto">
          <span className="font-mono text-xs text-teal uppercase tracking-widest">01 / The Real Cost</span>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mt-3 mb-8 max-w-3xl">
            Checkatrade pricing<br />in {new Date().getFullYear()}.
          </h2>
          <p className="font-body text-cream/70 max-w-3xl mb-10 text-lg leading-relaxed">
            There are four main tiers. The cheapest gets you a listing; the most expensive is more than most trades' monthly take-home.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((t) => (
              <div key={t.tier} className="border border-cream/10 p-6 bg-cream/[0.02]">
                <p className="font-mono text-[10px] text-cream/50 uppercase tracking-wider mb-2">{t.tier}</p>
                <p className="font-heading text-cream text-3xl">{t.price}</p>
                <p className="font-mono text-cream/40 text-xs mt-1 mb-3">{t.annual}</p>
                <p className="font-mono text-cream/60 text-xs leading-relaxed">{t.note}</p>
              </div>
            ))}
          </div>
          <p className="font-mono text-cream/40 text-xs mt-6">
            Pricing as published by Checkatrade in 2026; varies by region and tier.
          </p>
        </div>
      </section>

      {/* Break-even maths */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-6xl mx-auto">
          <span className="font-mono text-xs text-teal uppercase tracking-widest">02 / Break-Even Maths</span>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mt-3 mb-8 max-w-3xl">
            How many jobs to<br />
            <span className="text-teal">cover the fee?</span>
          </h2>
          <p className="font-body text-cream/70 max-w-3xl mb-10 text-lg leading-relaxed">
            At an average <strong className="text-cream">£400 profit per job</strong>, here's the bare minimum you need to win every month just to <em>break even</em> on the membership — before you've made a penny in profit.
          </p>
          <div className="overflow-x-auto border border-cream/10">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="bg-cream/[0.04] text-cream uppercase tracking-wider text-xs">
                  <th className="text-left p-4">Tier</th>
                  <th className="text-left p-4 text-teal">Jobs / month to break even</th>
                  <th className="text-left p-4">Maths</th>
                </tr>
              </thead>
              <tbody>
                {breakeven.map((r, i) => (
                  <tr key={r.tier} className={i % 2 === 0 ? "bg-cream/[0.01]" : ""}>
                    <td className="p-4 text-cream font-medium align-top">{r.tier}</td>
                    <td className="p-4 text-teal align-top">{r.jobs}</td>
                    <td className="p-4 text-cream/60 align-top">{r.maths}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-body text-cream/60 mt-6 text-sm leading-relaxed max-w-3xl">
            And that's just the membership. Add lead credits, marketing time and quiet months — the real number is higher.
          </p>
        </div>
      </section>

      {/* Hidden costs */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-6xl mx-auto">
          <span className="font-mono text-xs text-teal uppercase tracking-widest">03 / Hidden Costs</span>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mt-3 mb-8 max-w-3xl">
            What the fee<br />doesn't tell you.
          </h2>
          <ul className="grid md:grid-cols-3 gap-6">
            <li className="border border-cream/10 p-6 bg-cream/[0.02]">
              <X className="text-destructive mb-3" />
              <h3 className="font-heading text-cream text-xl mb-2">Leads shared with up to 5 trades</h3>
              <p className="font-mono text-cream/60 text-sm leading-relaxed">You're racing four other trades to the phone. The credit cost is the same whether you win or not.</p>
            </li>
            <li className="border border-cream/10 p-6 bg-cream/[0.02]">
              <X className="text-destructive mb-3" />
              <h3 className="font-heading text-cream text-xl mb-2">No exclusivity</h3>
              <p className="font-mono text-cream/60 text-sm leading-relaxed">Even high-tier subscribers don't get exclusive leads. You're paying for visibility, not the work itself.</p>
            </li>
            <li className="border border-cream/10 p-6 bg-cream/[0.02]">
              <X className="text-destructive mb-3" />
              <h3 className="font-heading text-cream text-xl mb-2">No completion guarantees</h3>
              <p className="font-mono text-cream/60 text-sm leading-relaxed">Quotes that vanish, jobs that ghost, variations done off-platform. The fee is gone whether the work happens or not.</p>
            </li>
          </ul>
        </div>
      </section>

      {/* MyBuilder story */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-3xl mx-auto">
          <span className="font-mono text-xs text-teal uppercase tracking-widest">04 / Real Numbers</span>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mt-3 mb-8">
            18 leads. £625 spent.<br />
            <span className="text-teal">0 jobs won.</span>
          </h2>
          <div className="font-body text-cream/70 text-lg space-y-5 leading-relaxed">
            <p>
              That's the founder's own MyBuilder run before ProGrafter existed — the kind of result that pushed this whole thing into being. Same shared-lead problem, same outcome.
            </p>
            <p>
              The full story is on the About page, including the receipts and the moment the maths stopped making sense.
            </p>
          </div>
          <Link to="/about" className="inline-flex items-center gap-2 mt-8 font-mono text-sm text-teal hover:text-teal-hover">
            Read the full story on /about <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Where it works / doesn't */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="border border-cream/10 p-8 bg-cream/[0.02]">
            <Check className="text-teal mb-4" />
            <h3 className="font-heading text-cream text-2xl mb-4">Where Checkatrade <span className="text-teal">does</span> work</h3>
            <p className="font-body text-cream/70 leading-relaxed">
              High-volume regional trades with consistent demand and the cash flow to absorb a four-figure monthly fee. If you're already winning 10+ jobs a month off it and the maths is comfortably in the black, fair play.
            </p>
          </div>
          <div className="border border-cream/10 p-8 bg-cream/[0.02]">
            <X className="text-destructive mb-4" />
            <h3 className="font-heading text-cream text-2xl mb-4">Where it <span className="text-destructive">doesn't</span></h3>
            <ul className="font-body text-cream/70 leading-relaxed space-y-2 list-disc pl-5">
              <li>Solo trades who can't carry a £1,400+ monthly overhead.</li>
              <li>Regional new entrants without an established pipeline.</li>
              <li>Premium specialists whose value isn't a race-to-the-bottom price.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* The alternative */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-3xl mx-auto">
          <span className="font-mono text-xs text-teal uppercase tracking-widest">05 / The Alternative</span>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mt-3 mb-8">
            ProGrafter, in one paragraph.
          </h2>
          <p className="font-body text-cream/70 text-lg leading-relaxed mb-6">
            Free to register. Free to quote. <strong className="text-cream">7.5% commission on completion only, capped at £900 per job.</strong> Built by an electrician of 20 years for trades who'd rather pay when the work lands than pay every month either way.
          </p>
          <p className="font-body text-cream/70 text-lg leading-relaxed">
            See it laid out in <Link to="/#pricing" className="text-teal underline">Honest Numbers</Link>, sense-check a real quote with the <Link to="/quote-checker" className="text-teal underline">Quote Checker</Link>, or read the <Link to="/checkatrade-alternative" className="text-teal underline">side-by-side comparison</Link>.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 border-t border-cream/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-cream text-[36px] craft:text-[72px] leading-[1] mb-6">
            Register Free —<br /><span className="text-teal">No Monthly Fees.</span>
          </h2>
          <p className="font-body text-cream/70 max-w-xl mx-auto mb-10 text-lg">
            7.5% on completion only. Capped at £900. No subscription, no credits, no contract.
          </p>
          <Button asChild size="lg" className="bg-teal hover:bg-teal/90 text-deep font-mono uppercase tracking-wider">
            <Link to="/register/trade">
              Register Free → No Monthly Fees <ArrowRight className="ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IsCheckatradeWorthIt;
