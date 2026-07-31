import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import Logo from "@/components/Logo";
import { getProcessGuide, PERMISSIONS_DISCLAIMER } from "@/lib/projectProcessGuide";

// ── ProGrafter Brand Palette ──────────────────────────────────────────────────
const C = {
  cream:      "#F5F0E8",
  deep:       "#0F2238",
  navy:       "#27396A",
  teal:       "#14A8A1",
  tealHover:  "#14B8A8",
  tealLight:  "#CCFBF1",
  tealDim:    "rgba(13,148,136,0.12)",
  body:       "#1F2937",
  secondary:  "#4B5563",
  border:     "#D1CBB8",
  white:      "#FFFFFF",
  error:      "#DC2626",
  amber:      "#D97706",
  amberBg:    "#FFFBEB",
  amberBorder:"#FDE68A",
  green:      "#16A34A",
  greenBg:    "#F0FDF4",
  greenBorder:"#BBF7D0",
  red:        "#DC2626",
  redBg:      "#FEF2F2",
  redBorder:  "#FECACA",
};

const PROJECT_TYPES: { label: string; module: string }[] = [
  { label: "Extension / structural building work", module: "extension_building" },
  { label: "Boiler / heating", module: "boiler_heating" },
  { label: "Electrical / rewire", module: "electrical_rewire" },
  { label: "Bathroom", module: "bathroom" },
  { label: "Kitchen", module: "kitchen" },
  { label: "Roofing", module: "roofing" },
  { label: "Windows & doors", module: "windows_doors" },
  { label: "Plastering / rendering", module: "plastering_rendering" },
  { label: "Landscaping / driveway", module: "landscaping_driveway" },
  { label: "General building / not sure", module: "general_building" },
];

const REGIONS = [
  "East Midlands","West Midlands","Yorkshire","North West","North East",
  "South East","London","South West","East of England","Wales","Scotland",
];

const COMMON_PACKAGES = [
  "Foundations","Drainage","Substructure","Structure / frame","External walls","Roof",
  "Windows & Doors","Insulation","Plastering","Electrics","Plumbing","Heating",
  "Kitchen","Bathroom","Flooring","Decoration","Landscaping","Scaffolding","Waste / skip",
];

const inp = (err?: boolean): React.CSSProperties => ({
  width:"100%", padding:"10px 12px", borderRadius:8,
  border:`1.5px solid ${err ? C.error : C.border}`,
  fontSize:14, color:C.body, fontFamily:"inherit",
  outline:"none", boxSizing:"border-box", background:C.white,
});

const F = ({ label, req, hint, err, children }: any) => (
  <div style={{ marginBottom:16 }}>
    <label style={{ display:"block", fontSize:12, fontWeight:600,
      color:C.navy, marginBottom:5, letterSpacing:"0.03em" }}>
      {label}{req && <span style={{ color:C.teal }}> *</span>}
    </label>
    {children}
    {hint && <p style={{ fontSize:11, color:C.secondary, marginTop:4 }}>{hint}</p>}
    {err && <p style={{ fontSize:11, color:C.error, marginTop:4, fontWeight:500 }}>{err}</p>}
  </div>
);

const G2 = ({ children }: any) => (
  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>{children}</div>
);

const VERDICT_CONFIG: Record<string, any> = {
  WITHIN:  { bg:C.greenBg, border:C.greenBorder, text:C.green, label:"Your budget appears commercially realistic", icon:"✅" },
  BELOW:   { bg:C.amberBg, border:C.amberBorder, text:C.amber, label:"Your budget appears below the expected construction cost", icon:"🔍" },
  FAR_BELOW:{bg:C.redBg,   border:C.redBorder,   text:C.red,   label:"Your budget is unlikely to deliver this specification", icon:"⚠️" },
  ABOVE:   { bg:C.redBg,   border:C.redBorder,   text:C.red,   label:"Your budget appears above the expected construction cost", icon:"⚠️" },
  UNKNOWN: { bg:"#F3F4F6", border:C.border,      text:C.secondary, label:"Early-stage guidance",             icon:"💡" },
};

const ASSESS_CONFIG: Record<string, any> = {
  FAIR: { color:C.green, bg:C.greenBg, border:C.greenBorder, icon:"✔", label:"Fair" },
  LOW:  { color:C.amber, bg:C.amberBg, border:C.amberBorder, icon:"⚠", label:"Low" },
  HIGH: { color:C.red,   bg:C.redBg,   border:C.redBorder,   icon:"⚠", label:"High" },
};

const CONF_CONFIG: Record<string, any> = {
  HIGH:   { color:C.green,     label:"High confidence" },
  MEDIUM: { color:C.amber,     label:"Medium confidence" },
  LOW:    { color:C.secondary, label:"Low confidence" },
};

const SNAPSHOT_CONFIG: Record<string, any> = {
  TYPICAL: { color:C.green, bg:C.greenBg, border:C.greenBorder, icon:"✔", label:"Typical" },
  REVIEW:  { color:C.amber, bg:C.amberBg, border:C.amberBorder, icon:"⚠", label:"Review" },
  CONFIRM: { color:C.navy,  bg:C.cream,   border:C.border,      icon:"?", label:"Confirm scope" },
};

const renderText = (text: string) => {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    if (line.startsWith("### ")) return <p key={i} style={{ fontSize:13, fontWeight:700, color:C.navy, margin:"14px 0 4px" }}>{line.slice(4)}</p>;
    if (line.startsWith("## "))  return <p key={i} style={{ fontSize:14, fontWeight:700, color:C.deep, margin:"16px 0 6px" }}>{line.slice(3)}</p>;
    if (line.startsWith("**") && line.endsWith("**")) return <p key={i} style={{ fontSize:13, fontWeight:600, color:C.body, margin:"6px 0 2px" }}>{line.slice(2,-2)}</p>;
    if (line.startsWith("- ") || line.startsWith("• ")) return (
      <div key={i} style={{ display:"flex", gap:8, margin:"3px 0" }}>
        <span style={{ color:C.teal, flexShrink:0, fontSize:14, lineHeight:"1.6" }}>•</span>
        <span style={{ fontSize:13, color:C.body, lineHeight:1.65 }}>{line.slice(2)}</span>
      </div>
    );
    if (line.trim() === "") return <div key={i} style={{ height:6 }} />;
    return <p key={i} style={{ fontSize:13, color:C.body, lineHeight:1.65, margin:"2px 0" }}>{line}</p>;
  });
};

