import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";

const Complaints = () => {
  return (
    <AppShell>
      <SEO
        title="Complaints Policy — ProGrafter"
        description="How to raise a complaint with ProGrafter Ltd, what happens next, and the timescales we work to."
        path="/complaints"
      />
      <main className="px-6 pt-28 pb-16">
        <section className="mx-auto max-w-4xl rounded-2xl border border-navy/10 bg-white p-6 shadow-sm craft:p-10">
          <h1 className="font-heading text-3xl text-navy craft:text-4xl">Complaints Policy</h1>
          <p className="font-body text-secondary-text mt-3">
            We want ProGrafter to be the most straightforward part of your project. If something
            falls short, tell us and we will put it right.
          </p>

          <div className="mt-8 space-y-8 font-body text-body-text leading-relaxed">
            <div>
              <h2 className="font-heading text-xl text-navy">1. What this policy covers</h2>
              <p className="mt-2">
                This policy covers complaints about ProGrafter Ltd — our platform, our reports, our
                verification decisions, our billing and our staff. Disputes about work carried out
                by a trade should be raised through the dispute process inside your project, which
                keeps the evidence in one place.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-xl text-navy">2. How to complain</h2>
              <p className="mt-2">
                Email{" "}
                <a href="mailto:hello@prografter.co.uk" className="text-teal hover:underline">
                  hello@prografter.co.uk
                </a>{" "}
                with the subject line “Complaint”. Please include your name, the email address on
                your account, what happened, and the outcome you are looking for.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-xl text-navy">3. What happens next</h2>
              <ul className="mt-2 list-disc pl-5 space-y-1.5">
                <li>We acknowledge every complaint within 2 working days.</li>
                <li>We investigate and respond in full within 10 working days.</li>
                <li>
                  If we need longer — for example where a third party is involved — we tell you why
                  and give you a revised date.
                </li>
                <li>
                  You can ask for a review by a director if you are unhappy with the outcome. That
                  review is completed within a further 10 working days.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-xl text-navy">4. Data protection complaints</h2>
              <p className="mt-2">
                If your complaint concerns how we handle personal data and you are not satisfied
                with our response, you can contact the Information Commissioner's Office at{" "}
                <a
                  href="https://ico.org.uk"
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal hover:underline"
                >
                  ico.org.uk
                </a>
                . Our ICO registration number is ZC114018.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-xl text-navy">5. Our details</h2>
              <p className="mt-2">
                ProGrafter Ltd · Registered in England and Wales · Company number 17124130 ·{" "}
                <a href="mailto:hello@prografter.co.uk" className="text-teal hover:underline">
                  hello@prografter.co.uk
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
};

export default Complaints;
