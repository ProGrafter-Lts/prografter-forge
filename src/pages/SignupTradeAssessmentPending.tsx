import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import Logo from "@/components/Logo";

const SignupTradeAssessmentPending = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(var(--deep))" }}>
      <SEO
        title="Your experience is being assessed — ProGrafter"
        description="ProGrafter is reviewing your time-served trade application."
        path="/signup/trade/assessment-pending"
        noindex
      />
      <header className="py-6 px-6">
        <Logo variant="light" className="h-9 w-auto inline-block" />
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-xl">
          <p className="font-mono text-xs text-teal uppercase tracking-widest mb-3">
            Time-served assessment
          </p>
          <h1 className="font-heading text-cream text-[40px] leading-[1.05] mb-5">
            Thanks — your <span className="text-teal">experience is being assessed.</span>
          </h1>
          <p className="font-body text-cream/75 text-base mb-6 leading-relaxed">
            You've chosen the time-served route. That means we don't rely on a single
            certificate — we look at the whole picture. Here's what happens next:
          </p>

          <ol className="space-y-4 mb-8">
            {[
              "We'll phone the references you gave us.",
              "We may arrange a short visit to see a current or recent job.",
              "We'll have a short conversation about your trade and how you work.",
            ].map((line, i) => (
              <li key={i} className="flex items-start gap-3 p-4 rounded-xl border border-cream/10 bg-cream/5">
                <span className="flex-none w-8 h-8 rounded-full bg-teal/15 text-teal font-mono text-sm flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="font-body text-cream/85 text-sm leading-relaxed pt-1">
                  {line}
                </p>
              </li>
            ))}
          </ol>

          <div className="rounded-xl border border-teal/30 bg-teal/10 p-4 mb-6">
            <p className="font-mono text-xs text-teal uppercase tracking-widest mb-1">Typical time</p>
            <p className="font-body text-cream text-sm">
              3–7 working days. You can log in and browse jobs in your area — but you can't
              quote until your assessment is complete.
            </p>
          </div>

          <p className="font-body text-cream/65 text-sm mb-8">
            We'll email you the moment you're approved. If we need anything else from you,
            we'll be in touch on the phone or email you signed up with.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard/trade"
              className="bg-teal text-cream font-mono text-sm px-5 py-3 rounded-xl hover:bg-teal-hover transition-colors"
            >
              Go to my dashboard
            </Link>
            <Link
              to="/"
              className="border border-cream/20 text-cream/80 font-mono text-sm px-5 py-3 rounded-xl hover:bg-cream/5 transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupTradeAssessmentPending;
