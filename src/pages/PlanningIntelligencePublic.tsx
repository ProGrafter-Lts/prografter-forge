import { Link } from "react-router-dom";
import { ArrowRight, Bell, FileSearch, MapPin, Radar, ShieldCheck } from "lucide-react";
import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import { SectionLabel } from "@/components/public/PublicBits";
import { useTradeAccess } from "@/hooks/useTradeAccess";

const WHAT_IT_DOES = [
  {
    icon: Radar,
    title: "Approved applications, nightly",
    text: "Planning decisions published by local authorities in the covered East Midlands areas, collected and listed as they are validated.",
  },
  {
    icon: MapPin,
    title: "Filtered to your patch",
    text: "Work through applications by authority, project type and location instead of reading planning portals one by one.",
  },
  {
    icon: FileSearch,
    title: "Context before you call",
    text: "Application reference, description and a link to the council record, so you can judge whether a project is worth approaching.",
  },
  {
    icon: Bell,
    title: "Your own pipeline",
    text: "Save applications, record status and keep notes against the ones you are following up.",
  },
];

/**
 * PUBLIC explanation of Planning Intelligence.
 *
 * Public pages never drop a visitor into the operational application. Opening
 * the tool is always an explicit action, even when a valid session exists.
 */
const PlanningIntelligencePublic = () => {
  const { trade, loading } = useTradeAccess();
  const canOpenApp = !loading && !!trade;

  return (
    <AppShell>
      <SEO
        title="Planning Alerts — Planning Intelligence for Trades | ProGrafter"
        description="See how ProGrafter Planning Intelligence lists approved local planning applications so verified trades can approach the right projects earlier."
        path="/planning-intelligence"
      />

      <section className="bg-deep px-6 pt-32 pb-16 craft:pt-36">
        <div className="mx-auto max-w-5xl">
          <SectionLabel>Planning Intelligence</SectionLabel>
          <h1 className="mt-4 font-heading text-[42px] uppercase leading-[0.95] text-cream craft:text-[68px]">
            Approved planning.
            <br />
            Before the calls start.
          </h1>
          <p className="mt-6 max-w-2xl font-body text-base leading-relaxed text-cream/80 craft:text-lg">
            Planning Intelligence is a tool inside the ProGrafter trade account. It lists approved
            planning applications from covered local authorities so you can see genuine upcoming
            work in your area and decide who is worth approaching.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/signup/trade"
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-teal px-7 py-4 font-body text-sm font-semibold uppercase tracking-wide text-cream shadow-lg shadow-teal/30 transition-all hover:-translate-y-0.5 hover:bg-teal-hover"
            >
              Join free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-3 rounded-xl border border-cream/30 bg-navy/40 px-7 py-4 font-body text-sm font-semibold uppercase tracking-wide text-cream backdrop-blur-sm transition-colors hover:border-teal hover:text-teal"
            >
              Log in to Planning Intelligence
            </Link>
            {canOpenApp && (
              <Link
                to="/planning-alerts"
                className="inline-flex items-center justify-center gap-3 rounded-xl border border-teal/60 bg-teal/10 px-7 py-4 font-body text-sm font-semibold uppercase tracking-wide text-teal transition-colors hover:bg-teal/20"
              >
                Open Planning Intelligence
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-cream/55">
            Covered authorities · South Derbyshire · Nottingham City · Broxtowe · Rushcliffe ·
            Amber Valley · Erewash · North West Leicestershire
          </p>
        </div>
      </section>

      <section className="bg-cream px-6 py-16 craft:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionLabel tone="light">What it does</SectionLabel>
          <h2 className="mt-3 max-w-2xl font-heading text-4xl uppercase text-navy">
            Public planning records, made workable.
          </h2>
          <div className="mt-9 grid gap-6 sm:grid-cols-2">
            {WHAT_IT_DOES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="border-t-2 border-teal pt-4">
                <Icon className="h-5 w-5 text-teal" strokeWidth={1.5} />
                <h3 className="mt-3 font-body text-base font-bold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary-text">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-deep px-6 py-16 craft:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionLabel>Access</SectionLabel>
          <h2 className="mt-3 max-w-3xl font-heading text-4xl uppercase text-cream">
            Verified trades only.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-cream/80">
            Planning Intelligence sits behind the trade account. Applications are reviewed before
            approval, and any outreach you send is recorded against your account.
          </p>
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-cream/10 bg-cream/[0.04] p-6">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal" strokeWidth={1.5} />
            <p className="font-body text-sm leading-relaxed text-cream/75">
              Only published planning information is shown. No homeowner account details are
              exposed here, and nothing is sent on your behalf without your action.
            </p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/signup/trade"
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-teal px-7 py-4 font-body text-sm font-semibold uppercase tracking-wide text-cream transition-all hover:-translate-y-0.5 hover:bg-teal-hover"
            >
              Apply to join ProGrafter
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/platform-tour"
              className="inline-flex items-center justify-center gap-3 rounded-xl border border-cream/30 bg-transparent px-7 py-4 font-body text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:border-teal hover:text-teal"
            >
              Explore the tools
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default PlanningIntelligencePublic;
