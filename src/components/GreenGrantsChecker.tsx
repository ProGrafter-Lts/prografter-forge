import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Green palette — kept distinct for the grants visual identity, but typography
// follows the site system (Bebas Neue headings, DM Sans body, DM Mono labels).
const G = {
  g900: "#14532D", g800: "#166534", g700: "#15803D", g600: "#16A34A",
  g500: "#22C55E", g400: "#4ADE80", g200: "#BBF7D0", g100: "#DCFCE7", g50: "#F0FDF4",
};

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
interface QOption { value: string; label: string; icon?: string }
interface Question { id: keyof Answers; question: string; hint?: string; options: QOption[] }

const QUESTIONS: Question[] = [
  {
    id: "country", question: "Where is the property?", hint: "Grant routes differ across the UK.",
    options: [
      { value: "england", label: "England", icon: "🏴" },
      { value: "wales", label: "Wales", icon: "🏴" },
      { value: "scotland", label: "Scotland", icon: "🏴" },
      { value: "ni", label: "Northern Ireland", icon: "🇬🇧" },
    ],
  },
  {
    id: "tenure", question: "Do you own or rent your home?",
    hint: "Some schemes are only available to certain property types or may need landlord involvement.",
    options: [
      { value: "own", label: "I own my home", icon: "🔑" },
      { value: "rent-private", label: "I privately rent", icon: "📋" },
      { value: "rent-private-supportive", label: "I privately rent and my landlord is supportive", icon: "🤝" },
      { value: "social", label: "Social housing / council / housing association", icon: "🏛️" },
      { value: "landlord", label: "I am a landlord checking for my property", icon: "🏘️" },
    ],
  },
  {
    id: "benefits", question: "Does your household receive any means-tested benefits?",
    hint: "Examples may include Universal Credit, Housing Benefit, Pension Credit and other qualifying benefits depending on the scheme.",
    options: [
      { value: "yes", label: "Yes — we receive qualifying benefits", icon: "✅" },
      { value: "no", label: "No", icon: "❌" },
      { value: "unsure", label: "Not sure — I need to check", icon: "🤔" },
    ],
  },
  {
    id: "income", question: "What is your approximate household income?",
    hint: "Some schemes use income thresholds, while others also consider benefits, postcode area or property condition.",
    options: [
      { value: "under20", label: "Under £20,000", icon: "💷" },
      { value: "20-36", label: "£20,000–£36,000", icon: "💷" },
      { value: "over36", label: "Over £36,000", icon: "💷" },
      { value: "prefer", label: "Prefer not to say / not sure", icon: "🤐" },
    ],
  },
  {
    id: "epc", question: "What is your property's EPC rating?",
    hint: "You can find this on your EPC certificate or the official EPC register.",
    options: [
      { value: "abc", label: "A, B or C — good rating", icon: "🟢" },
      { value: "d", label: "D", icon: "🟡" },
      { value: "e", label: "E", icon: "🟠" },
      { value: "fg", label: "F or G — poor rating", icon: "🔴" },
      { value: "unknown", label: "I don't know my EPC rating", icon: "❓" },
    ],
  },
  {
    id: "heating", question: "What heating system do you currently have?",
    hint: "This helps identify whether heating upgrade schemes may apply.",
    options: [
      { value: "gas", label: "Gas boiler", icon: "🔥" },
      { value: "oil", label: "Oil boiler", icon: "🛢️" },
      { value: "lpg", label: "LPG boiler", icon: "🔥" },
      { value: "electric", label: "Electric heating", icon: "⚡" },
      { value: "coal", label: "Coal / solid fuel", icon: "🪨" },
      { value: "heatpump", label: "Existing heat pump", icon: "♨️" },
      { value: "none", label: "No central heating", icon: "🚫" },
      { value: "unsure", label: "Not sure", icon: "🤔" },
    ],
  },
  {
    id: "gas", question: "Is the property connected to mains gas?",
    hint: "This can affect some low-carbon heating and retrofit routes.",
    options: [
      { value: "yes", label: "Yes", icon: "✅" },
      { value: "no", label: "No", icon: "❌" },
      { value: "unsure", label: "Not sure", icon: "🤔" },
    ],
  },
  {
    id: "measure", question: "What energy improvement are you considering?",
    hint: "Choose the main improvement you are interested in. You can discuss the full scope later with an installer.",
    options: [
      { value: "insulation", label: "Insulation: loft, cavity or solid wall", icon: "🧱" },
      { value: "heatpump", label: "Heat pump: air source or ground source", icon: "♨️" },
      { value: "air-to-air", label: "Air-to-air heat pump", icon: "🌬️" },
      { value: "biomass", label: "Biomass boiler", icon: "🌿" },
      { value: "solar", label: "Solar panels", icon: "☀️" },
      { value: "controls", label: "Smart heating controls", icon: "🌡️" },
      { value: "draught", label: "Draught proofing", icon: "🪟" },
      { value: "glazing", label: "Double / triple glazing", icon: "🪟" },
      { value: "ev", label: "EV chargepoint", icon: "🔌" },
      { value: "boiler", label: "Boiler upgrade or replacement", icon: "🔧" },
      { value: "other", label: "Something else", icon: "➕" },
      { value: "unsure", label: "Not sure", icon: "🤔" },
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
        mayCover: "May fund free energy-saving improvements through participating local authorities in England. Measures may include insulation, air source heat pumps, smart controls and solar panels.",
        confirm: "Your local council confirms final eligibility and suitable measures. Private renters may need landlord involvement.",
        accreditation: "Councils typically require TrustMark / PAS 2030 / PAS 2035 accredited installers.",
        value: "Council-funded improvements may be available where eligible.",
        govUrl: "https://www.gov.uk/apply-warm-homes-local-grant",
      });
    }
  }

  // ECO4 (Great Britain, not NI)
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
        mayCover: "Energy supplier-funded energy efficiency improvements for low-income, fuel-poor and vulnerable households. Measures may include insulation, heating upgrades, whole-home retrofit and some low-carbon measures.",
        confirm: "Final eligibility and measures are assessed through the supplier or installer route.",
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
        mayCover: "Installer-led grant. The installer applies and deducts the grant from the quoted installation cost where eligible.",
        confirm: "Ownership, existing heating type and property suitability are confirmed by the installer.",
        accreditation: "Must use an MCS-certified installer who applies for the grant.",
        value: valueMap[measure] || "Up to £7,500",
        govUrl: "https://www.gov.uk/apply-boiler-upgrade-scheme",
      });
    }
  }

  // 0% VAT relief (tax relief, not a grant)
  if (country && measure && ENERGY_SAVING.includes(measure)) {
    results.push({
      id: "vat", name: "0% VAT Relief on Energy-Saving Materials", status: "Tax relief — not a grant",
      level: "possible",
      why: "Your chosen measure may be a qualifying energy-saving material that attracts VAT relief.",
      mayCover: "Potential tax relief, not grant funding. VAT relief may apply to qualifying installed energy-saving materials.",
      confirm: country === "ni"
        ? "Rules differ in Northern Ireland — your installer confirms whether the relief applies."
        : "Your installer confirms whether the work qualifies for the relief.",
      accreditation: "Use a VAT-registered installer competent for the work (e.g. MCS, Gas Safe or NICEIC where relevant).",
      value: "Potential tax relief, not grant funding.",
      govUrl: "https://www.gov.uk/guidance/vat-on-energy-saving-materials-and-heating-equipment-notice-7086",
    });
  }

  // GBIS — limited / check with supplier
  if (country && GB.includes(country) && measure === "insulation" && (benefitsYes || lowIncome || poorEpc)) {
    results.push({
      id: "gbis", name: "Great British Insulation Scheme", status: "Limited / check with supplier",
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
      confirm: "Eligibility and grant value can change. Check current official rules and use an OZEV-approved installer where required.",
      accreditation: "Use an OZEV-approved installer where required.",
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

const LEVEL_META: Record<MatchLevel, { label: string; badgeStyle: React.CSSProperties }> = {
  strong: { label: "Strong potential match", badgeStyle: { background: G.g600, color: "#fff" } },
  possible: { label: "Possible funding route", badgeStyle: { background: G.g200, color: G.g800 } },
  "more-info": { label: "More information needed", badgeStyle: { background: "#FDE68A", color: "#92400E" } },
  unlikely: { label: "Unlikely based on current answers", badgeStyle: { background: "#E5E7EB", color: "#374151" } },
};

const CLOSED_NOTE = "Home Upgrade Grant is closed. Warm Homes: Local Grant may now be the relevant route in England.";

const SchemeResult = ({ result, onPostJob }: { result: Result; onPostJob: () => void }) => {
  const meta = LEVEL_META[result.level];
  return (
    <div className="rounded-2xl overflow-hidden mb-3 bg-white" style={{ border: `2px solid ${G.g200}` }}>
      <div className="px-4 py-3 flex justify-between items-start gap-3 flex-wrap" style={{ background: `linear-gradient(135deg, ${G.g800} 0%, ${G.g700} 100%)` }}>
        <div>
          <p className="font-mono text-sm font-bold text-cream m-0">{result.name}</p>
          <p className="font-mono text-[10px] mt-1 mb-0 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.7)" }}>{result.status}</p>
        </div>
        <span className="font-mono text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide" style={meta.badgeStyle}>
          {meta.label}
        </span>
      </div>
      <div className="px-4 py-3 space-y-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: G.g700 }}>Why it appeared</p>
          <p className="font-body text-xs leading-relaxed text-secondary-text">{result.why}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: G.g700 }}>What it may cover</p>
          <p className="font-body text-xs leading-relaxed text-secondary-text">{result.mayCover}</p>
        </div>
        {result.value && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: G.g700 }}>Value</span>
            <span className="font-body text-sm font-medium" style={{ color: G.g700 }}>{result.value}</span>
          </div>
        )}
        <div className="rounded-lg px-3 py-2" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
          <p className="font-body text-xs leading-relaxed" style={{ color: "#92400E" }}>
            <strong className="font-semibold">Needs confirming:</strong> {result.confirm}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-sm flex-shrink-0">🔎</span>
          <span className="font-body text-xs text-secondary-text">{result.accreditation}</span>
        </div>
        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            onClick={onPostJob}
            className="flex-1 min-w-[200px] font-mono text-xs font-bold text-white rounded-lg py-2.5 hover:opacity-90 transition-opacity"
            style={{ background: G.g600 }}
          >
            Post a grant-funded project brief →
          </button>
          {result.govUrl && (
            <a
              href={result.govUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 min-w-[200px] font-mono text-xs font-semibold rounded-lg py-2.5 text-center inline-flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ border: `1.5px solid ${G.g200}`, color: G.g700 }}
            >
              View official scheme details ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default function GreenGrantsChecker() {
  const navigate = useNavigate();
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Answers>({});
  const [results, setResults] = useState<Result[]>([]);

  const currentQ = QUESTIONS[step];
  const TOTAL = QUESTIONS.length;

  const selectAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQ.id]: value } as Answers;
    setAnswers(newAnswers);
    if (step < TOTAL - 1) {
      setStep(s => s + 1);
    } else {
      setResults(getResults(newAnswers));
      setStep(TOTAL);
    }
  };

  const reset = () => { setStep(-1); setAnswers({}); setResults([]); };
  const postJob = () => navigate("/post-job-brief");

  const strongCount = results.filter(r => r.level === "strong").length;
  const nationNote = getNationNote(answers.country);

  const Wrap = ({ children }: { children: React.ReactNode }) => (
    <section className="bg-cream py-16 md:py-24 px-6">
      <div className="max-w-[1100px] mx-auto">{children}</div>
    </section>
  );

  // ── Intro ──────────────────────────────────────────────
  if (step === -1) return (
    <Wrap>
      <div
        className="rounded-3xl overflow-hidden relative"
        style={{ background: `linear-gradient(135deg, ${G.g900} 0%, ${G.g700} 60%, ${G.g600} 100%)` }}
      >
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 50%, #fff 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div className="relative px-8 py-12 md:px-12 md:py-16">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <span className="text-sm">🌿</span>
            <span className="font-mono text-[11px] font-bold tracking-widest uppercase" style={{ color: G.g400 }}>Green Grants Guidance Checker</span>
          </div>

          <h2 className="font-heading text-cream text-[40px] md:text-[58px] leading-[0.95] mb-4">
            Which funding routes<br />
            <span style={{ color: G.g400 }}>may apply to your home?</span>
          </h2>

          <p className="font-body text-base md:text-lg leading-relaxed max-w-[640px] mb-6 font-light" style={{ color: "rgba(255,255,255,0.85)" }}>
            Check which funding routes may apply to your home. This is guidance only — final eligibility is confirmed by the scheme provider, local authority, energy supplier or accredited installer.
          </p>

          <button
            onClick={() => setStep(0)}
            className="inline-flex items-center gap-2.5 bg-white rounded-xl px-7 py-4 font-mono text-sm font-bold hover:opacity-95 transition-opacity"
            style={{ color: G.g800, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
          >
            <span className="text-lg">🌿</span>
            Check funding routes — free, 8 quick questions
            <span>→</span>
          </button>
          <p className="font-body text-[11px] mt-4 leading-relaxed max-w-[640px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            Information is guidance only and may change. ProGrafter is not a government body and does not approve grant eligibility. Always check official scheme guidance before making decisions.
          </p>
        </div>
      </div>
    </Wrap>
  );

  // ── Question step ──────────────────────────────────────
  if (step >= 0 && step < TOTAL) return (
    <Wrap>
      <div
        className="rounded-3xl px-8 py-10 md:px-12"
        style={{ background: `linear-gradient(135deg, ${G.g900} 0%, ${G.g700} 100%)` }}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-1 flex-1">
            {QUESTIONS.map((_, i) => (
              <div key={i} className="h-1.5 rounded-sm flex-1 transition-colors"
                style={{ background: i <= step ? G.g400 : "rgba(255,255,255,0.15)" }} />
            ))}
          </div>
          <span className="font-mono text-[11px] ml-4" style={{ color: "rgba(255,255,255,0.5)" }}>{step + 1} of {TOTAL}</span>
        </div>
        <div className="mb-6">
          <p className="font-mono text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: G.g400 }}>🌿 Green Grants Guidance Checker</p>
          <h3 className="font-heading text-cream text-3xl md:text-4xl leading-[1.05] mb-1.5">{currentQ.question}</h3>
          {currentQ.hint && <p className="font-body text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{currentQ.hint}</p>}
        </div>
        <div className="flex flex-col gap-2">
          {currentQ.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => selectAnswer(opt.value)}
              className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-left text-white w-full transition-colors hover:bg-white/15"
              style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.15)" }}
            >
              <span className="text-xl flex-shrink-0">{opt.icon}</span>
              <span className="font-body text-sm font-medium leading-snug">{opt.label}</span>
              <span className="ml-auto text-base flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>→</span>
            </button>
          ))}
        </div>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="font-mono text-[11px] mt-4 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>← Back</button>
        )}
      </div>
    </Wrap>
  );

  // ── Results ────────────────────────────────────────────
  return (
    <Wrap>
      <div>
        <div
          className="rounded-t-3xl px-8 py-8"
          style={{ background: `linear-gradient(135deg, ${G.g900} 0%, ${G.g700} 100%)` }}
        >
          <p className="font-mono text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: G.g400 }}>🌿 Your guidance results</p>
          <h3 className="font-heading text-cream text-4xl md:text-5xl leading-[1.05] mb-2">
            {results.length > 0 ? "Potential funding routes found" : "No clear routes from these answers"}
          </h3>
          <p className="font-body text-base leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.8)" }}>
            {results.length > 0
              ? "Based on your answers, these schemes may be worth checking. This is not an approval. Final eligibility is confirmed by the relevant scheme provider, local authority, energy supplier or accredited installer."
              : "We couldn't identify a clear national funding route from your answers. Your local authority or energy supplier may still have options worth checking."}
          </p>
          {results.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {[
                { label: `${results.length} potential route${results.length !== 1 ? "s" : ""} found`, icon: "📋" },
                strongCount > 0
                  ? { label: `${strongCount} strong potential match${strongCount !== 1 ? "es" : ""}`, icon: "✅" }
                  : { label: "Possible routes — more info needed", icon: "🔍" },
                { label: "Accreditation may be required", icon: "🔒" },
              ].map(p => (
                <span
                  key={p.label}
                  className="font-mono text-[11px] font-semibold text-white px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  {p.icon} {p.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div
          className="rounded-b-3xl p-6 border-2 border-t-0"
          style={{ background: G.g50, borderColor: G.g200 }}
        >
          {nationNote && (
            <div className="rounded-xl px-4 py-3 mb-3.5 font-body text-xs leading-relaxed" style={{ background: G.g100, border: `1px solid ${G.g200}`, color: G.g800 }}>
              <strong className="font-semibold">Note for your nation:</strong> {nationNote}
            </div>
          )}

          {results.map(r => (
            <SchemeResult key={r.id} result={r} onPostJob={postJob} />
          ))}

          {/* Closed schemes note */}
          <div className="rounded-xl px-4 py-2.5 mb-3.5 font-body text-xs leading-relaxed" style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", color: "#4B5563" }}>
            <strong className="font-semibold">Closed schemes:</strong> {CLOSED_NOTE}
          </div>

          {/* Result disclaimer */}
          <div
            className="rounded-xl px-4 py-2.5 mb-3.5 font-body text-xs leading-relaxed"
            style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}
          >
            <strong className="font-semibold">Important:</strong> Final eligibility, funding amount and installer requirements are confirmed by the relevant scheme provider, local authority, energy supplier or accredited installer. ProGrafter is not a government body and does not approve grant eligibility.
          </div>

          {/* Commercial trust section */}
          <div className="rounded-2xl p-6 mb-3.5" style={{ background: "#fff", border: `1px solid ${G.g200}` }}>
            <p className="font-heading text-2xl leading-tight mb-2" style={{ color: G.g800 }}>Funding is only useful if the work is done properly.</p>
            <p className="font-body text-sm leading-relaxed text-secondary-text mb-3">
              Grant-funded retrofit work often needs the right assessment, paperwork, installer accreditation and completion evidence. ProGrafter helps homeowners understand which funding routes may apply and connect with suitably verified trades for the work required.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                "TrustMark / PAS 2030 / PAS 2035 — retrofit schemes",
                "MCS — heat pumps and solar",
                "OZEV-approved — EV chargepoints",
                "Gas Safe — gas works",
                "NICEIC / NAPIT — electrical work",
              ].map(item => (
                <span key={item} className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border" style={{ background: G.g100, color: G.g700, borderColor: G.g200 }}>{item}</span>
              ))}
            </div>
            <p className="font-body text-xs italic text-secondary-text">Relevant accreditation is checked before matching for grant-funded work.</p>
          </div>

          {/* Primary CTA */}
          <div className="rounded-2xl p-6 text-center" style={{ background: G.g700 }}>
            <p className="font-heading text-cream text-2xl md:text-3xl leading-none mb-1.5">Post a grant-funded project brief</p>
            <p className="font-body text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.75)" }}>
              Where grant-funded work requires accreditation, ProGrafter will only match you with installers who meet the relevant scheme requirements.
            </p>
            <button
              onClick={postJob}
              className="inline-flex bg-white rounded-xl px-7 py-3.5 font-mono text-sm font-bold mb-2 hover:opacity-95 transition-opacity"
              style={{ color: G.g800 }}
            >
              Post a grant-funded project brief →
            </button>
            <div>
              <button onClick={reset} className="font-mono text-[11px] uppercase tracking-wider hover:text-white/80" style={{ color: "rgba(255,255,255,0.5)" }}>Start again</button>
            </div>
          </div>
        </div>
      </div>
    </Wrap>
  );
}
