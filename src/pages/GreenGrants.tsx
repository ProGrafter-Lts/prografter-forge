import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Leaf, CheckCircle2, HelpCircle, ChevronLeft, AlertCircle, ExternalLink } from "lucide-react";

/* ─── Types ─── */
type PropertyType = "detached" | "semi" | "mid-terrace" | "end-terrace" | "ground-flat" | "upper-flat" | "bungalow";
type Ownership = "own" | "rent-private" | "rent-social" | "family";
type EpcBand = "ab" | "c" | "d" | "efg" | "unknown";
type HouseholdFlag = "benefits" | "low-income" | "off-grid" | "none";

const PROPERTY_OPTIONS: { value: PropertyType; label: string; emoji: string }[] = [
  { value: "detached", label: "Detached House", emoji: "🏠" },
  { value: "semi", label: "Semi-Detached House", emoji: "🏘️" },
  { value: "mid-terrace", label: "Mid-Terrace", emoji: "🏚️" },
  { value: "end-terrace", label: "End-Terrace", emoji: "🏡" },
  { value: "ground-flat", label: "Ground Floor Flat", emoji: "🏢" },
  { value: "upper-flat", label: "Upper Floor Flat", emoji: "🏬" },
  { value: "bungalow", label: "Bungalow", emoji: "🛖" },
];

const OWNERSHIP_OPTIONS: { value: Ownership; label: string }[] = [
  { value: "own", label: "I own it" },
  { value: "rent-private", label: "I rent it (private landlord)" },
  { value: "rent-social", label: "I rent it (housing association / council)" },
  { value: "family", label: "I live with family" },
];

const EPC_OPTIONS: { value: EpcBand; label: string; sub?: string }[] = [
  { value: "ab", label: "A or B", sub: "Very efficient" },
  { value: "c", label: "C", sub: "" },
  { value: "d", label: "D", sub: "" },
  { value: "efg", label: "E, F or G", sub: "Least efficient" },
  { value: "unknown", label: "I don't know", sub: "Help me find out" },
];

const HOUSEHOLD_OPTIONS: { value: HouseholdFlag; label: string }[] = [
  { value: "benefits", label: "We receive Universal Credit or other means-tested benefits" },
  { value: "low-income", label: "Our household income is under £31,000/yr" },
  { value: "off-grid", label: "The property is off the gas grid (no mains gas)" },
  { value: "none", label: "None of these apply" },
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
  jobType: string;
}

function isHouse(p: PropertyType) {
  return ["detached", "semi", "mid-terrace", "end-terrace", "bungalow"].includes(p);
}

function isEpcDOrBelow(epc: EpcBand) {
  return epc === "d" || epc === "efg";
}

function getSchemes(
  property: PropertyType,
  ownership: Ownership,
  epc: EpcBand,
  household: HouseholdFlag[]
): Scheme[] {
  const schemes: Scheme[] = [];
  const hasBenefits = household.includes("benefits");
  const lowIncome = household.includes("low-income");
  const offGrid = household.includes("off-grid");
  const isOwner = ownership === "own";
  const poorEpc = isEpcDOrBelow(epc);

  // ECO4: EPC D/E/F/G AND (benefits OR income < £31K)
  if (poorEpc && (hasBenefits || lowIncome)) {
    const met: string[] = [];
    const confirm: string[] = [];
    met.push("EPC rating D or below");
    if (hasBenefits) met.push("Receives means-tested benefits");
    if (lowIncome) met.push("Household income under £31,000");
    confirm.push("TrustMark-registered installer confirms eligibility");
    schemes.push({
      id: "eco4",
      name: "ECO4 Scheme",
      icon: "🌱",
      confidence: "may",
      summary: "Energy suppliers fund insulation, heating & renewable upgrades for qualifying households.",
      value: "Up to £10,000 funded",
      metCriteria: met,
      confirmCriteria: confirm,
      jobType: "insulation",
    });
  }

  // GBIS: EPC D/E/F/G AND house (not flat)
  if (poorEpc && isHouse(property)) {
    schemes.push({
      id: "gbis",
      name: "Great British Insulation Scheme",
      icon: "🏠",
      confidence: "may",
      summary: "Insulation measures funded through energy suppliers for eligible homes in council tax bands A–D.",
      value: "Up to £6,000 funded",
      metCriteria: ["EPC rating D or below", "Property is a house"],
      confirmCriteria: ["Council tax band confirmed by installer"],
      jobType: "insulation",
    });
  }

  // BUS: owner AND off gas grid
  if (isOwner && offGrid) {
    schemes.push({
      id: "bus",
      name: "Boiler Upgrade Scheme",
      icon: "🔥",
      confidence: "may",
      summary: "£7,500 grant towards an air or ground source heat pump, replacing fossil fuel heating.",
      value: "Up to £7,500 grant",
      metCriteria: ["Owner-occupier", "Off the gas grid"],
      confirmCriteria: ["MCS-certified installer confirms suitability"],
      jobType: "heat-pump",
    });
  }

  // HUG: owner AND off gas grid AND EPC D or below
  if (isOwner && offGrid && poorEpc) {
    schemes.push({
      id: "hug",
      name: "Home Upgrade Grant (HUG2)",
      icon: "⚡",
      confidence: "might",
      summary: "Funding for energy efficiency improvements in off-gas-grid homes with low EPC ratings.",
      value: "Up to £10,000 funded",
      metCriteria: ["Owner-occupier", "Off the gas grid", "EPC rating D or below"],
      confirmCriteria: ["Income/benefits verified by local authority"],
      jobType: "insulation",
    });
  }

  // 0% VAT — always show
  schemes.push({
    id: "vat",
    name: "0% VAT on Energy Saving Materials",
    icon: "💷",
    confidence: "may",
    summary: "Zero VAT on insulation, heat pumps, solar panels, and other energy-saving installations until March 2027.",
    value: "Save 20% VAT on materials & install",
    metCriteria: ["UK residential property"],
    confirmCriteria: [],
    jobType: "insulation",
  });

  // EPC Assessor — if unknown
  if (epc === "unknown") {
    schemes.push({
      id: "epc",
      name: "Get an EPC Assessment",
      icon: "📋",
      confidence: "might",
      summary: "Knowing your EPC rating unlocks eligibility for most grant schemes. We can match you with a local assessor.",
      value: "From £60 — could unlock thousands",
      metCriteria: ["EPC rating unknown"],
      confirmCriteria: ["Assessor visit to confirm rating"],
      jobType: "epc-assessment",
    });
  }

  return schemes;
}

