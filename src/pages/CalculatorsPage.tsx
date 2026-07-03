import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import { ContentHero, ContentSection, ContentCta } from "@/components/content/ContentBlocks";
import CommissionCalculator from "@/components/calculators/CommissionCalculator";
import SavingsCalculator from "@/components/calculators/SavingsCalculator";

const CalculatorsPage = () => (
  <AppShell>
    <SEO
      title="Trade Calculators — Commission & Savings | ProGrafter"
      description="Work out exactly what a job costs on ProGrafter and how much you could save versus a typical monthly-fee, pay-per-lead platform. Free interactive calculators."
      path="/calculators"
    />
    <ContentHero
      eyebrow="Calculators"
      title="See the numbers"
      highlight="for yourself."
      intro="Commission-only, capped and transparent. Use these calculators to see exactly what a job costs on ProGrafter — and what you'd save compared with paying monthly fees and per-lead charges."
      ghost="MATHS"
      primaryCta={{ label: "Join as a Trade", href: "/signup/trade" }}
      secondaryCta={{ label: "View pricing", href: "/pricing" }}
    />
    <ContentSection>
      <div className="grid grid-cols-1 craft:grid-cols-2 gap-6 items-start">
        <CommissionCalculator />
        <SavingsCalculator />
      </div>
    </ContentSection>
    <ContentCta
      title="Only pay when you get paid"
      intro="No monthly fees. No lead fees. Register free and win genuine work."
      primary={{ label: "Join as a Trade", href: "/signup/trade" }}
      secondary={{ label: "How pricing works", href: "/pricing" }}
    />
  </AppShell>
);

export default CalculatorsPage;
