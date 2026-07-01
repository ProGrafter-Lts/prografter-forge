import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import SEO from "@/components/SEO";
import { buildServiceJsonLd } from "@/lib/seoSchemas";
import { Leaf, CheckCircle2, HelpCircle, ChevronLeft, AlertCircle, ExternalLink } from "lucide-react";
import GreenSchemesBreakdown from "@/components/GreenSchemesBreakdown";

/* ─── Types ─── */
type Country = "england" | "wales" | "scotland" | "ni";
type Tenure = "own" | "rent-private" | "rent-private-supportive" | "social" | "landlord";
type Benefits = "yes" | "no" | "unsure";
type Income = "under20" | "20-36" | "over36" | "prefer";
type Epc = "abc" | "d" | "e" | "fg" | "unknown";
type Heating = "gas" | "oil" | "lpg" | "electric" | "coal" | "heatpump" | "none" | "unsure";
type Gas = "yes" | "no" | "unsure";
type Measure =
  | "insulation" | "heatpump" | "air-to-air" | "biomass" | "solar" | "controls"
  | "draught" | "glazing" | "ev" | "boiler" | "other" | "unsure";

type Answers = {
  country?: Country;
  tenure?: Tenure;
  benefits?: Benefits;
  income?: Income;
  epc?: Epc;
  heating?: Heating;
  gas?: Gas;
  measure?: Measure;
};

type MatchLevel = "strong" | "possible" | "more-info" | "unlikely";

interface Result {
  id: string;
  name: string;
  status: string;
  level: MatchLevel;
  why: string;
  mayCover: string;
  confirm: string;
  accreditation: string;
  value?: string;
  govUrl?: string;
}

/* ─── Question config ─── */
interface QOption { value: string; label: string; emoji?: string }
interface Question { id: keyof Answers; question: string; helper?: string; options: QOption[] }

const QUESTIONS: Question[] = [
  {
    id: "country", question: "Where is the property?", helper: "Grant routes differ across the UK.",
    options: [
      { value: "england", label: "England", emoji: "🏴" },
      { value: "wales", label: "Wales", emoji: "🏴" },
      { value: "scotland", label: "Scotland", emoji: "🏴" },
      { value: "ni", label: "Northern Ireland", emoji: "🇬🇧" },
    ],
  },
  {
    id: "tenure", question: "Do you own or rent your home?",
    options: [
      { value: "own", label: "I own my home", emoji: "🔑" },
      { value: "rent-private", label: "I privately rent", emoji: "📋" },
      { value: "rent-private-supportive", label: "I privately rent and my landlord is supportive", emoji: "🤝" },
      { value: "social", label: "Social housing / council / housing association", emoji: "🏛️" },
      { value: "landlord", label: "I am a landlord checking for my property", emoji: "🏘️" },
    ],
  },
  {
    id: "benefits", question: "Does your household receive means-tested benefits?",
    helper: "Examples may include Universal Credit, Housing Benefit, Pension Credit and other qualifying benefits depending on the scheme.",
    options: [
      { value: "yes", label: "Yes — we receive qualifying benefits", emoji: "✅" },
      { value: "no", label: "No", emoji: "❌" },
      { value: "unsure", label: "Not sure — I need to check", emoji: "🤔" },
    ],
  },
  {
    id: "income", question: "What is your approximate household income?",
    helper: "Some schemes use income thresholds, while others also consider benefits, postcode area or property condition.",
    options: [
      { value: "under20", label: "Under £20,000", emoji: "💷" },
      { value: "20-36", label: "£20,000–£36,000", emoji: "💷" },
      { value: "over36", label: "Over £36,000", emoji: "💷" },
      { value: "prefer", label: "Prefer not to say / not sure", emoji: "🤐" },
    ],
  },
  {
    id: "epc", question: "What is your property's EPC rating?",
    helper: "You can find this on your EPC certificate or the official EPC register.",
    options: [
      { value: "abc", label: "A, B or C — good rating", emoji: "🟢" },
      { value: "d", label: "D", emoji: "🟡" },
      { value: "e", label: "E", emoji: "🟠" },
      { value: "fg", label: "F or G — poor rating", emoji: "🔴" },
      { value: "unknown", label: "I don't know my EPC rating", emoji: "❓" },
    ],
  },
  {
    id: "heating", question: "What heating system do you currently have?",
    options: [
      { value: "gas", label: "Gas boiler", emoji: "🔥" },
      { value: "oil", label: "Oil boiler", emoji: "🛢️" },
      { value: "lpg", label: "LPG boiler", emoji: "🔥" },
      { value: "electric", label: "Electric heating", emoji: "⚡" },
      { value: "coal", label: "Coal / solid fuel", emoji: "🪨" },
      { value: "heatpump", label: "Existing heat pump", emoji: "♨️" },
      { value: "none", label: "No central heating", emoji: "🚫" },
      { value: "unsure", label: "Not sure", emoji: "🤔" },
    ],
  },
  {
    id: "gas", question: "Is the property connected to mains gas?",
    options: [
      { value: "yes", label: "Yes", emoji: "✅" },
      { value: "no", label: "No", emoji: "❌" },
      { value: "unsure", label: "Not sure", emoji: "🤔" },
    ],
  },
  {
    id: "measure", question: "What energy improvement are you considering?",
    options: [
      { value: "insulation", label: "Insulation: loft, cavity or solid wall", emoji: "🧱" },
      { value: "heatpump", label: "Heat pump: air source or ground source", emoji: "♨️" },
      { value: "air-to-air", label: "Air-to-air heat pump", emoji: "🌬️" },
      { value: "biomass", label: "Biomass boiler", emoji: "🌿" },
      { value: "solar", label: "Solar panels", emoji: "☀️" },
      { value: "controls", label: "Smart heating controls", emoji: "🌡️" },
      { value: "draught", label: "Draught proofing", emoji: "🪟" },
      { value: "glazing", label: "Double / triple glazing", emoji: "🪟" },
      { value: "ev", label: "EV chargepoint", emoji: "🔌" },
      { value: "boiler", label: "Boiler upgrade or replacement", emoji: "🔧" },
      { value: "other", label: "Something else", emoji: "➕" },
      { value: "unsure", label: "Not sure", emoji: "🤔" },
    ],
  },
];

