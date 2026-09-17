import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import {
  ContentHero,
  ContentSection,
  FaqBlock,
  ContentCta,
  buildFaqJsonLd,
} from "@/components/content/ContentBlocks";
import TrustSignal from "@/components/TrustSignal";


type Faq = { q: string; a: string; link?: { label: string; href: string } };

const GENERAL: Faq[] = [
  { q: "What is ProGrafter?", a: "ProGrafter is a UK construction trust platform. We match reviewed homeowner briefs with verified tradespeople and keep quotes, progress, decisions and milestone records together.", link: { label: "See how it works", href: "/how-it-works" } },
  { q: "How is ProGrafter different from lead-selling platforms?", a: "ProGrafter verifies trades, records homeowner contact and project details, reviews every brief by hand and charges only after completed, paid work.", link: { label: "Compare the pricing models", href: "/pricing#marketplace-pricing" } },
  { q: "Where is ProGrafter available?", a: "ProGrafter operates across the United Kingdom, with initial coverage focused on Nottinghamshire and the East Midlands and expanding from there." },
  { q: "Is ProGrafter free to use?", a: "Registering, posting a job and being matched are free. Trades pay commission only on completed, paid work; some homeowner tools are optional paid extras. Pricing is the definitive source for the exact rate and cap.", link: { label: "See full pricing", href: "/pricing#marketplace-pricing" } },
];

const HOMEOWNERS: Faq[] = [
  { q: "How many quotes will I get?", a: "You're matched with up to three vetted, local, available trades — not thirty — so you choose on the quality of the work, not just the lowest price." },
  { q: "Are the trades insured and qualified?", a: "Yes. Every trade passes our five checks before their profile goes live.", link: { label: "Read Our Checks", href: "/trade-verification#our-checks" } },
  { q: "Can I check a builder's quote before I commit?", a: "Start with the free guide to reading a building quote. If you want your own quote reviewed in detail, the Quote Checker is an optional paid report.", link: { label: "Read the free guide", href: "/advice/reading-a-building-quote" } },
  { q: "What records can I keep during the project?", a: "Depending on your project, you can keep accepted quote details, milestones, site photo updates, decisions, certificates and warranties together. Contract signing and automated homeowner payment collection are not yet live.", link: { label: "See the product", href: "/platform-tour#live-now" } },
];

const TRADES: Faq[] = [
  { q: "What does it cost to join?", a: "Joining, getting verified, being matched and quoting are free. Commission applies only after a completed job has been paid, and it is capped.", link: { label: "See the exact rate and cap", href: "/pricing#marketplace-pricing" } },
  { q: "How do I get verified?", a: "Submit your ID, public liability insurance and relevant qualifications. Most verifications are completed within a few working days after a manual review.", link: { label: "How verification works", href: "/trade-verification#our-checks" } },
  { q: "What checks happen before a brief reaches trades?", a: "A brief requires homeowner contact details, a project address and information about the work. Every brief is manually reviewed before suitable trades are invited." },
  { q: "What are Planning Alerts?", a: "Planning Alerts turn local planning applications into genuine opportunities, helping you reach homeowners with upcoming projects early.", link: { label: "About Planning Alerts", href: "/planning-intelligence" } },
];

const Group = ({ number, title, items }: { number: string; title: string; items: Faq[] }) => (
  <section className="faq-group mb-10 border-t border-navy/15 pt-5 craft:mb-14">
    <div className="mb-5 flex items-baseline gap-4">
      <span className="font-mono text-[10px] tracking-[0.18em] text-teal">{number}</span>
      <h2 className="font-heading text-3xl uppercase leading-none text-navy craft:text-4xl">{title}</h2>
    </div>
    <FaqBlock items={items} />
  </section>
);

const FaqPage = () => (
  <AppShell>
    <SEO
      title="Frequently Asked Questions | ProGrafter"
      description="Answers about ProGrafter: trade verification, reviewed project briefs, pricing, the Quote Checker and shared project records."
      path="/faq"
      jsonLd={buildFaqJsonLd([...GENERAL, ...HOMEOWNERS, ...TRADES])}
    />
    <ContentHero
      eyebrow="FAQ"
      title="Questions,"
      highlight="answered."
      intro="Everything homeowners and tradespeople ask about how ProGrafter works, what it costs, and how we build trust into every stage."
      ghost="FAQ"
      primaryCta={{ label: "Upload a quote", href: "/quote-checker" }}
      secondaryCta={{ label: "Contact us", href: "/contact" }}
    />
    <ContentSection>
      <Group number="01 / GENERAL" title="About ProGrafter" items={GENERAL} />
      <Group number="02 / HOMEOWNER" title="For homeowners" items={HOMEOWNERS} />
      <Group number="03 / TRADE" title="For tradespeople" items={TRADES} />
      <TrustSignal className="mt-10" />
    </ContentSection>
    <ContentCta
      title="Still have a question?"
      intro="We're happy to help — get in touch and a real person will get back to you."
      primary={{ label: "Contact ProGrafter", href: "/contact" }}
      secondary={{ label: "Browse resources", href: "/resources" }}
    />
  </AppShell>
);

export default FaqPage;
