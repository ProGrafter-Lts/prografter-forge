import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import { BadgeCheck, FileCheck2, HardHat, ScrollText, ShieldCheck } from "lucide-react";
import { EditorialStatement, PublicSceneHero, SectionLabel, VisualSequence } from "@/components/public/PublicBits";
import {
  ContentSection,
  FeatureGrid,
  FaqBlock,
  ContentCta,
  buildFaqJsonLd,
} from "@/components/content/ContentBlocks";
import verifiedTrade from "@/assets/how-it-works/get-verified.jpg";
import policyEvidence from "@/assets/dashboard/card-tradevault.jpg";
import qualificationEvidence from "@/assets/how-it-works/submit-quote.jpg";
import workEvidence from "@/assets/how-it-works/trade-project.jpg";
import accountabilityEvidence from "@/assets/dashboard/card-sitephotos.jpg";

const STEPS = [
  { num: "01", icon: BadgeCheck, image: verifiedTrade, alt: "Verified tradesperson on a residential building project", evidence: "Government-issued ID", title: "Identity verification", description: "Government-issued ID is checked to confirm the person behind the business is who they say they are — no anonymous listings." },
  { num: "02", icon: ShieldCheck, image: policyEvidence, alt: "Trade document records and expiry information", evidence: "Policy schedule", title: "Public liability insurance", description: "We confirm valid public liability cover so homeowners are protected if something goes wrong on site." },
  { num: "03", icon: ScrollText, image: qualificationEvidence, alt: "Trade preparing structured documents on a laptop", evidence: "Certificates & scheme membership", title: "Trade qualifications & accreditations", description: "Relevant qualifications, competent-person scheme membership and trade accreditations are checked against the work a trade offers." },
  { num: "04", icon: HardHat, image: workEvidence, alt: "Builder reviewing completed construction work", evidence: "Referees & completed work", title: "References & work history", description: "We review references and past work so a trade's track record — not just their marketing — earns them a place." },
  { num: "05", icon: FileCheck2, image: accountabilityEvidence, alt: "Dated construction site records and photographs", evidence: "Reviews & expiry reminders", title: "Ongoing accountability", description: "Two-way reviews, document expiry reminders and manual oversight keep standards high after approval, not just at sign-up." },
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
  { q: "Does verification cost the trade anything?", a: "No. Joining and verification are part of the free core platform. See the pricing page for the commission applied after completed paid work." },
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
    <PublicSceneHero
      image={verifiedTrade}
      imageAlt="Verified tradesperson working on a residential construction project"
      eyebrow="Trade Verification"
      title="Every trade, verified "
      highlight="five ways."
      intro="Trust starts before the first quote. ProGrafter checks identity, insurance, qualifications, references and history — so homeowners meet genuine professionals, not paid listings."
      primaryCta={{ label: "Join as a verified trade", href: "/signup/trade" }}
      secondaryCta={{ label: "See how it works", href: "/how-it-works" }}
      annotation={["Checked first.", "Trusted after."]}
      phases={["Identity", "Insurance", "Skills", "History", "Accountability"]}
    />

    <section className="public-evidence-section">
      <div className="public-scene-container">
        <SectionLabel>The record we build</SectionLabel>
        <div className="public-section-heading">
          <h2>Our 5-step<br /><span>verification process.</span></h2>
          <p>
          Each trade passes every stage before their profile goes live to homeowners.
          </p>
        </div>
        <VisualSequence items={STEPS} />
      </div>
    </section>

    <EditorialStatement
      lines={["Five checks.", "Not five stars."]}
      note="Evidence on file before a trade reaches a homeowner."
    />

    <ContentSection title="Why it matters" tone="white">
      <FeatureGrid items={WHY} />
    </ContentSection>
    <ContentSection title="Frequently asked questions">
      <FaqBlock items={FAQ} />
    </ContentSection>
    <ContentCta
      title="Win genuine work as a verified trade"
      intro="Build a trusted profile, receive suitable opportunities and keep your documents current in one place."
      primary={{ label: "Join as a Trade", href: "/signup/trade" }}
      secondary={{ label: "View pricing", href: "/pricing" }}
    />
  </AppShell>
);

export default TradeVerificationPage;
