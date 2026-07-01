import { Link } from "react-router-dom";

interface Scheme {
  id: string;
  name: string;
  status: string;
  oneLiner: string;
  whatItIs: string;
  qualifies: string[];
  paysFor: string;
  value: string;
  note: string;
  badge: "teal" | "navy" | "amber" | "grey";
  cta: string;
  govUrl?: string;
  closed?: boolean;
}

interface GreenSchemesBreakdownProps {
  onCheckEligibility?: () => void;
}

const SCHEMES: Scheme[] = [
  {
    id: "warm-homes",
    name: "Warm Homes: Local Grant",
    status: "Active — England only",
    oneLiner:
      "Free energy-saving improvements may be available through participating local councils for eligible low-income households in England.",
    whatItIs:
      "Delivered through participating local councils in England. Your local council usually arranges a survey and confirms which improvements are suitable, then pays for agreed work.",
    qualifies: [
      "Property must be in England",
      "Home privately owned — owner-occupied or privately rented",
      "EPC rating D, E, F or G",
      "Household income usually £36,000 a year or less",
      "May still qualify above that in an eligible postcode area or on certain benefits",
      "Private renters may need landlord involvement or approval",
    ],
    paysFor:
      "Wall, loft and underfloor insulation, air source heat pumps, smart controls, solar panels and other council-agreed measures.",
    value:
      "Council-funded improvements may be available where eligible. Your local council confirms what can be installed and pays for agreed work.",
    note: "Your local council usually arranges a survey and confirms what improvements are suitable. If you have a landlord, they may need to contribute to some improvements.",
    badge: "teal",
    cta: "Check if this route may apply",
    govUrl: "https://www.gov.uk/apply-warm-homes-local-grant",
  },
  {
    id: "eco4",
    name: "ECO4 — Energy Company Obligation",
    status: "Active — supplier-led",
    oneLiner:
      "Energy suppliers fund energy efficiency improvements for low-income, fuel-poor and vulnerable households.",
    whatItIs:
      "Energy suppliers fund improvements for eligible households. Final eligibility is assessed through the supplier and installer route.",
    qualifies: [
      "Low-income households",
      "Households receiving qualifying benefits",
      "Fuel-poor or vulnerable households",
      "EPC D, E, F or G properties are commonly targeted",
      "Homeowners and tenants may be considered depending on circumstances",
    ],
    paysFor:
      "Insulation, heating upgrades, whole-home retrofit measures, and some renewable or low-carbon measures depending on assessment.",
    value:
      "Funding depends on the property, assessment, supplier route and measures recommended.",
    note: "ECO4 retrofit quality assurance is linked to TrustMark and relevant retrofit standards. ProGrafter should only route ECO-style work to appropriately accredited providers.",
    badge: "amber",
    cta: "Check if ECO4 may apply",
    govUrl: "https://www.gov.uk/energy-company-obligation",
  },
  {
    id: "bus",
    name: "Boiler Upgrade Scheme",
    status: "Active — England and Wales",
    oneLiner:
      "Grants are available to help replace fossil fuel heating systems with low-carbon heating.",
    whatItIs:
      "The installer applies for the grant and deducts it from the quoted installation cost where eligible. Use an appropriately certified installer.",
    qualifies: [
      "Property in England or Wales",
      "Homeowner or property owner",
      "Usually replacing gas, oil, LPG, coal, solid fuel or direct electric heating",
      "Not for replacing an existing low-carbon heating system",
      "Hybrid heat pump systems are not eligible",
      "Biomass boilers have extra restrictions — normally rural / off-gas-grid only",
    ],
    paysFor:
      "£7,500 air source heat pump · £7,500 ground source heat pump · £5,000 biomass boiler · £2,500 air-to-air heat pump.",
    value: "Up to £7,500",
    note: "The installer applies for the grant and deducts it from the quoted installation cost where eligible. Use an appropriately certified installer.",
    badge: "navy",
    cta: "Check if BUS may apply",
    govUrl: "https://www.gov.uk/apply-boiler-upgrade-scheme",
  },
  {
    id: "vat",
    name: "0% VAT Relief on Energy-Saving Materials",
    status: "Available tax relief — not a grant",
    oneLiner:
      "Some qualifying energy-saving materials installed in residential properties may receive VAT relief.",
    whatItIs:
      "This is not money you apply for. It is a VAT treatment applied to qualifying installed work, usually applied by the installer on the invoice. Rules differ in Northern Ireland.",
    qualifies: [
      "Homeowners having qualifying installed energy-saving materials",
      "Usually applied by the installer on the invoice where the work qualifies",
    ],
    paysFor:
      "Air/ground source heat pumps, solar panels, insulation, heating controls, draught proofing, wood-fuelled boilers and other listed qualifying materials.",
    value: "Potential VAT saving where qualifying work is installed correctly.",
    note: "This is not money you apply for. It is a VAT treatment applied to qualifying installed work. Rules differ in Northern Ireland.",
    badge: "teal",
    cta: "Check if VAT relief may apply",
    govUrl: "https://www.gov.uk/guidance/vat-on-energy-saving-materials-and-heating-equipment-notice-7086",
  },
  {
    id: "gbis",
    name: "Great British Insulation Scheme",
    status: "Limited / closing",
    oneLiner:
      "The central eligibility service for free or cheaper insulation has closed, but some energy suppliers may still accept applications.",
    whatItIs:
      "Availability is limited. Check with your energy supplier. Do not treat this as a fully open national application route.",
    qualifies: [
      "Existing applicants may still be processed",
      "Some suppliers may still accept applications",
      "Supplier assessment decides whether any contribution is needed",
      "Installations must be completed by 31 March 2026",
    ],
    paysFor:
      "Single insulation measures such as loft, cavity wall, solid wall or other eligible insulation depending on assessment.",
    value: "Availability is limited — check current availability with your energy supplier.",
    note: "Availability is limited. Check with your energy supplier. Do not present this as a fully open national application route.",
    badge: "amber",
    cta: "Check latest availability",
    govUrl: "https://www.gov.uk/apply-great-british-insulation-scheme",
  },
  {
    id: "ev",
    name: "EV Chargepoint Grant",
    status: "Check latest rules",
    oneLiner:
      "EV chargepoint support may be available in certain circumstances, but eligibility and grant values change. Check current official guidance before relying on this.",
    whatItIs:
      "Eligibility and grant values change over time. Check current official rules and use an OZEV-approved installer where required.",
    qualifies: [
      "Renters",
      "Flat owners",
      "Landlords",
      "Some parking arrangements",
      "Other routes depending on current rules",
    ],
    paysFor: "Supply and installation of a home EV chargepoint, subject to current scheme rules.",
    value: "Eligibility and grant value can change — check current official rules.",
    note: "Use an OZEV-approved installer where required.",
    badge: "navy",
    cta: "Check latest EV grant rules",
    govUrl: "https://www.gov.uk/government/collections/government-grants-for-low-emission-vehicles",
  },
  {
    id: "hug2",
    name: "Home Upgrade Grant — Closed",
    status: "Closed",
    oneLiner:
      "The Home Upgrade Grant is now closed. Eligible households may be directed toward Warm Homes: Local Grant instead.",
    whatItIs:
      "The Home Upgrade Grant is no longer accepting applications. It is kept here only as a closed historic scheme to avoid confusion.",
    qualifies: ["Scheme is closed — no new applications accepted"],
    paysFor: "Previously funded heat pumps, solar, insulation and heating controls in off-gas-grid homes.",
    value: "Closed",
    note: "Eligible households in England may now be directed toward Warm Homes: Local Grant instead.",
    badge: "grey",
    cta: "See Warm Homes: Local Grant",
    closed: true,
  },
];

