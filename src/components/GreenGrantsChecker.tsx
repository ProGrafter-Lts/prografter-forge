import { useState } from "react";

// ── ProGrafter Brand ──────────────────────────────────────────────────────────
const C = {
  cream: "#F5F0E8", deep: "#0F2238", navy: "#1B3A5C",
  teal: "#0D9488", tealLight: "#CCFBF1",
  body: "#1F2937", secondary: "#4B5563", border: "#D1CBB8", white: "#FFFFFF",
  // Green Grants — deliberately bold and distinct from the ProGrafter teal palette
  g900: "#14532D", g800: "#166534", g700: "#15803D", g600: "#16A34A",
  g500: "#22C55E", g400: "#4ADE80", g200: "#BBF7D0", g100: "#DCFCE7", g50: "#F0FDF4",
  amber: "#D97706", amberBg: "#FFFBEB", amberBorder: "#FDE68A",
};

const SCHEMES: Record<string, { name: string; full: string; max: string; covers: string[]; who: string; deadline: string; funded_by: string; url: string }> = {
  eco4: {
    name: "ECO4", full: "Energy Company Obligation 4", max: "£15,000+",
    covers: ["Insulation (loft, cavity, solid wall)", "Heat pumps", "Solar PV", "Boiler upgrades", "Heating controls"],
    who: "Low income households, benefits recipients, or properties rated EPC D–G",
    deadline: "March 2026", funded_by: "Energy suppliers (obligated by government)",
    url: "https://www.gov.uk/apply-eco4",
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
    url: "https://www.gov.uk/guidance/local-authority-flexible-eligibility",
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
    id: "epc", question: "What is your property's EPC (Energy Performance Certificate) rating?",
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
    <div style={{ background: C.white, border: `2px solid ${high ? C.g600 : C.g200}`, borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ background: high ? C.g700 : C.g100, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{high ? "✅" : "🔍"}</span>
            <p style={{ fontSize: 14, fontWeight: 700, color: high ? C.white : C.g800, margin: 0 }}>{scheme.name}</p>
            <span style={{ fontSize: 11, fontWeight: 600, background: high ? "rgba(255,255,255,0.2)" : C.g200, color: high ? C.white : C.g700, padding: "2px 8px", borderRadius: 20 }}>
              {high ? "Likely eligible" : "Possibly eligible"}
            </span>
          </div>
          <p style={{ fontSize: 11, color: high ? "rgba(255,255,255,0.75)" : C.g700, margin: "3px 0 0" }}>{scheme.full}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: high ? C.g400 : C.g600, margin: 0 }}>Up to {scheme.max}</p>
          <p style={{ fontSize: 10, color: high ? "rgba(255,255,255,0.6)" : C.g700, margin: "2px 0 0" }}>grant funding</p>
        </div>
      </div>
      <div style={{ padding: "12px 16px" }}>
        <p style={{ fontSize: 12, color: C.secondary, lineHeight: 1.6, margin: "0 0 10px", fontStyle: "italic" }}>{result.reason}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {scheme.covers.map(item => (
            <span key={item} style={{ fontSize: 10, fontWeight: 600, background: C.g100, color: C.g700, border: `1px solid ${C.g200}`, padding: "2px 8px", borderRadius: 20 }}>{item}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onPostJob} style={{ flex: "1 1 200px", background: C.g600, color: C.white, border: "none", borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Find a vetted installer →
          </button>
          <a href={scheme.url} target="_blank" rel="noopener noreferrer" style={{ flex: "1 1 200px", background: "none", border: `1.5px solid ${C.g200}`, color: C.g700, borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
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

  // Section wrapper — full-width, cream background to slot between page sections
  const Wrap = ({ children }: { children: React.ReactNode }) => (
    <section className="bg-cream py-16 md:py-24 px-6">
      <div className="max-w-[1100px] mx-auto">{children}</div>
    </section>
  );

  if (step === -1) return (
    <Wrap>
      <div style={{ fontFamily: "system-ui, sans-serif", background: `linear-gradient(135deg, ${C.g900} 0%, ${C.g700} 60%, ${C.g600} 100%)`, borderRadius: 24, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 50%, #fff 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div style={{ position: "relative", padding: "3rem 2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "4px 12px", marginBottom: 20 }}>
            <span style={{ fontSize: 14 }}>🌿</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.g400, letterSpacing: "0.08em" }}>GREEN HOME GRANTS</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.white, margin: "0 0 14px", lineHeight: 1.15, letterSpacing: "-0.5px" }}>
            Could the government<br />
            <span style={{ color: C.g400 }}>pay for your upgrade?</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", lineHeight: 1.65, margin: "0 0 24px", maxWidth: 620 }}>
            Millions of UK homeowners qualify for grants worth up to <strong style={{ color: C.g400 }}>£15,000</strong> for insulation, heat pumps, solar panels and more. Find out in 60 seconds.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
            {Object.values(SCHEMES).map(s => (
              <span key={s.name} style={{ fontSize: 11, fontWeight: 600, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: C.white, padding: "4px 12px", borderRadius: 20 }}>
                {s.name} · up to {s.max}
              </span>
            ))}
          </div>
          <button onClick={() => setStep(0)} style={{ background: C.white, color: C.g800, border: "none", borderRadius: 12, padding: "16px 28px", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", display: "inline-flex", alignItems: "center", gap: 10, letterSpacing: "-0.2px" }}>
            <span style={{ fontSize: 20 }}>🌿</span>
            Check my eligibility — free, 60 seconds
            <span>→</span>
          </button>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 12 }}>
            No personal details required · Instant result · No obligation
          </p>
        </div>
      </div>
    </Wrap>
  );

  if (step >= 0 && step < QUESTIONS.length) return (
    <Wrap>
      <div style={{ fontFamily: "system-ui, sans-serif", background: `linear-gradient(135deg, ${C.g900} 0%, ${C.g700} 100%)`, borderRadius: 24, padding: "2.5rem 2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {QUESTIONS.map((_, i) => (
              <div key={i} style={{ width: 32, height: 4, borderRadius: 2, background: i <= step ? C.g400 : "rgba(255,255,255,0.15)", transition: "background 0.3s" }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{step + 1} of {QUESTIONS.length}</span>
        </div>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.g400, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>🌿 Green Grants Checker</p>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: C.white, margin: "0 0 6px", lineHeight: 1.3 }}>{currentQ.question}</h3>
          {currentQ.hint && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.5 }}>{currentQ.hint}</p>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {currentQ.options.map(opt => (
            <button key={opt.value} onClick={() => selectAnswer(opt.value)}
              style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "14px 18px", cursor: "pointer", textAlign: "left", transition: "all 0.15s", color: C.white, width: "100%", fontFamily: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.borderColor = "rgba(74,222,128,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{opt.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}>{opt.label}</span>
              <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.3)", fontSize: 16, flexShrink: 0 }}>→</span>
            </button>
          ))}
        </div>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", marginTop: 16, padding: 0 }}>← Back</button>
        )}
      </div>
    </Wrap>
  );

  return (
    <Wrap>
      <div style={{ fontFamily: "system-ui, sans-serif" }}>
        <div style={{ background: `linear-gradient(135deg, ${C.g900} 0%, ${C.g700} 100%)`, borderRadius: "24px 24px 0 0", padding: "2rem" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.g400, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>🌿 Your grant eligibility results</p>
          {highCount > 0 ? (
            <>
              <h3 style={{ fontSize: 26, fontWeight: 800, color: C.white, margin: "0 0 8px", lineHeight: 1.2 }}>Great news — you likely qualify</h3>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", margin: "0 0 16px", lineHeight: 1.55 }}>
                Based on your answers, you may be eligible for up to{" "}
                <strong style={{ color: C.g400 }}>£{totalFunding.toLocaleString()}</strong>{" "}
                in government grant funding.
              </p>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: 26, fontWeight: 800, color: C.white, margin: "0 0 8px", lineHeight: 1.2 }}>You may have options</h3>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", margin: "0 0 16px", lineHeight: 1.55 }}>
                Some schemes may apply to your situation. Check the details below and speak to a registered installer who can confirm your eligibility.
              </p>
            </>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: `${results.length} scheme${results.length !== 1 ? "s" : ""} identified`, icon: "📋" },
              { label: `${highCount} likely eligible`, icon: "✅" },
              { label: "ProGrafter installers vetted", icon: "🔒" },
            ].map(p => (
              <span key={p.label} style={{ fontSize: 11, fontWeight: 600, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: C.white, padding: "4px 10px", borderRadius: 20 }}>
                {p.icon} {p.label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ background: C.g50, borderRadius: "0 0 24px 24px", padding: "1.5rem", border: `2px solid ${C.g200}`, borderTop: "none" }}>
          {results.map(r => (
            <SchemeResult key={r.scheme} result={r} onPostJob={() => window.location.href = "/post-job"} />
          ))}
          <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: C.amber, lineHeight: 1.65 }}>
            <strong>Important:</strong> This checker provides guidance only. Final eligibility is confirmed by your energy supplier, installer, or local authority. A ProGrafter-vetted installer can assess your property and confirm which grants you qualify for at no obligation.
          </div>
          <div style={{ background: C.g700, borderRadius: 14, padding: "1.5rem", textAlign: "center" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.white, margin: "0 0 6px" }}>Find a ProGrafter-vetted installer</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "0 0 16px", lineHeight: 1.55 }}>
              Every installer on ProGrafter is personally vetted, insured, and qualified. Many are MCS-certified — required for grant-funded installations.
            </p>
            <button onClick={() => window.location.href = "/post-job"} style={{ background: C.white, color: C.g800, border: "none", borderRadius: 10, padding: "13px 28px", fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>
              Post a job brief — free →
            </button>
            <div>
              <button onClick={reset} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer", padding: 0 }}>Start again</button>
            </div>
          </div>
        </div>
      </div>
    </Wrap>
  );
}
