import {
  ShieldCheck,
  Building2,
  Shield,
  Award,
  Phone,
  ArrowRight,
} from "lucide-react";

const CHECKS = [
  {
    icon: ShieldCheck,
    label: "ID Verified",
    description: "Passport or driving licence confirmed",
  },
  {
    icon: Building2,
    label: "Companies House",
    description: "Registration and director confirmed",
  },
  {
    icon: Shield,
    label: "Insurance",
    description: "Public liability certificate and cover level checked",
  },
  {
    icon: Award,
    label: "Proven competence",
    description:
      "Verified qualifications, or assessed time-served experience",
  },
  {
    icon: Phone,
    label: "References",
    description: "Recent customers called personally",
  },

];

const VerificationStandards = () => {
  return (
    <section className="bg-deep py-20 px-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-4 fade-up">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">
            Verification
          </span>
        </div>

        {/* Heading */}
        <h2 className="font-heading text-cream text-[42px] craft:text-[56px] leading-none mb-12 fade-up">
          Five checks. Every trade. No exceptions.
        </h2>

        {/* Five-check grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          {CHECKS.map((check, i) => {
            const Icon = check.icon;
            return (
              <div
                key={check.label}
                className="fade-up rounded-xl border p-6 flex flex-col gap-4"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.08)",
                  transitionDelay: `${i * 60}ms`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "rgba(13,148,136,0.12)" }}
                >
                  <Icon className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <h3 className="font-heading text-cream text-lg leading-tight mb-1">
                    {check.label}
                  </h3>
                  <p className="font-body text-cream/60 text-sm leading-relaxed">
                    {check.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer line + link */}
        <div className="fade-up flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <p className="font-body text-cream/70 text-sm">
            We don&apos;t require a CSCS card — that&apos;s a commercial-site
            requirement, not a domestic one. We verify what actually matters.
          </p>
          <a
            href="/verification"
            className="inline-flex items-center gap-2 font-mono text-sm text-teal hover:text-teal-hover transition-colors group shrink-0"
          >
            How we verify
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default VerificationStandards;
