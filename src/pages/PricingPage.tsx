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

const TRADE_POINTS = [
  { title: "£0 to register", desc: "Join, get verified and build your profile for free. No card required.", icon: "£" },
  { title: "£0 monthly fee", desc: "No subscriptions. No tiers. No paying to stay visible.", icon: "∅" },
  { title: "£0 lead fees", desc: "You never pay to see or respond to a job. No pay-per-lead, ever.", icon: "✓" },
  { title: "7.5% commission", desc: "Only when a job completes and you've been paid. We earn when you earn.", icon: "%" },
  { title: "£900 per-job cap", desc: "Commission is capped at £900 per job — big jobs stay fair.", icon: "◆" },
  { title: "Founding Member perks", desc: "First 50 trades: first 5 jobs at 6%, a permanent badge, and a welcome call from Lee.", icon: "★" },
];

const HOME_POINTS = [
  { title: "Free to post a job", desc: "Posting a project and getting matched with verified trades costs nothing.", icon: "✓" },
  { title: "Free Project Cost Guide", desc: "Early budget guidance before you have any quotes — at no cost.", icon: "◎" },
  { title: "Quote Health Check", desc: "A detailed AI review of a specific builder's quote for a one-off fee.", icon: "✦" },
];

const FAQ = [
  { q: "How much does ProGrafter cost tradespeople?", a: "It's free to register and there are no monthly fees or lead fees. Trades pay a 7.5% commission only when a job completes and they've been paid, capped at £900 per job." },
  { q: "How much does it cost homeowners?", a: "Homeowners post jobs for free and are matched with verified trades at no cost. The AI Quote Checker offers a free Project Cost Guide, with a paid Quote Health Check for detailed reviews of a specific quote." },
  { q: "When exactly does commission apply?", a: "Only after a job is marked complete and the trade has been paid. There's nothing to pay up front and nothing to pay if a job doesn't go ahead." },
  { q: "Are there any hidden fees or rank-boosting charges?", a: "No. There's no pay-to-play, no boosted rankings and no surprise charges. One fair, capped commission — that's it." },
  { q: "What is the Founding Member offer?", a: "The first 50 verified trades get their first 5 jobs at a reduced 6% commission, a permanent Founding Member badge, and a personal welcome call from founder Lee Palfreeman." },
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
      title="Pricing — Commission Only, No Monthly Fees | ProGrafter"
      description="ProGrafter is free to join and free to post a job. Trades pay 7.5% only when a job completes — capped at £900. No monthly fees, no lead fees, no hidden costs."
      path="/pricing"
      jsonLd={buildFaqJsonLd(FAQ)}
    />
    <ContentHero
      eyebrow="Pricing"
      title="Fair, transparent,"
      highlight="commission only."
      intro="No monthly fees. No lead fees. No pay-to-play. ProGrafter only earns when a trade does — one fair, capped commission and nothing hidden."
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
    <ContentSection title="How our pricing compares" intro="Most platforms charge whether you win work or not. We don't.">
      <div className="overflow-x-auto">
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
              ["Monthly fee", "None", "£30–£120+"],
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
      </div>
      <p className="font-body text-xs text-secondary-text mt-4">
        Comparison is illustrative of common industry pricing models and not a statement about any
        specific named competitor.
      </p>
    </ContentSection>
    <ContentSection title="Frequently asked questions">
      <FaqBlock items={FAQ} />
    </ContentSection>
    <ContentCta
      title="Only pay when you get paid"
      intro="Register free, get verified, and win genuine work — with no monthly fees hanging over you."
      primary={{ label: "Join as a Trade", href: "/signup/trade" }}
      secondary={{ label: "Check a quote", href: "/quote-checker" }}
    />
  </AppShell>
);

export default PricingPage;