/* ─── Components ─── */
const StepIndicator = ({ current, total }: { current: number; total: number }) => (
  <div className="flex items-center gap-2 mb-8">
    {Array.from({ length: total }, (_, i) => (
      <div
        key={i}
        className={`h-1 flex-1 rounded-full transition-all ${
          i < current ? "bg-teal" : i === current ? "bg-teal/60" : "bg-cream/10"
        }`}
      />
    ))}
  </div>
);

const SchemeCard = ({ scheme }: { scheme: Scheme }) => {
  const isMay = scheme.confidence === "may";
  return (
    <div className="rounded-xl border border-green-500/20 bg-green-500/[0.04] p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{scheme.icon}</span>
          <div>
            <h3 className="font-heading text-cream text-xl tracking-wide">{scheme.name}</h3>
            <span
              className={`font-mono text-[11px] uppercase tracking-widest ${
                isMay ? "text-teal" : "text-amber-400"
              }`}
            >
              {isMay ? "You may qualify" : "You might qualify — check with installer"}
            </span>
          </div>
        </div>
        <span className="font-heading text-green-500 text-lg whitespace-nowrap">{scheme.value}</span>
      </div>

      <p className="font-body text-cream/60 text-sm leading-relaxed">{scheme.summary}</p>

      {scheme.metCriteria.length > 0 && (
        <div className="space-y-1.5">
          {scheme.metCriteria.map((c) => (
            <div key={c} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="font-body text-sm text-cream/70">{c}</span>
            </div>
          ))}
        </div>
      )}

      {scheme.confirmCriteria.length > 0 && (
        <div className="space-y-1.5">
          {scheme.confirmCriteria.map((c) => (
            <div key={c} className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="font-body text-sm text-cream/50">{c}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Main Page ─── */
const GreenGrantsPage = () => {
  const [step, setStep] = useState(0);
  const [property, setProperty] = useState<PropertyType | null>(null);
  const [ownership, setOwnership] = useState<Ownership | null>(null);
  const [epc, setEpc] = useState<EpcBand | null>(null);
  const [household, setHousehold] = useState<HouseholdFlag[]>([]);

  const showResults = step === 4;
  const schemes = showResults && property && ownership && epc
    ? getSchemes(property, ownership, epc, household)
    : [];

  const primaryJobType = schemes.length > 0 ? schemes[0].jobType : "insulation";

  const toggleHousehold = (flag: HouseholdFlag) => {
    if (flag === "none") {
      setHousehold(["none"]);
      return;
    }
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

  const advance = () => {
    if (canAdvance()) setStep(step + 1);
  };

  const cardClass = (isActive: boolean) =>
    `cursor-pointer rounded-xl border px-5 py-4 transition-all text-left ${
      isActive
        ? "border-teal/60 bg-teal/10 text-cream"
        : "border-cream/10 bg-cream/[0.02] text-cream/60 hover:border-cream/20"
    }`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--deep))" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">Green Funding Checker</span>
            <div className="w-8 h-[2px] bg-teal" />
          </div>
          <h1 className="font-heading text-cream text-[44px] md:text-[64px] leading-[0.9] mb-4">
            FIND OUT WHAT <span className="text-teal">HELP</span> YOU COULD GET
          </h1>
          <p className="font-body text-cream/50 text-lg max-w-xl mx-auto leading-relaxed">
            Government schemes are funding thousands of pounds of energy improvements for UK homeowners. Answer 4 questions to see what you may qualify for.
          </p>
        </div>
      </section>

      {/* The Checker */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto">
          {!showResults && <StepIndicator current={step} total={4} />}

          {/* Step 1 — Property type */}
          {step === 0 && (
            <div>
              <h2 className="font-heading text-cream text-2xl mb-6">What type of property do you live in?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROPERTY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setProperty(opt.value)}
                    className={cardClass(property === opt.value)}
                  >
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
                  <button
                    key={opt.value}
                    onClick={() => setOwnership(opt.value)}
                    className={cardClass(ownership === opt.value)}
                  >
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
              <div className="grid grid-cols-1 gap-3">
                {EPC_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setEpc(opt.value)}
                    className={cardClass(epc === opt.value)}
                  >
                    <div>
                      <span className="font-body text-sm font-medium">{opt.label}</span>
                      {opt.sub && <span className="font-body text-xs text-cream/40 ml-2">{opt.sub}</span>}
                    </div>
                  </button>
                ))}
              </div>
              {epc === "unknown" && (
                <div className="mt-4 flex items-start gap-3 bg-teal/10 border border-teal/20 rounded-xl px-5 py-4">
                  <AlertCircle className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                  <p className="font-body text-sm text-cream/70">
                    You can find your EPC rating for free at{" "}
                    <a
                      href="https://www.gov.uk/find-energy-certificate"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal underline underline-offset-2"
                    >
                      epcregister.com <ExternalLink className="inline w-3 h-3" />
                    </a>{" "}
                    or we can match you with a local EPC assessor.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4 — Household */}
          {step === 3 && (
            <div>
              <h2 className="font-heading text-cream text-2xl mb-6">Which of these best describes your household?</h2>
              <p className="font-mono text-xs text-cream/40 uppercase tracking-widest mb-4">Select all that apply</p>
              <div className="grid grid-cols-1 gap-3">
                {HOUSEHOLD_OPTIONS.map((opt) => {
                  const isActive = household.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleHousehold(opt.value)}
                      className={cardClass(isActive)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isActive ? "bg-teal border-teal" : "border-cream/30"
                          }`}
                        >
                          {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-cream" />}
                        </div>
                        <span className="font-body text-sm">{opt.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          {!showResults && (
            <div className="flex items-center justify-between mt-8">
              {step > 0 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 font-mono text-sm text-cream/50 hover:text-cream transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={advance}
                disabled={!canAdvance()}
                className="bg-teal text-cream font-mono text-sm px-8 py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {step === 3 ? "See My Results" : "Next →"}
              </button>
            </div>
          )}

          {/* Results */}
          {showResults && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Leaf className="w-5 h-5 text-green-500" />
                <p className="font-mono text-xs text-green-500 uppercase tracking-widest">
                  {schemes.length} scheme{schemes.length !== 1 ? "s" : ""} found
                </p>
              </div>

              {schemes.map((s) => (
                <SchemeCard key={s.id} scheme={s} />
              ))}

              {/* Disclaimer */}
              <div className="bg-cream/[0.03] border border-cream/10 rounded-xl px-6 py-5">
                <p className="font-body text-cream/50 text-sm leading-relaxed">
                  <strong className="text-cream/70">These results are a guide only</strong> — a certified installer will confirm your exact eligibility during a free site assessment. ProGrafter signposts available schemes but does not provide financial or energy advice.
                </p>
              </div>

              {/* CTA */}
              <div className="text-center pt-4">
                <Link
                  to={`/post-a-job?type=${primaryJobType}`}
                  className="inline-block bg-green-500 text-white font-mono text-sm py-4 px-10 rounded-xl hover:bg-green-600 transition-colors tracking-wider uppercase shadow-lg shadow-green-500/20"
                >
                  Match Me With a Certified Local Installer →
                </Link>
              </div>

              {/* Start over */}
              <div className="text-center">
                <button
                  onClick={() => { setStep(0); setProperty(null); setOwnership(null); setEpc(null); setHousehold([]); }}
                  className="font-mono text-xs text-cream/40 hover:text-cream/60 underline underline-offset-4 transition-colors"
                >
                  Start over
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GreenGrantsPage;
