import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import SEO from "@/components/SEO";
import { buildServiceJsonLd } from "@/lib/seoSchemas";
import { Leaf, CheckCircle2, HelpCircle, ChevronLeft, AlertCircle, ExternalLink } from "lucide-react";
import GreenSchemesBreakdown from "@/components/GreenSchemesBreakdown";

/* ─── Types ─── */
type PropertyType = "detached" | "semi" | "mid-terrace" | "end-terrace" | "ground-flat" | "upper-flat" | "bungalow";
type Ownership = "own" | "rent-private" | "rent-social" | "family";
type EpcBand = "ab" | "c" | "d" | "efg" | "unknown";
type HouseholdFlag = "benefits" | "low-income" | "off-grid" | "none";

const PROPERTY_OPTIONS: { value: PropertyType; label: string; emoji: string }[] = [
  { value: "detached", label: "Detached House", emoji: "🏠" },
  { value: "semi", label: "Semi-Detached House", emoji: "🏘️" },
  { value: "mid-terrace", label: "Mid-Terrace", emoji: "🏠" },
  { value: "end-terrace", label: "End-Terrace", emoji: "🏠" },
  { value: "ground-flat", label: "Ground Floor Flat", emoji: "🏢" },
  { value: "upper-flat", label: "Upper Floor Flat", emoji: "🏢" },
  { value: "bungalow", label: "Bungalow", emoji: "🏡" },
];

const OWNERSHIP_OPTIONS: { value: Ownership; label: string; emoji: string }[] = [
  { value: "own", label: "I own it (owner-occupier)", emoji: "🔑" },
  { value: "rent-private", label: "I rent — private landlord", emoji: "📋" },
  { value: "rent-social", label: "I rent — housing association or council", emoji: "🏛️" },
  { value: "family", label: "I live with family (not my property)", emoji: "👨‍👩‍👧" },
];

const EPC_OPTIONS: { value: EpcBand; label: string; sub: string; color: string }[] = [
  { value: "ab", label: "A or B", sub: "Very efficient", color: "🟢" },
  { value: "c", label: "C", sub: "", color: "🟡" },
  { value: "d", label: "D", sub: "", color: "🟠" },
  { value: "efg", label: "E, F or G", sub: "Least efficient", color: "🔴" },
  { value: "unknown", label: "I don't know", sub: "", color: "❓" },
];

const HOUSEHOLD_OPTIONS: { value: HouseholdFlag; label: string; emoji: string }[] = [
  { value: "benefits", label: "We receive Universal Credit or other means-tested benefits", emoji: "💳" },
  { value: "low-income", label: "Total household income is under £31,000 per year", emoji: "💰" },
  { value: "off-grid", label: "Our property is off the gas grid (no mains gas supply)", emoji: "🔥" },
  { value: "none", label: "None of these apply to us", emoji: "✖️" },
];


/* ─── Scheme definitions ─── */
interface Scheme {
  id: string;
  name: string;
  icon: string;
  confidence: "may" | "might";
  summary: string;
  value: string;
  metCriteria: string[];
  confirmCriteria: string[];
  govUrl: string;
}

function isHouse(p: PropertyType) {
  return ["detached", "semi", "mid-terrace", "end-terrace", "bungalow"].includes(p);
}

function isEpcDOrBelow(epc: EpcBand) {
  return epc === "d" || epc === "efg";
}

