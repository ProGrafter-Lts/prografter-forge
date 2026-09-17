import { Link } from "react-router-dom";
import { ArrowRight, AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ContentSection, ContentCta, buildFaqJsonLd, FaqBlock } from "@/components/content/ContentBlocks";
import { ShowcaseHero, SectionLabel } from "@/components/public/PublicBits";
import guideHero from "@/assets/how-it-works/compare-quotes.jpg";

const SECTIONS = [
  {
    num: "01",
    title: "Start with the scope, not the price",
    body: "A price only means something once you know what it buys. A usable quote describes the work in the order it will happen — preparation, structure, first fix, second fix, finishes, making good — and says what is being removed as well as what is being installed.",
    points: [
      "Each stage of work described in plain words, not one line saying “as discussed”.",
      "Dimensions, quantities or areas where they affect the price (m², linear metres, number of units).",
      "What happens to waste, spoil and old materials.",
    ],
  },
  {
    num: "02",
    title: "Separate labour, materials and plant",
    body: "Quotes that bundle everything into one figure are impossible to compare. You do not need a full cost breakdown of the builder’s margins, but you should be able to see the shape of the price.",
    points: [
      "Labour shown separately from materials where practical.",
      "Hired plant, scaffolding, skips and access equipment named rather than assumed.",
      "Any allowance or provisional sum clearly labelled as an allowance.",
    ],
  },
  {
    num: "03",
    title: "Look for the specification behind the words",
    body: "“Quality kitchen units” and “new roof covering” are not specifications. Named products, thicknesses and grades are what stop a cheap quote becoming an expensive project.",
    points: [
      "Named or equivalent products for anything visible or performance-related.",
      "Insulation types and thicknesses, membrane and fixing types.",
      "Who chooses and who buys — you or the builder — and on what budget.",
    ],
  },
  {
    num: "04",
    title: "Find the exclusions — they are where the money goes",
    body: "Most disputes come from work everybody assumed was included. A good builder writes their exclusions down; a risky quote stays silent.",
    points: [
      "Building control and planning fees, structural calculations and drawings.",
      "Services alterations: gas, electrics, drainage diversions, meter moves.",
      "Decoration, flooring, tiling, groundworks and unexpected ground conditions.",
      "VAT — stated as included or excluded, never left ambiguous.",
    ],
  },
  {
    num: "05",
    title: "Check payment terms and programme",
    body: "Payment terms tell you how much risk you are carrying. A large deposit with no staged milestones is the single biggest warning sign in domestic building work.",
    points: [
      "Staged payments tied to completed work, not to dates alone.",
      "A modest, justified deposit — usually for materials, not labour.",
      "Start date, expected duration and what happens if either moves.",
      "Retention or a final payment held until snagging is complete.",
    ],
  },
  {
    num: "06",
    title: "Confirm the paperwork behind the price",
    body: "The quote is a commercial document, but it should sit on top of real credentials and real protections.",
    points: [
      "Company name, registered number and address on the document.",
      "Public liability insurance, and scheme registration for gas, electrical or building work.",
      "Warranty or guarantee terms — who backs them and for how long.",
      "Certificates you will receive at completion.",
    ],
  },
];

const RED_FLAGS = [
  "A single total with no description of the work.",
  "A large deposit requested before anything is ordered or delivered.",
  "Pressure to decide today, or a price that expires in 24 hours.",
  "No written exclusions at all.",
  "No VAT position stated.",
  "Cash-only terms or no company details.",
];

const GOOD_SIGNS = [
  "Work described stage by stage in the order it happens.",
  "Exclusions written down plainly.",
  "Named materials and specifications.",
  "Payment tied to completed stages.",
  "Insurance, scheme membership and company details on the document.",
];

const QUESTIONS = [
  "What is specifically excluded from this price?",
  "What happens to the price if the ground, roof or structure is worse than expected?",
  "Which materials are provisional sums, and what is the allowance?",
  "What are the payment stages and what must be complete before each one?",
  "Who is on site day to day, and who is responsible if something goes wrong?",
  "What certificates and warranties will I have at the end?",
];

const FAQ = [
  { q: "Is the cheapest quote usually the problem?", a: "Not always — but a cheaper quote is often cheaper because it covers less. Compare what each quote includes before comparing totals. A price that is far below the others usually has exclusions the others have priced for." },
  { q: "How many quotes should I get?", a: "Two or three properly detailed quotes are more useful than six vague ones. Each builder needs the same information from you, otherwise you are not comparing like for like." },
  { q: "Should a quote include VAT?", a: "It should state its VAT position clearly either way. Not every builder is VAT registered, but you should never have to guess whether 20% is about to be added." },
  { q: "What is a provisional sum?", a: "An allowance for work or materials that cannot be priced accurately yet — for example tiles you have not chosen. It is a placeholder, not a fixed price, and it will be adjusted when the real cost is known." },
];

