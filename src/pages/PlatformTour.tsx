import { Link } from "react-router-dom";
import { ArrowRight, Camera, ClipboardCheck, FileText, Map, MessageSquareText, PackageCheck, WalletCards } from "lucide-react";
import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import QuoteComparisonDemo from "@/components/demos/QuoteComparisonDemo";
import VerificationExplainerInteractive from "@/components/demos/VerificationExplainerInteractive";
import { Button } from "@/components/ui/button";
import { DeviceFrame, EditorialStatement, HandNote, SectionLabel, ShowcaseHero } from "@/components/public/PublicBits";
import projectView from "@/assets/platform/homeowner-overview.png";
import tradeView from "@/assets/platform/trade-dashboard.png";
import homeownerQuotes from "@/assets/platform/homeowner-quotes.png";
import tradeJobs from "@/assets/platform/trade-jobs.png";
import tradeEarnings from "@/assets/platform/trade-earnings.png";
import homeownerManual from "@/assets/platform/homeowner-manual.png";
import tourHero from "@/assets/dashboard/hero-project.jpg";

const SHARED_STEPS = [
  { icon: ClipboardCheck, title: "Agree the plan", text: "A shared project record keeps the scope, programme and stages aligned." },
  { icon: Camera, title: "See real progress", text: "Dated site updates and photos show homeowners what is happening." },
  { icon: MessageSquareText, title: "Keep decisions together", text: "Messages, documents and variations stay connected to the job." },
  { icon: WalletCards, title: "Pay by stage", text: "Agreed milestones make progress and payment status easier to follow." },
];

const IN_THE_PROJECT = [
  { src: homeownerQuotes, label: "Homeowner · Quotes", alt: "Homeowner quotes view comparing submitted prices", caption: "Quotes side by side, with what each one actually includes." },
  { src: tradeJobs, label: "Trade · Work", alt: "Trade jobs view listing current work and actions", caption: "The trade sees today's jobs, actions and what needs answering." },
  { src: tradeEarnings, label: "Trade · Payments", alt: "Trade earnings view showing staged payments", caption: "Staged payments tracked against the agreed programme." },
  { src: homeownerManual, label: "Homeowner · Record", alt: "Homeowner manual showing project records and documents", caption: "Documents, evidence and decisions kept as a lasting record." },
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

    <ShowcaseHero
      label="Platform tour"
      lines={[
        { text: "One project." },
        { text: "Two sides." },
        { text: "One source", teal: true },
        { text: "of truth.", teal: true },
      ]}
      intro="The homeowner and trade work from the same project record, with the right information and actions suited to each role."
      image={tourHero}
      note={<>Real projects.<br />Real people.<br />One place.</>}
      actions={
        <>
          <Button asChild variant="cta" size="lg"><Link to="/quote-checker">Try the Quote Checker <ArrowRight /></Link></Button>
          <Button asChild variant="outline" size="lg" className="border-cream/30 bg-transparent text-cream hover:border-teal hover:bg-transparent hover:text-teal"><Link to="/how-it-works">Follow both journeys</Link></Button>
        </>
      }
    />


    <section className="platform-shared-record public-dark-surface bg-cream px-6 py-16 craft:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel tone="light">Live now</SectionLabel>
            <h2 className="mt-3 font-heading text-4xl uppercase text-navy">One project. Two useful views.</h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-secondary-text">The homeowner and trade work from the same project record, with information and actions suited to each role.</p>
        </div>
        <div className="platform-shared-record__views grid gap-8 craft:grid-cols-2">
          <div>
            <DeviceFrame
              src={projectView}
              label="Homeowner view"
              alt="Homeowner project overview showing progress, quotes and actions"
              mobileFocus="left"
              caption={<><strong className="text-navy">Homeowner view:</strong> progress, updates, decisions and payments.</>}
            />
            <HandNote className="mt-4">Homeowner view. Track progress, photos, decisions and payments.</HandNote>
            <ul className="mt-4 flex flex-wrap gap-2">
              {HOMEOWNER_MENU.map((item) => (
                <li key={item} className="border border-navy/15 bg-navy/[0.04] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-secondary-text">{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <DeviceFrame
              src={tradeView}
              label="Trade view"
              alt="Trade dashboard showing projects, tasks and earnings"
              mobileFocus="left"
              caption={<><strong className="text-navy">Trade view:</strong> today’s work, quoting and project delivery.</>}
            />
            <HandNote className="mt-4">Trade view. Today’s work, quoting and project delivery.</HandNote>
            <ul className="mt-4 flex flex-wrap gap-2">
              {TRADE_MENU.map((item) => (
                <li key={item} className="border border-navy/15 bg-navy/[0.04] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-secondary-text">{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="platform-shared-record__steps mt-8 grid gap-5 sm:grid-cols-2 craft:grid-cols-4">
          {SHARED_STEPS.map(({ icon: Icon, title, text }) => <article key={title} className="border-t-2 border-teal pt-4"><Icon className="h-5 w-5 text-teal" /><h3 className="mt-3 font-body text-base font-bold text-navy">{title}</h3><p className="mt-2 text-sm leading-relaxed text-secondary-text">{text}</p></article>)}
        </div>
      </div>
    </section>

    <EditorialStatement
      lines={["One project.", "Two sides.", "One truth."]}
      note="The same record, read from both ends of the job."
    />

    <section className="platform-evidence bg-cream px-6 py-16 craft:py-20">
      <div className="mx-auto max-w-5xl">
        <SectionLabel tone="light">Inside the project</SectionLabel>
        <h2 className="mt-3 max-w-2xl font-heading text-4xl uppercase text-navy">Quotes, work, payments and evidence.</h2>
        <div className="platform-evidence__grid mt-9 grid gap-5 craft:grid-cols-2">
          {IN_THE_PROJECT.map((item) => (
            <DeviceFrame key={item.label} src={item.src} alt={item.alt} label={item.label} caption={item.caption} mobileFocus="left" />
          ))}
        </div>
      </div>
    </section>

    <QuoteComparisonDemo />
    <VerificationExplainerInteractive />

    <section className="bg-deep px-6 py-16 craft:py-20">
      <div className="mx-auto max-w-5xl">
        <SectionLabel>Trade tools roadmap</SectionLabel>
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
