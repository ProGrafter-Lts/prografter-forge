import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import {
  ContentHero,
  ContentSection,
  FeatureGrid,
  FaqBlock,
  ContentCta,
  buildFaqJsonLd,
} from "@/components/content/ContentBlocks";

const BANDS = [
  { title: "8–10 · Clear", desc: "Well-structured, itemised and transparent. Scope, pricing and payment are easy to understand.", icon: "◆" },
  { title: "5–7 · Reasonable", desc: "A workable quote with some gaps or vague areas worth clarifying before you commit.", icon: "◎" },
  { title: "1–4 · Unclear", desc: "Significant missing detail or ambiguity. Ask questions and get things in writing before proceeding.", icon: "⚠" },
];

const CATS = [
  { title: "VAT clarity", desc: "Is VAT clearly shown and unambiguous?", icon: "%" },
  { title: "Scope", desc: "Is the full extent of the work clearly defined?", icon: "❏" },
  { title: "Pricing transparency", desc: "Are costs itemised or bundled into lump sums?", icon: "£" },
  { title: "Payment structure", desc: "Are stages, amounts and timing clear?", icon: "⇄" },
  { title: "Programme", desc: "Is there a start, completion or broad timescale?", icon: "◷" },
  { title: "Exclusions", desc: "Are exclusions and assumptions stated openly?", icon: "⚠" },
  { title: "Variations", desc: "Is there a clear process for changes and extra costs?", icon: "±" },
  { title: "Allowances", desc: "Are provisional sums flagged and reasonable?", icon: "◆" },
  { title: "Certification", desc: "Are the right certificates and sign-offs covered?", icon: "✓" },
];

const FAQ = [
  { q: "What is the Quote Clarity Score?", a: "It's a clear, defensible score that reflects how transparent and complete a builder's quotation is — based on a construction-aware review across categories like scope, pricing, VAT, payment structure and exclusions." },
  { q: "What's the difference between the Document Score and the Project Confidence Score?", a: "The Document Score reflects the quality of the uploaded quote on its own. The Project Confidence Score also factors in genuine context you provide — so supplying more accurate detail can raise your confidence in the overall project." },
  { q: "Does a low score mean the builder is bad?", a: "Not necessarily. A low score usually means the document is unclear or incomplete, not that the builder is dishonest. It highlights what to clarify and get in writing before you commit." },
  { q: "Why might the same quote score differently?", a: "We've hardened the scoring to be consistent for the same document. Where you add genuine extra context, the Project Confidence Score can improve — but the Document Score for an identical quote stays stable." },
];

const QuoteClarityScorePage = () => (
  <AppShell>
    <SEO
      title="Quote Clarity Score — How ProGrafter Scores Builder Quotes"
      description="The Quote Clarity Score is a clear, construction-aware measure of how transparent a builder's quote is — across scope, pricing, VAT, payment, exclusions and more."
      path="/quote-clarity-score"
      jsonLd={buildFaqJsonLd(FAQ)}
    />
    <ContentHero
      eyebrow="Quote Clarity Score"
      title="A clear score for"
      highlight="a clear decision."
      intro="The Quote Clarity Score turns a dense builder's quotation into a single, defensible number — plus the detail behind it — so you can compare quotes on substance, not just price."
      ghost="SCORE"
      primaryCta={{ label: "Get your score", href: "/quote-checker" }}
      secondaryCta={{ label: "About the checker", href: "/ai-quote-checker" }}
    />
    <ContentSection title="What the bands mean" intro="Every quote is scored out of 10 and placed in a clear band.">
      <FeatureGrid items={BANDS} />
    </ContentSection>
    <ContentSection title="What goes into the score" tone="white" intro="A construction-aware review across the categories that actually affect your decision.">
      <FeatureGrid items={CATS} />
    </ContentSection>
    <ContentSection title="Document Score vs Project Confidence Score">
      <div className="grid grid-cols-1 craft:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white border border-border/60 p-7 shadow-sm">
          <h3 className="font-heading text-navy text-2xl mb-2">Document Score</h3>
          <p className="font-body text-sm text-body-text leading-relaxed">
            How clear and complete the quotation is on its own. Stable for the same document, every
            time — so you can trust it.
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-border/60 p-7 shadow-sm">
          <h3 className="font-heading text-navy text-2xl mb-2">Project Confidence Score</h3>
          <p className="font-body text-sm text-body-text leading-relaxed">
            The document plus genuine context you provide. Adding accurate project and payment detail
            can raise it — extra context improves the analysis, never punishes it.
          </p>
        </div>
      </div>
    </ContentSection>
    <ContentSection title="Frequently asked questions" tone="white">
      <FaqBlock items={FAQ} />
    </ContentSection>
    <ContentCta
      title="See your Quote Clarity Score"
      intro="Upload a quote and understand exactly where it's clear — and where to ask more."
      primary={{ label: "Upload Your Quote", href: "/quote-checker" }}
    />
  </AppShell>
);

export default QuoteClarityScorePage;
