import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";

const lastUpdated = "21 April 2026";

const Privacy = () => {
  return (
    <AppShell>
      <SEO
        title="Privacy Policy — ProGrafter"
        description="How ProGrafter Ltd collects, stores and uses your data. Last updated April 2026."
        path="/privacy"
      />
      <main className="px-6 pt-28 pb-16">
        <section className="mx-auto max-w-4xl rounded-2xl border border-navy/10 bg-white p-6 shadow-sm craft:p-10">
          <div className="mb-8 border-b border-navy/10 pb-6">
            <p className="font-mono text-xs uppercase tracking-widest text-teal">Version 0.1</p>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-secondary-text">Last updated: {lastUpdated}</p>
            <h1 className="mt-4 font-heading text-5xl leading-none text-navy craft:text-6xl">Privacy Policy</h1>
          </div>

          <div className="space-y-8 font-body text-base leading-8 text-body-text">
            <p>
              ProGrafter Ltd is the data controller for personal data collected via the Platform. We process data under UK GDPR.
            </p>

            <section>
              <h2 className="mb-3 font-heading text-3xl leading-none text-navy">Data we collect</h2>
              <p>
                Name, contact details, address, payment information, ID verification documents, qualification and insurance certificates, project details, messages between users, platform usage data.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-3xl leading-none text-navy">How we use it</h2>
              <p>
                To operate the Platform, verify Tradespeople, facilitate payments, match Projects with suitable Tradespeople, comply with legal obligations.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-3xl leading-none text-navy">Sharing</h2>
              <p>
                Homeowner and Tradesperson details are shared with each other where necessary to complete a Project. Payment data is processed by Stripe. We do not sell personal data.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-3xl leading-none text-navy">Your rights</h2>
              <p>
                Access, rectification, erasure, portability, objection. Contact: <a href="mailto:privacy@prografter.co.uk" className="text-teal underline-offset-4 hover:underline">privacy@prografter.co.uk</a>
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-3xl leading-none text-navy">Retention</h2>
              <p>
                We retain data for as long as your account is active plus 7 years for tax and legal compliance.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-3xl leading-none text-navy">Cookies</h2>
              <p>
                We use essential cookies to operate the Platform and analytics cookies with your consent.
              </p>
            </section>

            <hr className="border-navy/10" />

            <p className="text-sm italic text-secondary-text">
              This is Version 0.1. A full Privacy Policy drafted by qualified legal counsel will replace this document.
            </p>
          </div>
        </section>
      </main>
    </AppShell>
  );
};

export default Privacy;
