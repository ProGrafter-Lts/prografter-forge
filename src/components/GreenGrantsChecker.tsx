import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Green palette — kept distinct for the grants visual identity, but typography
// follows the site system (Bebas Neue headings, DM Sans body, DM Mono labels).
const G = {
  g900: "#14532D", g800: "#166534", g700: "#15803D", g600: "#16A34A",
  g500: "#22C55E", g400: "#4ADE80", g200: "#BBF7D0", g100: "#DCFCE7", g50: "#F0FDF4",
};

const SCHEMES: Record<string, { name: string; full: string; max: string; covers: string[]; who: string; deadline: string; funded_by: string; url: string }> = {
  eco4: {
    name: "ECO4", full: "Energy Company Obligation 4", max: "£15,000+",
    covers: ["Insulation (loft, cavity, solid wall)", "Heat pumps", "Solar PV", "Boiler upgrades", "Heating controls"],
    who: "Low income households, benefits recipients, or properties rated EPC D–G",
    deadline: "March 2026", funded_by: "Energy suppliers (obligated by government)",
    url: "https://www.gov.uk/energy-company-obligation",
  },
  bus: {
    name: "BUS", full: "Boiler Upgrade Scheme", max: "£7,500",
    covers: ["Air source heat pump", "Ground source heat pump", "Biomass boiler (rural only)"],
    who: "Homeowners replacing fossil fuel heating with low-carbon alternative",
    deadline: "March 2028", funded_by: "Department for Energy Security & Net Zero",
    url: "https://www.gov.uk/apply-boiler-upgrade-scheme",
  },
  gbis: {
    name: "GBIS", full: "Great British Insulation Scheme", max: "£10,000",
    covers: ["Loft insulation", "Cavity wall insulation", "Solid wall insulation", "Underfloor insulation"],
    who: "Properties EPC D–G, or low income EPC A–G",
    deadline: "March 2026", funded_by: "Energy suppliers",
    url: "https://www.gov.uk/apply-great-british-insulation-scheme",
  },
  laflex: {
    name: "LA Flex", full: "Local Authority Flexible Eligibility", max: "£10,000",
    covers: ["Insulation", "Heating upgrades", "Renewable energy", "Draught proofing"],
    who: "Determined by your local authority — often broader than ECO4",
    deadline: "Ongoing — varies by council", funded_by: "Local authority + energy suppliers",
    url: "https://www.gov.uk/improve-energy-efficiency",
  },
};

type Answers = Record<string, string>;
type Result = { scheme: string; confidence: "high" | "possible"; reason: string };

const checkEligibility = (answers: Answers): Result[] => {
  const results: Result[] = [];
  const { tenure, benefits, income, epc, project } = answers;

  const eco4_income = income === "under_31k" || income === "under_20k";
  const eco4_benefits = benefits === "yes";
  const eco4_epc = ["d", "e", "f", "g", "unknown"].includes(epc);
  const eco4_project = ["insulation", "heat_pump", "solar", "boiler", "heating"].includes(project);
  const eco4_tenure = tenure === "owned" || tenure === "rented_private";
  if (eco4_tenure && eco4_project && (eco4_benefits || eco4_income) && eco4_epc) {
    results.push({ scheme: "eco4", confidence: "high", reason: "Income/benefits + EPC rating + project type all match ECO4 criteria." });
  } else if (eco4_tenure && eco4_project && eco4_epc) {
    results.push({ scheme: "eco4", confidence: "possible", reason: "EPC rating and project type match — eligibility depends on household income or benefits." });
  }

  const bus_project = ["heat_pump", "biomass"].includes(project);
  if (tenure === "owned" && bus_project) {
    results.push({ scheme: "bus", confidence: "high", reason: "Homeowners replacing fossil fuel heating with a heat pump qualify directly — no income threshold." });
  }

  const gbis_project = project === "insulation";
  const gbis_epc = ["d", "e", "f", "g", "unknown"].includes(epc);
  const gbis_income = income === "under_31k" || income === "under_20k";
  if (gbis_project && gbis_epc) {
    results.push({
      scheme: "gbis", confidence: gbis_income ? "high" : "possible",
      reason: gbis_income ? "EPC rating + income level both match GBIS criteria." : "EPC rating matches — income may affect grant level.",
    });
  }

  if (results.length === 0 || results.every(r => r.confidence === "possible")) {
    results.push({ scheme: "laflex", confidence: "possible", reason: "Your local authority may have broader eligibility than the national schemes. Worth checking with your council." });
  }

  return results;
};

