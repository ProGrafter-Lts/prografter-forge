import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import {
  ContentHero,
  ContentSection,
  StepList,
  FeatureGrid,
  FaqBlock,
  ContentCta,
  buildFaqJsonLd,
} from "@/components/content/ContentBlocks";
import { buildServiceJsonLd } from "@/lib/seoSchemas";

const STEPS = [
  { title: "Upload your quote", desc: "Add a builder's quotation as a PDF or photos. Optionally include project details and any payment information you've been given." },
  { title: "AI reads it like a quantity surveyor", desc: "Our construction-aware AI reviews scope, pricing, exclusions, allowances, temporary works, payment structure and more." },
  { title: "Get your Quote Clarity Score", desc: "Receive a clear score plus a breakdown of what's included, what's unclear and what may be missing." },
  { title: "Know what to ask", desc: "Walk into your builder conversation with a precise list of questions — so nothing important is left to assumption." },
];

const CHECKS = [
  { title: "Scope & inclusions", desc: "What the quote actually covers — and where the boundaries are.", icon: "❏" },
  { title: "Pricing transparency", desc: "Whether costs are itemised clearly or bundled into vague lump sums.", icon: "£" },
  { title: "VAT clarity", desc: "Whether VAT is clearly shown, so there are no surprises at the end.", icon: "%" },
  { title: "Exclusions & assumptions", desc: "The things the builder has quietly left out or assumed.", icon: "⚠" },
  { title: "Allowances & provisional sums", desc: "Where costs are estimates that could move — like facing bricks or fittings.", icon: "◆" },
  { title: "Payment & variations", desc: "How and when you pay, and how changes to the work are handled.", icon: "⇄" },
];

const FAQ = [
  { q: "What is the AI Quote Checker?", a: "It's a tool that reviews a builder's quotation using construction-aware AI, then gives you a Quote Clarity Score and a plain-English breakdown of what's included, unclear or missing — plus the questions to ask before you commit." },
  { q: "Is it a replacement for a surveyor?", a: "No. It's a fast, affordable first check that helps you understand a quote and prepare better questions. It doesn't replace professional advice on complex or structural projects, but it makes every conversation sharper." },
  { q: "How much does it cost?", a: "There's a free Project Cost Guide for early planning, and a paid Quote Health Check for a detailed review of a specific quotation. See the ProGrafter Intelligence page for current options." },
  { q: "Will more project detail improve my result?", a: "Yes. Adding genuine project and payment context helps the AI recognise what's already been provided — it improves your Project Confidence Score and reduces unnecessary flags." },
  { q: "What file types can I upload?", a: "PDFs and clear photos or scans of your quotation work best. The clearer the document, the more accurate the review." },
];

const AiQuoteCheckerPage = () => (
  <AppShell>
    <SEO
      title="AI Quote Checker — Check a Builder's Quote in Minutes | ProGrafter"
      description="Upload a builder's quote and get an instant, construction-aware review: what's included, unclear or missing, plus a Quote Clarity Score and the questions to ask before you commit."
      path="/ai-quote-checker"
      jsonLd={[
        buildFaqJsonLd(FAQ),
        buildServiceJsonLd({
          name: "AI Quote Checker",
          description: "AI-powered review of a builder's construction quotation, producing a Quote Clarity Score and a breakdown of inclusions, exclusions and missing items.",
          url: "https://prografter.co.uk/ai-quote-checker",
          serviceType: "Construction quote analysis",
        }),
      ]}
    />
    <ContentHero
      eyebrow="AI Quote Checker"
      title="Understand any"
      highlight="builder's quote."
      intro="Anyone can hand you a cheap quote. ProGrafter helps you understand it — upload a quotation and get a construction-aware review in minutes, so you know exactly what you're paying for."
      ghost="AI"
      primaryCta={{ label: "Upload your quote", href: "/quote-checker" }}
      secondaryCta={{ label: "Free Cost Guide", href: "/quote-checker-ai" }}
    />
    <ContentSection title="How it works" intro="Four simple steps from upload to clarity.">
      <StepList items={STEPS} />
    </ContentSection>
    <ContentSection title="What the AI checks" tone="white">
      <FeatureGrid items={CHECKS} />
    </ContentSection>
    <ContentSection title="Frequently asked questions">
      <FaqBlock items={FAQ} />
    </ContentSection>
    <ContentCta
      title="Check your quote before you commit"
      intro="A few minutes now can save thousands later. Get your Quote Clarity Score today."
      primary={{ label: "Upload Your Quote", href: "/quote-checker" }}
      secondary={{ label: "About the Clarity Score", href: "/quote-clarity-score" }}
    />
  </AppShell>
);

export default AiQuoteCheckerPage;
