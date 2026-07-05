import { Link } from "react-router-dom";

const SIGNALS = [
  { label: "5-Step Trade Verification", icon: "✓" },
  { label: "Verified Homeowners", icon: "◎" },
  { label: "Two-Way Reviews", icon: "⇄" },
  { label: "Human-Reviewed Briefs", icon: "❏" },
  { label: "Transparent, Capped Fees", icon: "£" },
  { label: "AI Transparency", icon: "✦" },
];

const TrustCentreBand = () => {
  return (
    <section className="px-6 py-16 craft:py-20 bg-navy" style={{ background: "linear-gradient(135deg, #27396A 0%, #0F1F38 100%)" }}>
      <div className="max-w-5xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">Trust, by design</span>
          <div className="w-8 h-[2px] bg-teal" />
        </div>
        <h2 className="font-heading text-cream text-[30px] craft:text-[46px] leading-tight mb-4">
          Built to be trusted — and to prove it.
        </h2>
        <p className="font-body text-cream/80 text-lg font-light max-w-2xl mx-auto mb-10">
          Trust isn&apos;t a badge you buy from us. Every check, review and fee is transparent by
          default. See exactly how it works in our Trust Centre.
        </p>

        <div className="grid grid-cols-2 craft:grid-cols-3 gap-3 max-w-3xl mx-auto mb-10">
          {SIGNALS.map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-left">
              <span className="flex-shrink-0 h-8 w-8 rounded-lg bg-teal/15 border border-teal/25 flex items-center justify-center font-heading text-teal">
                {s.icon}
              </span>
              <span className="font-body text-sm text-cream/90 leading-tight">{s.label}</span>
            </div>
          ))}
        </div>

        <Link
          to="/trust"
          className="inline-flex items-center justify-center gap-2 bg-teal text-cream font-mono text-sm px-8 py-4 rounded-xl hover:bg-teal-hover transition-all shadow-lg shadow-teal/30 hover:-translate-y-0.5"
        >
          Visit the Trust Centre →
        </Link>
      </div>
    </section>
  );
};

export default TrustCentreBand;
