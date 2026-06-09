import { Link } from "react-router-dom";

interface Scheme {
  id: string;
  name: string;
  oneLiner: string;
  whatItIs: string;
  qualifies: string[];
  paysFor: string;
  maxValue: string;
  maxValueSub?: string;
  note: string;
  badge: "teal" | "navy" | "amber" | "grey";
  badgeLabel: string;
  closed?: boolean;
}

interface GreenSchemesBreakdownProps {
  onCheckEligibility?: () => void;
}

const SCHEMES: Scheme[] = [
  {
    id: "eco4",
    name: "ECO4 — Energy Company Obligation 4",
    oneLiner:
      "The big one. Fully funded home energy upgrades for households on low incomes or benefits.",
    whatItIs:
      "Energy suppliers are legally required to fund energy improvements for eligible households. The work is free — the energy company pays the installer directly. You do not pay anything.",
    qualifies: [
      "Receiving Universal Credit, Housing Benefit, Child Benefit, Pension Credit, or other means-tested benefits",
      "OR household income under £31,000/yr",
      "AND home is EPC band D, E, F, or G",
    ],
    paysFor:
      "Insulation (loft, cavity wall, solid wall), heat pumps, solar panels, heating controls, double glazing in some cases",
    maxValue: "Up to £18,000",
    maxValueSub: "Average job value: £6,000–£15,000",
    note: "ProGrafter requires a PAS 2035 Retrofit Coordinator assessment before any ECO4 work begins. Every trade is verified before they go live on the platform.",
    badge: "amber",
    badgeLabel: "Means-tested",
  },
  {
    id: "gbis",
    name: "Great British Insulation Scheme (GBIS)",
    oneLiner:
      "Up to £10,000 towards a single insulation measure for homes with poor energy ratings.",
    whatItIs:
      "A government scheme specifically for insulation. Simpler than ECO4 — it covers one insulation measure per property rather than a whole-house approach. Partially funded for some households, fully funded for others.",
    qualifies: [
      "Home is EPC band D or below",
      "For full funding: receiving means-tested benefits",
      "For partial funding: EPC band D or E with no benefits requirement — you may still get a significant contribution",
    ],
    paysFor:
      "Loft insulation, cavity wall insulation, solid wall insulation (internal or external), underfloor insulation, room-in-roof insulation",
    maxValue: "Up to £10,000",
    note: "This is often the fastest scheme to access. One measure, one installer, one application.",
    badge: "amber",
    badgeLabel: "Means-tested",
  },
  {
    id: "bus",
    name: "Boiler Upgrade Scheme (BUS)",
    oneLiner:
      "£7,500 off the cost of replacing your gas boiler with a heat pump. Paid directly to your installer.",
    whatItIs:
      "A straight government grant of £7,500 applied to the cost of installing an air source or ground source heat pump. The money goes directly to your MCS-certified installer — you only pay the difference. No repayment required.",
    qualifies: [
      "Owner-occupier (not a tenant)",
      "Replacing an existing fossil fuel heating system (gas boiler, oil boiler, LPG)",
      "Property must have a valid EPC (any band) and installer must be MCS-certified",
    ],
    paysFor:
      "Air source heat pump: £7,500 grant. Ground source heat pump: £7,500 grant. Does NOT cover solar panels or insulation.",
    maxValue: "£7,500",
    maxValueSub: "Typical heat pump cost after grant: £3,000–£8,000",
    note: "ProGrafter requires MCS certification for all heat pump installers. Verified before they appear.",
    badge: "navy",
    badgeLabel: "Most owner-occupiers",
  },
  {
    id: "hug2",
    name: "Home Upgrade Grant — HUG2",
    oneLiner:
      "Closed to new applicants. We will update this page when a successor scheme is announced.",
    whatItIs:
      "HUG2 provided funding for energy efficiency improvements in off-gas-grid homes through local councils. The scheme closed to new applicants in early 2025 and is no longer accepting applications.",
    qualifies: [
      "Scheme is currently closed — no new applications accepted",
      "Government has not yet announced a direct successor",
      "Off-grid homeowners may still qualify for ECO4, GBIS or BUS",
    ],
    paysFor:
      "Previously funded heat pumps, solar panels, loft insulation, wall insulation and heating controls.",
    maxValue: "Closed",
    maxValueSub: "No longer accepting applications",
    note: "This scheme is currently closed. We will update this page when a successor scheme is announced.",
    badge: "grey",
    badgeLabel: "Specific circumstances",
    closed: true,
  },
  {
    id: "vat",
    name: "0% VAT on Energy Saving Installations",
    oneLiner:
      "No VAT on solar panels, heat pumps, insulation, and other energy saving work. A 20% saving on every job.",
    whatItIs:
      "Since April 2022, the UK government charges zero VAT on the supply and installation of qualifying energy saving materials. This is not a grant — it is a tax relief that automatically applies. You do not need to apply for it. Your installer should already be pricing without VAT on qualifying work.",
    qualifies: [
      "Any homeowner — no income test, no EPC requirement",
      "Work must be carried out by a VAT-registered installer",
      "Must be for residential property",
    ],
    paysFor:
      "Solar panels and solar thermal, heat pumps (air and ground source), wind turbines, insulation of any kind, draught proofing, heating controls, hot water systems, boiler controls",
    maxValue: "20% saving",
    maxValueSub: "Off the standard cost of qualifying work",
    note: "If a quote includes VAT on insulation or solar — ask your installer to confirm whether 0% VAT applies. It almost always does for residential work.",
    badge: "teal",
    badgeLabel: "Available to everyone",
  },
  {
    id: "ev",
    name: "EV Chargepoint Grant",
    oneLiner:
      "£350 towards installing a home EV charger. Applied automatically by your OZEV-approved installer.",
    whatItIs:
      "A government grant of £350 towards the cost of a home electric vehicle chargepoint installation. Applied directly by the installer — you do not need to claim it yourself. The installer deducts £350 from their invoice and claims it back from the government.",
    qualifies: [
      "Own or have ordered an electric vehicle",
      "Property must be a house (flats and rented properties have a separate scheme)",
      "Installer must be OZEV-approved",
    ],
    paysFor:
      "Supply and installation of a home EV chargepoint (smart charger that complies with OZEV specifications)",
    maxValue: "£350",
    maxValueSub: "Per chargepoint",
    note: "ProGrafter requires OZEV approval for all EV charger installers. Verified before they appear.",
    badge: "navy",
    badgeLabel: "Most homeowners",
  },
];

