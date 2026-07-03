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

const STEPS = [
  { title: "Identity verification", desc: "Government-issued ID is checked to confirm the person behind the business is who they say they are — no anonymous listings." },
  { title: "Public liability insurance", desc: "We confirm valid public liability cover so homeowners are protected if something goes wrong on site." },
  { title: "Trade qualifications & accreditations", desc: "Relevant qualifications, competent-person scheme membership and trade accreditations are checked against the work a trade offers." },
  { title: "References & work history", desc: "We review references and past work so a trade's track record — not just their marketing — earns them a place." },
  { title: "Ongoing accountability", desc: "Two-way reviews, document expiry reminders and manual oversight keep standards high after approval, not just at sign-up." },
];

const WHY = [
  { title: "Not pay-to-list", desc: "Trades can't buy their way onto ProGrafter. Verification is earned, so a badge actually means something.", icon: "✓" },
  { title: "Insurance you can rely on", desc: "Public liability is confirmed, not assumed — with reminders before documents lapse.", icon: "◎" },
  { title: "Right trade, right job", desc: "Qualifications are matched to the work offered, so you get someone genuinely competent for your project.", icon: "◆" },
  { title: "Real track record", desc: "References and history are reviewed by a human, filtering out poor operators before they reach you.", icon: "❏" },
  { title: "Documents kept current", desc: "TradeVault tracks certificate and insurance expiry so verified stays verified.", icon: "⟳" },
  { title: "Accountable after approval", desc: "Two-way reviews mean trades keep earning trust on every job, not just at onboarding.", icon: "⇄" },
];

const FAQ = [
  { q: "How long does trade verification take?", a: "Most verifications are completed within a few working days once a trade has submitted their ID, insurance and qualification documents. Manual review means we prioritise accuracy over speed." },
  { q: "Does verification cost the trade anything?", a: "No. ProGrafter is free to join and verification is included. Trades only ever pay a 7.5% commission when a completed job has been paid, capped at £900 per job." },
  { q: "What happens if a trade's insurance expires?", a: "TradeVault tracks document expiry and sends reminders in advance. Cover must be kept current to remain verified on the platform." },
  { q: "Is a verified badge a guarantee of quality?", a: "Verification confirms identity, insurance, qualifications and history — a strong foundation of trust. Ongoing two-way reviews then reflect real-world performance on every job." },
];

const TradeVerificationPage = () => (
  <AppShell>
    <SEO
      title="Trade Verification — ProGrafter's 5-Step Check for UK Tradespeople"
      description="How ProGrafter verifies every trade: ID, public liability insurance, qualifications, references and ongoing accountability. Verification is earned, never bought."
      path="/trade-verification"
      jsonLd={buildFaqJsonLd(FAQ)}
    />
    <ContentHero
      eyebrow="Trade Verification"
      title="Every trade, verified"
      highlight="five ways."
      intro="Trust starts before the first quote. ProGrafter checks identity, insurance, qualifications, references and history — so homeowners meet genuine professionals, not paid listings."
      ghost="VERIFY"
      primaryCta={{ label: "Join as a verified trade", href: "/signup/trade" }}
      secondaryCta={{ label: "See how it works", href: "/how-it-works" }}
    />
    <ContentSection
      title="Our 5-step verification process"
      intro="Each trade passes every stage before their profile goes live to homeowners."
    >
      <StepList items={STEPS} />
    </ContentSection>
    <ContentSection title="Why it matters" tone="white">
      <FeatureGrid items={WHY} />
    </ContentSection>
    <ContentSection title="Frequently asked questions">
      <FaqBlock items={FAQ} />
    </ContentSection>
    <ContentCta
      title="Win genuine work as a verified trade"
      intro="Free to join. Commission only. No monthly fees, no lead fees — you only pay when you get paid."
      primary={{ label: "Join as a Trade", href: "/signup/trade" }}
      secondary={{ label: "View pricing", href: "/pricing" }}
    />
  </AppShell>
);

export default TradeVerificationPage;
