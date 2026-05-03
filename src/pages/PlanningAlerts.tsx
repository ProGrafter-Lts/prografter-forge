import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PlanningAlerts = () => {
  return (
    <div className="min-h-screen bg-cream">
      <SEO
        title="Planning Intelligence Alerts — Coming Soon | ProGrafter"
        description="ProGrafter is connecting to UK Local Authority planning data feeds. Verified trades will be the first to know about approved projects in their area."
        path="/planning-alerts"
      />
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-24">
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-teal/10 border border-teal/30">
          <span className="font-mono text-[11px] text-deep uppercase tracking-wider">Coming Soon</span>
        </div>
        <h1 className="font-heading text-deep text-4xl md:text-5xl mb-5 leading-tight">
          Planning Intelligence Alerts — Coming Soon
        </h1>
        <p className="font-body text-body-text text-lg mb-10">
          We're connecting to UK Local Authority planning data feeds. Verified trades will be the first to know when projects matching their trade get planning approval in their service area.
        </p>

        <ul className="space-y-3 mb-10 font-mono text-sm text-body-text">
          <li className="flex gap-3"><span className="text-teal">→</span> EWI installers alerted the moment a solid-wall insulation application is approved nearby.</li>
          <li className="flex gap-3"><span className="text-teal">→</span> EV charger installers notified about approved driveway and off-street parking changes.</li>
          <li className="flex gap-3"><span className="text-teal">→</span> Builders and extension specialists matched to approved full-house extensions and rear-extension applications.</li>
        </ul>

        <a
          href="/register/trade"
          className="inline-flex items-center justify-center bg-teal text-cream font-mono text-sm px-6 py-3.5 rounded-xl hover:bg-teal-hover transition-colors"
        >
          Be ready — register as a trade now →
        </a>

        <p className="mt-8 font-mono text-xs text-secondary-text">
          Initial coverage: Nottinghamshire, expanding.
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default PlanningAlerts;