const badgeStyles: Record<Scheme["badge"], { border: string; chip: string; accent: string; dot: string }> = {
  teal: {
    border: "border-l-teal",
    chip: "bg-teal/15 text-teal border border-teal/40",
    accent: "text-teal",
    dot: "bg-teal",
  },
  navy: {
    border: "border-l-navy",
    chip: "bg-navy/15 text-navy border border-navy/40",
    accent: "text-navy",
    dot: "bg-navy",
  },
  amber: {
    border: "border-l-amber-600",
    chip: "bg-amber-600/15 text-amber-700 border border-amber-600/40",
    accent: "text-amber-700",
    dot: "bg-amber-600",
  },
  grey: {
    border: "border-l-navy/40",
    chip: "bg-navy/10 text-navy/60 border border-navy/25",
    accent: "text-navy/60",
    dot: "bg-navy/50",
  },
};

const GreenSchemesBreakdown = ({ onCheckEligibility }: GreenSchemesBreakdownProps) => {
  return (
    <section className="py-20 px-6 bg-cream">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <span className="font-mono text-xs text-teal uppercase tracking-widest mb-4 block">
            Available Funding
          </span>
          <h2 className="font-heading text-navy text-[36px] sm:text-[44px] md:text-[52px] leading-[0.95] tracking-wide mb-5">
            WHAT HELP IS ACTUALLY AVAILABLE RIGHT NOW
          </h2>
          <p className="font-body text-body-text text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Six government schemes are currently funding energy improvements for UK homeowners.
            Here is exactly what each one is, who it is for, and what it pays for.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {SCHEMES.map((scheme) => {
            const styles = badgeStyles[scheme.badge];
            return (
              <article
                key={scheme.id}
                className={`bg-card rounded-xl border border-navy/10 border-l-4 ${styles.border} p-6 md:p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col ${scheme.closed ? "opacity-80" : ""}`}
              >
                {/* Top row: badge */}
                <div className="flex items-center justify-between mb-4 gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full ${styles.chip}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                    {scheme.badgeLabel}
                  </span>
                  {scheme.closed && (
                    <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-navy/10 text-navy/70 border border-navy/20">
                      Scheme closed
                    </span>
                  )}
                </div>

                <h3 className="font-heading text-navy text-2xl md:text-[26px] tracking-wide leading-tight mb-2">
                  {scheme.name}
                </h3>

                <p className="font-body text-body-text text-sm md:text-base leading-relaxed italic mb-5">
                  "{scheme.oneLiner}"
                </p>

                <p className="font-body text-body-text/90 text-sm leading-relaxed mb-5">
                  {scheme.whatItIs}
                </p>

                <div className="mb-5">
                  <h4 className="font-mono text-[11px] uppercase tracking-widest text-navy/70 mb-2">
                    Who qualifies
                  </h4>
                  <ul className="space-y-1.5">
                    {scheme.qualifies.map((q, i) => (
                      <li key={i} className="flex gap-2 font-body text-sm text-body-text leading-snug">
                        <span className={`${styles.accent} mt-1 flex-shrink-0`}>•</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-5">
                  <h4 className="font-mono text-[11px] uppercase tracking-widest text-navy/70 mb-2">
                    What it pays for
                  </h4>
                  <p className="font-body text-sm text-body-text leading-snug">{scheme.paysFor}</p>
                </div>

                <div className="mt-auto pt-5 border-t border-navy/10">
                  <div className="flex items-end justify-between gap-3 mb-3">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-navy/60 mb-1">
                        Maximum value
                      </div>
                      <div className={`font-heading text-3xl md:text-4xl tracking-wide ${styles.accent}`}>
                        {scheme.maxValue}
                      </div>
                      {scheme.maxValueSub && (
                        <div className="font-mono text-[11px] text-body-text/60 mt-1">
                          {scheme.maxValueSub}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="font-body text-xs text-body-text/70 leading-snug bg-navy/[0.06] rounded-md p-3">
                    {scheme.note}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="bg-navy rounded-2xl p-8 md:p-12 text-center mb-10">
          <h3 className="font-heading text-cream text-[28px] sm:text-[36px] md:text-[44px] leading-[0.95] tracking-wide mb-4">
            READY TO FIND A VERIFIED INSTALLER?
          </h3>
          <p className="font-body text-cream/70 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Post your project on ProGrafter and we'll match you with verified, accredited installers in your area. No monthly fees — trades only pay when work is done.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/post-a-job"
              className="inline-block bg-teal text-cream font-mono text-sm px-8 py-3.5 rounded-xl hover:bg-teal-hover transition-colors shadow-lg shadow-teal/20"
            >
              Post a Job →
            </Link>
            <button
              onClick={onCheckEligibility}
              className="inline-block bg-transparent text-cream border border-cream/40 font-mono text-sm px-8 py-3.5 rounded-xl hover:bg-cream/10 transition-colors"
            >
              Check My Eligibility
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="font-mono text-xs text-body-text/50 leading-relaxed text-center max-w-3xl mx-auto">
          Scheme eligibility criteria and funding levels are set by the UK government and may
          change. Information correct as of May 2026. ProGrafter provides information only — not
          financial advice. For official eligibility guidance visit gov.uk/energy-grants.
        </p>
      </div>
    </section>
  );
};

export default GreenSchemesBreakdown;
