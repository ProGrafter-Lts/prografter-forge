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
  { title: "Verified contact details", desc: "We confirm a real, contactable homeowner behind every project — no fake enquiries wasting trades' time." },
  { title: "Genuine, described project", desc: "Every job brief describes real work at a real property, so trades know what they're quoting on." },
  { title: "Manual brief review", desc: "A human checks each brief for clarity and completeness before it reaches trades — better matches, fewer wasted quotes." },
  { title: "Two-way accountability", desc: "Homeowners are reviewed by trades too, keeping conduct fair and respectful on both sides." },
];

const WHY = [
  { title: "Real work, not tyre-kickers", desc: "Trades only see genuine projects from verified homeowners, so their time and quotes count.", icon: "◎" },
  { title: "Better matches", desc: "Manually reviewed briefs mean the right trades are invited to the right jobs.", icon: "◆" },
  { title: "Fair on both sides", desc: "Two-way reviews hold homeowners to the same standard of respect and reliability as trades.", icon: "⇄" },
  { title: "Fewer, better quotes", desc: "Up to three matched trades — not thirty — so you compare on merit, not just price.", icon: "❏" },
];

const FAQ = [
  { q: "Why does ProGrafter verify homeowners?", a: "Verifying homeowners protects trades from fake enquiries and time-wasters, and protects homeowners by ensuring they're matched with genuinely available professionals. It keeps the whole platform trustworthy." },
  { q: "What does homeowner verification involve?", a: "We confirm real contact details and that each job brief describes a genuine project. Every brief is then manually reviewed for clarity before it reaches trades." },
  { q: "Does it cost anything to post a job?", a: "No. Posting a job on ProGrafter is completely free for homeowners. You only ever deal with verified, insured trades." },
  { q: "How many quotes will I receive?", a: "You're matched with up to three vetted, local, available trades — not thirty — so you can choose on the quality of the work, not just the lowest price." },
];

const HomeownerVerificationPage = () => (
  <AppShell>
    <SEO
      title="Homeowner Verification — Real Projects, Verified People | ProGrafter"
      description="ProGrafter verifies homeowners and manually reviews every job brief so trades quote on genuine work and homeowners get better matches. Free to post a job."
      path="/homeowner-verification"
      jsonLd={buildFaqJsonLd(FAQ)}
    />
    <ContentHero
      eyebrow="Homeowner Verification"
      title="Real projects."
      highlight="Real people."
      intro="Trust runs both ways. We verify homeowners and manually review every brief so trades quote on genuine work — and you get matched with professionals who are actually available."
      ghost="HOME"
      primaryCta={{ label: "Post a job — free", href: "/post-job-brief" }}
      secondaryCta={{ label: "How it works", href: "/how-it-works" }}
    />
    <ContentSection
      title="How homeowner verification works"
      intro="A few simple checks that protect everyone on the platform."
    >
      <StepList items={STEPS} />
    </ContentSection>
    <ContentSection title="Why it matters" tone="white">
      <FeatureGrid items={WHY} cols={2} />
    </ContentSection>
    <ContentSection title="Frequently asked questions">
      <FaqBlock items={FAQ} />
    </ContentSection>
    <ContentCta
      title="Post your job with confidence"
      intro="Matched with up to three verified, local, available trades. Free to post, no obligation."
      primary={{ label: "Post a Job — free", href: "/post-job-brief" }}
      secondary={{ label: "Check a quote first", href: "/quote-checker" }}
    />
  </AppShell>
);

export default HomeownerVerificationPage;
