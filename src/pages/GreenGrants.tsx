import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Leaf, ChevronDown, ChevronUp, CheckCircle2, XCircle, HelpCircle, Home, Zap, Flame, Sun, Wind, ThermometerSun } from "lucide-react";

/* ─── Grant data ─── */
const GRANTS = [
  {
    id: "bus",
    name: "Boiler Upgrade Scheme (BUS)",
    provider: "UK Government (Ofgem)",
    amount: "Up to £7,500",
    description: "Covers air source heat pumps (£7,500) and ground source heat pumps (£7,500). Replaces fossil fuel heating in homes.",
    eligibleWorks: ["Air Source Heat Pump", "Ground Source Heat Pump"],
    requirements: [
      "Property must have a valid EPC (no loft/cavity wall recommendations outstanding)",
      "Existing fossil fuel heating system being replaced",
      "Installer must be MCS certified",
      "Property in England or Wales",
    ],
    link: "https://www.gov.uk/apply-boiler-upgrade-scheme",
    active: true,
  },
  {
    id: "eco4",
    name: "ECO4 Scheme",
    provider: "Energy suppliers (obligation scheme)",
    amount: "Varies — can cover full cost",
    description: "Targets fuel-poor and low-income households. Covers insulation, heating upgrades, and renewable installations.",
    eligibleWorks: ["Cavity Wall Insulation", "Loft Insulation", "External Wall Insulation (EWI)", "Air Source Heat Pump", "Solar PV Installer", "Underfloor Heating"],
    requirements: [
      "Household must be in receipt of qualifying benefits (UC, pension credit, etc.)",
      "Property EPC rated D, E, F, or G",
      "Installer must be TrustMark registered and PAS 2030/2035 compliant",
      "Retrofit assessment required by PAS 2035 Retrofit Coordinator",
    ],
    link: "https://www.ofgem.gov.uk/environmental-and-social-schemes/energy-company-obligation-eco",
    active: true,
  },
  {
    id: "gbis",
    name: "Great British Insulation Scheme (GBIS)",
    provider: "UK Government via energy suppliers",
    amount: "Varies — can cover full cost",
    description: "Targets homes in council tax bands A-D (England) or A-E (Scotland/Wales). Focused on insulation measures.",
    eligibleWorks: ["Cavity Wall Insulation", "Loft Insulation", "External Wall Insulation (EWI)", "Underfloor Heating"],
    requirements: [
      "Property in council tax bands A-D (England) or A-E (Scotland/Wales)",
      "OR household in receipt of qualifying benefits",
      "Installer must be TrustMark registered",
      "PAS 2030 compliant installation required",
    ],
    link: "https://www.gov.uk/apply-great-british-insulation-scheme",
    active: true,
  },
  {
    id: "seg",
    name: "Smart Export Guarantee (SEG)",
    provider: "Energy suppliers",
    amount: "Ongoing payments per kWh exported",
    description: "Get paid for surplus renewable electricity you export to the grid. Applies to solar PV, wind, and battery storage.",
    eligibleWorks: ["Solar PV Installer", "Battery Storage"],
    requirements: [
      "Installation must be MCS certified",
      "Capacity up to 5MW",
      "Smart meter or export meter required",
      "Apply through your energy supplier",
    ],
    link: "https://www.ofgem.gov.uk/environmental-and-social-schemes/smart-export-guarantee-seg",
    active: true,
  },
  {
    id: "ozev",
    name: "OZEV EV Chargepoint Grant",
    provider: "Office for Zero Emission Vehicles",
    amount: "Up to £350 (per socket, max 2)",
    description: "Covers installation of EV chargepoints for renters and flat owners. Landlords can also apply.",
    eligibleWorks: ["EV Charger Installer"],
    requirements: [
      "Applicant must be a tenant, flat owner, or landlord",
      "Off-street parking required",
      "Charger must be OZEV-approved model",
      "Installer must be OZEV-approved",
    ],
    link: "https://www.gov.uk/government/collections/government-grants-for-low-emission-vehicles",
    active: true,
  },
  {
    id: "his",
    name: "Home Insulation Scheme (Scotland)",
    provider: "Scottish Government / Home Energy Scotland",
    amount: "Up to £9,000 (or £12,000 in rural areas)",
    description: "Grants and interest-free loans for insulation and heating improvements in Scotland.",
    eligibleWorks: ["Cavity Wall Insulation", "Loft Insulation", "External Wall Insulation (EWI)", "Air Source Heat Pump", "Ground Source Heat Pump"],
    requirements: [
      "Property must be in Scotland",
      "Homeowner or registered social landlord",
      "Property EPC rated D or below (for some measures)",
      "Assessment by Home Energy Scotland advisor",
    ],
    link: "https://www.homeenergyscotland.org/",
    active: true,
  },
];

