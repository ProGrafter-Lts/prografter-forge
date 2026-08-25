import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { localBusinessJsonLd } from "@/lib/seoSchemas";

const leads = [
  {
    name: "Homeowner",
    job: "Kitchen/office showroom — 1 mile",
    paid: "£18+VAT",
    others: "6 builders paid",
    outcome: "Asked 'could you give me an idea of the cost?' — conversation stopped dead",
  },
  {
    name: "Homeowner",
    job: "2-storey extension — 14 miles",
    paid: "£43+VAT",
    others: "8 builders paid (~£344 total to MyBuilder)",
    outcome: "Never replied after contact details shared",
  },
  {
    name: "Homeowner",
    job: "Single storey extension — 7 miles",
    paid: "£45+VAT",
    others: "8 builders paid",
    outcome: "Not a single word exchanged",
  },
  {
    name: "Homeowner",
    job: "Double storey extension — 7 miles",
    paid: "£27+VAT",
    others: "8 builders paid",
    outcome: "Silence",
  },
  {
    name: "Homeowner",
    job: "Garage conversion — 14 miles",
    paid: "£8.60+VAT",
    others: "2 responses",
    outcome: "Message appeared AI-generated. Asked for drawings — nothing back",
  },
  {
    name: "Homeowner",
    job: "Single storey extension — 2 miles",
    paid: "£29+VAT",
    others: "6 builders paid",
    outcome: "No conversation",
  },
  {
    name: "Homeowner",
    job: "L-shaped extension — 4 miles",
    paid: "£44+VAT",
    others: "8 builders paid",
    outcome: "Nothing",
  },
  {
    name: "Homeowner",
    job: "Retaining wall repair — 2 miles",
    paid: "£27+VAT",
    others: "1 response",
    outcome: "Paid, waited, chased 2.5 months later — no reply",
  },
  {
    name: "Homeowner",
    job: "2-storey side extension — 2 miles",
    paid: "£37+VAT",
    others: "2 responses",
    outcome: "Message was READ. Never replied.",
  },
  {
    name: "Homeowner",
    job: "Ground & first floor extension — 12 miles",
    paid: "£38+VAT",
    others: "5 responses",
    outcome: "Asked for drawings — no outcome",
  },
];

const features = [
  { name: "Live Project Timeline", detail: "Every stage, date and update logged in one place — no more 'where are we up to?'" },
  { name: "Digital Variation Sign-Off", detail: "Changes agreed in writing, by the homeowner, before anyone lifts a tool." },
  { name: "Homeowner Manual", detail: "Plain-English guidance so the customer knows what good looks like." },
  { name: "AI Quote Checker", detail: "Quotes sense-checked against a fixed trade standard before money moves." },
  { name: "Green Grants Checker", detail: "Grant eligibility surfaced on the jobs where it actually applies." },
  { name: "Planning Intelligence", detail: "Live planning activity in your area, scored for relevance." },
  { name: "Dispute Resolution Paper Trail", detail: "If it goes wrong, there's documented evidence to put it right fairly." },
];

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "I Spent £625 on 18 Leads and Won Nothing. So I Built Something Better.",
  description:
    "ProGrafter was built by a working builder who spent £625 on 18 MyBuilder leads and won nothing. Find out why he built a better way.",
  author: { "@type": "Organization", name: "ProGrafter Ltd" },
  publisher: {
    "@type": "Organization",
    name: "ProGrafter Ltd",
    logo: { "@type": "ImageObject", url: "https://prografter.co.uk/favicon.ico" },
  },
  mainEntityOfPage: "https://prografter.co.uk/about",
};

