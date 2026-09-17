import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import { ArrowRight, BadgeCheck, FileCheck2, HardHat, ScrollText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorialStatement, SectionLabel, ShowcaseHero } from "@/components/public/PublicBits";
import {
  
  ContentSection,
  FeatureGrid,
  FaqBlock,
  ContentCta,
  buildFaqJsonLd,
} from "@/components/content/ContentBlocks";
import verifiedTrade from "@/assets/how-it-works/get-verified-prografter.jpg";
import policyEvidence from "@/assets/verification/insurance-evidence.jpg";
import qualificationEvidence from "@/assets/verification/qualifications-evidence.jpg";
import workEvidence from "@/assets/how-it-works/trade-project.jpg";
import accountabilityEvidence from "@/assets/dashboard/card-sitephotos.jpg";

const STEPS = [
  { icon: BadgeCheck, image: verifiedTrade, evidence: "Government-issued ID", status: "Identity verified", title: "Identity verification", desc: "Government-issued ID is checked to confirm the person behind the business is who they say they are — no anonymous listings." },
  { icon: ShieldCheck, image: policyEvidence, evidence: "Policy schedule", status: "Cover confirmed", title: "Public liability insurance", desc: "We confirm valid public liability cover before a trade can quote, so homeowners are protected if something goes wrong on site." },
  { icon: ScrollText, image: qualificationEvidence, evidence: "Certificates & scheme membership", status: "Accreditations checked", title: "Qualifications & accreditations", desc: "Relevant trade qualifications, competent-person scheme membership and industry accreditations are checked against the work a trade offers." },
  { icon: HardHat, image: workEvidence, evidence: "Referees & completed work", status: "History verified", title: "References & work history", desc: "We review past projects and speak to recent customers where needed, so a track record — not marketing — earns a place." },
  { icon: FileCheck2, image: accountabilityEvidence, evidence: "Reviews & expiry reminders", status: "Kept current", title: "Ongoing monitoring", desc: "Profiles are regularly checked to keep standards high — two-way reviews, document expiry reminders and manual oversight after approval, not just at sign-up." },
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
    <ShowcaseHero
      label="Our checks"
      lines={[{ text: "Five checks." }, { text: "Not five stars." }]}
      intro="We verify every trade before they join ProGrafter — because trust on a building project isn’t a rating, it’s evidence."
      image={verifiedTrade}
      imageAlt="Verified tradesperson in ProGrafter workwear on a residential construction site"
      imageFocus="66% 18%"
      note={<>Proper checks<br />for proper grafters.</>}
      actions={
        <>
          <Button asChild variant="cta" size="lg"><Link to="/how-it-works">See how it works <ArrowRight /></Link></Button>
          <Button asChild variant="outline" size="lg" className="border-cream/30 bg-transparent text-cream hover:border-teal hover:bg-transparent hover:text-teal"><Link to="/signup/trade">Apply for verification</Link></Button>
        </>
      }
    />

    <section className="bg-deep px-6 py-16 craft:py-20">
      <div className="mx-auto max-w-5xl">
        <SectionLabel>The record we build</SectionLabel>
        <h2 className="type-h2 mt-3 max-w-3xl text-cream">Our 5-step verification process</h2>
        <p className="mt-4 max-w-2xl font-body text-lg text-cream/80">
          Each trade passes every stage before their profile goes live to homeowners.
        </p>
        <ol className="mt-10 space-y-4">
          {STEPS.map(({ icon: Icon, image, evidence, status, title, desc }, i) => (
            <li key={title} className="pg-check-row">
              <span className="pg-check-row__num">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="font-body text-lg font-bold leading-tight text-cream">{title}</h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-cream/75">{desc}</p>
                <span className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cream/55">
                  <Icon className="h-4 w-4 shrink-0 text-teal" aria-hidden />
                  {evidence}
                </span>
              </div>
              <div className="pg-check-row__media"><img src={image} alt="" loading="lazy" /></div>
              <span className="pg-check-row__status"><BadgeCheck className="h-3.5 w-3.5" aria-hidden />{status}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-cream/50">
          Images are illustrative. Verification status shown here describes what we check, not any individual trade.
        </p>
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
      primary={{ label: "Apply to Join", href: "/signup/trade" }}
      secondary={{ label: "View pricing", href: "/pricing" }}
    />
  </AppShell>
);

export default TradeVerificationPage;