const WORK_TYPES = [
  { value: "heat-pump", label: "Heat Pump (Air/Ground Source)", icon: ThermometerSun },
  { value: "solar", label: "Solar PV / Battery", icon: Sun },
  { value: "insulation", label: "Insulation (Cavity/Loft/EWI)", icon: Home },
  { value: "ev-charger", label: "EV Charger", icon: Zap },
  { value: "other-green", label: "Other Renewable / Energy Efficiency", icon: Wind },
];

const WORK_TO_TRADES: Record<string, string[]> = {
  "heat-pump": ["Air Source Heat Pump", "Ground Source Heat Pump"],
  "solar": ["Solar PV Installer", "Battery Storage"],
  "insulation": ["Cavity Wall Insulation", "Loft Insulation", "External Wall Insulation (EWI)"],
  "ev-charger": ["EV Charger Installer"],
  "other-green": ["MVHR Installer", "Underfloor Heating", "Draught Proofing Specialist", "Green Roof", "Rainwater Harvesting"],
};

const GrantCard = ({ grant, isMatch }: { grant: typeof GRANTS[0]; isMatch: boolean }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-xl border transition-all ${isMatch ? "border-green-500/30 bg-green-500/[0.04]" : "border-cream/10 bg-cream/[0.02]"}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
      >
        <div className="flex items-center gap-3">
          {isMatch ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          ) : (
            <HelpCircle className="w-5 h-5 text-cream/30 flex-shrink-0" />
          )}
          <div>
            <h3 className="font-heading text-cream text-xl tracking-wide">{grant.name}</h3>
            <p className="font-mono text-xs text-teal mt-0.5">{grant.amount}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-cream/40" /> : <ChevronDown className="w-5 h-5 text-cream/40" />}
      </button>

      {open && (
        <div className="px-6 pb-5 space-y-4 border-t border-cream/5 pt-4">
          <p className="font-body text-cream/60 text-sm leading-relaxed">{grant.description}</p>

          <div>
            <p className="font-mono text-[10px] text-teal uppercase tracking-widest mb-2">Provider</p>
            <p className="font-body text-cream/80 text-sm">{grant.provider}</p>
          </div>

          <div>
            <p className="font-mono text-[10px] text-teal uppercase tracking-widest mb-2">Requirements</p>
            <ul className="space-y-1.5">
              {grant.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-cream/50">
                  <span className="text-teal mt-0.5">•</span>
                  <span className="font-body">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] text-teal uppercase tracking-widest mb-2">Eligible Works</p>
            <div className="flex flex-wrap gap-2">
              {grant.eligibleWorks.map((w) => (
                <span key={w} className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 font-mono text-[10px] px-2.5 py-1 rounded-full">
                  <Leaf className="w-3 h-3" /> {w}
                </span>
              ))}
            </div>
          </div>

          <a
            href={grant.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-teal text-cream font-mono text-xs py-2.5 px-5 rounded-lg hover:bg-teal-hover transition-colors tracking-wider uppercase"
          >
            Learn More & Apply →
          </a>
        </div>
      )}
    </div>
  );
};