/* ─── Result logic ─── */
const GB: Country[] = ["england", "wales", "scotland"];
const ENERGY_SAVING: Measure[] = ["insulation", "heatpump", "air-to-air", "biomass", "solar", "controls", "draught", "boiler"];
const HEAT_PUMP_MEASURES: Measure[] = ["heatpump", "air-to-air", "biomass"];

function getResults(a: Answers): Result[] {
  const results: Result[] = [];
  const { country, tenure, benefits, income, epc, heating, measure } = a;
  const poorEpc = epc === "d" || epc === "e" || epc === "fg" || epc === "unknown";
  const lowIncome = income === "under20" || income === "20-36";
  const incomeUnknown = income === "prefer";
  const benefitsYes = benefits === "yes";
  const benefitsUnsure = benefits === "unsure";

  // Warm Homes: Local Grant (England only)
  if (country === "england") {
    const eligibleTenure = tenure === "own" || tenure === "rent-private" || tenure === "rent-private-supportive";
    if (eligibleTenure && epc === "abc") {
      results.push({
        id: "warm-homes", name: "Warm Homes: Local Grant", status: "Active — England only",
        level: "unlikely",
        why: "The main route targets homes rated EPC D–G. With an A–C rating you're less likely to be prioritised.",
        mayCover: "Insulation, air source heat pumps, smart controls, solar panels and other council-agreed measures.",
        confirm: "Final eligibility, including your EPC band and income, is confirmed by your local council.",
        accreditation: "Councils typically require TrustMark / PAS 2035 accredited installers.",
        value: "Council-funded improvements where eligible.",
        govUrl: "https://www.gov.uk/apply-warm-homes-local-grant",
      });
    } else if (eligibleTenure && poorEpc && (lowIncome || benefitsYes || incomeUnknown || benefitsUnsure)) {
      const strong = benefitsYes || lowIncome;
      results.push({
        id: "warm-homes", name: "Warm Homes: Local Grant", status: "Active — England only",
        level: strong ? "strong" : "more-info",
        why: strong
          ? "Property is in England, EPC D–G, and income/benefits point toward the low-income route."
          : "Property is in England with an EPC D–G — eligibility may depend on income, benefits or your postcode area.",
        mayCover: "Wall, loft and underfloor insulation, air source heat pumps, smart controls, solar panels.",
        confirm: "Your local council usually arranges a survey and confirms suitable improvements. Private renters may need landlord involvement.",
        accreditation: "Councils typically require TrustMark / PAS 2030 / PAS 2035 accredited installers.",
        value: "Council-funded improvements may be available where eligible.",
        govUrl: "https://www.gov.uk/apply-warm-homes-local-grant",
      });
    }
  }

  // ECO4 (GB, not NI)
  if (country && GB.includes(country)) {
    const measureOk = !measure || ["insulation", "heatpump", "air-to-air", "solar", "controls", "boiler", "other", "unsure"].includes(measure);
    if ((benefitsYes || lowIncome || poorEpc) && measureOk) {
      const strong = benefitsYes || lowIncome;
      results.push({
        id: "eco4", name: "ECO4 — Energy Company Obligation", status: "Active — supplier-led",
        level: strong ? "strong" : "possible",
        why: strong
          ? "Household income/benefits and property condition match the fuel-poor / low-income focus of ECO4."
          : "Property condition may match ECO4 — final eligibility is assessed through the supplier and installer route.",
        mayCover: "Insulation, heating upgrades, whole-home retrofit and some low-carbon measures depending on assessment.",
        confirm: "Eligibility and funding depend on the property, assessment, supplier route and measures recommended.",
        accreditation: "Work is routed only to TrustMark / PAS 2035 accredited retrofit providers.",
        value: "Funding depends on the property, assessment and measures recommended.",
        govUrl: "https://www.gov.uk/energy-company-obligation",
      });
    }
  }

  // Boiler Upgrade Scheme (England & Wales)
  if (country === "england" || country === "wales") {
    if (measure && HEAT_PUMP_MEASURES.includes(measure)) {
      const existingLowCarbon = heating === "heatpump";
      const isOwner = tenure === "own" || tenure === "landlord";
      const valueMap: Record<string, string> = {
        heatpump: "£7,500 air source · £7,500 ground source heat pump",
        "air-to-air": "£2,500 air-to-air heat pump",
        biomass: "£5,000 biomass boiler (rural / off-gas-grid only)",
      };
      results.push({
        id: "bus", name: "Boiler Upgrade Scheme", status: "Active — England and Wales",
        level: existingLowCarbon ? "unlikely" : isOwner ? "strong" : "possible",
        why: existingLowCarbon
          ? "BUS is for replacing fossil fuel heating — replacing an existing heat pump is not eligible."
          : "You're in England/Wales and considering low-carbon heating that BUS can help fund.",
        mayCover: "A grant deducted from the installation cost by your certified installer.",
        confirm: "Ownership, existing heating type and property suitability are confirmed by the installer.",
        accreditation: "Must use an MCS-certified installer who applies for the grant.",
        value: valueMap[measure] || "Up to £7,500",
        govUrl: "https://www.gov.uk/apply-boiler-upgrade-scheme",
      });
    }
  }

  // 0% VAT relief (GB + NI, note NI differs)
  if (country && measure && ENERGY_SAVING.includes(measure)) {
    results.push({
      id: "vat", name: "0% VAT Relief on Energy-Saving Materials", status: "Available tax relief — not a grant",
      level: "possible",
      why: "Your chosen measure may be a qualifying energy-saving material that attracts VAT relief.",
      mayCover: "A VAT saving applied by the installer on the invoice for qualifying installed work.",
      confirm: country === "ni"
        ? "Rules differ in Northern Ireland — your installer confirms whether the relief applies."
        : "Your installer confirms whether the work qualifies for the relief.",
      accreditation: "Use a VAT-registered installer competent for the work (e.g. MCS, Gas Safe or NICEIC where relevant).",
      value: "Potential tax relief, not grant funding.",
      govUrl: "https://www.gov.uk/guidance/vat-on-energy-saving-materials-and-heating-equipment-notice-7086",
    });
  }

  // GBIS — limited
  if (country && GB.includes(country) && measure === "insulation" && (benefitsYes || lowIncome || poorEpc)) {
    results.push({
      id: "gbis", name: "Great British Insulation Scheme", status: "Limited / closing",
      level: "more-info",
      why: "You're considering insulation and may meet the criteria — but this route is winding down.",
      mayCover: "A single insulation measure such as loft, cavity or solid wall insulation depending on assessment.",
      confirm: "The central eligibility service has closed. Some suppliers may still accept applications. Installations must be completed by 31 March 2026.",
      accreditation: "Supplier-appointed, TrustMark-registered insulation installers.",
      value: "Availability is limited — check with your energy supplier.",
      govUrl: "https://www.gov.uk/apply-great-british-insulation-scheme",
    });
  }

  // EV chargepoint
  if (measure === "ev") {
    results.push({
      id: "ev", name: "EV Chargepoint Grant", status: "Check latest rules",
      level: "more-info",
      why: "You're considering an EV chargepoint — some support may be available in certain circumstances.",
      mayCover: "Supply and installation of a home EV chargepoint, subject to current scheme rules.",
      confirm: "Eligibility and grant value can change. Check current official rules before relying on this.",
      accreditation: "Use an OZEV-approved installer where required.",
      value: "Eligibility and grant value can change — check current official rules.",
      govUrl: "https://www.gov.uk/government/collections/government-grants-for-low-emission-vehicles",
    });
  }

  return results;
}

