import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const costRows = [
  { label: "Membership (typical)", value: "£40–£100 per month" },
  { label: "Annual membership cost", value: "£480–£1,200 per year" },
  { label: "Lead credits (typical)", value: "£25–£70 per lead, often shared" },
  { label: "Average annual lead spend (active trade)", value: "£600–£2,000+" },
  { label: "Realistic annual total", value: "£1,000 – £3,000+" },
];

const frustrations = [
  "Leads being sold to multiple trades, so you're racing to the phone before the credit is even worth using.",
  "Tyre-kickers and price-shoppers who never had any intention of going ahead — but the credit is already gone.",
  "Charges continuing during quiet months, holidays and downturns, when no work is coming in.",
  "Awkward cancellation experiences and contract terms that aren't obvious until you try to leave.",
  "Profile visibility feeling tied to spend — slow down and you drop down the list.",
];

const alternatives = [
  { name: "MyBuilder / Rated People", body: "Similar pay-per-lead model. Cheaper entry, but the same shared-lead and tyre-kicker problems apply." },
  { name: "Google + your own website", body: "No middleman fees, but you're paying in time and SEO spend. Works long term, slow to start." },
  { name: "Word of mouth + Facebook groups", body: "Free, high-trust, but unpredictable — and it doesn't scale when you want to grow." },
  { name: "ProGrafter", body: "No monthly fee. No per-lead credits. 7.5% commission only when a job completes. Built by a trade for trades." },
];

