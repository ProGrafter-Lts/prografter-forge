import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  HardHat,
  Home,
  MessageSquareText,
  ShieldCheck,
  Star,
  UserCheck,
  Users,
  WalletCards,
} from "lucide-react";
import SEO from "@/components/SEO";
import HomeownerNav from "@/components/home/HomeownerNav";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { localBusinessJsonLd } from "@/lib/seoSchemas";
import heroImage from "@/assets/home/hero-blueprint-build.jpg";
import homeownerPlanning from "@/assets/how-it-works/homeowner-planning.jpg.asset.json";
import tradeProject from "@/assets/how-it-works/trade-project.jpg.asset.json";
import completedHome from "@/assets/how-it-works/completed-home.jpg.asset.json";
import ctaPlans from "@/assets/how-it-works/cta-plans.jpg.asset.json";
import homeownerQuotes from "@/assets/platform/homeowner-quotes.png";
import homeownerOverview from "@/assets/platform/homeowner-overview.png";
import homeownerManual from "@/assets/platform/homeowner-manual.png";
import quoteChecker from "@/assets/platform/quote-checker.png";
import tradeDashboard from "@/assets/platform/trade-dashboard.png";
import tradeEarnings from "@/assets/platform/trade-earnings.png";
import tradeJobs from "@/assets/platform/trade-jobs.png";

type JourneyStep = {
  num: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  note?: string;
};

const HOMEOWNER_STEPS: JourneyStep[] = [
  {
    num: "01",
    title: "Post your project",
    description: "Tell us what you’re planning — big or small. It’s free and takes just a few minutes.",
    image: homeownerPlanning.url,
    alt: "UK homeowners discussing extension plans with a ProGrafter trade",
    icon: FileText,
  },
  {
    num: "02",
    title: "Get matched",
    description: "We manually review your brief and match you with up to three vetted, insured trades.",
    image: tradeProject.url,
    alt: "Homeowner and verified trade reviewing an active UK extension",
    icon: Users,
    note: "Three, not thirty.",
  },
  {
    num: "03",
    title: "Compare quotes",
    description: "Receive structured quotes to compare like for like, or upload an existing quote to the Quote Checker.",
    image: homeownerQuotes,
    alt: "ProGrafter homeowner quote comparison screen",
    icon: ClipboardCheck,
  },
  {
    num: "04",
    title: "Manage your project",
    description: "Track progress with daily updates, photos and a clear programme. Communication stays in one place.",
    image: homeownerOverview,
    alt: "ProGrafter homeowner project overview",
    icon: MessageSquareText,
  },
  {
    num: "05",
    title: "Pay with confidence",
    description: "Fund work in agreed stages. You stay informed and approve each completed milestone before payment moves on.",
    image: tradeEarnings,
    alt: "ProGrafter stage payment overview",
    icon: WalletCards,
  },
  {
    num: "06",
    title: "Complete & beyond",
    description: "Receive certificates, photos, warranties and project records together in your Homeowner Manual.",
    image: homeownerManual,
    alt: "ProGrafter digital Homeowner Manual",
    icon: Home,
  },
];

const TRADE_STEPS: JourneyStep[] = [
  {
    num: "01",
    title: "Get verified",
    description: "Complete the five verification checks to join. Early qualifying members can access the current Founding Member offer.",
    image: tradeProject.url,
    alt: "Verified ProGrafter trade on a UK residential building project",
    icon: ShieldCheck,
  },
  {
    num: "02",
    title: "Find suitable work",
    description: "Receive relevant local opportunities matched to your skills and working area — without a crowded open marketplace.",
    image: tradeJobs,
    alt: "ProGrafter local work opportunities screen",
    icon: BriefcaseBusiness,
    note: "Three, not thirty.",
  },
  {
    num: "03",
    title: "Submit your quote",
    description: "Use the structured ProGrafter quote format so homeowners can understand and compare your offer fairly.",
    image: quoteChecker,
    alt: "Structured ProGrafter quote screen",
    icon: FileCheck2,
  },
  {
    num: "04",
    title: "Deliver the project",
    description: "Keep the site diary, messages, variations, photos and programme together around one project record.",
    image: tradeDashboard,
    alt: "ProGrafter trade project dashboard",
    icon: HardHat,
  },
  {
    num: "05",
    title: "Get paid",
    description: "Work to agreed stages, keep progress visible and request payment against the approved project schedule.",
    image: tradeEarnings,
    alt: "ProGrafter trade stage payment screen",
    icon: WalletCards,
  },
  {
    num: "06",
    title: "Build your reputation",
    description: "Receive honest project reviews and build a trusted ProGrafter record from completed work.",
    image: completedHome.url,
    alt: "Completed contemporary extension on a British home",
    icon: Star,
  },
];