const QUESTIONS = [
  {
    id: "tenure", question: "Do you own or rent your home?",
    hint: "Grant eligibility differs for owners and tenants",
    options: [
      { value: "owned", label: "I own my home", icon: "🏠" },
      { value: "rented_social", label: "Social housing (council/housing association)", icon: "🏢" },
      { value: "rented_private", label: "Private rental", icon: "🔑" },
    ],
  },
  {
    id: "benefits", question: "Does your household receive any means-tested benefits?",
    hint: "e.g. Universal Credit, Housing Benefit, Pension Credit, Child Tax Credit, ESA, JSA",
    options: [
      { value: "yes", label: "Yes — we receive qualifying benefits", icon: "✅" },
      { value: "no", label: "No", icon: "❌" },
      { value: "unsure", label: "Not sure — I'd need to check", icon: "🤔" },
    ],
  },
  {
    id: "income", question: "What is your approximate household income?",
    hint: "Combined income before tax of all adults living in the property",
    options: [
      { value: "under_20k", label: "Under £20,000", icon: "💷" },
      { value: "under_31k", label: "£20,000–£31,000", icon: "💷" },
      { value: "under_50k", label: "£31,000–£50,000", icon: "💷" },
      { value: "over_50k", label: "Over £50,000", icon: "💷" },
    ],
  },
  {
    id: "epc", question: "What is your property's EPC rating?",
    hint: "Found on your EPC certificate or at gov.uk/find-energy-certificate",
    options: [
      { value: "a_b_c", label: "A, B or C — good rating", icon: "⭐" },
      { value: "d", label: "D", icon: "🟡" },
      { value: "e", label: "E", icon: "🟠" },
      { value: "f", label: "F or G — poor rating", icon: "🔴" },
      { value: "unknown", label: "I don't know my EPC rating", icon: "❓" },
    ],
  },
  {
    id: "project", question: "What energy improvement are you considering?",
    hint: "Select the primary work you want done",
    options: [
      { value: "insulation", label: "Insulation (loft, cavity, solid wall)", icon: "🧱" },
      { value: "heat_pump", label: "Heat pump (air or ground source)", icon: "♨️" },
      { value: "boiler", label: "Boiler upgrade or replacement", icon: "🔥" },
      { value: "solar", label: "Solar panels", icon: "☀️" },
      { value: "heating", label: "Heating controls / smart thermostat", icon: "🌡️" },
      { value: "biomass", label: "Biomass boiler", icon: "🌿" },
      { value: "windows", label: "Double / triple glazing", icon: "🪟" },
      { value: "other", label: "Something else", icon: "🔧" },
    ],
  },
];

