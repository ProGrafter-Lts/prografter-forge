import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { localBusinessJsonLd } from "@/lib/seoSchemas";
import { EditorialStatement, ShowcaseHero } from "@/components/public/PublicBits";
import founderImage from "@/assets/home/trades-hero.jpg";
import receiptsImage from "@/assets/how-it-works/cta-plans.jpg";

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
        description="Why working builder Lee Palfreeman created ProGrafter after spending £625 on 18 leads without winning a job."
        path="/about"
        ogType="article"
        jsonLd={[localBusinessJsonLd, articleJsonLd]}
      />

      <div className="bg-deep">
        {/* Hero */}
        <ShowcaseHero
          label="Why I built ProGrafter"
          lines={[{ text: "I spent £625" }, { text: "on 18 leads" }, { text: "and won nothing." }]}
          intro={<span className="font-body text-xl text-teal">So I built something better.</span>}
          image={founderImage}
          imageAlt="Construction site in Nottinghamshire"
        >
          <div className="pg-receipt mt-10 max-w-sm craft:absolute craft:right-0 craft:top-4 craft:mt-0 craft:w-[19rem]">
            <p className="pg-note text-navy/70">Actual experience.<br />A better solution.</p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-navy/55">
              <span className="block">Lead spend</span>
              <span className="block">Editorial summary</span>
            </p>
            <dl className="mt-4 space-y-3">
              {[
                { figure: "18", label: "qualified leads" },
                { figure: "£625.32", label: "spent inc. VAT" },
                { figure: "0", label: "jobs won" },
              ].map(({ figure, label }) => (
                <div key={label}>
                  <dt className="font-heading text-3xl leading-none text-navy">{figure}</dt>
                  <dd className="font-mono text-[11px] uppercase tracking-[0.16em] text-navy/60">{label}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 flex items-baseline justify-between border-t border-navy/20 pt-3 font-mono text-xs uppercase tracking-[0.16em] text-navy/70">
              <span>Total</span><span className="font-heading text-xl tracking-normal text-navy">£625.32</span>
            </p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-navy/45">Illustrative summary of real spend — not a reproduction of an original receipt.</p>
          </div>
        </ShowcaseHero>

        {/* Opening prose */}
        <section className="px-6 py-16">
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
        <section className="about-receipts px-6 py-16 border-t border-cream/10">
          <div className="about-receipts__image" aria-hidden><img src={receiptsImage} alt="" /></div>
          <div className="max-w-6xl mx-auto">
            <span className="font-mono text-xs text-teal uppercase tracking-widest">
              The Receipts
            </span>
            <h2 className="type-h2 mb-10 mt-3 text-cream">
              Ten of the eighteen.
            </h2>
            <div className="mb-7 grid divide-y divide-cream/10 border border-cream/10 bg-cream/[0.02] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[
                { figure: "18", label: "Qualified leads" },
                { figure: "£625.32", label: "Spent inc. VAT" },
                { figure: "0", label: "Jobs won" },
              ].map(({ figure, label }) => (
                <div key={label} className="relative overflow-hidden px-6 py-9">
                  <p className="font-heading text-5xl leading-none text-teal craft:text-6xl">{figure}</p>
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-cream/55">{label}</p>
                </div>
              ))}
            </div>
            <details className="group border border-cream/10 bg-cream/[0.02] p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-body font-semibold text-cream">
                See the detailed lead breakdown
                <span className="ml-4 text-2xl leading-none text-teal transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="mt-5 overflow-x-auto border border-cream/10">
                <table className="w-full font-mono text-sm min-w-[820px]">
                <thead>
                  <tr className="bg-cream/[0.04] text-cream uppercase tracking-wider text-xs">
                    <th className="text-left p-4">Job</th>
                    <th className="text-left p-4">Distance</th>
                    <th className="text-left p-4 text-teal">Paid + VAT</th>
                    <th className="text-left p-4">Other builders</th>
                    <th className="text-left p-4">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l, i) => {
                    const [job, distance] = l.job.split(" — ");
                    return (
                      <tr key={i} className={i % 2 === 0 ? "bg-cream/[0.01]" : ""}>
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
              <p className="font-body text-cream/70 mt-6 max-w-3xl leading-relaxed">
              Ten leads shown here, £379.92 of the total spent (inc. VAT) — the full picture across
              all 18 leads came to £625.32. Zero jobs won. In several cases, zero conversations even
              started. On one job alone, eight builders collectively handed MyBuilder around £344+VAT
              — for a homeowner who never responded to any of us. On another, I chased up three
              months after paying and there was no reply. There is no refund for that. MyBuilder's
              refund policy only covers wrong contact details or duplicate charges — 'homeowner did
              not respond' is explicitly not a valid reason. You just lose the money.
              </p>
            </details>
          </div>
        </section>

        {/* The moment it clicked */}
        <section className="px-6 py-16 border-t border-cream/10">
          <div className="max-w-[700px] mx-auto">
            <h2 className="type-h2 mb-8 text-teal">
              The Moment It Clicked
            </h2>
            <div className="space-y-6 font-body text-cream/80 text-lg leading-relaxed font-light">
              <p>
                That&apos;s when it clicked. The lead model rewarded introductions, not good outcomes.
                Builders carried the cost before a real conversation began, while homeowners still
                faced uncertainty about scope, quality and what happened next.
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
            <p className="font-mono text-xs text-cream/55 uppercase tracking-widest mt-6">
              — Founder, ProGrafter
            </p>
          </div>
        </section>

        <EditorialStatement
          lines={["Proper work.", "Proper people."]}
          note="Built by a working builder, for working builders and the people who hire them."
        />

        {/* What ProGrafter is */}
        <section className="px-6 py-16 border-t border-cream/10">
          <div className="max-w-6xl mx-auto">
            <span className="font-mono text-xs text-teal uppercase tracking-widest">
              The Alternative
            </span>
            <h2 className="type-h2 mb-10 mt-3 text-cream">
              What ProGrafter Is
            </h2>
            <div className="grid md:grid-cols-2 gap-4 mb-12">
              <div className="border border-cream/10 p-6 bg-cream/[0.02]">
                <p className="font-heading text-teal text-5xl mb-3">£0</p>
                <p className="font-mono text-cream/60 text-sm leading-relaxed">
                  Join, get matched and quote without paying for leads. Optional tools are separate.
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
              variant="cta"
              size="lg"
            >
              <Link to="/register/trade">
                Join ProGrafter <ArrowRight className="ml-1" />
              </Link>
            </Button>
            <p className="font-mono text-xs text-cream/55 uppercase tracking-widest mt-10">
              ProGrafter Ltd · Company 17124130 · ICO ZC114018
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default About;
