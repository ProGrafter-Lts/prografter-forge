import LegalLayout, { Section } from "@/components/legal/LegalLayout";

const Complaints = () => (
  <LegalLayout
    title="Complaints Policy"
    seoTitle="Complaints Policy — ProGrafter"
    description="How to raise a complaint about ProGrafter, and what to do about a dispute between a homeowner and a tradesperson."
    path="/complaints"
    intro={<p>This policy covers two different things — please use the right one.</p>}
  >
    <Section heading="A. Complaints about ProGrafter itself">
      <p>
        (e.g. a platform bug, a billing error, a verification decision you disagree with)
      </p>
      <p>
        Email{" "}
        <a href="mailto:hello@prografter.co.uk" className="text-teal hover:underline">
          hello@prografter.co.uk
        </a>{" "}
        with “Complaint” in the subject. We aim to acknowledge within 3 working days and resolve or
        respond in full within 20 working days.
      </p>
    </Section>

    <Section heading="B. Disputes between a Homeowner and a Tradesperson">
      <p>
        ProGrafter is an introducer, not an arbitrator of work disputes. We are not able to
        adjudicate on workmanship, project delays, or payment disputes between users. If you have a
        dispute:
      </p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Try to resolve it directly with the other party first</li>
        <li>
          For work quality or standards issues, contact the relevant trade body or competent person
          scheme (e.g. NICEIC, Gas Safe)
        </li>
        <li>
          For unresolved disputes, consider CEDR (mediation) or statutory adjudication where
          applicable
        </li>
        <li>Small claims court is available for financial disputes under the relevant threshold</li>
      </ul>
      <p>
        If you believe a Tradesperson has misrepresented their qualifications or insurance to us,
        report it to{" "}
        <a href="mailto:hello@prografter.co.uk" className="text-teal hover:underline">
          hello@prografter.co.uk
        </a>{" "}
        — we will investigate and may suspend their account pending review.
      </p>
    </Section>
  </LegalLayout>
);

export default Complaints;
