import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";

const lastUpdated = "21 April 2026";

const Terms = () => {
  return (
    <AppShell>
      <SEO
        title="Terms of Service — ProGrafter"
        description="ProGrafter Ltd terms of use for tradespeople and homeowners."
        path="/terms"
      />
      <main className="px-6 pt-28 pb-16">
        <section className="mx-auto max-w-4xl rounded-2xl border border-navy/10 bg-white p-6 shadow-sm craft:p-10">
          <div className="mb-8 border-b border-navy/10 pb-6">
            <p className="font-mono text-xs uppercase tracking-widest text-teal">Version 0.1</p>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-secondary-text">Last updated: {lastUpdated}</p>
            <h1 className="mt-4 font-heading text-5xl leading-none text-navy craft:text-6xl">Terms of Service</h1>
          </div>

          <div className="space-y-8 font-body text-base leading-8 text-body-text">
            <p>
              These Terms of Service govern your use of ProGrafter Ltd ("ProGrafter", "we", "us", "our"), a trades marketplace platform operated by ProGrafter Ltd, a company registered in England and Wales.
            </p>

            <section>
              <h2 className="mb-3 font-heading text-3xl leading-none text-navy">1. Definitions</h2>
              <ul className="space-y-3 pl-5 marker:text-teal list-disc">
                <li>"Homeowner" means a user who posts projects seeking trades services.</li>
                <li>"Tradesperson" means a verified professional offering trades services.</li>
                <li>"Platform" means the ProGrafter website, mobile applications, and associated services.</li>
                <li>"Project" means a job posted by a Homeowner.</li>
                <li>"Quote" means a priced proposal submitted by a Tradesperson.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-3xl leading-none text-navy">2. Accounts and Eligibility</h2>
              <p>
                You must be 18 or over and legally able to enter contracts. Tradespeople must hold all qualifications, insurances, and competent person scheme registrations required for the work they offer.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-3xl leading-none text-navy">3. Fees</h2>
              <p>
                ProGrafter charges Tradespeople a commission of 7.5% on successful project completion, capped at £900 per project. Homeowners use the Platform free of charge.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-3xl leading-none text-navy">4. Payments</h2>
              <p>
                Payments are processed via Stripe Connect. Funds are held and released according to agreed project milestones.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-3xl leading-none text-navy">5. Verification</h2>
              <p>
                ProGrafter verifies Tradesperson credentials including insurance, qualifications, and competent person scheme membership. Verification is ongoing and may be revoked.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-3xl leading-none text-navy">6. Conduct</h2>
              <p>
                Users agree not to attempt off-platform circumvention of fees, to communicate professionally, and to complete work to applicable UK standards including Building Regulations and BS7671 where relevant.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-3xl leading-none text-navy">7. Liability</h2>
              <p>
                ProGrafter is a platform that connects Homeowners and Tradespeople. Contracts for work are formed directly between Homeowner and Tradesperson. ProGrafter's liability is limited to the commission paid.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-3xl leading-none text-navy">8. Termination</h2>
              <p>
                Either party may terminate an account with notice. ProGrafter reserves the right to terminate accounts for breach of these terms.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-3xl leading-none text-navy">9. Data Protection</h2>
              <p>
                See our <a href="/privacy" className="text-teal underline-offset-4 hover:underline">Privacy Policy</a>.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-3xl leading-none text-navy">10. Governing Law</h2>
              <p>These terms are governed by the laws of England and Wales.</p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-3xl leading-none text-navy">11. Contact</h2>
              <p>
                Questions about these terms: <a href="mailto:hello@prografter.co.uk" className="text-teal underline-offset-4 hover:underline">hello@prografter.co.uk</a>
              </p>
            </section>

            <hr className="border-navy/10" />

            <p className="text-sm italic text-secondary-text">
              This is Version 0.1 of our Terms of Service. A full version drafted by qualified legal counsel will replace this document. By agreeing to these terms, you agree to be bound by future updates subject to reasonable notice.
            </p>
          </div>
        </section>
      </main>
    </AppShell>
  );
};

export default Terms;