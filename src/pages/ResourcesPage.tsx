import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  ContentSection,
  ContentCta,
} from "@/components/content/ContentBlocks";
import { EditorialStatement, ShowcaseHero } from "@/components/public/PublicBits";
import adviceHero from "@/assets/how-it-works/cta-plans.jpg";
import quoteDetail from "@/assets/how-it-works/compare-quotes.jpg";
import verificationDetail from "@/assets/how-it-works/get-verified.jpg";
import projectDetail from "@/assets/home/blueprint-lines.jpg";

/** Featured entry points — each maps to a real existing route. */
const FEATURED = [
  { tag: "Guides", title: "How to read a building quote", desc: "Spot what’s included, what’s missing and how to compare like for like.", href: "/compare-quotes", cta: "Read the guide" },
  { tag: "Explainers", title: "What to look for in a verified trade", desc: "Understand our 5-step checks and why they matter.", href: "/trade-verification", cta: "Read the explainer" },
  { tag: "Planning", title: "From idea to build", desc: "A step-by-step guide to planning a smoother project.", href: "/how-it-works", cta: "Read the guide" },
];


type Resource = {
  title: string;
  desc: string;
  href: string;
  tag: string;
  external?: boolean;
  image?: string;
};

const GUIDES: Resource[] = [
  { title: "How ProGrafter Works", desc: "Verification, contracts, staged payments and the Homeowner Manual — the whole journey explained.", href: "/how-it-works", tag: "Guide", image: projectDetail },
  { title: "AI Quote Checker", desc: "What it checks, how the score bands work, and how to read your results before committing to a builder.", href: "/ai-quote-checker", tag: "AI Tools", image: quoteDetail },
  { title: "Trade Verification Explained", desc: "The five checks every trade passes before they reach homeowners.", href: "/trade-verification", tag: "Trust", image: verificationDetail },
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
    <div className={`advice-resource-card flex h-full flex-col rounded-[4px] border border-border/60 border-t-2 border-t-teal/70 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-md ${r.image ? "advice-resource-card--visual" : "p-6"}`}>
      {r.image && <div className="advice-resource-card__image"><img src={r.image} alt="" loading="lazy" /></div>}
      <div className={r.image ? "flex flex-1 flex-col p-6" : "contents"}>
      <span className="mb-4 self-start border border-teal/25 bg-teal/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-teal">
        {r.tag}
      </span>
      <h3 className="font-heading text-navy text-xl leading-tight mb-2">{r.title}</h3>
      <p className="font-body text-sm text-body-text leading-relaxed flex-1">{r.desc}</p>
      <span className="font-mono text-xs text-teal mt-4">Read more →</span>
      </div>
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
    <ShowcaseHero
      label="Construction advice centre"
      lines={[{ text: "Know more." }, { text: "Build better.", teal: true }]}
      intro="Practical, honest guidance for homeowners and tradespeople — how to check a quote, understand verification, compare pricing, and make better construction decisions."
      image={adviceHero}
      imageAlt="Architectural drawings, a tape measure and pencils on a workbench"
      note={<>Better questions.<br />Better builds.</>}
      actions={
        <Button asChild variant="cta" size="lg">
          <Link to="#advice-guides">Explore the advice centre <ArrowRight /></Link>
        </Button>
      }
    />

    <section className="bg-deep px-6 pb-16 pt-4 craft:pb-20">
      <div className="mx-auto grid max-w-5xl gap-5 craft:grid-cols-3">
        {FEATURED.map((f) => (
          <Link key={f.title} to={f.href} className="group block border border-cream/12 bg-cream p-6 transition-transform hover:-translate-y-0.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-ink">{f.tag}</span>
            <h3 className="mt-3 font-body text-xl font-bold leading-tight text-navy">{f.title}</h3>
            <p className="mt-3 font-body text-sm leading-relaxed text-body-text">{f.desc}</p>
            <span className="mt-5 inline-flex items-center gap-2 font-mono text-xs text-teal-ink">{f.cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
        ))}
      </div>
    </section>

    <EditorialStatement
      lines={["Practical knowledge.", "Better builds."]}
      note="Plain guidance on drawings, costs, regulations and specifications."
    />

    <div className="advice-guides">
    <ContentSection title="Guides & tools">
      <div className="grid grid-cols-1 craft:grid-cols-3 gap-4 craft:gap-5">
        {GUIDES.map((r) => (
          <ResourceCard key={r.title} r={r} />
        ))}
      </div>
    </ContentSection>
    </div>
    <ContentCta
      title="Make your next project a good one"
      intro="Start with Project Cost Guide or check a builder's quote in minutes."
      primary={{ label: "Upload Your Quote", href: "/quote-checker" }}
      secondary={{ label: "Post a job — free", href: "/post-job-brief" }}
    />
  </AppShell>
);

export default ResourcesPage;