const GuideReadingAQuote = () => (
  <AppShell>
    <SEO
      title="How to Read a Building Quote | ProGrafter Advice"
      description="A practical UK guide to reading a builder's quote: scope, specification, exclusions, provisional sums, payment stages, red flags and the questions to ask before you sign."
      path="/advice/reading-a-building-quote"
      jsonLd={buildFaqJsonLd(FAQ)}
    />

    <ShowcaseHero
      label="Guide · Quotes"
      lines={[{ text: "How to read" }, { text: "a building quote.", teal: true }]}
      intro="A builder's quote is a description of work with a number on the end. This guide explains what a good one contains, what is usually missing, and the questions worth asking before you commit."
      image={guideHero}
      imageAlt="Homeowner reading a printed building quote at a kitchen table"
      note={<>Read it properly.<br />Once.</>}
      actions={
        <Button asChild variant="cta" size="lg">
          <a href="#guide-start">Start reading <ArrowRight /></a>
        </Button>
      }
    />

    <section id="guide-start" className="bg-deep px-6 py-16 craft:py-20">
      <div className="mx-auto max-w-3xl">
        <SectionLabel>Six things to check</SectionLabel>
        <ol className="mt-10 space-y-10">
          {SECTIONS.map(({ num, title, body, points }) => (
            <li key={num}>
              <span className="font-heading text-3xl leading-none text-teal">{num}</span>
              <h2 className="mt-3 font-body text-2xl font-bold leading-tight text-cream">{title}</h2>
              <p className="mt-3 font-body text-base leading-relaxed text-cream/80">{body}</p>
              <ul className="mt-4 space-y-2 border-l-2 border-teal/40 pl-5">
                {points.map((point) => (
                  <li key={point} className="font-body text-sm leading-relaxed text-cream/70">{point}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>

    <ContentSection title="Warning signs and good signs" tone="white">
      <div className="grid gap-5 craft:grid-cols-2">
        <div className="rounded-[4px] border border-border/60 border-t-2 border-t-rose-400 bg-card p-6">
          <h3 className="flex items-center gap-2 font-heading text-xl text-navy">
            <AlertTriangle className="h-5 w-5 text-rose-400" aria-hidden /> Warning signs
          </h3>
          <ul className="mt-4 space-y-2.5">
            {RED_FLAGS.map((item) => (
              <li key={item} className="font-body text-sm leading-relaxed text-body-text">{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-[4px] border border-border/60 border-t-2 border-t-teal bg-card p-6">
          <h3 className="flex items-center gap-2 font-heading text-xl text-navy">
            <CheckCircle2 className="h-5 w-5 text-teal" aria-hidden /> Good signs
          </h3>
          <ul className="mt-4 space-y-2.5">
            {GOOD_SIGNS.map((item) => (
              <li key={item} className="font-body text-sm leading-relaxed text-body-text">{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </ContentSection>

    <ContentSection title="Six questions to ask before you sign" intro="Send these in writing. A good builder will answer them without hesitation.">
      <ul className="grid gap-4 craft:grid-cols-2">
        {QUESTIONS.map((q) => (
          <li key={q} className="flex gap-3 rounded-[4px] border border-border/60 bg-card p-5">
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />
            <span className="font-body text-sm leading-relaxed text-body-text">{q}</span>
          </li>
        ))}
      </ul>
    </ContentSection>

    <ContentSection title="Frequently asked questions" tone="white">
      <FaqBlock items={FAQ} />
    </ContentSection>

    <ContentCta
      title="Now check your actual quote"
      intro="Read the guide first, then have your own quote reviewed. The Quote Checker is a paid, optional report — the guidance above is free."
      primary={{ label: "Check your actual quote", href: "/quote-checker" }}
      secondary={{ label: "More advice", href: "/resources" }}
    />

    <div className="bg-deep px-6 pb-16">
      <p className="mx-auto max-w-3xl font-body text-sm leading-relaxed text-cream/60">
        This guide is general information about UK domestic building quotes, not legal or financial advice.{" "}
        <Link to="/trade-verification#our-checks" className="text-teal underline underline-offset-4">See how we verify trades</Link>.
      </p>
    </div>
  </AppShell>
);

export default GuideReadingAQuote;
