import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ContentHero,
  ContentSection,
  FeatureGrid,
  StepList,
  ContentCta,
} from "@/components/content/ContentBlocks";

const PILLARS = [
  {
    icon: "✓",
    title: "5-Step Trade Verification",
    desc: "ID, insurance, qualifications, references and work history — every trade is checked by a human before approval. Verification, not a paid listing.",
  },
  {
    icon: "◎",
    title: "Homeowner Verification",
    desc: "Real, verified homeowners with genuine projects. Trades quote on real work, never tyre-kickers or recycled leads.",
  },
  {
    icon: "⇄",
    title: "Two-Way Reviews",
    desc: "Homeowners and trades review each other after every job. Accountability runs both ways — the way it should.",
  },
  {
    icon: "❏",
    title: "Manual Job Review",
    desc: "Every homeowner brief is read by a person before it reaches trades — better matches and fewer wasted quotes.",
  },
  {
    icon: "£",
    title: "Fair, Transparent Pricing",
    desc: "Rates, caps and optional costs are published clearly, with no paid ranking boosts.",
  },
  {
    icon: "✦",
    title: "AI Transparency",
    desc: "Our AI Quote Checker explains what's included, unclear or missing — and shows its reasoning. It's guidance, never a verdict on a trade.",
  },
  {
    icon: "🔒",
    title: "Privacy & Security",
    desc: "Your data is encrypted in transit and at rest, access-controlled, and never sold. You stay in control of what you share and when.",
  },
  {
    icon: "⚖",
    title: "Dispute Resolution",
    desc: "If something goes wrong, there's a clear, documented process — with your project's contract, messages and milestones on record.",
  },
  {
    icon: "◆",
    title: "Company Mission",
    desc: "We exist to restore trust to domestic construction through intelligent technology, genuine verification and real accountability.",
  },
];

const VERIFICATION_STEPS = [
  { title: "Identity", desc: "Government ID and business details confirmed against public records." },
  { title: "Insurance", desc: "Public liability cover checked and monitored for expiry." },
  { title: "Qualifications", desc: "Trade certifications and accreditations validated where applicable." },
  { title: "References", desc: "Previous clients and work history reviewed for consistency." },
  { title: "History", desc: "Track record and conduct assessed before approval — and on an ongoing basis." },
];

const FAQ = [
  { q: "Does ProGrafter certify or guarantee trades?", a: "We verify trades through a 5-step check and monitor conduct, but we are the platform — not an insurer or certification body. Verification reduces risk; it does not replace your own judgement or a written contract." },
  { q: "Is my personal data sold to third parties?", a: "No. We do not sell your data. It is used to run your projects, match you with suitable trades and improve the service. You control what you share." },
  { q: "How does the AI Quote Checker stay fair?", a: "It analyses the quote document itself — clarity, completeness and structure — and explains its reasoning. It scores documents, not people, and never ranks trades." },
];

const TrustCentre = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="Trust Centre — How ProGrafter Keeps Construction Honest"
        description="See exactly how ProGrafter builds trust: 5-step trade verification, verified homeowners, two-way reviews, human-reviewed briefs, fair pricing, AI transparency, privacy and dispute resolution."
        path="/trust"
      />
      <Navbar />
      <ContentHero
        eyebrow="Trust Centre"
        title="Trust you can"
        highlight="actually verify."
        intro="ProGrafter combines human verification, reviewed project briefs, transparent pricing and shared project records to reduce uncertainty before and during building work."
        primaryCta={{ label: "Check a Quote", href: "/quote-checker" }}
        secondaryCta={{ label: "How It Works", href: "/how-it-works" }}
        ghost="TRUST"
      />

      <ContentSection
        title="The nine pillars of ProGrafter trust"
        intro="Each layer answers a different risk: who is involved, what was agreed, what changed and what evidence exists."
      >
        <FeatureGrid items={PILLARS} cols={3} />
      </ContentSection>

      <ContentSection
        tone="white"
        title="Our 5-Step Trade Verification"
        intro="No trade appears on ProGrafter until they've passed every step. This is verification, not a paid placement."
      >
        <StepList items={VERIFICATION_STEPS} />
      </ContentSection>

      <ContentSection
        title="Trust questions, answered"
        intro="Straight answers about what we do — and what we don't."
      >
        <div className="space-y-3 max-w-3xl">
          {FAQ.map((it) => (
            <details key={it.q} className="group rounded-[4px] bg-white border border-border/60 p-5 shadow-sm">
              <summary className="flex items-center justify-between cursor-pointer font-heading text-navy text-lg leading-tight list-none">
                {it.q}
                <span className="ml-4 text-teal transition-transform group-open:rotate-45 text-2xl leading-none">+</span>
              </summary>
              <p className="font-body text-sm text-body-text leading-relaxed mt-3">{it.a}</p>
            </details>
          ))}
        </div>
      </ContentSection>

      <ContentCta
        title="See trust in action"
        intro="Explore the live quote and verification tools, plus a clearly labelled view of what is being developed next."
        primary={{ label: "Check a Quote", href: "/quote-checker" }}
        secondary={{ label: "Explore the tools", href: "/platform-tour" }}
      />
      <Footer />
    </div>
  );
};

export default TrustCentre;
