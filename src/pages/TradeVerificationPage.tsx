import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import { BadgeCheck, FileCheck2, HardHat, ScrollText, ShieldCheck } from "lucide-react";
import { EditorialStatement, SectionLabel } from "@/components/public/PublicBits";
import {
  ContentHero,
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
  { icon: BadgeCheck, image: verifiedTrade, evidence: "Government-issued ID", title: "Identity verification", desc: "Government-issued ID is checked to confirm the person behind the business is who they say they are — no anonymous listings." },
  { icon: ShieldCheck, image: policyEvidence, evidence: "Policy schedule", title: "Public liability insurance", desc: "We confirm valid public liability cover so homeowners are protected if something goes wrong on site." },
  { icon: ScrollText, image: qualificationEvidence, evidence: "Certificates & scheme membership", title: "Trade qualifications & accreditations", desc: "Relevant qualifications, competent-person scheme membership and trade accreditations are checked against the work a trade offers." },
  { icon: HardHat, image: workEvidence, evidence: "Referees & completed work", title: "References & work history", desc: "We review references and past work so a trade's track record — not just their marketing — earns them a place." },
  { icon: FileCheck2, image: accountabilityEvidence, evidence: "Reviews & expiry reminders", title: "Ongoing accountability", desc: "Two-way reviews, document expiry reminders and manual oversight keep standards high after approval, not just at sign-up." },
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
    <ContentHero
      eyebrow="Trade Verification"
      title="Every trade, verified"
      highlight="five ways."
      intro="Trust starts before the first quote. ProGrafter checks identity, insurance, qualifications, references and history — so homeowners meet genuine professionals, not paid listings."
      image={verifiedTrade}
      imageAlt="Verified tradesperson working on a residential construction project"
      primaryCta={{ label: "Join as a verified trade", href: "/signup/trade" }}
      secondaryCta={{ label: "See how it works", href: "/how-it-works" }}
    />

    <section className="verification-record bg-cream px-6 py-16 craft:py-20">
      <div className="mx-auto max-w-5xl">
        <SectionLabel tone="light">The record we build</SectionLabel>
        <h2 className="type-h2 mt-3 max-w-3xl text-navy">Our 5-step verification process</h2>
        <p className="mt-4 max-w-2xl font-body text-lg text-secondary-text">
          Each trade passes every stage before their profile goes live to homeowners.
        </p>
        <ol className="verification-record__list mt-10 space-y-4">
          {STEPS.map(({ icon: Icon, image, evidence, title, desc }, i) => (
            <li key={title} className="relative grid gap-4 rounded-[4px] border border-border/60 border-l-2 border-l-teal bg-card p-6 shadow-sm craft:grid-cols-[auto_1fr_auto] craft:items-start">
              <img src={image} alt="" loading="lazy" className="verification-record__image" />
              <span className="flex h-11 w-11 items-center justify-center rounded-[4px] border border-teal/25 bg-teal/10 font-mono text-sm text-teal">{String(i + 1).padStart(2, "0")}</span>
              <div><h3 className="font-heading text-xl leading-tight text-navy">{title}</h3><p className="mt-2 font-body text-sm leading-relaxed text-body-text">{desc}</p></div>
              <span className="flex items-center gap-2 self-center whitespace-nowrap border border-border/60 bg-cream px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-secondary-text"><Icon className="h-4 w-4 shrink-0 text-teal" aria-hidden />{evidence}</span>
            </li>
          ))}
        </ol>
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
