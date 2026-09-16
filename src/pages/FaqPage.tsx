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
  { q: "What is ProGrafter?", a: "ProGrafter is a UK construction trust platform. We match homeowners with verified tradespeople and keep quotes, progress, decisions and staged payments in one shared project record.", link: { label: "See how it works", href: "/how-it-works" } },
  { q: "How is ProGrafter different from lead-selling platforms?", a: "Those platforms largely sell introductions. We verify both sides, review every brief by hand and charge only after completed, paid work.", link: { label: "Compare the pricing models", href: "/pricing" } },
  { q: "Where is ProGrafter available?", a: "ProGrafter operates across the United Kingdom, with initial coverage focused on Nottinghamshire and the East Midlands and expanding from there." },
  { q: "Is ProGrafter free to use?", a: "Registering, posting a job and being matched are free. Trades pay commission only on completed, paid work; some homeowner tools are optional paid extras. Pricing is the definitive source for the exact rate and cap.", link: { label: "See full pricing", href: "/pricing" } },
];

const HOMEOWNERS: Faq[] = [
  { q: "How many quotes will I get?", a: "You're matched with up to three vetted, local, available trades — not thirty — so you choose on the quality of the work, not just the lowest price." },
  { q: "Are the trades insured and qualified?", a: "Yes. Every trade passes our five checks before their profile goes live.", link: { label: "Read Our Checks", href: "/trade-verification" } },
  { q: "Can I check a builder's quote before I commit?", a: "Start with the free guide to reading a building quote. If you want your own quote reviewed in detail, the Quote Checker is an optional paid report.", link: { label: "Read the free guide", href: "/advice/reading-a-building-quote" } },
  { q: "What protection do I get during the project?", a: "Depending on your project you can benefit from written contracts, staged payments, site photo updates and a record of certificates and warranties at completion.", link: { label: "See the product", href: "/platform-tour" } },
];

const TRADES: Faq[] = [
  { q: "What does it cost to join?", a: "Joining, getting verified, being matched and quoting are free. Commission applies only after a completed job has been paid, and it is capped.", link: { label: "See the exact rate and cap", href: "/pricing" } },
  { q: "How do I get verified?", a: "Submit your ID, public liability insurance and relevant qualifications. Most verifications are completed within a few working days after a manual review.", link: { label: "How verification works", href: "/trade-verification" } },
  { q: "Are the leads real?", a: "Yes. Homeowners are verified and every job brief is manually reviewed, so you quote on genuine, described projects — not time-wasters." },
  { q: "What are Planning Alerts?", a: "Planning Alerts turn local planning applications into genuine opportunities, helping you reach homeowners with upcoming projects early.", link: { label: "About Planning Alerts", href: "/planning-alerts" } },
];

const Group = ({ title, items }: { title: string; items: { q: string; a: string }[] }) => (
  <div className="mb-12">
    <h2 className="font-heading text-navy text-[26px] craft:text-[34px] mb-5">{title}</h2>
    <FaqBlock items={items} />
  </div>
);

const FaqPage = () => (
  <AppShell>
    <SEO
      title="Frequently Asked Questions | ProGrafter"
      description="Answers about ProGrafter: how verification works, what it costs, how the AI Quote Checker works, and how we protect homeowners and tradespeople."
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
      <Group title="About ProGrafter" items={GENERAL} />
      <Group title="For homeowners" items={HOMEOWNERS} />
      <Group title="For tradespeople" items={TRADES} />
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
