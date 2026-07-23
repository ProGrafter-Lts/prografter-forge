import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import Logo from "@/components/Logo";

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

const TRADES = [
  "Electrician","Gas Engineer","General Builder","Plasterer",
  "Carpenter / Joiner","Tiler","Decorator / Painter","Roofer","Plumber","Landscaper",
];

const REGIONS = [
  "East Midlands","West Midlands","Yorkshire","North West","North East",
  "South East","London","South West","East of England","Wales","Scotland",
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
  WITHIN:  { bg:C.greenBg, border:C.greenBorder, text:C.green, label:"Within typical range", icon:"✅" },
  BELOW:   { bg:C.amberBg, border:C.amberBorder, text:C.amber, label:"Below typical range",  icon:"🔍" },
  ABOVE:   { bg:C.redBg,   border:C.redBorder,   text:C.red,   label:"Above typical range",  icon:"⚠️" },
  UNKNOWN: { bg:"#F3F4F6", border:C.border,      text:C.secondary, label:"Guidance only",    icon:"💡" },
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

// Extract a labelled section (## Heading … up to next ## or end) from AI markdown.
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

export default function QuoteCheckerAI() {
  const [form, setForm] = useState({
    trade:"", region:"East Midlands", property_type:"",
    job_description:"", estimated_value:"",
  });
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [streaming, setStreaming] = useState("");
  const [verdict, setVerdict] = useState<string | null>(null);
  const [rangeLow, setRangeLow] = useState<number | null>(null);
  const [rangeHigh, setRangeHigh] = useState<number | null>(null);

  const upd = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.trade) e.trade = "Required";
    if (!form.region) e.region = "Required";
    if (form.job_description.trim().length < 30) e.job_description = "Please describe the project in more detail";
    return e;
  };

  const analyse = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    setResult(null);
    setStreaming("");
    setVerdict(null);
    setRangeLow(null);
    setRangeHigh(null);

    const userValue = parseMoney(form.estimated_value);

    const systemPrompt = `You are ProGrafter's Project Cost Guide — an early-stage budgeting and education tool for UK homeowners. You are NOT a quote validator. You do NOT analyse line items, packages, or scrutinise a specific quotation. Your job is to give a fast, plain-English budget orientation before the homeowner collects real quotes.

Homeowners must be able to read your output in under 60 seconds.

Output structure — follow EXACTLY, in this order, using these headings:

RANGE_LOW: [integer GBP, low end of typical UK cost range for this project in ${form.region}]
RANGE_HIGH: [integer GBP, high end of typical UK cost range for this project in ${form.region}]
VERDICT: [one of: BELOW / WITHIN / ABOVE / UNKNOWN — how the homeowner's estimated value sits versus the range. Use UNKNOWN if they didn't provide a value.]

## Cost range summary
[2 short sentences. State the typical range and, if the user gave an estimated value, say plainly whether it sits below, within, or above the range and by roughly how much.]

## Biggest cost drivers
[3–5 short bullets — the things that most move the price for this type of project.]

## Typical missing costs
[3–5 short bullets — items homeowners commonly forget to budget for.]

## Factors that increase cost
[3–4 short bullets.]

## Factors that reduce cost
[3–4 short bullets.]

## What to do next
- Collect 2–3 detailed quotations from vetted trades.
- Compare them like-for-like on scope, spec and inclusions.
- When you receive a written quotation, upload it to the ProGrafter AI Quote Checker for a full professional review.

Rules:
- Keep every bullet under ~15 words.
- Do NOT invent line-item pricing.
- Do NOT critique a specific quote — the user has not provided one.
- No preamble, no closing paragraph, no disclaimers (the UI already shows them).`;

    const userMessage = `Give an early-stage cost guide for this project:

Trade: ${form.trade}
Region: ${form.region}
Property type: ${form.property_type || "Not specified"}
Homeowner's estimated / target project value: ${userValue ? `£${userValue.toLocaleString()}` : "Not provided"}

Project description:
${form.job_description}`;

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please sign in to use the Project Cost Guide.");
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
        throw new Error("Please sign in to use the Project Cost Guide.");
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

                const vMatch = fullText.match(/VERDICT:\s*(BELOW|WITHIN|ABOVE|UNKNOWN)/i);
                if (vMatch) setVerdict(vMatch[1].toUpperCase());
                const loMatch = fullText.match(/RANGE_LOW:\s*([\d,]+)/i);
                if (loMatch) setRangeLow(parseInt(loMatch[1].replace(/,/g, ""), 10));
                const hiMatch = fullText.match(/RANGE_HIGH:\s*([\d,]+)/i);
                if (hiMatch) setRangeHigh(parseInt(hiMatch[1].replace(/,/g, ""), 10));
              }
            } catch {}
          }
        }
      }

      const cleaned = fullText
        .replace(/^RANGE_LOW:.*\n?/mi, "")
        .replace(/^RANGE_HIGH:.*\n?/mi, "")
        .replace(/^VERDICT:.*\n?/mi, "")
        .trim();
      setResult(cleaned);
      setStreaming("");
      trackEvent("quote_check", { method: "cost_guide" });
    } catch (err) {
      setResult("Unable to generate a cost guide right now. Please try again in a moment.");
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
    setErrors({});
  };

  const vc = verdict ? (VERDICT_CONFIG[verdict] || VERDICT_CONFIG.UNKNOWN) : null;
  const displayText = result || streaming;
  const userValue = parseMoney(form.estimated_value);

  // Extract sections for the streamlined always-open view + expandables.
  const summary       = extractSection(displayText, "Cost range summary");
  const drivers       = extractSection(displayText, "Biggest cost drivers");
  const missing       = extractSection(displayText, "Typical missing costs");
  const increases     = extractSection(displayText, "Factors that increase cost");
  const reductions    = extractSection(displayText, "Factors that reduce cost");
  const nextSteps     = extractSection(displayText, "What to do next");

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
            EARLY BUDGETING
          </span>
          <span style={{ fontSize:12, color:"rgba(245,240,232,0.55)", letterSpacing:"0.06em" }}>
            PROJECT COST GUIDE
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
            FREE EARLY-STAGE GUIDANCE
          </span>
          <h1 className="font-heading" style={{ fontSize:48, color:C.white,
            margin:"0 0 14px", letterSpacing:"0.01em", lineHeight:1.05 }}>
            What could your{" "}
            <span style={{ background:`linear-gradient(135deg, ${C.tealHover}, ${C.tealLight})`,
              WebkitBackgroundClip:"text", backgroundClip:"text",
              WebkitTextFillColor:"transparent" }}>project cost?</span>
          </h1>
          <p style={{ fontSize:15, color:"rgba(245,240,232,0.82)", maxWidth:500,
            margin:"0 auto", lineHeight:1.7 }}>
            A 60-second budget orientation before you start collecting quotes — typical cost range,
            biggest cost drivers, and what to do next. Not a quote review.
          </p>
          <div style={{ display:"flex", justifyContent:"center", gap:10, marginTop:22, flexWrap:"wrap" }}>
            {["Typical cost range","Cost drivers","Missing-cost prompts","What to do next"].map(t=>(
              <span key={t} style={{ fontSize:12, color:C.white, fontWeight:500,
                background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.14)",
                padding:"6px 12px", borderRadius:20 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:700, margin:"-4rem auto 0", padding:"0 1rem 2rem", position:"relative", zIndex:1 }}>

        <div style={{ marginBottom:20 }}>
          <div style={{ background:C.amberBg, border:`1px solid ${C.amberBorder}`,
            borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
            <p style={{ fontSize:12, color:C.body, lineHeight:1.6, margin:0 }}>
              Early-stage guidance only. Not a quote, valuation or survey. Costs vary with drawings,
              specification, access, site conditions, region, finishes and contractor availability.
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
                justifyContent:"space-between", gap:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:24 }}>{vc.icon}</span>
                  <div>
                    <p style={{ fontSize:16, fontWeight:700, color:vc.text, margin:0 }}>
                      {vc.label}
                    </p>
                    <p style={{ fontSize:11, color:vc.text, margin:"2px 0 0", opacity:0.8 }}>
                      {form.trade} · {form.region}
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
                    ProGrafter AI
                  </div>
                </div>
              </div>
            )}

            <div style={{ padding:"20px 24px" }}>
              {/* Headline range card */}
              {(rangeLow !== null || rangeHigh !== null) && (
                <div style={{ background:C.cream, border:`1px solid ${C.border}`,
                  borderRadius:12, padding:"14px 16px", marginBottom:16,
                  display:"grid", gridTemplateColumns:userValue ? "1fr 1fr" : "1fr", gap:14 }}>
                  <div>
                    <p style={{ fontSize:11, fontWeight:600, color:C.secondary,
                      textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 4px" }}>
                      Estimated project cost range
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
                        Your estimated value
                      </p>
                      <p className="font-heading" style={{ fontSize:22, color:C.deep, margin:0 }}>
                        {formatMoney(userValue)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Streamlined always-visible summary + next steps */}
              {summary && (
                <div style={{ marginBottom:6 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:C.deep, margin:"0 0 6px" }}>
                    Summary
                  </p>
                  <div>{renderText(summary)}</div>
                </div>
              )}

              {nextSteps && (
                <div style={{ marginTop:14, background:C.tealDim,
                  border:`1px solid ${C.tealLight}`, borderRadius:12, padding:"12px 14px" }}>
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
                    When you receive a written quotation, upload it to the AI Quote Checker for a
                    full professional review.
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
              {!summary && !nextSteps && (
                <div style={{ lineHeight:1.7 }}>
                  {renderText(displayText)}
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
                  Guide another project
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
                  A quick description is enough — no quote or line items needed.
                </p>
              </div>
            </div>

            <G2>
              <F label="Type of trade" req err={errors.trade}>
                <select style={inp(!!errors.trade)} value={form.trade} onChange={upd("trade")}>
                  <option value="">Select trade...</option>
                  {TRADES.map(t=><option key={t} value={t}>{t}</option>)}
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
              <F label="Your estimated value (£)" hint="Optional — your rough target budget">
                <input type="number" style={inp()} value={form.estimated_value}
                  onChange={upd("estimated_value")} placeholder="e.g. 3500" min="0" />
              </F>
            </G2>

            <F label="Describe the project" req err={errors.job_description}
              hint="What are you planning? A few sentences on scope, size and finish level is enough.">
              <textarea rows={4} style={{
                ...inp(!!errors.job_description),
                resize:"vertical", minHeight:100,
              }} value={form.job_description} onChange={upd("job_description")}
                placeholder="e.g. Full rewire of a 3-bedroom semi-detached house in Nottingham, including new consumer unit, cabling, sockets and lights throughout, plus EIC certificate on completion." />
            </F>

            <div style={{ background:C.amberBg, border:`1px solid ${C.amberBorder}`,
              borderRadius:8, padding:"10px 12px", fontSize:11,
              color:C.amber, lineHeight:1.65, marginBottom:20 }}>
              <strong>Please note:</strong> This is early-stage AI-assisted guidance, not a professional
              valuation. Once you receive a written quotation, run it through the AI Quote Checker for a
              full professional review.
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
                  Generating your cost guide...
                </>
              ) : (
                "Get Free Cost Guide →"
              )}
            </button>
            {loading && (
              <p style={{ fontSize:12, color:C.secondary, textAlign:"center",
                marginTop:12, lineHeight:1.55 }}>
                Building your early-stage cost range
                {form.trade ? ` for ${form.trade}` : ""}
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
                { n:"01", title:"Describe the project", body:"A short description of what you're planning — no quote needed." },
                { n:"02", title:"Get a cost range", body:"Typical UK cost range for that project in your region." },
                { n:"03", title:"See cost drivers", body:"Biggest cost drivers, missing costs, and what moves the price up or down." },
                { n:"04", title:"Know what to do next", body:"Get 2–3 quotes, then run the winning one through the AI Quote Checker." },
              ].map(s => (
                <div key={s.n} style={{ background:C.white, border:`1px solid ${C.border}`,
                  borderRadius:14, padding:"18px 16px", position:"relative", overflow:"hidden",
                  boxShadow:"0 4px 16px rgba(15,34,56,0.05)" }}>
                  <div style={{ width:36, height:36, borderRadius:10, marginBottom:10,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:13, fontWeight:700, color:C.white,
                    background:`linear-gradient(135deg, ${C.navy}, ${C.teal})` }}>{s.n}</div>
                  <p className="font-heading" style={{ fontSize:16, color:C.navy, margin:"0 0 4px", letterSpacing:"0.01em" }}>{s.title}</p>
                  <p style={{ fontSize:12, color:C.secondary, margin:0, lineHeight:1.55 }}>{s.body}</p>
                </div>
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