const extractSection = (text: string, heading: string): string => {
  if (!text) return "";
  const re = new RegExp(`##\\s*${heading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i");
  const m = text.match(re);
  return m ? m[1].trim() : "";
};

const Expandable = ({ title, children, defaultOpen = false }: any) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop:`1px solid ${C.cream}` }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:"100%", background:"none", border:"none", cursor:"pointer",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"14px 0", fontSize:13, fontWeight:600, color:C.navy, textAlign:"left",
        }}
      >
        <span>{title}</span>
        <span style={{ color:C.teal, fontSize:16 }}>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ paddingBottom:14 }}>{children}</div>}
    </div>
  );
};

const parseMoney = (v: string): number | null => {
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
};

const formatMoney = (n: number) =>
  n >= 1000 ? `£${Math.round(n).toLocaleString()}` : `£${Math.round(n)}`;

type PackageRow = { name: string; value: string };

type PackageAssessment = {
  name: string;
  user_value: number | null;
  range_low: number | null;
  range_high: number | null;
  assessment: "FAIR" | "LOW" | "HIGH";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  note?: string;
};

// Extract a JSON block delimited by ```json ... ``` or a raw {..} after PACKAGES:
const extractPackages = (text: string): PackageAssessment[] => {
  if (!text) return [];
  const fenced = text.match(/```json\s+packages\s*([\s\S]*?)```/i) || text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? text.match(/PACKAGES_JSON:\s*(\[[\s\S]*?\])/i)?.[1];
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(p => p && typeof p.name === "string" && typeof p.assessment === "string").map((p: any) => ({
      name: String(p.name),
      user_value: typeof p.user_value === "number" ? p.user_value : null,
      range_low: typeof p.range_low === "number" ? p.range_low : null,
      range_high: typeof p.range_high === "number" ? p.range_high : null,
      assessment: (["FAIR","LOW","HIGH"].includes(p.assessment) ? p.assessment : "FAIR") as any,
      confidence: (["HIGH","MEDIUM","LOW"].includes(p.confidence) ? p.confidence : "MEDIUM") as any,
      note: typeof p.note === "string" ? p.note : undefined,
    }));
  } catch { return []; }
};

type SnapshotItem = {
  name: string;
  status: "TYPICAL" | "REVIEW" | "CONFIRM";
  reason?: string;
};

const extractSnapshot = (text: string): SnapshotItem[] => {
  if (!text) return [];
  const m = text.match(/```json\s+snapshot\s*([\s\S]*?)```/i);
  if (!m) return [];
  try {
    const parsed = JSON.parse(m[1]);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p: any) => p && typeof p.name === "string")
      .map((p: any) => ({
        name: String(p.name),
        status: (["TYPICAL","REVIEW","CONFIRM"].includes(p.status) ? p.status : "REVIEW") as any,
        reason: typeof p.reason === "string" ? p.reason : undefined,
      }))
      .slice(0, 8);
  } catch { return []; }
};

// Live matching area — East Midlands outcodes (same list used for trade geography)
const LIVE_AREA_PREFIXES = ["NG", "DE", "LE", "LN", "S", "DN"] as const;
const normalisePostcode = (pc: string) => pc.trim().toUpperCase().replace(/\s+/g, "");
const outcodeOf = (pc: string) => {
  const p = normalisePostcode(pc);
  const m = p.match(/^([A-Z]{1,2}\d[A-Z\d]?)/);
  return m ? m[1] : "";
};
const isInLiveArea = (pc: string) => {
  const out = outcodeOf(pc);
  if (!out) return false;
  const letters = out.match(/^[A-Z]+/)?.[0] || "";
  return LIVE_AREA_PREFIXES.includes(letters as any);
};

export default function QuoteCheckerAI() {
  const [form, setForm] = useState({
    trade:"", region:"East Midlands", property_type:"", postcode:"",
    job_description:"", estimated_value:"",
  });
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [streaming, setStreaming] = useState("");
  const [verdict, setVerdict] = useState<string | null>(null);
  const [rangeLow, setRangeLow] = useState<number | null>(null);
  const [rangeHigh, setRangeHigh] = useState<number | null>(null);
  const [budgetConfidence, setBudgetConfidence] = useState<string | null>(null);
  const [inLiveArea, setInLiveArea] = useState(true);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSaving, setWaitlistSaving] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const upd = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  const addPackage = () => setPackages(p => [...p, { name: "", value: "" }]);
  const updPackage = (i: number, k: keyof PackageRow, v: string) =>
    setPackages(p => p.map((row, idx) => idx === i ? { ...row, [k]: v } : row));
  const removePackage = (i: number) =>
    setPackages(p => p.filter((_, idx) => idx !== i));

  const joinWaitlist = async () => {
    const email = waitlistEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      setWaitlistError("Please enter a valid email address");
      return;
    }
    setWaitlistSaving(true);
    setWaitlistError(null);
    const { error } = await supabase.from("early_signups" as any).insert({
      name: "Cost Guide lead",
      email,
      postcode: normalisePostcode(form.postcode).slice(0, 12),
      user_type: "homeowner",
    } as any);
    setWaitlistSaving(false);
    if (error) {
      setWaitlistError("Couldn't save that just now — please try again.");
      return;
    }
    setWaitlistDone(true);
    trackEvent("cost_guide_out_of_area_waitlist", { region: form.region });
  };

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.trade) e.trade = "Required";
    if (!form.region) e.region = "Required";
    if (!outcodeOf(form.postcode)) e.postcode = "Enter a valid UK postcode";
    if (form.job_description.trim().length < 30) e.job_description = "Please describe the project in more detail";
    return e;
  };


  const analyse = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setInLiveArea(isInLiveArea(form.postcode));
    setWaitlistDone(false);
    setWaitlistError(null);
    setLoading(true);
    setResult(null);
    setStreaming("");
    setVerdict(null);
    setRangeLow(null);
    setRangeHigh(null);
    setBudgetConfidence(null);

    const userValue = parseMoney(form.estimated_value);
    const cleanedPackages = packages
      .map(p => ({ name: p.name.trim(), value: parseMoney(p.value) }))
      .filter(p => p.name && p.value !== null);
    const hasPackages = cleanedPackages.length > 0;

    const systemPrompt = `You are ProGrafter Construction Intelligence — a UK construction-aware budget and package-allowance analyst for homeowners at the pre-quotation stage. Write like an experienced chartered estimator: precise, calm, commercially confident. No AI padding, no essay tone.

You do NOT validate quotations. You do NOT comment on contracts, scope wording, exclusions, payment schedules, retentions, warranties or legal terms.

Output structure — follow EXACTLY, in this order.

First, on their own lines:
RANGE_LOW: [integer GBP — low end of a realistic total project cost range in ${form.region}]
RANGE_HIGH: [integer GBP — high end of a realistic total project cost range in ${form.region}]
VERDICT: [FAR_BELOW / BELOW / WITHIN / ABOVE / UNKNOWN — how the homeowner's expected budget sits versus the realistic range. FAR_BELOW = budget under ~85% of RANGE_LOW (unlikely to deliver spec). BELOW = budget between ~85% of RANGE_LOW and RANGE_LOW. WITHIN = inside the range. ABOVE = above RANGE_HIGH. UNKNOWN if no budget was provided.]
BUDGET_CONFIDENCE: [HIGH / MEDIUM / LOW]

DYNAMIC RANGE RULES — the range must narrow as more information is supplied:
- Little detail (only trade + region + short description): allow a wider band, but never wider than ±35% around the midpoint.
- Property type + clear scope + size clues (dimensions, storeys, m²): tighten to roughly ±20–25%.
- Package allowances supplied OR detailed specification given: tighten to roughly ±10–15%.
- Never return a range wider than £20,000 unless the true project cost genuinely warrants it (major new-build or full renovation over £150k). For small works, avoid sprawling ranges — commit to a tight, defensible band.

Then, IF AND ONLY IF the user has supplied package allowances, output a fenced JSON block tagged \`json packages\` with each supplied package assessed. Do not invent packages the user did not provide.

\`\`\`json packages
[
  {
    "name": "Foundations",
    "user_value": 12000,
    "range_low": 9000,
    "range_high": 15000,
    "assessment": "FAIR",
    "confidence": "MEDIUM",
    "note": "Reasonable for a standard strip foundation on this footprint; assumes no ground complications."
  }
]
\`\`\`

Then ALWAYS output a fenced JSON block tagged \`json snapshot\` covering 5–8 of the most material work packages for THIS project type (e.g. Foundations, Structure, Roof, Windows & Doors, Drainage, M&E, Finishes, External works). Base status on what the description reveals — this is not per-package pricing, it's a scope snapshot.

\`\`\`json snapshot
[
  { "name": "Foundations", "status": "TYPICAL", "reason": "Standard strip footings suit the described ground." },
  { "name": "Windows & Doors", "status": "REVIEW", "reason": "Spec not stated — glazing choice moves cost materially." },
  { "name": "Drainage", "status": "CONFIRM", "reason": "Connection point and run length not described." }
]
\`\`\`

Snapshot status meaning:
- TYPICAL — no unusual risk expected for this project type.
- REVIEW — meaningful commercial variance possible; homeowner should firm up spec.
- CONFIRM — scope is unclear or missing; ask the builder to confirm.

Then the markdown sections, in this exact order:

## ProGrafter opinion
[Maximum 3 short sentences. Authoritative commercial verdict on the overall budget and (if provided) the package mix. No hedging language, no repetition of the verdict label.]

## Potential cost optimisation
[Exactly 4–5 concise bullets. Do NOT promise or quantify savings. Frame opportunities under: procurement, logistics, construction sequencing, supplier selection, spec choices. End with the exact line: "The AI Quote Checker identifies these opportunities in greater detail once you upload a written quotation."]

## Biggest cost drivers
[3–5 concise bullets.]

## Typical missing costs
[3–5 concise bullets.]

## Factors that increase cost
[3–4 concise bullets.]

## Factors that reduce cost
[3–4 concise bullets.]

## What to do next
- Clarify any package flagged LOW, HIGH, REVIEW or CONFIRM before requesting final quotations.
- Collect 2–3 detailed written quotations from vetted trades on a like-for-like scope.
- When you receive a written quotation, upload it to the ProGrafter AI Quote Checker for a full professional review of scope, contract, payment terms and exclusions.

Hard rules:
- Never critique a quotation document — the user has not uploaded one.
- Never comment on contracts, exclusions, payment terms, retentions, warranties or legal wording.
- Never invent line-item pricing beyond what the user supplied.
- Keep bullets under ~15 words. No preamble. No closing disclaimer (the UI shows one).`;

    const packageBlock = hasPackages
      ? `\n\nPackage allowances supplied by the homeowner (assess each one):\n${cleanedPackages.map(p => `- ${p.name}: £${p.value!.toLocaleString()}`).join("\n")}`
      : `\n\nThe homeowner has NOT supplied a package breakdown — assess overall budget realism only and omit the JSON block.`;

    const userMessage = `Give a construction-intelligence budget assessment for this project:

Trade / lead discipline: ${form.trade}
Region: ${form.region}
Property type: ${form.property_type || "Not specified"}
Homeowner's expected budget: ${userValue ? `£${userValue.toLocaleString()}` : "Not provided"}

Project description:
${form.job_description}${packageBlock}`;

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please sign in to use the Quote Clarity Score.");
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/analyse-quote-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
          }),
        },
      );
      if (response.status === 401) {
        throw new Error("Please sign in to use the Quote Clarity Score.");
      }
      if (!response.ok || !response.body) {
        throw new Error(`Proxy error ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                fullText += parsed.delta.text;
                setStreaming(fullText);

                const vMatch = fullText.match(/VERDICT:\s*(FAR_BELOW|BELOW|WITHIN|ABOVE|UNKNOWN)/i);
                if (vMatch) setVerdict(vMatch[1].toUpperCase());
                const loMatch = fullText.match(/RANGE_LOW:\s*([\d,]+)/i);
                if (loMatch) setRangeLow(parseInt(loMatch[1].replace(/,/g, ""), 10));
                const hiMatch = fullText.match(/RANGE_HIGH:\s*([\d,]+)/i);
                if (hiMatch) setRangeHigh(parseInt(hiMatch[1].replace(/,/g, ""), 10));
                const bcMatch = fullText.match(/BUDGET_CONFIDENCE:\s*(HIGH|MEDIUM|LOW)/i);
                if (bcMatch) setBudgetConfidence(bcMatch[1].toUpperCase());
              }
            } catch {}
          }
        }
      }

      const cleaned = fullText
        .replace(/^RANGE_LOW:.*\n?/mi, "")
        .replace(/^RANGE_HIGH:.*\n?/mi, "")
        .replace(/^VERDICT:.*\n?/mi, "")
        .replace(/^BUDGET_CONFIDENCE:.*\n?/mi, "")
        .trim();
      setResult(cleaned);
      setStreaming("");
      trackEvent("quote_check", { method: "clarity_score" });
    } catch (err) {
      setResult("Unable to generate an assessment right now. Please try again in a moment.");
      setVerdict("UNKNOWN");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setStreaming("");
    setVerdict(null);
    setRangeLow(null);
    setRangeHigh(null);
    setBudgetConfidence(null);
    setErrors({});
  };

  const vc = verdict ? (VERDICT_CONFIG[verdict] || VERDICT_CONFIG.UNKNOWN) : null;
  const displayText = result || streaming;
  const userValue = parseMoney(form.estimated_value);

  const selectedModule = PROJECT_TYPES.find(t => t.label === form.trade)?.module;
  const processGuide = getProcessGuide(selectedModule);
  const checkerHref = selectedModule
    ? `/quote-checker?module=${selectedModule}`
    : "/quote-checker";

  const packageResults = extractPackages(displayText);
  const snapshot = extractSnapshot(displayText);
  // Strip both fenced JSON blocks for markdown rendering
  const markdownOnly = displayText.replace(/```json[\s\S]*?```/gi, "").trim();

  const opinion      = extractSection(markdownOnly, "ProGrafter opinion");
  const optimisation = extractSection(markdownOnly, "Potential cost optimisation");
  const drivers      = extractSection(markdownOnly, "Biggest cost drivers");
  const missing      = extractSection(markdownOnly, "Typical missing costs");
  const increases    = extractSection(markdownOnly, "Factors that increase cost");
  const reductions   = extractSection(markdownOnly, "Factors that reduce cost");
  const nextSteps    = extractSection(markdownOnly, "What to do next");

  // Confidence reasons — deterministic, computed from what the user actually supplied.
  const confidenceReasons: { ok: boolean; label: string }[] = [
    { ok: !!form.trade, label: "Project type identified" },
    { ok: !!form.region, label: "Regional pricing applied" },
    { ok: !!form.property_type, label: "Property type provided" },
    { ok: form.job_description.trim().length >= 120, label: "Detailed scope described" },
    { ok: userValue !== null, label: "Target budget supplied" },
    { ok: packages.some(p => p.name && parseMoney(p.value) !== null), label: "Package costs supplied" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.cream, fontFamily:"'DM Sans', system-ui, sans-serif" }}>

      <div style={{ background:C.deep, padding:"16px 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:10,
        borderBottom:`1px solid rgba(20,168,161,0.25)` }}>
        <div className="font-heading tracking-wider" style={{ fontSize:24, fontWeight:700 }}>
          <Logo variant="light" className="h-9 w-auto inline-block" />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:11, color:C.white,
            background:`linear-gradient(135deg, ${C.teal}, ${C.tealHover})`,
            padding:"4px 11px", borderRadius:20, fontWeight:700, letterSpacing:"0.05em",
            boxShadow:"0 2px 10px rgba(20,168,161,0.4)" }}>
            CONSTRUCTION INTELLIGENCE
          </span>
        </div>
      </div>

      {/* Hero band */}
      <div style={{ position:"relative", overflow:"hidden",
        background:`linear-gradient(160deg, ${C.deep} 0%, ${C.navy} 100%)`,
        padding:"3rem 1rem 5.5rem", textAlign:"center" }}>
        <div style={{ position:"absolute", top:-80, right:-60, width:260, height:260,
          borderRadius:"50%", background:`radial-gradient(circle, rgba(20,168,161,0.35), transparent 70%)`,
          pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-120, left:-80, width:300, height:300,
          borderRadius:"50%", background:`radial-gradient(circle, rgba(39,57,106,0.6), transparent 70%)`,
          pointerEvents:"none" }} />
        <div style={{ position:"relative", maxWidth:640, margin:"0 auto" }}>
          <span style={{ display:"inline-block", fontSize:11, fontWeight:700,
            color:C.tealLight, background:"rgba(20,168,161,0.18)",
            border:"1px solid rgba(20,168,161,0.4)",
            padding:"5px 14px", borderRadius:20, letterSpacing:"0.12em",
            marginBottom:18 }}>
            FREE BUDGET & PACKAGE ASSESSMENT
          </span>
          <h1 className="font-heading" style={{ fontSize:48, color:C.white,
            margin:"0 0 14px", letterSpacing:"0.01em", lineHeight:1.05 }}>
            Is your budget{" "}
            <span style={{ background:`linear-gradient(135deg, ${C.tealHover}, ${C.tealLight})`,
              WebkitBackgroundClip:"text", backgroundClip:"text",
              WebkitTextFillColor:"transparent" }}>commercially realistic?</span>
          </h1>
          <p style={{ fontSize:15, color:"rgba(245,240,232,0.82)", maxWidth:520,
            margin:"0 auto", lineHeight:1.7 }}>
            A construction-aware review of your overall budget — and, if you supply them, each
            package allowance — benchmarked against typical UK regional pricing.
          </p>
          <div style={{ display:"flex", justifyContent:"center", gap:10, marginTop:22, flexWrap:"wrap" }}>
            {["Package-by-package check","Regional ranges","Commercial opinion","Confidence indicators"].map(t=>(
              <span key={t} style={{ fontSize:12, color:C.white, fontWeight:500,
                background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.14)",
                padding:"6px 12px", borderRadius:20 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:760, margin:"-4rem auto 0", padding:"0 1rem 2rem", position:"relative", zIndex:1 }}>

        <div style={{ marginBottom:20 }}>
          <div style={{ background:C.amberBg, border:`1px solid ${C.amberBorder}`,
            borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
            <p style={{ fontSize:12, color:C.body, lineHeight:1.6, margin:0 }}>
              This is a budget and package-allowance assessment — not a quotation review. It does not
              comment on scope, contracts, payment terms, exclusions or legal wording.
              For that, use the AI Quote Checker once you have a written quotation.
            </p>
          </div>
          <p style={{ fontSize:12, color:C.secondary, textAlign:"center" }}>
            Already got a written quotation?{" "}
            <Link to="/quote-checker" style={{ color:C.teal, fontWeight:600, textDecoration:"none" }}>
              Run it through the AI Quote Checker →
            </Link>
          </p>
        </div>

        {(result || streaming) && (
          <div style={{ background:C.white, borderRadius:16,
            border:`1.5px solid ${vc ? vc.border : C.border}`,
            marginBottom:24, overflow:"hidden",
            boxShadow:"0 4px 24px rgba(15,34,56,0.07)" }}>

            {vc && (
              <div style={{ background:vc.bg, borderBottom:`1px solid ${vc.border}`,
                padding:"14px 20px", display:"flex", alignItems:"center",
                justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:24 }}>{vc.icon}</span>
                  <div>
                    <p style={{ fontSize:16, fontWeight:700, color:vc.text, margin:0 }}>
                      {vc.label}
                    </p>
                    <p style={{ fontSize:11, color:vc.text, margin:"2px 0 0", opacity:0.8 }}>
                      {form.trade} · {form.region}
                      {budgetConfidence ? ` · ${CONF_CONFIG[budgetConfidence]?.label ?? ""}` : ""}
                    </p>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {loading && (
                    <span style={{ fontSize:11, color:vc.text, opacity:0.7 }}>Generating…</span>
                  )}
                  <div style={{ fontSize:10, color:vc.text, background:C.white,
                    padding:"3px 8px", borderRadius:20, fontWeight:600,
                    border:`1px solid ${vc.border}`, opacity:0.8 }}>
                    ProGrafter Intelligence
                  </div>
                </div>
              </div>
            )}

            <div style={{ padding:"20px 24px" }}>
              {/* Budget headline */}
              {(rangeLow !== null || rangeHigh !== null) && (
                <div style={{ background:C.cream, border:`1px solid ${C.border}`,
                  borderRadius:12, padding:"14px 16px", marginBottom:16,
                  display:"grid", gridTemplateColumns:userValue ? "1fr 1fr" : "1fr", gap:14 }}>
                  <div>
                    <p style={{ fontSize:11, fontWeight:600, color:C.secondary,
                      textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 4px" }}>
                      Realistic project range
                    </p>
                    <p className="font-heading" style={{ fontSize:22, color:C.deep, margin:0 }}>
                      {rangeLow !== null ? formatMoney(rangeLow) : "—"}
                      {" – "}
                      {rangeHigh !== null ? formatMoney(rangeHigh) : "—"}
                    </p>
                  </div>
                  {userValue !== null && (
                    <div>
                      <p style={{ fontSize:11, fontWeight:600, color:C.secondary,
                        textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 4px" }}>
                        Your expected budget
                      </p>
                      <p className="font-heading" style={{ fontSize:22, color:C.deep, margin:0 }}>
                        {formatMoney(userValue)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ProGrafter opinion */}
              {opinion && (
                <div style={{ marginBottom:16, background:C.tealDim,
                  border:`1px solid ${C.tealLight}`, borderRadius:12, padding:"14px 16px" }}>
                  <p style={{ fontSize:11, fontWeight:700, color:C.navy,
                    textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 6px" }}>
                    ProGrafter opinion
                  </p>
                  <div>{renderText(opinion)}</div>
                </div>
              )}

              {/* Confidence explanation */}
              {budgetConfidence && (
                <div style={{ marginBottom:16, background:C.white,
                  border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
                    <p style={{ fontSize:11, fontWeight:700, color:C.navy,
                      textTransform:"uppercase", letterSpacing:"0.08em", margin:0 }}>
                      Confidence
                    </p>
                    <span style={{ fontSize:12, fontWeight:700,
                      color: CONF_CONFIG[budgetConfidence]?.color ?? C.secondary,
                      background:C.cream, border:`1px solid ${C.border}`,
                      padding:"3px 10px", borderRadius:20 }}>
                      {budgetConfidence === "HIGH" ? "High" : budgetConfidence === "MEDIUM" ? "Medium" : "Low"}
                    </span>
                  </div>
                  <p style={{ fontSize:11, fontWeight:600, color:C.secondary,
                    textTransform:"uppercase", letterSpacing:"0.06em", margin:"10px 0 4px" }}>
                    Reason
                  </p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 14px" }}>
                    {confidenceReasons.map((r, i) => (
                      <div key={i} style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <span style={{ fontSize:12, fontWeight:700,
                          color: r.ok ? C.green : C.secondary, width:14, textAlign:"center" }}>
                          {r.ok ? "✓" : "·"}
                        </span>
                        <span style={{ fontSize:12,
                          color: r.ok ? C.body : C.secondary,
                          textDecoration: r.ok ? "none" : "none",
                          opacity: r.ok ? 1 : 0.7 }}>
                          {r.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize:11, color:C.secondary, margin:"10px 0 0", lineHeight:1.55 }}>
                    Confidence rises as you add scope detail, dimensions and package allowances.
                  </p>
                </div>
              )}

              {/* Package Snapshot */}
              {snapshot.length > 0 && (
                <div style={{ marginBottom:18, background:C.white,
                  border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px" }}>
                  <p style={{ fontSize:11, fontWeight:700, color:C.navy,
                    textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 4px" }}>
                    Package snapshot
                  </p>
                  <p style={{ fontSize:11, color:C.secondary, margin:"0 0 10px" }}>
                    Scope-level view of the main work packages. Expand for reasoning.
                  </p>
                  <div style={{ display:"flex", flexDirection:"column" }}>
                    {snapshot.map((s, i) => {
                      const cfg = SNAPSHOT_CONFIG[s.status] || SNAPSHOT_CONFIG.REVIEW;
                      return (
                        <Expandable key={i} title={
                          <span style={{ display:"inline-flex", alignItems:"center", gap:10 }}>
                            <span style={{ fontSize:13, fontWeight:600, color:C.deep }}>{s.name}</span>
                            <span style={{ fontSize:11, fontWeight:700, color:cfg.color,
                              background:cfg.bg, border:`1px solid ${cfg.border}`,
                              padding:"2px 8px", borderRadius:20 }}>
                              {cfg.icon} {cfg.label}
                            </span>
                          </span>
                        }>
                          <p style={{ fontSize:12, color:C.body, lineHeight:1.6, margin:0 }}>
                            {s.reason || "No further detail supplied — request scope confirmation from the builder."}
                          </p>
                        </Expandable>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Package assessments (only when user supplied their own allowances) */}
              {packageResults.length > 0 && (
                <div style={{ marginBottom:18 }}>
                  <p style={{ fontSize:11, fontWeight:600, color:C.secondary,
                    textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 8px" }}>
                    Package-by-package assessment
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {packageResults.map((p, i) => {
                      const a = ASSESS_CONFIG[p.assessment] || ASSESS_CONFIG.FAIR;
                      const c = CONF_CONFIG[p.confidence] || CONF_CONFIG.MEDIUM;
                      return (
                        <div key={i} style={{ background:C.white, border:`1px solid ${C.border}`,
                          borderRadius:10, padding:"12px 14px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between",
                            alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
                            <div style={{ minWidth:0, flex:"1 1 200px" }}>
                              <p style={{ fontSize:14, fontWeight:700, color:C.deep, margin:0 }}>
                                {p.name}
                              </p>
                              <p style={{ fontSize:12, color:C.secondary, margin:"3px 0 0" }}>
                                {p.user_value !== null ? formatMoney(p.user_value) : "—"}
                                {" · typical "}
                                {p.range_low !== null ? formatMoney(p.range_low) : "—"}
                                {"–"}
                                {p.range_high !== null ? formatMoney(p.range_high) : "—"}
                              </p>
                            </div>
                            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                              <span style={{ fontSize:11, fontWeight:700, color:a.color,
                                background:a.bg, border:`1px solid ${a.border}`,
                                padding:"3px 9px", borderRadius:20 }}>
                                {a.icon} {a.label}
                              </span>
                              <span style={{ fontSize:11, fontWeight:600, color:c.color,
                                background:C.white, border:`1px solid ${C.border}`,
                                padding:"3px 9px", borderRadius:20 }}>
                                {c.label}
                              </span>
                            </div>
                          </div>
                          {p.note && (
                            <p style={{ fontSize:12, color:C.body, lineHeight:1.6,
                              margin:"8px 0 0" }}>
                              {p.note}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Potential cost optimisation */}
              {optimisation && (
                <div style={{ marginBottom:16, background:C.tealDim,
                  border:`1px solid ${C.tealLight}`, borderRadius:12, padding:"14px 16px" }}>
                  <p style={{ fontSize:11, fontWeight:700, color:C.navy,
                    textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 4px" }}>
                    Potential cost optimisation
                  </p>
                  <p style={{ fontSize:11, color:C.secondary, margin:"0 0 8px" }}>
                    Opportunities may exist — no savings are guaranteed.
                  </p>
                  <div>{renderText(optimisation)}</div>
                </div>
              )}

              {/* SECTION 2 — What typically happens next */}
              {processGuide && (
                <div style={{ marginTop:18, background:C.white,
                  border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px" }}>
                  <p style={{ fontSize:11, fontWeight:700, color:C.navy,
                    textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 4px" }}>
                    What typically happens next
                  </p>
                  <p style={{ fontSize:11, color:C.secondary, margin:"0 0 12px" }}>
                    Typical-case guidance for this kind of project — your project may differ.
                  </p>

                  <p style={{ fontSize:12, fontWeight:700, color:C.deep, margin:"0 0 6px" }}>
                    Typical stages
                  </p>
                  <ol style={{ margin:"0 0 14px", paddingLeft:18 }}>
                    {processGuide.stages.map((s) => (
                      <li key={s} style={{ fontSize:13, color:C.body, lineHeight:1.7 }}>{s}</li>
                    ))}
                  </ol>

                  <p style={{ fontSize:12, fontWeight:700, color:C.deep, margin:"0 0 6px" }}>
                    Trades commonly involved, in typical order
                  </p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                    {processGuide.trades.map((t, i) => (
                      <span key={t} style={{ fontSize:12, color:C.navy, background:C.cream,
                        border:`1px solid ${C.border}`, padding:"4px 10px", borderRadius:20 }}>
                        {i + 1}. {t}
                      </span>
                    ))}
                  </div>

                  <p style={{ fontSize:12, fontWeight:700, color:C.deep, margin:"0 0 4px" }}>
                    Typical time on site
                  </p>
                  <p style={{ fontSize:13, color:C.body, lineHeight:1.7, margin:0 }}>
                    {processGuide.timeline}
                  </p>
                </div>
              )}

              {/* SECTION 3 — Permissions & regs signal */}
              {processGuide && (
                <div style={{ marginTop:14, background:C.amberBg,
                  border:`1px solid ${C.amberBorder}`, borderRadius:12, padding:"14px 16px" }}>
                  <p style={{ fontSize:11, fontWeight:700, color:C.navy,
                    textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 8px" }}>
                    Permissions &amp; regulations signal
                  </p>
                  <p style={{ fontSize:14, color:C.deep, lineHeight:1.65, margin:"0 0 8px", fontWeight:600 }}>
                    Based on what you've told us, this project <strong>typically {processGuide.permissions.likelihood}</strong>{" "}
                    need {processGuide.permissions.requirement}.
                  </p>
                  <p style={{ fontSize:13, color:C.body, lineHeight:1.7, margin:"0 0 10px" }}>
                    {processGuide.permissions.reason}
                  </p>
                  <p style={{ fontSize:12, color:C.secondary, lineHeight:1.6, margin:0,
                    borderTop:`1px solid ${C.amberBorder}`, paddingTop:10 }}>
                    {PERMISSIONS_DISCLAIMER}
                  </p>
                </div>
              )}


              {nextSteps && (
                <div style={{ marginTop:14, background:C.cream,
                  border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px" }}>
                  <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:"0 0 6px" }}>
                    What should you do next?
                  </p>
                  <div>{renderText(nextSteps)}</div>
                  <Link to="/quote-checker"
                    style={{ display:"inline-flex", alignItems:"center", gap:6,
                      marginTop:10, background:C.teal, color:C.white,
                      padding:"9px 14px", borderRadius:8, fontSize:13, fontWeight:700,
                      textDecoration:"none" }}>
                    Open the AI Quote Checker →
                  </Link>
                  <p style={{ fontSize:11, color:C.secondary, margin:"8px 0 0", lineHeight:1.55 }}>
                    The AI Quote Checker reviews the quotation itself — scope, contract, payment
                    terms, exclusions and legal risk.
                  </p>
                </div>
              )}

              {/* Expandable detail */}
              {(drivers || missing || increases || reductions) && (
                <div style={{ marginTop:18 }}>
                  <p style={{ fontSize:11, fontWeight:600, color:C.secondary,
                    textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 4px" }}>
                    More detail
                  </p>
                  {drivers && (
                    <Expandable title="Biggest cost drivers">
                      {renderText(drivers)}
                    </Expandable>
                  )}
                  {missing && (
                    <Expandable title="Typical missing costs">
                      {renderText(missing)}
                    </Expandable>
                  )}
                  {increases && (
                    <Expandable title="Factors that increase cost">
                      {renderText(increases)}
                    </Expandable>
                  )}
                  {reductions && (
                    <Expandable title="Factors that reduce cost">
                      {renderText(reductions)}
                    </Expandable>
                  )}
                </div>
              )}

              {/* Fallback: while streaming and no sections yet, show raw text */}
              {!opinion && !nextSteps && packageResults.length === 0 && (
                <div style={{ lineHeight:1.7 }}>
                  {renderText(markdownOnly)}
                </div>
              )}

              {loading && streaming && (
                <span style={{ display:"inline-block", width:8, height:16,
                  background:C.teal, borderRadius:2, marginLeft:2,
                  animation:"blink 0.8s step-end infinite" }} />
              )}
            </div>

            {result && (
              <div style={{ borderTop:`1px solid ${C.cream}`, padding:"14px 24px",
                display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                <button onClick={reset}
                  style={{ background:C.navy, color:C.white, border:"none",
                    borderRadius:8, padding:"9px 18px", fontSize:13,
                    fontWeight:600, cursor:"pointer" }}>
                  Assess another project
                </button>
                <span style={{ fontSize:12, color:C.secondary }}>
                  Ready to find a vetted trade?
                </span>
                <Link to="/post-job-brief" style={{ background:"none", border:`1.5px solid ${C.teal}`,
                  color:C.teal, borderRadius:8, padding:"8px 16px",
                  fontSize:13, fontWeight:600, cursor:"pointer", textDecoration:"none" }}>
                  Post a job on ProGrafter →
                </Link>
              </div>
            )}
          </div>
        )}

        {!result && (
          <div style={{ background:C.white, borderRadius:16,
            border:`1.5px solid ${C.border}`, padding:0, overflow:"hidden",
            boxShadow:"0 10px 40px rgba(15,34,56,0.10)" }}>

            <div style={{ height:4, background:`linear-gradient(90deg, ${C.navy}, ${C.teal}, ${C.tealLight})` }} />

            <div style={{ padding:"1.75rem" }}>
            <div style={{ marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:12, flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
                background:`linear-gradient(135deg, ${C.navy}, ${C.teal})`,
                boxShadow:"0 4px 14px rgba(20,168,161,0.35)" }}>💡</div>
              <div>
                <h2 className="font-heading" style={{ fontSize:22, color:C.deep, margin:"0 0 2px", letterSpacing:"0.01em" }}>
                  Tell us about the project
                </h2>
                <p style={{ fontSize:13, color:C.secondary, margin:0 }}>
                  A short description is enough. Add package allowances for a package-by-package check.
                </p>
              </div>
            </div>

            <G2>
              <F label="Type of project" req err={errors.trade}>
                <select style={inp(!!errors.trade)} value={form.trade} onChange={upd("trade")}>
                  <option value="">Select project type...</option>
                  {PROJECT_TYPES.map(t=><option key={t.module} value={t.label}>{t.label}</option>)}
                </select>
              </F>
              <F label="Your region" req err={errors.region}>
                <select style={inp(!!errors.region)} value={form.region} onChange={upd("region")}>
                  {REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </F>
            </G2>

            <G2>
              <F label="Property type" hint="Optional but helps with context">
                <select style={inp()} value={form.property_type} onChange={upd("property_type")}>
                  <option value="">Select...</option>
                  {["Detached house","Semi-detached house","Terraced house","End-of-terrace house","Flat / Apartment","Bungalow","Maisonette","Other"].map(o=>(
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </F>
              <F label="Your expected budget (£)" hint="Optional — your rough target budget">
                <input type="number" style={inp()} value={form.estimated_value}
                  onChange={upd("estimated_value")} placeholder="e.g. 45000" min="0" />
              </F>
            </G2>

            <F label="Describe the project" req err={errors.job_description}
              hint="Scope, size and finish level. The more context, the higher the confidence.">
              <textarea rows={4} style={{
                ...inp(!!errors.job_description),
                resize:"vertical", minHeight:100,
              }} value={form.job_description} onChange={upd("job_description")}
                placeholder="e.g. Single-storey rear extension, 4m x 6m, on a semi-detached house in Nottingham. Kitchen relocation, bifold doors, underfloor heating, plaster and paint finish. Existing rear wall to be removed with structural steel." />
            </F>

            {/* Optional package allowances */}
            <div style={{ marginBottom:16, border:`1px solid ${C.border}`, borderRadius:12,
              padding:"14px 14px 6px", background:"rgba(245,240,232,0.4)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                marginBottom:6, flexWrap:"wrap", gap:8 }}>
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:C.navy, margin:0, letterSpacing:"0.03em" }}>
                    Package allowances <span style={{ color:C.secondary, fontWeight:500 }}>(optional)</span>
                  </p>
                  <p style={{ fontSize:11, color:C.secondary, margin:"3px 0 0", lineHeight:1.5 }}>
                    Add any package amounts you already have and we'll benchmark each one against
                    typical regional ranges — with a confidence indicator.
                  </p>
                </div>
                <button type="button" onClick={addPackage}
                  style={{ background:C.white, color:C.navy, border:`1px solid ${C.border}`,
                    borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600,
                    cursor:"pointer" }}>
                  + Add package
                </button>
              </div>

              {packages.length === 0 && (
                <p style={{ fontSize:11, color:C.secondary, margin:"6px 0 10px", fontStyle:"italic" }}>
                  No packages added — we'll assess overall budget realism only.
                </p>
              )}

              {packages.map((row, i) => (
                <div key={i} style={{ display:"grid",
                  gridTemplateColumns:"1.4fr 1fr auto", gap:8, marginBottom:8, alignItems:"center" }}>
                  <input list="pg-package-suggestions" style={inp()}
                    placeholder="Package (e.g. Foundations)" value={row.name}
                    onChange={(e) => updPackage(i, "name", e.target.value)} />
                  <input type="number" style={inp()} placeholder="Amount (£)"
                    value={row.value} min="0"
                    onChange={(e) => updPackage(i, "value", e.target.value)} />
                  <button type="button" onClick={() => removePackage(i)}
                    style={{ background:"none", border:"none", color:C.secondary,
                      fontSize:18, cursor:"pointer", padding:"0 6px" }} aria-label="Remove">
                    ×
                  </button>
                </div>
              ))}
              <datalist id="pg-package-suggestions">
                {COMMON_PACKAGES.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>

            <div style={{ background:C.amberBg, border:`1px solid ${C.amberBorder}`,
              borderRadius:8, padding:"10px 12px", fontSize:11,
              color:C.amber, lineHeight:1.65, marginBottom:20 }}>
              <strong>Please note:</strong> This validates budgets and package allowances only. It does
              not review contracts, scope, payment terms or exclusions — that's the AI Quote Checker's job.
            </div>

            <button onClick={analyse} disabled={loading}
              style={{ width:"100%",
                background:loading ? "#9CA3AF" : `linear-gradient(135deg, ${C.navy} 0%, ${C.teal} 100%)`,
                color:C.white, border:"none", borderRadius:12,
                padding:"16px 24px", fontSize:15, fontWeight:700, letterSpacing:"0.02em",
                cursor:loading ? "not-allowed" : "pointer",
                boxShadow:loading ? "none" : "0 8px 24px rgba(20,168,161,0.35)",
                display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
              {loading ? (
                <>
                  <span style={{ display:"inline-block", width:16, height:16,
                    border:"2px solid rgba(255,255,255,0.3)",
                    borderTopColor:"#fff", borderRadius:"50%",
                    animation:"spin 0.8s linear infinite" }} />
                  Assessing your budget...
                </>
              ) : (
                "Get My Budget Assessment →"
              )}
            </button>
            {loading && (
              <p style={{ fontSize:12, color:C.secondary, textAlign:"center",
                marginTop:12, lineHeight:1.55 }}>
                Benchmarking against typical UK regional pricing
                {form.region ? ` in ${form.region}` : ""}…
                <br />
                This usually takes about 30 seconds — please don&apos;t refresh.
              </p>
            )}
            </div>
          </div>
        )}

        {!result && !loading && (
          <div style={{ marginTop:32 }}>
            <p style={{ fontSize:11, fontWeight:600, color:C.secondary,
              textTransform:"uppercase", letterSpacing:"0.07em",
              textAlign:"center", marginBottom:16 }}>
              How it works
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
              {[
                { n:"01", title:"Describe the project", body:"A short scope description — plus your expected budget if you have one." },
                { n:"02", title:"Add package allowances", body:"Optional — but the more you add, the higher the confidence per package." },
                { n:"03", title:"Get a construction opinion", body:"Realistic range, ProGrafter opinion and package-by-package Fair / Low / High." },
                { n:"04", title:"Take it further", body:"Once quoted, run the winning quotation through the AI Quote Checker.", href: checkerHref },
              ].map(s => (
                <a key={s.n} href={(s as { href?: string }).href ?? undefined}
                  style={{ background:C.white, border:`1px solid ${C.border}`,
                  borderRadius:14, padding:"18px 16px", position:"relative", overflow:"hidden",
                  display:"block", textDecoration:"none",
                  boxShadow:"0 4px 16px rgba(15,34,56,0.05)" }}>
                  <div style={{ width:36, height:36, borderRadius:10, marginBottom:10,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:13, fontWeight:700, color:C.white,
                    background:`linear-gradient(135deg, ${C.navy}, ${C.teal})` }}>{s.n}</div>
                  <p className="font-heading" style={{ fontSize:16, color:C.navy, margin:"0 0 4px", letterSpacing:"0.01em" }}>{s.title}</p>
                  <p style={{ fontSize:12, color:C.secondary, margin:0, lineHeight:1.55 }}>{s.body}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
