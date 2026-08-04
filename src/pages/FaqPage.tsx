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


const GENERAL = [
  { q: "What is ProGrafter?", a: "ProGrafter is the UK's AI-powered construction trust platform. We connect verified tradespeople with homeowners and add intelligent tools — like the AI Quote Checker — to remove uncertainty from building work for both sides." },
  { q: "How is ProGrafter different from Checkatrade, MyBuilder or Rated People?", a: "Those platforms largely sell leads. ProGrafter builds trust: five-step trade verification, homeowner verification, two-way reviews, manual brief review, AI quote checking and transparent commission-only pricing with no monthly fees." },
  { q: "Where is ProGrafter available?", a: "ProGrafter operates across the United Kingdom, with initial coverage focused on Nottinghamshire and the East Midlands and expanding nationally." },
  { q: "Is ProGrafter free to use?", a: "It's free to register and free to post a job. Trades pay a 7.5% commission only on completed, paid jobs, capped at £900. Homeowners can use the free Project Cost Guide, with the paid AI Quote Checker available for detailed reviews of a builder's quote." },
];

const HOMEOWNERS = [
  { q: "How many quotes will I get?", a: "You're matched with up to three vetted, local, available trades — not thirty — so you choose on the quality of the work, not just the lowest price." },
  { q: "Are the trades insured and qualified?", a: "Yes. Every trade passes a five-step verification covering ID, public liability insurance, qualifications, references and history before their profile goes live." },
  { q: "Can I check a builder's quote before I commit?", a: "Yes. Upload it to the AI Quote Checker to get a Clarity Score (0–100) and a breakdown of what's included, unclear or missing — plus the questions to ask." },
  { q: "What protection do I get during the project?", a: "Depending on your project you can benefit from written contracts, staged payments, site photo updates and a record of certificates and warranties at completion." },
];

const TRADES = [
  { q: "What does it cost to join?", a: "Nothing to register and no monthly or lead fees. You pay 7.5% commission only when a job completes and you've been paid, capped at £900 per job." },
  { q: "How do I get verified?", a: "Submit your ID, public liability insurance and relevant qualifications. Most verifications are completed within a few working days after a manual review." },
  { q: "Are the leads real?", a: "Yes. Homeowners are verified and every job brief is manually reviewed, so you quote on genuine, described projects — not time-wasters." },
  { q: "What are Planning Alerts?", a: "Planning Alerts turn local planning applications into genuine opportunities, helping you reach homeowners with upcoming projects early." },
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
