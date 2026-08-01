import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Card = {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  cta: string;
  route?: string;
  disabled?: boolean;
};

const CARDS: Card[] = [
  {
    badge: "FREE",
    title: "Plan My Project",
    subtitle: "Planning a project but don’t have a quote yet?",
    description:
      "Describe the work you’re considering and get early guidance on likely cost ranges, key cost drivers, common missing items and questions to ask before inviting builders.",
    bullets: [
      "Early budget guidance",
      "Low / mid / high cost range",
      "Common missing items",
      "Questions to ask before getting quotes",
      "Helps you prepare a clearer brief",
    ],
    cta: "Start Plan My Project",
    route: "/plan-my-project",
  },
  {
    badge: "£49",
    title: "Quote Checker",
    subtitle: "Already got a builder’s quote?",
    description:
      "Upload your quote and ProGrafter will check what’s included, what’s unclear, what may be missing, and what questions to ask before you commit.",
    bullets: [
      "Quote Quality Score",
      "Scope, exclusions and risk review",
      "Included / unclear / missing items",
      "Questions to ask the builder",
      "Downloadable report",
    ],
    cta: "Upload Quote — £49",
    route: "/quote-checker",
  },
  {
    badge: "COMING SOON",
    title: "Quote Comparison",
    subtitle: "Got more than one quote?",
    description:
      "Upload multiple quotes and compare them side by side — not just on price, but on scope, clarity, exclusions, risk and value.",
    bullets: [
      "Side-by-side quote comparison",
      "Scope differences highlighted",
      "Price gaps explained",
      "Missing items exposed",
      "Helps avoid false cheap quotes",
    ],
    cta: "Coming Soon",
    disabled: true,
  },
  {
    badge: "FUTURE MODULE",
    title: "Project Confidence Report",
    subtitle: "Quote, drawings and project risks reviewed together.",
    description:
      "A deeper project review combining quotes, drawings, planning status, Building Control, structural risks, scope gaps and key project decisions.",
    bullets: [
      "Quote + drawing review",
      "Planning and Building Control prompts",
      "Project risk overview",
      "Scope confidence",
      "Next-step guidance",
    ],
    cta: "Future Module",
    disabled: true,
  },
];

const JOURNEY = [
  { step: "Have an idea", detail: "Use Plan My Project." },
  { step: "Get builder quotes", detail: "Use the Quote Checker." },
  { step: "Compare options", detail: "Use Quote Comparison when available." },
  { step: "Choose with confidence", detail: "Use matched ProGrafter trades and the future Project Hub." },
  { step: "Build with accountability", detail: "Track documents, payments, certificates and completion." },
];

const ProductCard = ({ card }: { card: Card }) => {
  const inner = (
    <div
      className={`h-full flex flex-col rounded-2xl border p-6 transition-all ${
        card.disabled
          ? "border-border bg-muted/40 opacity-70"
          : "border-border bg-card hover:border-teal hover:shadow-xl hover:shadow-teal/10"
      }`}
    >
      <span
        className={`self-start font-mono text-[11px] tracking-wider px-3 py-1 rounded-full mb-4 ${
          card.disabled
            ? "bg-muted text-muted-foreground border border-border"
            : card.badge === "FREE"
            ? "bg-teal/15 text-teal border border-teal/30"
            : "bg-navy text-cream"
        }`}
      >
        {card.badge}
      </span>
      <h3 className="font-heading text-2xl text-navy tracking-wide">{card.title}</h3>
      <p className="font-mono text-xs text-teal mt-1 mb-3">{card.subtitle}</p>
      <p className="text-sm text-body-text leading-relaxed mb-4">{card.description}</p>
      <ul className="space-y-2 mb-6 flex-1">
        {card.bullets.map((b) => (
          <li key={b} className="flex gap-2 text-sm text-body-text">
            <span className="text-teal flex-shrink-0">•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div
        className={`w-full text-center font-mono text-sm px-5 py-2.5 rounded-xl ${
          card.disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-teal text-cream hover:bg-teal-hover transition-colors"
        }`}
      >
        {card.cta}
      </div>
    </div>
  );

  if (card.disabled || !card.route) {
    return <div aria-disabled className="h-full">{inner}</div>;
  }
  return (
    <Link to={card.route} className="h-full block">
      {inner}
    </Link>
  );
};

const ProGrafterIntelligence = () => {
  return (
    <div className="min-h-screen bg-cream">
      <SEO
        title="ProGrafter Intelligence™ — Cost Guidance & Quote Checking Tools"
        description="Choose the right tool for where you are in your project — free early cost guidance or a paid Quote Health Check on a builder’s quote."
        path="/prografter-intelligence"
      />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy bg-gradient-to-br from-navy via-navy to-[hsl(var(--teal)/0.4)] pt-28 pb-20 px-6">
        <div className="pointer-events-none absolute -top-20 -right-16 h-72 w-72 rounded-full bg-teal/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-teal/20 blur-3xl" />
        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block font-mono text-[11px] tracking-widest text-teal-foreground bg-white/10 border border-white/20 px-3 py-1.5 rounded-full mb-5">
            PROGRAFTER INTELLIGENCE™
          </span>
          <h1 className="font-heading text-4xl md:text-6xl text-white mb-5 leading-[1.05]">
            Choose the right tool for where you are in the project.
          </h1>
          <p className="text-white/75 text-base max-w-xl mx-auto leading-relaxed">
            Whether you’re planning a project, checking a builder’s quote, or preparing to compare
            trades, ProGrafter Intelligence helps you understand the costs, risks and questions
            before you commit.
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="px-6 -mt-10 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {CARDS.map((c) => (
            <ProductCard key={c.title} card={c} />
          ))}
        </div>
      </section>

      {/* Journey */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl text-navy tracking-wide text-center mb-12">
            Where ProGrafter fits into your project
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {JOURNEY.map((j, i) => (
              <div key={j.step} className="rounded-2xl border border-border bg-card p-5 text-center">
                <div className="mx-auto mb-3 h-9 w-9 rounded-full bg-teal text-cream font-mono text-sm flex items-center justify-center">
                  {i + 1}
                </div>
                <p className="font-heading text-lg text-navy tracking-wide">{j.step}</p>
                <p className="text-xs text-body-text mt-2 leading-relaxed">{j.detail}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-secondary-text max-w-2xl mx-auto mt-10 leading-relaxed">
            ProGrafter is not just a quote tool. It is being built to support the full journey from
            idea to completion — helping homeowners make clearer decisions and helping good trades
            win work fairly.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProGrafterIntelligence;
