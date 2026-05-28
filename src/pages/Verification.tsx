import { Link } from "react-router-dom";
import { Award, Phone, ShieldCheck, ClipboardCheck } from "lucide-react";
import SEO from "@/components/SEO";

const Verification = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--deep))" }}>
      <SEO
        title="How we verify trades — ProGrafter"
        description="ProGrafter verifies every trade against five checks, with two routes to proven competence: qualified/registered, or assessed time-served experience."
        path="/verification"
      />
      <header className="py-6 px-6">
        <Link to="/" className="font-heading text-2xl tracking-wider">
          <span className="text-cream">PRO</span>
          <span className="text-teal">GRAFTER</span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <p className="font-mono text-xs text-teal uppercase tracking-widest mb-3">
          How we verify
        </p>
        <h1 className="font-heading text-cream text-[44px] leading-[1.05] mb-5">
          Five checks. <span className="text-teal">Every trade.</span>
        </h1>
        <p className="font-body text-cream/75 text-base mb-10 leading-relaxed">
          Where the law requires registration — gas, electrical self-certification — we
          require it. Everywhere else, a great trade with genuine experience has a real
          route in. Here's how that works.
        </p>

        <section className="mb-12">
          <h2 className="font-heading text-cream text-2xl mb-4">Two routes to verified</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-teal/30 bg-cream/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-teal" />
                <h3 className="font-heading text-cream text-lg">Route A — Qualified / Registered</h3>
              </div>
              <p className="font-body text-cream/75 text-sm leading-relaxed">
                You hold a recognised qualification (NVQ, City &amp; Guilds, MCS, Gas Safe,
                NICEIC/NAPIT/ELECSA, OFTEC, FENSA, etc.). We check it directly with the
                issuing body or on the public register.
              </p>
            </div>
            <div className="rounded-xl border border-teal/30 bg-cream/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardCheck className="w-5 h-5 text-teal" />
                <h3 className="font-heading text-cream text-lg">Route B — Time-served, assessed</h3>
              </div>
              <p className="font-body text-cream/75 text-sm leading-relaxed">
                No formal paper, but the work speaks for itself. We review your evidence of
                years worked, a portfolio of recent jobs, customer references on the phone,
                and have a short conversation about your trade. Approved trades start with a
                3-job probation so the first homeowners are extra-protected.
              </p>
            </div>
          </div>
          <p className="font-body text-cream/60 text-xs mt-4">
            Note: legally-gated trades — gas, electrical self-certification, MCS-funded
            renewables, OZEV-funded EV charge points, OFTEC oil — must always be on Route A.
            The law doesn't allow a time-served route for those.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-cream text-2xl mb-4">The five checks</h2>
          <ul className="space-y-3">
            {[
              { icon: ShieldCheck, t: "ID verified", b: "Passport or driving licence confirmed." },
              { icon: ShieldCheck, t: "Companies House (if registered)", b: "Registration and director confirmed against the public register." },
              { icon: ShieldCheck, t: "Insurance", b: "Public liability certificate and cover level checked." },
              { icon: Award, t: "Proven competence", b: "Verified qualifications, or assessed time-served experience." },
              { icon: Phone, t: "References", b: "Recent customers called personally." },
            ].map(({ icon: Icon, t, b }) => (
              <li key={t} className="flex items-start gap-3 p-4 rounded-xl border border-cream/10 bg-cream/5">
                <span className="flex-none w-9 h-9 rounded-lg bg-teal/15 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-teal" />
                </span>
                <div>
                  <p className="font-heading text-cream text-base mb-0.5">{t}</p>
                  <p className="font-body text-cream/65 text-sm">{b}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default Verification;