function getNationNote(country?: Country): string | null {
  if (country === "scotland") return "You selected Scotland. Warm Homes: Local Grant is England-only — different national schemes (such as Home Energy Scotland support) may apply. ECO4 and 0% VAT relief may still be relevant.";
  if (country === "wales") return "You selected Wales. Warm Homes: Local Grant is England-only — the Welsh Government's Nest scheme may apply instead. ECO4, BUS and 0% VAT relief may still be relevant.";
  if (country === "ni") return "You selected Northern Ireland. ECO4 and Warm Homes: Local Grant do not apply here — different Northern Ireland schemes may apply. VAT relief rules also differ in Northern Ireland.";
  return null;
}

/* ─── UI helpers ─── */
const LEVEL_META: Record<MatchLevel, { label: string; badge: string }> = {
  strong: { label: "Strong potential match", badge: "bg-[#16A34A] text-white" },
  possible: { label: "Possible funding route", badge: "bg-teal text-cream" },
  "more-info": { label: "More information needed", badge: "bg-amber-500 text-white" },
  unlikely: { label: "Unlikely based on current answers", badge: "bg-navy/40 text-cream" },
};

const StepIndicator = ({ current, total }: { current: number; total: number }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex gap-1 flex-1">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`h-1.5 rounded-sm flex-1 transition-colors ${i <= current ? "bg-[#16A34A]" : "bg-cream/15"}`} />
      ))}
    </div>
    <span className="font-mono text-[11px] text-cream/50 ml-4">{current + 1} of {total}</span>
  </div>
);