const SchemeResult = ({ result, onPostJob }: { result: Result; onPostJob: () => void }) => {
  const scheme = SCHEMES[result.scheme];
  const high = result.confidence === "high";
  return (
    <div
      className="rounded-2xl overflow-hidden mb-3 bg-white"
      style={{ border: `2px solid ${high ? G.g600 : G.g200}` }}
    >
      <div
        className="px-4 py-3 flex justify-between items-center flex-wrap gap-2"
        style={{ background: high ? G.g700 : G.g100 }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{high ? "✅" : "🔍"}</span>
            <p className={`font-mono text-sm font-bold m-0 ${high ? "text-white" : ""}`} style={!high ? { color: G.g800 } : {}}>{scheme.name}</p>
            <span
              className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={high
                ? { background: "rgba(255,255,255,0.2)", color: "#fff" }
                : { background: G.g200, color: G.g700 }}
            >
              {high ? "Likely eligible" : "Possibly eligible"}
            </span>
          </div>
          <p className="font-body text-[11px] mt-1 mb-0" style={{ color: high ? "rgba(255,255,255,0.75)" : G.g700 }}>{scheme.full}</p>
        </div>
        <div className="text-right">
          <p className="font-heading text-2xl tracking-wide m-0" style={{ color: high ? G.g400 : G.g600 }}>Up to {scheme.max}</p>
          <p className="font-mono text-[10px] mt-0.5 mb-0 uppercase tracking-wider" style={{ color: high ? "rgba(255,255,255,0.6)" : G.g700 }}>grant funding</p>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="font-body text-xs italic leading-relaxed mb-2.5 text-secondary-text">{result.reason}</p>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {scheme.covers.map(item => (
            <span key={item} className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border" style={{ background: G.g100, color: G.g700, borderColor: G.g200 }}>{item}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={onPostJob}
            className="flex-1 min-w-[200px] font-mono text-xs font-bold text-white rounded-lg py-2.5 hover:opacity-90 transition-opacity"
            style={{ background: G.g600 }}
          >
            Find a vetted installer →
          </button>
          <a
            href={scheme.url} target="_blank" rel="noopener noreferrer"
            className="flex-1 min-w-[200px] font-mono text-xs font-semibold rounded-lg py-2.5 text-center inline-flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{ border: `1.5px solid ${G.g200}`, color: G.g700 }}
          >
            Official scheme details ↗
          </a>
        </div>
      </div>
    </div>
  );
};

export default function GreenGrantsChecker() {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Answers>({});
  const [results, setResults] = useState<Result[]>([]);

  const currentQ = QUESTIONS[step];

  const selectAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQ.id]: value };
    setAnswers(newAnswers);
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1);
    } else {
      setResults(checkEligibility(newAnswers));
      setStep(QUESTIONS.length);
    }
  };

  const reset = () => { setStep(-1); setAnswers({}); setResults([]); };

  const highCount = results.filter(r => r.confidence === "high").length;
  const totalFunding = results
    .filter(r => r.confidence === "high")
    .reduce((s, r) => s + parseInt(SCHEMES[r.scheme].max.replace(/[^0-9]/g, "")), 0);

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
            <span className="font-mono text-[11px] font-bold tracking-widest uppercase" style={{ color: G.g400 }}>Green Home Grants</span>
          </div>

          <h2 className="font-heading text-cream text-[44px] md:text-[64px] leading-[0.95] mb-4">
            Could the government<br />
            <span style={{ color: G.g400 }}>pay for your upgrade?</span>
          </h2>

          <p className="font-body text-base md:text-lg leading-relaxed max-w-[620px] mb-7 font-light" style={{ color: "rgba(255,255,255,0.8)" }}>
            Millions of UK homeowners qualify for grants worth up to{" "}
            <strong className="font-semibold" style={{ color: G.g400 }}>£15,000</strong>{" "}
            for insulation, heat pumps, solar panels and more. Find out in 60 seconds.
          </p>

          <div className="flex flex-wrap gap-2 mb-7">
            {Object.values(SCHEMES).map(s => (
              <span
                key={s.name}
                className="font-mono text-[11px] font-semibold text-white px-3 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                {s.name} · up to {s.max}
              </span>
            ))}
          </div>

          <button
            onClick={() => setStep(0)}
            className="inline-flex items-center gap-2.5 bg-white rounded-xl px-7 py-4 font-mono text-sm font-bold hover:opacity-95 transition-opacity"
            style={{ color: G.g800, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
          >
            <span className="text-lg">🌿</span>
            Check my eligibility — free, 60 seconds
            <span>→</span>
          </button>
          <p className="font-mono text-[10px] mt-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
            No personal details required · Instant result · No obligation
          </p>
        </div>
      </div>
    </Wrap>
  );

  // ── Question step ──────────────────────────────────────
  if (step >= 0 && step < QUESTIONS.length) return (
    <Wrap>
      <div
        className="rounded-3xl px-8 py-10 md:px-12"
        style={{ background: `linear-gradient(135deg, ${G.g900} 0%, ${G.g700} 100%)` }}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-1">
            {QUESTIONS.map((_, i) => (
              <div key={i} className="w-8 h-1 rounded-sm transition-colors"
                style={{ background: i <= step ? G.g400 : "rgba(255,255,255,0.15)" }} />
            ))}
          </div>
          <span className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{step + 1} of {QUESTIONS.length}</span>
        </div>
        <div className="mb-6">
          <p className="font-mono text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: G.g400 }}>🌿 Green Grants Checker</p>
          <h3 className="font-heading text-cream text-3xl md:text-4xl leading-[1.05] mb-1.5">{currentQ.question}</h3>
          {currentQ.hint && <p className="font-body text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{currentQ.hint}</p>}
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
          <p className="font-mono text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: G.g400 }}>🌿 Your grant eligibility results</p>
          {highCount > 0 ? (
            <>
              <h3 className="font-heading text-cream text-4xl md:text-5xl leading-[1.05] mb-2">Great news — you likely qualify</h3>
              <p className="font-body text-base leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.75)" }}>
                Based on your answers, you may be eligible for up to{" "}
                <strong className="font-semibold" style={{ color: G.g400 }}>£{totalFunding.toLocaleString()}</strong>{" "}
                in government grant funding.
              </p>
            </>
          ) : (
            <>
              <h3 className="font-heading text-cream text-4xl md:text-5xl leading-[1.05] mb-2">You may have options</h3>
              <p className="font-body text-base leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.75)" }}>
                Some schemes may apply to your situation. Check the details below and speak to a registered installer who can confirm your eligibility.
              </p>
            </>
          )}
          <div className="flex flex-wrap gap-2">
            {[
              { label: `${results.length} scheme${results.length !== 1 ? "s" : ""} identified`, icon: "📋" },
              { label: `${highCount} likely eligible`, icon: "✅" },
              { label: "ProGrafter installers vetted", icon: "🔒" },
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
        </div>
        <div
          className="rounded-b-3xl p-6 border-2 border-t-0"
          style={{ background: G.g50, borderColor: G.g200 }}
        >
          {results.map(r => (
            <SchemeResult key={r.scheme} result={r} onPostJob={() => window.location.href = "/post-job-brief"} />
          ))}
          <div
            className="rounded-xl px-4 py-2.5 mb-3.5 font-body text-xs leading-relaxed"
            style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#D97706" }}
          >
            <strong className="font-semibold">Important:</strong> This checker provides guidance only. Final eligibility is confirmed by your energy supplier, installer, or local authority. A ProGrafter-vetted installer can assess your property and confirm which grants you qualify for at no obligation.
          </div>
          <div className="rounded-2xl p-6 text-center" style={{ background: G.g700 }}>
            <p className="font-heading text-cream text-2xl md:text-3xl leading-none mb-1.5">Find a ProGrafter-vetted installer</p>
            <p className="font-body text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
              Every installer on ProGrafter is personally vetted, insured, and qualified. Many are MCS-certified — required for grant-funded installations.
            </p>
            <button
              onClick={() => window.location.href = "/post-job-brief"}
              className="inline-flex bg-white rounded-xl px-7 py-3.5 font-mono text-sm font-bold mb-2 hover:opacity-95 transition-opacity"
              style={{ color: G.g800 }}
            >
              Post a job brief — free →
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