const IsCheckatradeWorthIt = () => {
  return (
    <div className="min-h-screen bg-deep">
      <SEO
        title="Is Checkatrade Worth It in 2026? Honest Trade Review"
        description="An honest review of Checkatrade in 2026 from a founder who spent 20 years on the tools. Full cost breakdown, real frustrations and the alternatives worth considering."
        path="/is-checkatrade-worth-it"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Is Checkatrade Worth It? An Honest Answer From a Trade",
            author: { "@type": "Person", name: "Lee Palfreeman" },
            datePublished: "2026-01-01",
            publisher: { "@type": "Organization", name: "ProGrafter" },
          })}
        </script>
      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <span
          className="absolute -bottom-8 right-0 font-heading text-[160px] craft:text-[280px] text-cream select-none pointer-events-none leading-none"
          style={{ opacity: 0.03 }}
        >
          HONEST
        </span>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">Honest Review · 2026</span>
          </div>
          <h1 className="font-heading text-cream text-[40px] craft:text-[80px] leading-[0.95]">
            Is Checkatrade<br />worth it? An honest<br />
            <span className="text-teal">answer from a trade.</span>
          </h1>
          <p className="font-mono text-cream/70 mt-8 max-w-2xl text-base">
            I'm Lee. I spent 20 years as a qualified electrician before building ProGrafter. I've used the directories, paid the fees, and chased the bad leads. Here's a straight answer.
          </p>
        </div>
      </section>

      {/* First-person intro */}
      <section className="px-6 py-16 border-t border-cream/10">
        <div className="max-w-3xl mx-auto space-y-6 font-mono text-cream/80 text-base leading-relaxed">
          <p>
            I'll start with the honest bit: Checkatrade <em>can</em> work. If you're brand new, in a busy area and you're sharp on the phone, you can win jobs from it. I've watched mates do exactly that.
          </p>
          <p>
            But "can it work" is a different question to "is it worth it." Worth it means the maths stacks up after the fees, the quiet months, the shared leads and the tyre-kickers. That's the question I want to answer here — without the marketing, and without the comments-section rage either.
          </p>
        </div>
      </section>

      {/* Cost breakdown */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-xs text-teal uppercase tracking-widest">01 / The Real Cost</span>
          </div>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mb-10">
            What you'll actually pay.
          </h2>
          <div className="border border-cream/10">
            <table className="w-full font-mono text-sm">
              <tbody>
                {costRows.map((r, i) => (
                  <tr key={r.label} className={i % 2 === 0 ? "bg-cream/[0.02]" : ""}>
                    <td className="p-5 text-cream/70">{r.label}</td>
                    <td className="p-5 text-cream font-medium text-right">{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-mono text-cream/50 text-xs mt-4">
            Figures based on publicly reported trade spend. Your number depends on tier, region and how many leads you actually buy.
          </p>
        </div>
      </section>

      {/* What you get */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-xs text-teal uppercase tracking-widest">02 / What You Get</span>
          </div>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mb-8">
            What the money buys you.
          </h2>
          <div className="space-y-6 font-mono text-cream/80 text-base leading-relaxed">
            <p>
              For the membership, you get a profile, a logo to put on your van, and visibility on a directory the public recognise. That last bit is genuinely useful — Checkatrade has spent serious money making sure homeowners have heard of it.
            </p>
            <p>
              For the lead credits, you get the homeowner's contact details and a chance to quote. What you don't get is exclusivity — the same job is normally offered to several trades. So the "cost per job" you actually win is usually a multiple of the headline lead price.
            </p>
            <p>
              And once you've won the job? That's it. There's no quoting tool, no project tracker, no payment schedule, no homeowner documentation. You're back to WhatsApp and paper invoices like every other job.
            </p>
          </div>
        </div>
      </section>

      {/* Frustrations */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-xs text-teal uppercase tracking-widest">03 / What Trades Actually Say</span>
          </div>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mb-8">
            The recurring complaints.
          </h2>
          <p className="font-mono text-cream/60 text-sm mb-6">
            Reading through Trustpilot, trade forums and the comments under any tradesperson video on YouTube, the same five themes come up again and again (paraphrased here, not quoted):
          </p>
          <ul className="space-y-4">
            {frustrations.map((f, i) => (
              <li key={i} className="border-l-2 border-teal pl-6 font-mono text-cream/80 text-base leading-relaxed">
                {f}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Alternatives */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-xs text-teal uppercase tracking-widest">04 / Alternatives</span>
          </div>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mb-10">
            What else is out there.
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {alternatives.map((a) => (
              <div key={a.name} className="border border-cream/10 p-6 bg-cream/[0.02]">
                <h3 className="font-heading text-cream text-2xl mb-3">{a.name}</h3>
                <p className="font-mono text-cream/60 text-sm leading-relaxed">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* My take */}
      <section className="px-6 py-20 border-t border-cream/10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-xs text-teal uppercase tracking-widest">05 / My Honest Take</span>
          </div>
          <h2 className="font-heading text-cream text-[36px] craft:text-[64px] leading-[1] mb-8">
            So — is it worth it?
          </h2>
          <div className="space-y-6 font-mono text-cream/80 text-base leading-relaxed">
            <p>
              If you're new, hungry, fast on the phone, and you live in a high-demand area: maybe, for a year. Treat it as a marketing budget, track every lead and cut it the second the maths stops working.
            </p>
            <p>
              If you're an experienced trade with a half-decent reputation already: I genuinely don't think so. You're paying a flat fee every month for the privilege of being charged again to talk to homeowners — alongside three other trades pitching for the same job.
            </p>
            <p>
              That's the exact reason I built ProGrafter. No monthly fee. No per-lead credits. We only get paid when you do — 7.5% on completed work. If a job doesn't go ahead, you've lost nothing but the time you'd have spent quoting anyway.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 border-t border-cream/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-cream text-[36px] craft:text-[72px] leading-[1] mb-6">
            Try a platform that<br />charges <span className="text-teal">nothing</span><br />until you earn.
          </h2>
          <p className="font-mono text-cream/60 max-w-xl mx-auto mb-10">
            No membership. No credits. 7.5% commission only on completed jobs.
          </p>
          <Button asChild size="lg" className="bg-teal hover:bg-teal/90 text-deep font-mono uppercase tracking-wider">
            <Link to="/register/trade">
              Register Free <ArrowRight className="ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IsCheckatradeWorthIt;