const About = () => {
  return (
    <AppShell>
      <SEO
        title="I Spent £625 on 18 Leads and Won Nothing. So I Built Something Better. — ProGrafter"
        description="ProGrafter was built by a working builder who spent £625 on 18 MyBuilder leads and won nothing. Find out why he built a better way."
        path="/about"
        ogType="article"
        jsonLd={[localBusinessJsonLd, articleJsonLd]}
      />

      <div className="bg-deep">
        {/* Hero */}
        <section className="relative pt-32 pb-14 px-6 overflow-hidden">
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-[2px] bg-teal" />
              <span className="font-mono text-xs text-teal uppercase tracking-widest">
                Why I Built ProGrafter
              </span>
            </div>
            <h1 className="font-heading text-cream text-[36px] craft:text-[72px] leading-[0.98] max-w-4xl">
              I Spent £625 on 18 Leads and Won Nothing. So I Built Something Better.
            </h1>
          </div>
        </section>

        {/* Opening prose */}
        <section className="px-6 pb-16">
          <div className="max-w-[700px] mx-auto space-y-6 font-body text-cream/80 text-lg leading-relaxed font-light">
            <p>
              I run my own construction business in Nottinghamshire. I've been in the trade for
              years. I know how to build. What I couldn't figure out was why getting decent work
              felt like buying scratch cards — and why the platform took my money regardless of
              what happened next.
            </p>
            <p>
              A couple of years back I was using MyBuilder like most builders do — shortlisting
              jobs, paying the lead fee, firing off a message, then waiting. Mostly just waiting.
            </p>
            <p>
              So I sat down one day and added it all up. Over time, across 18 leads — all jobs I
              was genuinely qualified and ready to price — £521.10 plus VAT, £625.32 in real money
              out of my account. And that's before you count the time.
            </p>
          </div>
        </section>

        {/* Lead breakdown table */}
        <section className="px-6 py-16 border-t border-cream/10">
          <div className="max-w-6xl mx-auto">
            <span className="font-mono text-xs text-teal uppercase tracking-widest">
              The Receipts
            </span>
            <h2 className="font-heading text-cream text-[32px] craft:text-[56px] leading-[1] mt-3 mb-10">
              Ten of the eighteen.
            </h2>
            <div className="overflow-x-auto border border-cream/10">
              <table className="w-full font-mono text-sm min-w-[820px]">
                <thead>
                  <tr className="bg-cream/[0.04] text-cream uppercase tracking-wider text-xs">
                    <th className="text-left p-4">Job</th>
                    <th className="text-left p-4">Distance</th>
                    <th className="text-left p-4 text-teal">Lee paid+VAT</th>
                    <th className="text-left p-4">Other builders</th>
                    <th className="text-left p-4">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l, i) => {
                    const [job, distance] = l.job.split(" — ");
                    return (
                      <tr key={l.name} className={i % 2 === 0 ? "bg-cream/[0.01]" : ""}>
                        <td className="p-4 text-cream font-medium align-top">
                          {l.name}
                          <span className="block text-cream/50 font-normal mt-1">{job}</span>
                        </td>
                        <td className="p-4 text-cream/60 align-top">{distance}</td>
                        <td className="p-4 text-teal align-top">{l.paid}</td>
                        <td className="p-4 text-cream/60 align-top">{l.others}</td>
                        <td className="p-4 text-cream/70 align-top">{l.outcome}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="font-body text-cream/70 mt-8 max-w-3xl leading-relaxed">
              Ten leads shown here, £379.92 of the total spent (inc. VAT) — the full picture across
              all 18 leads came to £625.32. Zero jobs won. In several cases, zero conversations even
              started. On Dave Windsor's job alone, eight builders collectively handed MyBuilder
              around £344+VAT — for a homeowner who never responded to any of us. When I chased
              Kirpal three months after paying, there was no reply. There is no refund for that.
              MyBuilder's refund policy only covers wrong contact details or duplicate charges —
              'homeowner did not respond' is explicitly not a valid reason. You just lose the money.
            </p>
          </div>
        </section>

        {/* The moment it clicked */}
        <section className="px-6 py-16 border-t border-cream/10">
          <div className="max-w-[700px] mx-auto">
            <h2 className="font-heading text-teal text-[32px] craft:text-[48px] leading-[1] mb-8">
              The Moment It Clicked
            </h2>
            <div className="space-y-6 font-body text-cream/80 text-lg leading-relaxed font-light">
              <p>
                That's when it clicked. The platform wasn't built for builders. It wasn't even
                really built for homeowners. It was built to sell leads — and once that fee clears,
                nobody cares what happens next.
              </p>
              <p>
                I thought: there has to be a better way. So I stopped complaining about it and built
                it myself.
              </p>
            </div>
          </div>
        </section>

        {/* Pull quote */}
        <section className="px-6 pb-16">
          <div className="max-w-[820px] mx-auto bg-navy border-l-4 border-teal p-8 craft:p-12">
            <p className="font-body italic text-cream text-xl craft:text-2xl leading-relaxed">
              "I paid £625 in MyBuilder fees across 18 leads and won nothing. Not one job. The
              platform took my money the moment contact details were shared. What happened after was
              my problem. ProGrafter exists because that is not how it should work."
            </p>
            <p className="font-mono text-xs text-secondary-text uppercase tracking-widest mt-6">
              — Lee Palfreeman, Founder — ProGrafter / Palfreeman Construction Ltd
            </p>
          </div>
        </section>

        {/* What ProGrafter is */}
        <section className="px-6 py-16 border-t border-cream/10">
          <div className="max-w-6xl mx-auto">
            <span className="font-mono text-xs text-teal uppercase tracking-widest">
              The Alternative
            </span>
            <h2 className="font-heading text-cream text-[32px] craft:text-[56px] leading-[1] mt-3 mb-10">
              What ProGrafter Is
            </h2>
            <div className="grid md:grid-cols-2 gap-4 mb-12">
              <div className="border border-cream/10 p-6 bg-cream/[0.02]">
                <p className="font-heading text-teal text-5xl mb-3">£0</p>
                <p className="font-mono text-cream/60 text-sm leading-relaxed">
                  No monthly fees. No credit packs. No paying for silence.
                </p>
              </div>
              <div className="border border-cream/10 p-6 bg-cream/[0.02]">
                <p className="font-heading text-teal text-5xl mb-3">7.5%</p>
                <p className="font-mono text-cream/60 text-sm leading-relaxed">
                  Capped at £900, charged only when a job completes.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto border border-cream/10">
              <table className="w-full font-mono text-sm">
                <thead>
                  <tr className="bg-cream/[0.04] text-cream uppercase tracking-wider text-xs">
                    <th className="text-left p-4 w-1/3">What you get</th>
                    <th className="text-left p-4">What it does</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((f, i) => (
                    <tr key={f.name} className={i % 2 === 0 ? "bg-cream/[0.01]" : ""}>
                      <td className="p-4 text-cream font-medium align-top">{f.name}</td>
                      <td className="p-4 text-cream/60 align-top">{f.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 border-t border-cream/10">
          <div className="max-w-4xl mx-auto text-center">
            <Button
              asChild
              size="lg"
              className="bg-teal hover:bg-teal/90 text-deep font-mono uppercase tracking-wider"
            >
              <Link to="/register/trade">
                Register Free — Pay Nothing Until You Earn <ArrowRight className="ml-1" />
              </Link>
            </Button>
            <p className="font-mono text-xs text-secondary-text uppercase tracking-widest mt-10">
              ProGrafter Ltd · Company 17124130 · ICO ZC114018
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default About;
