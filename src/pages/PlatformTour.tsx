import { Link } from "react-router-dom";
import { ArrowRight, Camera, ClipboardCheck, FileText, Map, MessageSquareText, PackageCheck, WalletCards } from "lucide-react";
import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import QuoteComparisonDemo from "@/components/demos/QuoteComparisonDemo";
import VerificationExplainerInteractive from "@/components/demos/VerificationExplainerInteractive";
import { Button } from "@/components/ui/button";
import projectView from "@/assets/platform/homeowner-overview.png";
import tradeView from "@/assets/platform/trade-dashboard.png";

const SHARED_STEPS = [
  { icon: ClipboardCheck, title: "Agree the plan", text: "A shared project record keeps the scope, programme and stages aligned." },
  { icon: Camera, title: "See real progress", text: "Dated site updates and photos show homeowners what is happening." },
  { icon: MessageSquareText, title: "Keep decisions together", text: "Messages, documents and variations stay connected to the job." },
  { icon: WalletCards, title: "Pay by stage", text: "Agreed milestones make progress and payment status easier to follow." },
];

const ROADMAP = [
  { icon: Map, status: "In active development", title: "SiteScout", text: "A structured inside-and-out site inspection capturing access, nearby trees, ground observations, services and regulatory prompts. It produces a site map and structured ground truth for quoting." },
  { icon: FileText, status: "In active development", title: "Site-informed quoting", text: "Quote preparation built from SiteScout observations, drawings and measured project information rather than disconnected notes." },
  { icon: PackageCheck, status: "Planned", title: "One trade operating system", text: "Procurement, project management, homeowner communication, variations, invoices and end-of-job cost and time review — helping trades learn from actual versus quoted labour and materials." },
];

const PlatformTour = () => (
  <AppShell>
    <SEO
      title="Platform Tour — See ProGrafter in Action"
      description="Explore ProGrafter's live quote, verification and project tools, plus a clearly labelled view of what is in active development."
      path="/platform-tour"
    />

    <section className="public-blueprint bg-deep px-6 pb-20 pt-32">
      <div className="mx-auto max-w-5xl">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.28em] text-teal">Platform tour</p>
        <h1 className="type-h1 max-w-4xl text-cream">
          See how the work stays clear.
        </h1>
        <p className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-cream/80">
          Explore the live homeowner tools and the shared project experience, then see what we are building next for trades.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="cta" size="lg"><Link to="/quote-checker">Try the Quote Checker <ArrowRight /></Link></Button>
          <Button asChild variant="outline" size="lg" className="border-cream/30 bg-transparent text-cream hover:border-teal hover:bg-transparent hover:text-teal"><Link to="/how-it-works">Follow both journeys</Link></Button>
        </div>
      </div>
    </section>

    <section className="bg-cream px-6 py-16 craft:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div><p className="font-mono text-[11px] uppercase tracking-[0.22em] text-teal">Live now</p><h2 className="mt-2 font-heading text-4xl uppercase text-navy">One project. Two useful views.</h2></div>
          <p className="max-w-md text-sm leading-relaxed text-secondary-text">The homeowner and trade work from the same project record, with information and actions suited to each role.</p>
        </div>
        <div className="grid gap-5 craft:grid-cols-2">
          <figure className="overflow-hidden rounded-lg border border-border bg-white shadow-sm"><img src={projectView} alt="Homeowner project overview showing progress, quotes and actions" className="w-full" /><figcaption className="p-4 text-sm text-secondary-text"><strong className="text-navy">Homeowner view:</strong> progress, updates, decisions and payments.</figcaption></figure>
          <figure className="overflow-hidden rounded-lg border border-border bg-white shadow-sm"><img src={tradeView} alt="Trade dashboard showing projects, tasks and earnings" className="w-full" /><figcaption className="p-4 text-sm text-secondary-text"><strong className="text-navy">Trade view:</strong> today’s work, quoting and project delivery.</figcaption></figure>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 craft:grid-cols-4">
          {SHARED_STEPS.map(({ icon: Icon, title, text }) => <article key={title} className="border-t-2 border-teal pt-4"><Icon className="h-5 w-5 text-teal" /><h3 className="mt-3 font-body text-base font-bold text-navy">{title}</h3><p className="mt-2 text-sm leading-relaxed text-secondary-text">{text}</p></article>)}
        </div>
      </div>
    </section>

    <QuoteComparisonDemo />
    <VerificationExplainerInteractive />

    <section className="bg-deep px-6 py-16 craft:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-teal">Trade tools roadmap</p>
        <h2 className="type-h2 mt-3 max-w-3xl text-cream">From site visit to a smarter next quote.</h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-cream/80">This is the direction of travel, not a claim that every tool is publicly available today.</p>
        <div className="mt-10 grid gap-5 craft:grid-cols-3">
          {ROADMAP.map(({ icon: Icon, status, title, text }) => <article key={title} className="rounded-lg border border-cream/10 bg-cream/[0.04] p-6"><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-teal">{status}</span><Icon className="mt-6 h-7 w-7 text-teal" /><h3 className="mt-4 font-body text-xl font-bold text-cream">{title}</h3><p className="mt-3 text-sm leading-relaxed text-cream/75">{text}</p></article>)}
        </div>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="cta" size="lg"><Link to="/signup/trade">Join as a trade <ArrowRight /></Link></Button>
          <Button asChild variant="outline" size="lg" className="border-cream/30 bg-transparent text-cream hover:border-teal hover:bg-transparent hover:text-teal"><Link to="/pricing">See transparent pricing</Link></Button>
        </div>
      </div>
    </section>
  </AppShell>
);

export default PlatformTour;