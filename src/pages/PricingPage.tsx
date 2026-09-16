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
import CommissionCalculator from "@/components/calculators/CommissionCalculator";
import SavingsCalculator from "@/components/calculators/SavingsCalculator";
import TrustSignal from "@/components/TrustSignal";
import { COMMISSION_CAP_LABEL, COMMISSION_CAP_SENTENCE, COMMISSION_RATE_LABEL } from "@/lib/pricingTerms";

const TRADE_POINTS = [
  { title: "£0 to register", desc: "Join, get verified and build your profile for free. No card required.", icon: "£" },
  { title: "No lead fees", desc: "See and respond to suitable opportunities without paying for each introduction.", icon: "✓" },
  { title: `${COMMISSION_RATE_LABEL} when work completes`, desc: "Commission applies after the completed job has been paid.", icon: "%" },
  { title: `${COMMISSION_CAP_LABEL} per-job cap`, desc: `The commission stops at ${COMMISSION_CAP_LABEL}, however large the job.`, icon: "◆" },
];

const HOME_POINTS = [
  { title: "Free project matching", desc: "Post a project and receive up to three carefully selected verified matches where coverage allows.", icon: "✓" },
  { title: "Project Cost Guide", desc: "Early budget guidance before you have any quotes — at no cost.", icon: "◎" },
  { title: "AI Quote Checker", desc: "A detailed AI review of a specific builder's quote for a one-off fee.", icon: "✦" },
];

const FAQ = [
  { q: "How much does ProGrafter cost tradespeople?", a: `The core platform is free to join, get matched and quote. Trades pay a ${COMMISSION_RATE_LABEL} commission after a completed job has been paid, ${COMMISSION_CAP_SENTENCE}. Optional paid tools are separate and opt-in.` },
  { q: "How much does it cost homeowners?", a: "Homeowners post jobs for free and are matched with verified trades at no cost. ProGrafter offers the free Project Cost Guide, with a paid AI Quote Checker report for detailed reviews of a specific quote." },
  { q: "When exactly does commission apply?", a: "Only after a job is marked complete and the trade has been paid. There's nothing to pay up front and nothing to pay if a job doesn't go ahead." },
  { q: "Are there any hidden fees or rank-boosting charges?", a: "No. There's no pay-to-play, no boosted rankings and no surprise charges. One fair, capped commission — that's it." },
  { q: "Are optional tools included?", a: "Core matching and project delivery do not require a subscription. Optional tools, including Planning Hub, are separate and clearly priced before you opt in." },
];

const PriceCard = ({
  title,
  points,
}: {
  title: string;
  points: { title: string; desc: string; icon?: string }[];
}) => (
  <div>
    <h2 className="font-heading text-navy text-[28px] craft:text-[36px] mb-6">{title}</h2>
    <FeatureGrid items={points} cols={3} />
  </div>
);

const PricingPage = () => (
  <AppShell>
    <SEO
      title="ProGrafter Pricing — 7.5%, Capped at £900"
      description="Join and quote without lead fees. Trades pay 7.5% after a completed paid job, capped at £900; optional tools are separate."
      path="/pricing"
      jsonLd={buildFaqJsonLd(FAQ)}
    />
    <ContentHero
      eyebrow="Pricing"
      title="Fair, transparent,"
      highlight="commission only."
      intro="Join, get verified, receive suitable matches and quote without lead fees. Pay 7.5% after a completed job has been paid, capped at £900. Optional tools are separate."
      ghost="FAIR"
      primaryCta={{ label: "Join as a Trade", href: "/signup/trade" }}
      secondaryCta={{ label: "Post a job — free", href: "/post-job-brief" }}
    />
    <ContentSection>
      <div className="space-y-16">
        <PriceCard title="For tradespeople" points={TRADE_POINTS} />
        <PriceCard title="For homeowners" points={HOME_POINTS} />
      </div>
    </ContentSection>
    <ContentSection title="Work out your numbers" tone="white" intro="See exactly what a job costs and how much you could save versus a typical lead-based platform.">
      <div className="grid grid-cols-1 craft:grid-cols-2 gap-6 items-start">
        <CommissionCalculator />
        <SavingsCalculator />
      </div>
    </ContentSection>
    <ContentSection title="How our pricing compares" intro="The key difference is when you pay: after completed, paid work rather than before you know the outcome.">
      <details className="group rounded-[4px] border border-border/60 bg-white p-5 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between font-heading text-xl text-navy">
          Compare with common lead-site pricing
          <span className="ml-4 text-2xl leading-none text-teal transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px]">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 pr-4 font-mono text-xs uppercase tracking-wide text-secondary-text">&nbsp;</th>
              <th className="py-3 px-4 font-heading text-navy text-lg">ProGrafter</th>
              <th className="py-3 px-4 font-mono text-sm text-secondary-text">Typical lead sites</th>
            </tr>
          </thead>
          <tbody className="font-body text-sm text-body-text">
            {[
              ["Core platform subscription", "None", "£30–£120+"],
              ["Lead / contact fees", "None", "Per lead, win or lose"],
              ["Pay to rank higher", "No", "Often yes"],
              ["When you pay", "Only on completed, paid jobs", "Up front / ongoing"],
              ["Per-job cap", "£900", "Uncapped"],
            ].map((row) => (
              <tr key={row[0]} className="border-b border-border/50">
                <td className="py-3 pr-4 font-medium text-navy">{row[0]}</td>
                <td className="py-3 px-4 text-teal font-medium">{row[1]}</td>
                <td className="py-3 px-4 text-secondary-text">{row[2]}</td>
              </tr>
            ))}
          </tbody>
          </table>
          <p className="font-body text-xs text-secondary-text mt-4">Comparison is illustrative of common industry pricing models and not a statement about any specific named competitor.</p>
        </div>
      </details>
    </ContentSection>
    <ContentSection title="Frequently asked questions">
      <FaqBlock items={FAQ} />
      <TrustSignal className="mt-10" text="One published rate, one per-job cap, and no paid ranking boosts." />
    </ContentSection>
    <ContentCta
      title="Only pay when you get paid"
      intro="Join without lead fees and see your exact commission before you take on a project."
      primary={{ label: "Join as a Trade", href: "/signup/trade" }}
      secondary={{ label: "Explore the tools", href: "/platform-tour" }}
    />
  </AppShell>
);

export default PricingPage;