const TRUST_CHECKS = [
  { icon: UserCheck, title: "Identity", description: "We verify who they are." },
  { icon: ShieldCheck, title: "Insurance", description: "We check they’re covered." },
  { icon: FileCheck2, title: "Qualifications", description: "We confirm their skills." },
  { icon: BriefcaseBusiness, title: "Business details", description: "We verify they’re genuine." },
  { icon: Star, title: "References & conduct", description: "We monitor their track record." },
];

const scrollToJourney = (id: "homeowner-journey" | "trade-journey") => {
  const target = document.getElementById(id);
  if (!target) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
};

const Journey = ({
  id,
  label,
  title,
  description,
  steps,
  tone,
}: {
  id: string;
  label: string;
  title: React.ReactNode;
  description: string;
  steps: JourneyStep[];
  tone: "homeowner" | "trade";
}) => (
  <section id={id} className={`hiw-journey hiw-journey--${tone}`}>
    <div className="hiw-container">
      <div className="hiw-section-heading">
        <div>
          <p className="hiw-eyebrow">{label}</p>
          <h2>{title}</h2>
        </div>
        <p>{description}</p>
      </div>

      <div className="hiw-journey-grid">
        {steps.map(({ num, title: stepTitle, description: stepDescription, image, alt, icon: Icon, note }) => (
          <article key={num} className="hiw-step">
            <div className="hiw-step-image">
              <img src={image} alt={alt} loading="lazy" width={1366} height={768} />
              <div className="hiw-step-image-shade" />
              <span className="hiw-step-number">{num}</span>
              <Icon className="hiw-step-icon" strokeWidth={1.5} />
            </div>
            <div className="hiw-step-copy">
              <h3>{stepTitle}</h3>
              <p>{stepDescription}</p>
              {note && <span className="hiw-step-note">{note}</span>}
            </div>
          </article>
        ))}
      </div>

      <div className="hiw-shared-truth" aria-label="One shared project principle">
        <span>One project record.</span>
        <span>Two views.</span>
        <strong>Same truth.</strong>
      </div>
    </div>
  </section>
);

