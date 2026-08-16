import LegalLayout, { Section } from "@/components/legal/LegalLayout";

const Privacy = () => (
  <LegalLayout
    title="Privacy Policy"
    seoTitle="Privacy Policy — ProGrafter"
    description="How ProGrafter Ltd collects, uses, shares and retains your personal data under UK GDPR."
    path="/privacy"
    intro={
      <p>
        ProGrafter Ltd is the data controller for personal data processed through the platform. We
        are registered with the ICO, registration number <strong>ZC114018</strong>.
      </p>
    }
  >
    <Section heading="Data we collect">
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Account data: name, email, phone number, password (hashed)</li>
        <li>
          Verification data: qualification certificates, insurance documents, competent person
          scheme membership (Tradespeople only)
        </li>
        <li>
          Project data: job descriptions, photos, addresses, quotes, messages between Homeowners and
          Tradespeople
        </li>
        <li>Payment data: processed by Stripe Connect — we do not store full card details</li>
        <li>Usage data: pages visited, device/browser information, cookies (see Cookie Policy)</li>
      </ul>
    </Section>

    <Section heading="How we use it">
      <ul className="list-disc pl-5 space-y-1.5">
        <li>To operate the platform and match Homeowners with Tradespeople</li>
        <li>To verify Tradesperson credentials</li>
        <li>To process payments via Stripe Connect</li>
        <li>
          To send service emails (via Mailgun) — account confirmations, project updates, payment
          receipts
        </li>
        <li>
          To improve the platform and, where relevant, to generate AI Quote Checker estimates (via
          Anthropic's API — project details you submit for a quote estimate may be processed by this
          third party solely to generate your estimate)
        </li>
        <li>To comply with our legal and tax obligations</li>
      </ul>
    </Section>

    <Section heading="Who we share data with">
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          <strong>Stripe</strong> — payment processing
        </li>
        <li>
          <strong>Supabase</strong> — our database and backend infrastructure provider (data hosted
          in the EU/UK where configured)
        </li>
        <li>
          <strong>Mailgun</strong> — transactional emails
        </li>
        <li>
          <strong>Anthropic</strong> — AI Quote Checker processing only, limited to the data you
          submit for that feature
        </li>
        <li>
          <strong>PlanIt API</strong> — planning data lookups, address-level only, no personal
          account data shared
        </li>
        <li>
          Other users: a Homeowner and Tradesperson can see each other's relevant contact and
          project details once matched, so the job can proceed.
        </li>
      </ul>
      <p>
        We do not sell personal data to third parties, and we do not share data with marketing
        partners, data brokers, or affiliate networks.
      </p>
    </Section>

    <Section heading="Your rights">
      <p>
        Under UK GDPR you have the right to access, correct, delete, or port your data, and to
        object to certain processing. Contact{" "}
        <a href="mailto:hello@prografter.co.uk" className="text-teal hover:underline">
          hello@prografter.co.uk
        </a>{" "}
        to exercise these rights. If unresolved, you can complain to the ICO (
        <a
          href="https://ico.org.uk"
          target="_blank"
          rel="noreferrer"
          className="text-teal hover:underline"
        >
          ico.org.uk
        </a>
        ).
      </p>
    </Section>

    <Section heading="Retention">
      <p>
        We retain account and project data for as long as your account is active, and for up to 7
        years afterwards where needed for tax, accounting, or legal purposes.
      </p>
    </Section>

    <Section heading="Cookies">
      <p>
        See our{" "}
        <a href="/cookies" className="text-teal hover:underline">
          Cookie Policy
        </a>{" "}
        for details of cookies used and how to manage your preferences.
      </p>
    </Section>

    <Section heading="Changes">
      <p>
        We may update this policy as the platform develops. Material changes will be notified via
        the platform.
      </p>
    </Section>
  </LegalLayout>
);

export default Privacy;
