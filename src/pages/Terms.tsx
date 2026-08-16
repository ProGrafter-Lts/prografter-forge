import LegalLayout, { Section } from "@/components/legal/LegalLayout";

const Terms = () => (
  <LegalLayout
    title="Terms of Use"
    seoTitle="Terms of Use — ProGrafter"
    description="ProGrafter Ltd terms of use for homeowners and tradespeople using the ProGrafter platform."
    path="/terms"
  >
    <Section heading="1. Who we are">
      <p>
        ProGrafter Ltd (“ProGrafter”, “we”, “us”) operates prografter.co.uk, a platform that
        connects Homeowners with Tradespeople for the purpose of posting, quoting on, and completing
        building and trade work.
      </p>
    </Section>

    <Section heading="2. What ProGrafter is — and isn't">
      <p>
        ProGrafter is an <strong>introducer</strong>. We connect Homeowners and Tradespeople. We are
        not a party to any contract for work between them, we do not employ Tradespeople, and we do
        not supervise, guarantee, or take responsibility for the quality, safety, or completion of
        any work carried out. Any agreement for work is between the Homeowner and the Tradesperson
        directly.
      </p>
    </Section>

    <Section heading="3. Accounts and eligibility">
      <p>
        You must be 18 or over and able to form a legally binding contract to use ProGrafter.
        Tradespeople confirm they hold all qualifications, insurances, and competent person scheme
        registrations (e.g. NICEIC, Gas Safe) required for the work they list or accept.
      </p>
    </Section>

    <Section heading="4. Fees">
      <p>
        Tradespeople are charged a commission of 7.5% of the agreed project value on successful
        completion, capped at £900 per project. Homeowners use the platform free of charge.
        Attempting to circumvent this fee by arranging payment outside the platform after being
        introduced through ProGrafter is a breach of these terms.
      </p>
    </Section>

    <Section heading="5. Verification">
      <p>
        We carry out verification checks on Tradespeople (insurance documents, qualification and
        scheme membership evidence) at signup and periodically thereafter. Verification reduces risk
        but does not guarantee a Tradesperson's competence, reliability, or the standard of their
        work. Homeowners should carry out their own reasonable checks before agreeing to work.
      </p>
    </Section>

    <Section heading="6. AI Quote Checker">
      <p>
        Our AI Quote Checker gives an indicative estimate based on the information provided. It is
        generated automatically, is not a formal quotation, survey, or professional valuation, and
        should not be relied on as one. Actual costs will vary.
      </p>
    </Section>

    <Section heading="7. Planning and building regulations data">
      <p>
        Where we display planning or building regulation information sourced from third-party APIs
        (e.g. PlanIt), this is provided for informational convenience only. We do not guarantee its
        accuracy or currency. Users should verify directly with their local planning authority
        before relying on it.
      </p>
    </Section>

    <Section heading="8. Conduct">
      <p>
        Users agree to communicate professionally, not to post false or misleading information, and
        to carry out or commission work in line with applicable UK standards, including Building
        Regulations and BS 7671 where relevant.
      </p>
    </Section>

    <Section heading="9. Liability">
      <p>
        To the maximum extent permitted by law, ProGrafter's liability to you is limited to the
        commission fees paid by you in the 12 months prior to the claim. We are not liable for the
        acts, omissions, or standard of work of any Homeowner or Tradesperson.
      </p>
    </Section>

    <Section heading="10. Suspension and termination">
      <p>
        We may suspend or terminate an account for breach of these terms, fraudulent behaviour, or
        repeated complaints. Users may close their account at any time by contacting{" "}
        <a href="mailto:hello@prografter.co.uk" className="text-teal hover:underline">
          hello@prografter.co.uk
        </a>
        .
      </p>
    </Section>

    <Section heading="11. Changes to these terms">
      <p>
        We may update these terms as the platform develops. Material changes will be notified via
        the platform or email with reasonable notice before they take effect.
      </p>
    </Section>

    <Section heading="12. Governing law">
      <p>
        These terms are governed by the laws of England and Wales, and the courts of England and
        Wales have exclusive jurisdiction.
      </p>
    </Section>

    <Section heading="13. Contact">
      <p>
        Questions about these terms:{" "}
        <a href="mailto:hello@prografter.co.uk" className="text-teal hover:underline">
          hello@prografter.co.uk
        </a>
        .
      </p>
    </Section>
  </LegalLayout>
);

export default Terms;