function getSchemes(property: PropertyType, ownership: Ownership, epc: EpcBand, household: HouseholdFlag[]): Scheme[] {
  const schemes: Scheme[] = [];
  const hasBenefits = household.includes("benefits");
  const lowIncome = household.includes("low-income");
  const offGrid = household.includes("off-grid");
  const isOwner = ownership === "own";
  const poorEpc = isEpcDOrBelow(epc);

  if (poorEpc && (hasBenefits || lowIncome)) {
    const met: string[] = ["EPC rating D or below"];
    if (hasBenefits) met.push("Receives means-tested benefits");
    if (lowIncome) met.push("Household income under £31,000");
    schemes.push({
      id: "eco4", name: "ECO4 Scheme", icon: "🌱", confidence: "may",
      summary: "Energy suppliers fund insulation, heating & renewable upgrades for qualifying households.",
      value: "Up to £18,000", metCriteria: met,
      confirmCriteria: ["TrustMark-registered installer confirms eligibility"],
      govUrl: "https://www.gov.uk/apply-great-british-insulation-scheme",
    });
  }

  if (poorEpc && isHouse(property)) {
    schemes.push({
      id: "gbis", name: "Great British Insulation Scheme", icon: "🏠", confidence: "may",
      summary: "Insulation measures funded through energy suppliers for eligible homes in council tax bands A–D.",
      value: "Up to £10,000", metCriteria: ["EPC rating D or below", "Property is a house"],
      confirmCriteria: ["Council tax band confirmed by installer"],
      govUrl: "https://www.gov.uk/apply-great-british-insulation-scheme",
    });
  }

  if (isOwner && offGrid) {
    schemes.push({
      id: "bus", name: "Boiler Upgrade Scheme", icon: "🔥", confidence: "may",
      summary: "£7,500 grant towards an air or ground source heat pump, replacing fossil fuel heating.",
      value: "£7,500 grant", metCriteria: ["Owner-occupier", "Off the gas grid"],
      confirmCriteria: ["MCS-certified installer confirms suitability"],
      govUrl: "https://www.gov.uk/apply-boiler-upgrade-scheme",
    });
  }

  if (isOwner && offGrid && (epc === "ab" || epc === "c" || epc === "d")) {
    schemes.push({
      id: "hug", name: "Home Upgrade Grant (HUG2)", icon: "⚡", confidence: "might",
      summary: "Funding for energy efficiency improvements in off-gas-grid homes.",
      value: "Up to £10,000", metCriteria: ["Owner-occupier", "Off the gas grid", "EPC rating A–D"],
      confirmCriteria: ["Income/benefits verified by local authority"],
      govUrl: "https://www.gov.uk/apply-home-upgrade-grant",
    });
  }

  schemes.push({
    id: "vat", name: "0% VAT on Energy Saving Materials", icon: "💷", confidence: "may",
    summary: "Zero VAT on insulation, heat pumps, solar panels, and other energy-saving installations until March 2027.",
    value: "Save 20% on materials & install", metCriteria: ["UK residential property"],
    confirmCriteria: [],
    govUrl: "https://www.gov.uk/guidance/vat-on-energy-saving-materials-and-heating-equipment-notice-7086",
  });

  if (epc === "unknown") {
    schemes.push({
      id: "epc", name: "Get an EPC Assessment", icon: "📋", confidence: "might",
      summary: "Knowing your EPC rating unlocks eligibility for most grant schemes. We can match you with a local assessor.",
      value: "From £60 — could unlock thousands", metCriteria: ["EPC rating unknown"],
      confirmCriteria: ["Assessor visit to confirm rating"],
      govUrl: "https://www.gov.uk/find-energy-certificate",
    });
  }

  return schemes;
}

function getGreenJobTypes(schemes: Scheme[]): string[] {
  const ids = schemes.map((s) => s.id);
  const types: string[] = [];
  if (ids.includes("eco4") || ids.includes("gbis")) {
    types.push("External Wall Insulation (EWI)", "Cavity Wall Insulation", "Loft Insulation", "Retrofit Coordinator", "EPC Assessor");
  }
  if (ids.includes("bus") || ids.includes("hug")) {
    types.push("Air Source Heat Pump", "Ground Source Heat Pump");
  }
  if (ids.includes("epc")) {
    types.push("EPC Assessor");
  }
  if (types.length === 0) {
    types.push("Solar PV Installer", "Air Source Heat Pump", "Ground Source Heat Pump", "External Wall Insulation (EWI)",
      "Cavity Wall Insulation", "Loft Insulation", "EV Charger Installer", "Battery Storage", "EPC Assessor");
  }
  return [...new Set(types)];
}