/* Result card — cream card with green header */
const ResultCard = ({ r }: { r: Result }) => {
  const meta = LEVEL_META[r.level];
  return (
    <div className="rounded-xl overflow-hidden bg-cream border border-[#16A34A]/30">
      <div className="px-5 py-4" style={{ background: "linear-gradient(135deg,#166534 0%,#15803D 100%)" }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-heading text-cream text-xl tracking-wide leading-tight">{r.name}</h3>
            <span className="font-mono text-[11px] text-cream/70 uppercase tracking-wider">{r.status}</span>
          </div>
          <span className={`font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full ${meta.badge}`}>
            {meta.label}
          </span>
        </div>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-navy/50 mb-1">Why it appeared</p>
          <p className="font-body text-sm text-body-text leading-relaxed">{r.why}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-navy/50 mb-1">What it may cover</p>
          <p className="font-body text-sm text-body-text leading-relaxed">{r.mayCover}</p>
        </div>
        {r.value && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-navy/50">Value</span>
            <span className="font-body text-sm text-[#15803D] font-medium">{r.value}</span>
          </div>
        )}
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2">
          <p className="font-body text-xs text-amber-800 leading-relaxed">
            <strong>Needs confirming:</strong> {r.confirm}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-navy/40 flex-shrink-0 mt-0.5" />
          <span className="font-body text-xs text-body-text/70">{r.accreditation}</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            to="/post-a-job?green=1"
            className="font-mono text-xs text-cream bg-[#16A34A] px-4 py-2.5 rounded-lg hover:bg-[#15803D] transition-colors"
          >
            Post a project brief →
          </Link>
          {r.govUrl && (
            <a
              href={r.govUrl} target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs text-navy border border-navy/25 px-4 py-2.5 rounded-lg hover:bg-navy/5 transition-colors inline-flex items-center gap-1.5"
            >
              View official scheme details <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
const GreenGrantsPage = () => {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Answers>({});
  const checkerRef = useRef<HTMLDivElement>(null);

  const TOTAL = QUESTIONS.length;
  const showResults = step === TOTAL;
  const results = showResults ? getResults(answers) : [];
  const nationNote = showResults ? getNationNote(answers.country) : null;
  const strongCount = results.filter((r) => r.level === "strong").length;
  const needsAccred = results.some((r) => /trustmark|mcs|ozev|pas|gas safe|niceic/i.test(r.accreditation));

  const currentQ = QUESTIONS[step];

  const selectAnswer = (value: string) => {
    const next = { ...answers, [currentQ.id]: value };
    setAnswers(next);
    setTimeout(() => setStep((s) => s + 1), 120);
  };

  const scrollToChecker = () => {
    setStep(0);
    setTimeout(() => checkerRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const reset = () => { setStep(0); setAnswers({}); };

  const cardClass = (isActive: boolean) =>
    `cursor-pointer rounded-xl border px-5 py-4 transition-all text-left flex items-center gap-3 ${
      isActive ? "border-[#16A34A] bg-[#16A34A]/10 text-cream" : "border-cream/15 bg-cream/[0.06] text-cream/80 hover:border-cream/30"
    }`;

  return (
    <AppShell>
      <SEO
        title="Green Grants Guidance Checker — ProGrafter"
        description="Check which UK energy grant funding routes may apply to your home — guidance only. Warm Homes, ECO4, Boiler Upgrade Scheme and more."
        path="/green"
        jsonLd={buildServiceJsonLd({
          name: "Green Grants Guidance Checker",
          description: "Guidance on which UK energy funding routes may apply to your home. Not an official eligibility checker.",
          url: "https://prografter.co.uk/green",
          serviceType: "Energy grant funding guidance",
          price: "0.00",
        })}
      />

      {/* HERO */}
      <section className="pt-28 pb-14 px-6 bg-navy">
        <div className="max-w-3xl mx-auto text-center">
          <span className="font-mono text-xs text-teal uppercase tracking-widest mb-4 block">Green Grants Guidance Checker</span>
          <h1 className="font-heading text-cream text-[38px] sm:text-[50px] md:text-[58px] leading-[0.97] tracking-wide mb-5">
            COULD YOU GET HELP FUNDING ENERGY IMPROVEMENTS TO YOUR HOME?
          </h1>
          <p className="font-body text-cream/65 text-sm md:text-base max-w-2xl mx-auto leading-relaxed mb-7">
            Several UK schemes may help with insulation, heating upgrades, solar panels, heat pumps and
            other energy-saving improvements. Answer a few questions to see which funding routes may be
            worth checking.
          </p>
          <button
            onClick={scrollToChecker}
            className="inline-block bg-teal text-cream font-mono text-sm px-8 py-3.5 rounded-xl hover:bg-teal-hover transition-colors shadow-lg shadow-teal/20"
          >
            Check funding routes →
          </button>
          <p className="font-body text-cream/40 text-xs max-w-xl mx-auto leading-relaxed mt-5">
            ProGrafter is not a government body and does not approve grant eligibility. This page provides
            guidance only. Always check official scheme guidance before making decisions.
          </p>
        </div>
      </section>

      {/* SCHEME CARDS */}
      <GreenSchemesBreakdown onCheckEligibility={scrollToChecker} />

      {/* CHECKER */}
      <section className="px-6 pt-16 pb-24 bg-navy" ref={checkerRef}>
        <div className="max-w-2xl mx-auto">
          {step >= 0 && !showResults && currentQ && (
            <>
              <StepIndicator current={step} total={TOTAL} />
              <p className="font-mono text-xs text-teal uppercase tracking-widest mb-2">🌿 Green Grants Guidance Checker</p>
              <h2 className="font-heading text-cream text-2xl md:text-3xl mb-2 leading-tight">{currentQ.question}</h2>
              {currentQ.helper && <p className="font-body text-cream/55 text-sm mb-5 leading-relaxed">{currentQ.helper}</p>}
              <div className="grid grid-cols-1 gap-3">
                {currentQ.options.map((opt) => (
                  <button key={opt.value} onClick={() => selectAnswer(opt.value)} className={cardClass(answers[currentQ.id] === opt.value)}>
                    {opt.emoji && <span className="text-lg flex-shrink-0">{opt.emoji}</span>}
                    <span className="font-body text-sm">{opt.label}</span>
                    <span className="ml-auto text-cream/30">→</span>
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 font-mono text-sm text-cream/60 hover:text-cream transition-colors mt-6">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
            </>
          )}

          {/* RESULTS */}
          {showResults && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="w-5 h-5 text-[#16A34A]" />
                  <p className="font-mono text-xs text-[#16A34A] uppercase tracking-widest">Your guidance results</p>
                </div>
                <h2 className="font-heading text-cream text-3xl md:text-4xl leading-tight mb-2">
                  {results.length > 0 ? "Potential funding routes found" : "No clear funding routes right now"}
                </h2>
                <p className="font-body text-cream/65 text-sm leading-relaxed">
                  {results.length > 0
                    ? "Based on your answers, these routes may be worth checking. This is not an approval. Final eligibility is confirmed by the relevant scheme provider, local authority, energy supplier or accredited installer."
                    : "Based on your answers we couldn't identify a strong route. Schemes change often — it's still worth checking official guidance or speaking to an accredited installer."}
                </p>
              </div>

              {results.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="font-mono text-[11px] font-semibold text-cream px-2.5 py-1 rounded-full bg-cream/10 border border-cream/20">
                    📋 {results.length} potential route{results.length !== 1 ? "s" : ""}
                  </span>
                  {strongCount > 0 && (
                    <span className="font-mono text-[11px] font-semibold text-cream px-2.5 py-1 rounded-full bg-[#16A34A]/25 border border-[#16A34A]/40">
                      ✅ {strongCount} strong match{strongCount !== 1 ? "es" : ""}
                    </span>
                  )}
                  {needsAccred && (
                    <span className="font-mono text-[11px] font-semibold text-cream px-2.5 py-1 rounded-full bg-cream/10 border border-cream/20">
                      🔒 Accreditation required
                    </span>
                  )}
                </div>
              )}

              {nationNote && (
                <div className="flex items-start gap-3 bg-teal/10 border border-teal/30 rounded-xl px-5 py-4">
                  <AlertCircle className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                  <p className="font-body text-sm text-cream/75 leading-relaxed">{nationNote}</p>
                </div>
              )}

              {results.map((r) => <ResultCard key={r.id} r={r} />)}

              {/* Closed schemes */}
              <div className="rounded-xl border border-cream/15 bg-cream/[0.05] px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-cream/40 mb-1">Closed scheme</p>
                <p className="font-body text-sm text-cream/60 leading-relaxed">
                  <strong className="text-cream/80">Home Upgrade Grant is closed.</strong> Warm Homes: Local Grant may now be the relevant route in England.
                </p>
              </div>

              {/* Result disclaimer */}
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/40 px-5 py-4">
                <p className="font-body text-xs text-amber-200 leading-relaxed">
                  Final eligibility, funding amount and installer requirements are confirmed by the relevant
                  scheme provider, local authority, energy supplier or accredited installer. Scheme rules can change.
                </p>
              </div>

              {/* Commercial positioning */}
              <div className="rounded-2xl bg-cream p-6 md:p-8">
                <h3 className="font-heading text-navy text-2xl md:text-3xl tracking-wide leading-tight mb-3">
                  Funding is only useful if the work is done properly.
                </h3>
                <p className="font-body text-body-text text-sm leading-relaxed mb-4">
                  Grant-funded retrofit work often needs the right assessment, paperwork, installer
                  accreditation and completion evidence. ProGrafter helps homeowners understand which
                  funding routes may apply and connect with suitably verified trades for the work required.
                </p>
                <ul className="space-y-1.5 mb-4">
                  {[
                    "TrustMark / PAS 2030 / PAS 2035 where retrofit schemes require them",
                    "MCS for heat pumps and solar where relevant",
                    "OZEV-approved installers for EV chargepoints where required",
                    "Gas Safe for gas-related works",
                    "NICEIC / NAPIT or equivalent competent person schemes for electrical work",
                  ].map((a) => (
                    <li key={a} className="flex gap-2 font-body text-sm text-body-text">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
                <p className="font-mono text-xs text-body-text/60 mb-5">
                  Relevant accreditation is checked before matching for grant-funded work.
                </p>
                <Link
                  to="/post-a-job?green=1"
                  className="inline-block bg-[#16A34A] text-white font-mono text-sm py-3.5 px-8 rounded-xl hover:bg-[#15803D] transition-colors tracking-wider uppercase"
                >
                  Post a grant-funded project brief →
                </Link>
                <p className="font-body text-xs text-body-text/60 mt-3">
                  Where grant-funded work requires accreditation, ProGrafter will only match you with
                  installers who meet the relevant scheme requirements.
                </p>
              </div>

              {/* Start again */}
              <div className="text-center pt-1">
                <button onClick={reset} className="font-mono text-xs text-cream/50 hover:text-cream/80 underline underline-offset-4 transition-colors">
                  Start again
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
