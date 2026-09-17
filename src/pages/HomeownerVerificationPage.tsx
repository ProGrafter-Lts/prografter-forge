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
  { title: "Contact details recorded", desc: "A name, email, mobile number and project address are required with each brief." },
  { title: "Project details collected", desc: "Each job brief records the proposed work and property details so trades can assess the opportunity." },
  { title: "Manual brief review", desc: "A human checks each brief for clarity and completeness before it reaches trades — better matches, fewer wasted quotes." },
  { title: "Two-way accountability", desc: "Homeowners are reviewed by trades too, keeping conduct fair and respectful on both sides." },
];

const WHY = [
  { title: "Structured enquiries", desc: "Trades receive reviewed briefs with contact and project details, rather than an anonymous listing.", icon: "◎" },
  { title: "Better matches", desc: "Manually reviewed briefs mean the right trades are invited to the right jobs.", icon: "◆" },
  { title: "Fair on both sides", desc: "Two-way reviews hold homeowners to the same standard of respect and reliability as trades.", icon: "⇄" },
  { title: "Fewer, better quotes", desc: "Up to three matched trades — not thirty — so you compare on merit, not just price.", icon: "❏" },
];

const FAQ = [
  { q: "What does ProGrafter collect from homeowners?", a: "Each brief requires contact details, a project address and information about the proposed work. The team reviews the brief before releasing it to trades." },
  { q: "Does ProGrafter verify a homeowner's identity?", a: "No formal identity-document check is part of the current homeowner brief. We create an account from the submitted details and keep the brief under review before it is released." },
  { q: "Does it cost anything to post a job?", a: "No. Posting a job on ProGrafter is completely free for homeowners. You only ever deal with verified, insured trades." },
  { q: "How many quotes will I receive?", a: "You're matched with up to three vetted, local, available trades — not thirty — so you can choose on the quality of the work, not just the lowest price." },
];

const HomeownerVerificationPage = () => (
  <AppShell>
    <SEO
      title="Homeowner Project Checks — Reviewed Briefs | ProGrafter"
      description="ProGrafter records homeowner contact and project details, then manually reviews each brief before releasing it to suitable trades."
      path="/homeowner-verification"
      jsonLd={buildFaqJsonLd(FAQ)}
    />
    <ContentHero
      eyebrow="Homeowner Project Checks"
      title="Clear details."
      highlight="Reviewed briefs."
      intro="Trust runs both ways. We collect contact and project details, then review each brief before suitable trades are invited where coverage allows."
      ghost="HOME"
      primaryCta={{ label: "Post a job — free", href: "/post-job-brief" }}
      secondaryCta={{ label: "How it works", href: "/how-it-works" }}
    />
    <ContentSection
      title="How homeowner project checks work"
      intro="A clear record and human review before a brief reaches trades."
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