/* ─── Components ─── */
const StepIndicator = ({ current, total }: { current: number; total: number }) => (
  <div className="flex items-center gap-3 mb-8">
    {Array.from({ length: total }, (_, i) => (
      <div key={i} className="flex items-center gap-3 flex-1">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm transition-all ${
          i < current ? "bg-[#16A34A] text-white" : i === current ? "bg-teal text-cream" : "bg-cream/15 text-cream/50"
        }`}>
          {i < current ? "✓" : i + 1}
        </div>
        {i < total - 1 && <div className={`h-[2px] flex-1 ${i < current ? "bg-[#16A34A]" : "bg-cream/15"}`} />}
      </div>
    ))}
  </div>
);

const SchemeCard = ({ scheme }: { scheme: Scheme }) => {
  const isMay = scheme.confidence === "may";
  return (
    <div className="rounded-xl border border-[#16A34A]/35 bg-[#16A34A]/[0.08] p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{scheme.icon}</span>
          <div>
            <h3 className="font-heading text-cream text-xl tracking-wide">{scheme.name}</h3>
            <span className={`font-mono text-[11px] uppercase tracking-widest ${isMay ? "text-[#16A34A]" : "text-amber-400"}`}>
              {isMay ? "You may qualify ✓" : "Worth checking ?"}
            </span>
          </div>
        </div>
        <span className="font-heading text-[#16A34A] text-lg whitespace-nowrap">{scheme.value}</span>
      </div>
      <p className="font-body text-cream/70 text-sm leading-relaxed">{scheme.summary}</p>
      {scheme.metCriteria.length > 0 && (
        <div className="space-y-1.5">
          {scheme.metCriteria.map((c) => (
            <div key={c} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
              <span className="font-body text-sm text-cream/80">{c}</span>
            </div>
          ))}
        </div>
      )}
      {scheme.confirmCriteria.length > 0 && (
        <div className="space-y-1.5">
          {scheme.confirmCriteria.map((c) => (
            <div key={c} className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="font-body text-sm text-cream/65">{c}</span>
            </div>
          ))}
        </div>
      )}
      <a href={scheme.govUrl} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-[#16A34A] hover:text-[#15803D] transition-colors">
        Find Out More <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};

/* ─── Main Page ─── */
const GreenGrantsPage = () => {
  const [step, setStep] = useState(-1);
  const [property, setProperty] = useState<PropertyType | null>(null);
  const [ownership, setOwnership] = useState<Ownership | null>(null);
  const [epc, setEpc] = useState<EpcBand | null>(null);
  const [household, setHousehold] = useState<HouseholdFlag[]>([]);
  const checkerRef = useRef<HTMLDivElement>(null);

  const showResults = step === 4;
  const schemes = showResults && property && ownership && epc ? getSchemes(property, ownership, epc, household) : [];
  const schemeIds = schemes.map((s) => s.id);

  const toggleHousehold = (flag: HouseholdFlag) => {
    if (flag === "none") { setHousehold(["none"]); return; }
    setHousehold((prev) => {
      const without = prev.filter((f) => f !== "none");
      return without.includes(flag) ? without.filter((f) => f !== flag) : [...without, flag];
    });
  };

  const canAdvance = () => {
    if (step === 0) return !!property;
    if (step === 1) return !!ownership;
    if (step === 2) return !!epc;
    if (step === 3) return household.length > 0;
    return false;
  };

  const advance = () => { if (canAdvance()) setStep(step + 1); };

  const scrollToChecker = () => {
    setStep(0);
    setTimeout(() => checkerRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const cardClass = (isActive: boolean) =>
    `cursor-pointer rounded-xl border px-5 py-4 transition-all text-left ${
      isActive
        ? "border-teal/60 bg-teal/10 text-cream"
        : "border-cream/15 bg-cream/[0.06] text-cream/75 hover:border-cream/25"
    }`;

  return (
    <AppShell>
      <SEO
        title="Green Grants Eligibility Checker — ProGrafter | Free"
        description="Check your eligibility for ECO4, BUS heat pump grants, and GBIS insulation funding — free, instant result."
        path="/green"
        jsonLd={buildServiceJsonLd({
          name: "Green Grants Eligibility Checker",
          description: "Free instant eligibility check for ECO4, Boiler Upgrade Scheme and GBIS funding.",
          url: "https://prografter.co.uk/green",
          serviceType: "Energy grant eligibility assessment",
          price: "0.00",
        })}
      />

      {/* SECTION 1 — HERO */}
      <section className="pt-28 pb-16 px-6 bg-navy">
        <div className="max-w-3xl mx-auto text-center">
          <span className="font-mono text-xs text-teal uppercase tracking-widest mb-4 block">Green Energy Grants</span>
          <h1 className="font-heading text-cream text-[40px] sm:text-[52px] md:text-[60px] leading-[0.95] tracking-wide mb-5">
            COULD YOU GET HELP FUNDING YOUR HOME IMPROVEMENTS?
          </h1>
          <p className="font-body text-cream/60 text-sm md:text-base max-w-2xl mx-auto leading-relaxed mb-8">
            Government schemes are currently funding thousands of pounds of energy upgrades for eligible UK homeowners. Answer 4 quick questions to see what you may qualify for. Free. No commitment.
          </p>
          <button
            onClick={scrollToChecker}
            className="inline-block bg-teal text-cream font-mono text-sm px-8 py-3.5 rounded-xl hover:bg-teal-hover transition-colors shadow-lg shadow-teal/20"
          >
            Check My Eligibility →
          </button>
        </div>
      </section>

      {/* SECTION 2 — DETAILED SCHEMES BREAKDOWN */}
      <GreenSchemesBreakdown onCheckEligibility={scrollToChecker} />

      {/* SECTION 3 — THE 4-STEP CHECKER */}
      <section className="px-6 pb-24" ref={checkerRef}>
        <div className="max-w-2xl mx-auto">
          {step >= 0 && !showResults && (
            <>
              <StepIndicator current={step} total={4} />

              {/* Step 1 — Property type */}
              {step === 0 && (
                <div>
                  <h2 className="font-heading text-cream text-2xl mb-6">What type of property do you live in?</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PROPERTY_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => setProperty(opt.value)} className={cardClass(property === opt.value)}>
                        <span className="text-xl mr-3">{opt.emoji}</span>
                        <span className="font-body text-sm">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2 — Ownership */}
              {step === 1 && (
                <div>
                  <h2 className="font-heading text-cream text-2xl mb-6">Do you own or rent your home?</h2>
                  <div className="grid grid-cols-1 gap-3">
                    {OWNERSHIP_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => setOwnership(opt.value)} className={cardClass(ownership === opt.value)}>
                        <span className="text-xl mr-3">{opt.emoji}</span>
                        <span className="font-body text-sm">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3 — EPC */}
              {step === 2 && (
                <div>
                  <h2 className="font-heading text-cream text-2xl mb-6">What is your home's current EPC energy rating?</h2>
                  <p className="font-body text-cream/60 text-sm mb-5">
                    Your EPC (Energy Performance Certificate) rates your home from A (most efficient) to G (least efficient).
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {EPC_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => setEpc(opt.value)} className={cardClass(epc === opt.value)}>
                        <span className="text-lg mr-3">{opt.color}</span>
                        <span className="font-body text-sm font-medium">{opt.label}</span>
                        {opt.sub && <span className="font-body text-xs text-cream/50 ml-2">— {opt.sub}</span>}
                      </button>
                    ))}
                  </div>
                  {epc === "unknown" && (
                    <div className="mt-4 flex items-start gap-3 bg-teal/10 border border-teal/20 rounded-xl px-5 py-4">
                      <AlertCircle className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                      <p className="font-body text-sm text-cream/70">
                        You can find your EPC rating free at{" "}
                        <a href="https://www.gov.uk/find-energy-certificate" target="_blank" rel="noopener noreferrer" className="text-teal underline underline-offset-2">
                          epcregister.com <ExternalLink className="inline w-3 h-3" />
                        </a>{" "}
                        — just enter your postcode. Or we can match you with a local EPC Assessor who will assess your home for a small fee.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4 — Household */}
              {step === 3 && (
                <div>
                  <h2 className="font-heading text-cream text-2xl mb-6">Which of these describe your household?</h2>
                  <p className="font-mono text-xs text-cream/50 uppercase tracking-widest mb-4">Select all that apply</p>
                  <div className="grid grid-cols-1 gap-3">
                    {HOUSEHOLD_OPTIONS.map((opt) => {
                      const isActive = household.includes(opt.value);
                      return (
                        <button key={opt.value} onClick={() => toggleHousehold(opt.value)} className={cardClass(isActive)}>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              isActive ? "bg-teal border-teal" : "border-cream/30"
                            }`}>
                              {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-cream" />}
                            </div>
                            <span className="text-lg">{opt.emoji}</span>
                            <span className="font-body text-sm">{opt.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-8">
                {step > 0 ? (
                  <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 font-mono text-sm text-cream/60 hover:text-cream transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                ) : <div />}
                <button onClick={advance} disabled={!canAdvance()}
                  className="bg-teal text-cream font-mono text-sm px-8 py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  {step === 3 ? "See My Results →" : "Next →"}
                </button>
              </div>
            </>
          )}

          {/* SECTION 4 — RESULTS */}
          {showResults && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Leaf className="w-5 h-5 text-[#16A34A]" />
                <p className="font-mono text-xs text-[#16A34A] uppercase tracking-widest">
                  {schemes.length} scheme{schemes.length !== 1 ? "s" : ""} found for you
                </p>
              </div>

              {schemes.map((s) => <SchemeCard key={s.id} scheme={s} />)}

              {/* Disclaimer */}
              <div className="bg-cream/[0.06] border border-cream/15 rounded-xl px-6 py-5">
                <p className="font-body text-cream/60 text-xs leading-relaxed">
                  These results are a guide based on the information you provided. Your exact eligibility will be confirmed by a certified installer during a free assessment. ProGrafter provides information only — not financial advice. For official guidance visit{" "}
                  <a href="https://www.gov.uk" target="_blank" rel="noopener noreferrer" className="text-teal underline">gov.uk</a>.
                </p>
              </div>

              {/* Main CTA */}
              <div className="text-center pt-4">
                <Link
                  to={`/post-a-job?green=1&schemes=${schemeIds.join(",")}`}
                  className="inline-block bg-[#16A34A] text-white font-mono text-sm py-4 px-10 rounded-xl hover:bg-[#15803D] transition-colors tracking-wider uppercase shadow-lg shadow-[#16A34A]/20"
                >
                  Match Me With a Certified Local Installer — Free →
                </Link>
              </div>

              {/* Start over */}
              <div className="text-center">
                <button
                  onClick={() => { setStep(0); setProperty(null); setOwnership(null); setEpc(null); setHousehold([]); }}
                  className="font-mono text-xs text-cream/50 hover:text-cream/70 underline underline-offset-4 transition-colors"
                >
                  Start over
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

    </AppShell>
  );
};

export default GreenGrantsPage;