const GreenGrantsPage = () => {
  const [selectedWork, setSelectedWork] = useState<string>("");

  const matchedTradeTypes = selectedWork ? WORK_TO_TRADES[selectedWork] || [] : [];
  const matchedGrants = GRANTS.filter((g) =>
    g.eligibleWorks.some((ew) => matchedTradeTypes.includes(ew))
  );
  const otherGrants = GRANTS.filter((g) => !matchedGrants.includes(g));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--deep))" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-green-500" />
            <span className="font-mono text-xs text-green-500 uppercase tracking-widest">Grant Eligibility Checker</span>
            <div className="w-8 h-[2px] bg-green-500" />
          </div>
          <h1 className="font-heading text-cream text-[52px] md:text-[72px] leading-[0.9] mb-4">
            FIND YOUR <span className="text-green-500">GREEN GRANT.</span>
          </h1>
          <p className="font-body text-cream/50 text-lg max-w-xl mx-auto leading-relaxed">
            UK homeowners can access thousands in grants for energy-efficient home improvements. Select your planned work to see which schemes you may qualify for.
          </p>
        </div>
      </section>

      {/* Selector */}
      <section className="px-6 pb-8">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-xs text-teal uppercase tracking-widest mb-4">What work are you planning?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {WORK_TYPES.map((wt) => {
              const Icon = wt.icon;
              const isActive = selectedWork === wt.value;
              return (
                <button
                  key={wt.value}
                  onClick={() => setSelectedWork(isActive ? "" : wt.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    isActive
                      ? "border-green-500/50 bg-green-500/10 text-green-400"
                      : "border-cream/10 bg-cream/[0.02] text-cream/60 hover:border-cream/20"
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-green-500" : "text-cream/30"}`} />
                  <span className="font-body text-sm">{wt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto space-y-4">
          {selectedWork && matchedGrants.length > 0 && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <p className="font-mono text-xs text-green-500 uppercase tracking-widest">
                  {matchedGrants.length} grant{matchedGrants.length > 1 ? "s" : ""} matched
                </p>
              </div>
              {matchedGrants.map((g) => (
                <GrantCard key={g.id} grant={g} isMatch />
              ))}
            </>
          )}

          {selectedWork && matchedGrants.length === 0 && (
            <div className="text-center py-12 border border-cream/10 rounded-xl">
              <XCircle className="w-8 h-8 text-cream/20 mx-auto mb-3" />
              <p className="font-heading text-cream text-2xl mb-1">No Direct Matches</p>
              <p className="font-body text-cream/40 text-sm">But check the grants below — you may still qualify based on your circumstances.</p>
            </div>
          )}

          {(otherGrants.length > 0 || !selectedWork) && (
            <>
              <div className="flex items-center gap-3 mt-8 mb-2">
                <HelpCircle className="w-5 h-5 text-cream/30" />
                <p className="font-mono text-xs text-cream/40 uppercase tracking-widest">
                  {selectedWork ? "Other available grants" : "All available grants"}
                </p>
              </div>
              {(selectedWork ? otherGrants : GRANTS).map((g) => (
                <GrantCard key={g.id} grant={g} isMatch={false} />
              ))}
            </>
          )}

          {/* CTA */}
          <div className="mt-12 bg-green-500/[0.06] border border-green-500/20 rounded-xl p-8 text-center">
            <Leaf className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-heading text-cream text-2xl mb-2">NEED A CERTIFIED GREEN TRADE?</h3>
            <p className="font-body text-cream/50 text-sm mb-6 max-w-md mx-auto">
              All ProGrafter green trades are MCS, TrustMark, and PAS accredited — so your grant application goes through first time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/post-a-job"
                className="bg-green-500 text-white font-mono text-sm py-3 px-8 rounded-xl hover:bg-green-600 transition-colors tracking-wider uppercase"
              >
                Post a Green Job
              </Link>
              <Link
                to="/register/trade"
                className="border border-cream/20 text-cream font-mono text-sm py-3 px-8 rounded-xl hover:bg-cream/5 transition-colors tracking-wider uppercase"
              >
                Register as Green Trade
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GreenGrantsPage;