const badgeStyles: Record<Scheme["badge"], { border: string; chip: string; accent: string; dot: string }> = {
  teal: { border: "border-l-teal", chip: "bg-teal/15 text-teal border border-teal/40", accent: "text-teal", dot: "bg-teal" },
  navy: { border: "border-l-navy", chip: "bg-navy/15 text-navy border border-navy/40", accent: "text-navy", dot: "bg-navy" },
  amber: { border: "border-l-amber-600", chip: "bg-amber-600/15 text-amber-700 border border-amber-600/40", accent: "text-amber-700", dot: "bg-amber-600" },
  grey: { border: "border-l-navy/40", chip: "bg-navy/10 text-navy/60 border border-navy/25", accent: "text-navy/60", dot: "bg-navy/50" },
};

const GreenSchemesBreakdown = ({ onCheckEligibility }: GreenSchemesBreakdownProps) => {
  return (
    <section className="py-20 px-6 bg-cream">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <span className="font-mono text-xs text-teal uppercase tracking-widest mb-4 block">
            UK Funding Routes
          </span>
          <h2 className="font-heading text-navy text-[36px] sm:text-[44px] md:text-[52px] leading-[0.95] tracking-wide mb-5">
            FUNDING ROUTES THAT MAY APPLY TO YOUR HOME
          </h2>
          <p className="font-body text-body-text text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Several UK schemes may help with insulation, heating, solar and other energy-saving
            improvements. Here is what each route is, who it may suit, and what needs confirming.
          </p>
        </div>

        {/* Top disclaimer */}
        <div className="max-w-3xl mx-auto mb-10 rounded-xl bg-amber-500/10 border border-amber-500/40 px-5 py-4">
          <p className="font-body text-sm text-amber-800 leading-relaxed text-center">
            Information is guidance only and may change. ProGrafter is not a government body and does
            not approve grant eligibility. Always check official scheme guidance before making decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {SCHEMES.map((scheme) => {
            const styles = badgeStyles[scheme.badge];
            return (
              <article
                key={scheme.id}
                className={`bg-card rounded-xl border border-navy/10 border-l-4 ${styles.border} p-6 md:p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col ${scheme.closed ? "opacity-80" : ""}`}
              >
                <div className="flex items-center justify-between mb-4 gap-3">
                  <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full ${styles.chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                    {scheme.status}
                  </span>
                </div>

                <h3 className="font-heading text-navy text-2xl md:text-[26px] tracking-wide leading-tight mb-2">
                  {scheme.name}
                </h3>

                <p className="font-body text-body-text text-sm md:text-base leading-relaxed mb-5">
                  {scheme.oneLiner}
                </p>

                <p className="font-body text-body-text/90 text-sm leading-relaxed mb-5">
                  {scheme.whatItIs}
                </p>

                <div className="mb-5">
                  <h4 className="font-mono text-[11px] uppercase tracking-widest text-navy/70 mb-2">
                    {scheme.closed ? "Status" : "Who may qualify"}
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

                {!scheme.closed && (
                  <div className="mb-5">
                    <h4 className="font-mono text-[11px] uppercase tracking-widest text-navy/70 mb-2">
                      What it may fund
                    </h4>
                    <p className="font-body text-sm text-body-text leading-snug">{scheme.paysFor}</p>
                  </div>
                )}

                <div className="mt-auto pt-5 border-t border-navy/10">
                  <div className="mb-3">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-navy/60 mb-1">
                      Value
                    </div>
                    <p className={`font-body text-sm leading-snug ${styles.accent}`}>{scheme.value}</p>
                  </div>
                  <p className="font-body text-xs text-body-text/70 leading-snug bg-amber-500/10 border border-amber-500/30 rounded-md p-3 mb-4">
                    {scheme.note}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={onCheckEligibility}
                      className="font-mono text-xs text-cream bg-teal px-4 py-2.5 rounded-lg hover:bg-teal-hover transition-colors"
                    >
                      {scheme.cta}
                    </button>
                    {scheme.govUrl && (
                      <a
                        href={scheme.govUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-navy border border-navy/25 px-4 py-2.5 rounded-lg hover:bg-navy/5 transition-colors"
                      >
                        View official scheme details ↗
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="bg-navy rounded-2xl p-8 md:p-12 text-center mb-10">
          <h3 className="font-heading text-cream text-[28px] sm:text-[36px] md:text-[44px] leading-[0.95] tracking-wide mb-4">
            FUNDING IS ONLY USEFUL IF THE WORK IS DONE PROPERLY
          </h3>
          <p className="font-body text-cream/70 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-6">
            Grant-funded retrofit work often needs the right assessment, paperwork, installer
            accreditation and completion evidence. ProGrafter helps homeowners understand which
            funding routes may apply and connect with suitably verified trades for the work required.
          </p>
          <ul className="text-left max-w-2xl mx-auto space-y-1.5 mb-8">
            {[
              "TrustMark / PAS 2030 / PAS 2035 where retrofit schemes require them",
              "MCS for heat pumps and solar where relevant",
              "OZEV-approved installers for EV chargepoints where required",
              "Gas Safe for gas-related works",
              "NICEIC / NAPIT or equivalent competent person schemes for electrical work",
            ].map((a) => (
              <li key={a} className="flex gap-2 font-body text-sm text-cream/70">
                <span className="text-teal mt-0.5 flex-shrink-0">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
          <p className="font-mono text-xs text-cream/60 mb-8 max-w-2xl mx-auto">
            Relevant accreditation is checked before matching for grant-funded work.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/post-a-job?green=1"
              className="inline-block bg-teal text-cream font-mono text-sm px-8 py-3.5 rounded-xl hover:bg-teal-hover transition-colors shadow-lg shadow-teal/20"
            >
              Post a grant-funded project brief →
            </Link>
            <button
              onClick={onCheckEligibility}
              className="inline-block bg-transparent text-cream border border-cream/40 font-mono text-sm px-8 py-3.5 rounded-xl hover:bg-cream/10 transition-colors"
            >
              Check funding routes
            </button>
          </div>
        </div>

        <p className="font-mono text-xs text-body-text/50 leading-relaxed text-center max-w-3xl mx-auto">
          Information is guidance only and may change. ProGrafter is not a government body and does not
          approve grant eligibility. Always check official scheme guidance before making decisions.
        </p>
      </div>
    </section>
  );
};

export default GreenSchemesBreakdown;