const HowItWorksPage = () => {
  return (
    <div className="hiw-page">
      <SEO
        title="How ProGrafter Works | One Project, Two Views"
        description="See how UK homeowners and verified trades plan, quote, build and complete one shared project through ProGrafter."
        path="/how-it-works"
        jsonLd={localBusinessJsonLd}
      />
      <HomeownerNav />

      <main>
        <section className="hiw-hero">
          <div className="hiw-hero-image" aria-hidden="true">
            <img src={heroImage} alt="" width={1280} height={1024} />
          </div>
          <div className="hiw-hero-grid" aria-hidden="true" />
          <div className="hiw-container hiw-hero-inner">
            <div className="hiw-hero-copy">
              <p className="hiw-eyebrow">How it works</p>
              <h1>
                A clearer way
                <span>to build.</span>
              </h1>
              <p className="hiw-hero-intro">
                From first idea to final handover, ProGrafter keeps homeowners and trades aligned, informed and protected.
              </p>
              <div className="hiw-trust-points">
                <div><ShieldCheck /><span><strong>Verified trades</strong>Five checks. No exceptions.</span></div>
                <div><ClipboardCheck /><span><strong>Clear process</strong>No guesswork. No surprises.</span></div>
                <div><Home /><span><strong>Better builds</strong>Real people. Real progress.</span></div>
              </div>
            </div>
            <div className="hiw-hero-annotation">
              <span>Same plans.</span>
              <strong>Brighter outcomes.</strong>
            </div>
            <div className="hiw-hero-phases" aria-hidden="true">
              <span>Plan</span><span>Compare</span><span>Build</span><span>Complete</span>
            </div>
          </div>
        </section>

        <section className="hiw-selector" aria-label="Choose your journey">
          <div className="hiw-container hiw-selector-inner">
            <Button type="button" className="hiw-selector-button is-homeowner" onClick={() => scrollToJourney("homeowner-journey")}>
              <Home />
              <span><strong>I’m a Homeowner</strong><small>I want to build, renovate or improve</small></span>
              <ArrowRight />
            </Button>
            <Button type="button" className="hiw-selector-button is-trade" onClick={() => scrollToJourney("trade-journey")}>
              <HardHat />
              <span><strong>I’m a Trade</strong><small>I want to find and deliver work</small></span>
              <ArrowRight />
            </Button>
            <p className="hiw-selector-note">Two journeys.<br />One platform.</p>
          </div>
        </section>

        <Journey
          id="homeowner-journey"
          label="The homeowner journey"
          title={<>From idea to completion.<br /><span>All in one place.</span></>}
          description="ProGrafter gives homeowners the confidence to start their project, find the right trades and stay in control from day one."
          steps={HOMEOWNER_STEPS}
          tone="homeowner"
        />

        <Journey
          id="trade-journey"
          label="The trade journey"
          title={<>Real work.<br /><span>Serious customers.</span></>}
          description="ProGrafter connects trades with committed homeowners and gives them the tools to quote, deliver and get paid — without unnecessary admin."
          steps={TRADE_STEPS}
          tone="trade"
        />

        <section className="hiw-trust">
          <div className="hiw-container">
            <div className="hiw-section-heading">
              <div>
                <p className="hiw-eyebrow">The trust layer</p>
                <h2>Five checks.<br />Every trade.<br /><span>No exceptions.</span></h2>
              </div>
              <div className="hiw-trust-intro">
                <p>Every trade on ProGrafter is verified before they can work through the platform.</p>
                <Link to="/trust">Visit the Trust Centre <ArrowRight /></Link>
              </div>
            </div>
            <div className="hiw-checks-grid">
              {TRUST_CHECKS.map(({ icon: Icon, title, description }, index) => (
                <article key={title} className="hiw-check-card">
                  <span>0{index + 1}</span>
                  <Icon strokeWidth={1.4} />
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
            <p className="hiw-trust-note">Higher standards.<br />Better outcomes.</p>
          </div>
        </section>

        <section className="hiw-final-cta">
          <img src={ctaPlans.url} alt="Architectural plans, tools and ProGrafter site equipment on a UK construction project" loading="lazy" width={1600} height={700} />
          <div className="hiw-final-shade" />
          <div className="hiw-container hiw-final-inner">
            <div>
              <p className="hiw-eyebrow">Ready to get started?</p>
              <h2>Let’s build<br /><span>a better way.</span></h2>
              <p>Whether you’re a homeowner planning a project or a trade looking for quality work, ProGrafter gives you the tools, trust and support to make it happen.</p>
              <div className="hiw-final-actions">
                <Button asChild size="lg" className="hiw-primary-cta">
                  <Link to="/post-job-brief">Post a project <ArrowRight /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="hiw-secondary-cta">
                  <Link to="/signup/trade">Join as a trade <ArrowRight /></Link>
                </Button>
              </div>
            </div>
            <p className="hiw-final-note">Proper projects.<br />Proper grafters.<br /><strong>A brighter future.</strong></p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorksPage;