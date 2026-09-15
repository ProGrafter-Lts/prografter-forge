import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import {
  ContentHero,
  ContentSection,
  ContentCta,
} from "@/components/content/ContentBlocks";
import { EditorialStatement } from "@/components/public/PublicBits";

type Resource = {
  title: string;
  desc: string;
  href: string;
  tag: string;
  external?: boolean;
};

const GUIDES: Resource[] = [
  { title: "How ProGrafter Works", desc: "Verification, contracts, staged payments and the Homeowner Manual — the whole journey explained.", href: "/how-it-works", tag: "Guide" },
  { title: "AI Quote Checker", desc: "What it checks, how the score bands work, and how to read your results before committing to a builder.", href: "/ai-quote-checker", tag: "AI Tools" },
  { title: "Trade Verification Explained", desc: "The five checks every trade passes before they reach homeowners.", href: "/trade-verification", tag: "Trust" },
  { title: "Homeowner Verification", desc: "Why we verify homeowners and manually review every brief.", href: "/homeowner-verification", tag: "Trust" },
  { title: "Pricing & Commission", desc: "Exactly what ProGrafter costs — and why there are no monthly or lead fees.", href: "/pricing", tag: "Pricing" },
  { title: "Is Checkatrade Worth It?", desc: "An honest look at lead-based platforms and how a commission-only model compares.", href: "/is-checkatrade-worth-it", tag: "Comparison" },
  { title: "A Better Checkatrade Alternative", desc: "Why verified, commission-only matching beats paying per lead.", href: "/checkatrade-alternative", tag: "Comparison" },
  { title: "Green Grants & Funding", desc: "Find funding for energy-efficiency upgrades and green home improvements.", href: "/green", tag: "Green" },
  { title: "Planning Alerts", desc: "How local planning applications become genuine opportunities for trades.", href: "/planning-alerts", tag: "Trades" },
  { title: "Frequently Asked Questions", desc: "Quick answers for homeowners and tradespeople.", href: "/faq", tag: "Help" },
];

const ResourceCard = ({ r }: { r: Resource }) => {
  const inner = (
    <div className="flex h-full flex-col rounded-[4px] border border-border/60 border-t-2 border-t-teal/70 bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-md">
      <span className="mb-4 self-start border border-teal/25 bg-teal/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-teal">
        {r.tag}
      </span>
      <h3 className="font-heading text-navy text-xl leading-tight mb-2">{r.title}</h3>
      <p className="font-body text-sm text-body-text leading-relaxed flex-1">{r.desc}</p>
      <span className="font-mono text-xs text-teal mt-4">Read more →</span>
    </div>
  );
  return (
    <Link to={r.href} className="h-full block">
      {inner}
    </Link>
  );
};

const ResourcesPage = () => (
  <AppShell>
    <SEO
      title="Construction Advice Centre & Resources | ProGrafter"
      description="Guides for UK homeowners and tradespeople: how verification works, checking builders' quotes, understanding pricing, finding green grants and winning genuine work."
      path="/resources"
    />
    <ContentHero
      eyebrow="Construction Advice Centre"
      title="Build with"
      highlight="confidence."
      intro="Practical, honest guidance for homeowners and tradespeople — how to check a quote, understand verification, compare pricing, and make better construction decisions."
      ghost="LEARN"
      tone="light"
      primaryCta={{ label: "Upload a quote", href: "/quote-checker" }}
      secondaryCta={{ label: "Read the FAQ", href: "/faq" }}
    />
    <EditorialStatement
      lines={["Know more.", "Build better."]}
      note="Plain guidance on drawings, costs, regulations and specifications."
      tone="light"
    />
    <ContentSection title="Guides & tools">
      <div className="grid grid-cols-1 craft:grid-cols-3 gap-4 craft:gap-5">
        {GUIDES.map((r) => (
          <ResourceCard key={r.title} r={r} />
        ))}
      </div>
    </ContentSection>
    <ContentCta
      title="Make your next project a good one"
      intro="Start with Project Cost Guide or check a builder's quote in minutes."
      primary={{ label: "Upload Your Quote", href: "/quote-checker" }}
      secondary={{ label: "Post a job — free", href: "/post-job-brief" }}
    />
  </AppShell>
);

export default ResourcesPage;

