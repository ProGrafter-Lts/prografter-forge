import { useState } from "react";

// ── ProGrafter Brand Palette ──────────────────────────────────────────────────
const C = {
  cream:      "#F5F0E8",
  deep:       "#0F2238",
  navy:       "#1B3A5C",
  teal:       "#0D9488",
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
  FAIR:        { bg:C.greenBg,  border:C.greenBorder, text:C.green,  label:"Fair quote",        icon:"✅" },
  OVERPRICED:  { bg:C.redBg,    border:C.redBorder,   text:C.red,    label:"Overpriced",        icon:"⚠️" },
  UNDERPRICED: { bg:C.amberBg,  border:C.amberBorder, text:C.amber,  label:"Unusually low",     icon:"🔍" },
  INCOMPLETE:  { bg:C.amberBg,  border:C.amberBorder, text:C.amber,  label:"Incomplete quote",  icon:"📋" },
  UNKNOWN:     { bg:"#F3F4F6",  border:C.border,      text:C.secondary, label:"Unable to assess", icon:"❓" },
};

const renderText = (text: string) => {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    if (line.startsWith("### ")) return <p key={i} style={{ fontSize:13, fontWeight:700, color:C.navy, margin:"14px 0 4px" }}>{line.slice(4)}</p>;
    if (line.startsWith("## ")) return <p key={i} style={{ fontSize:14, fontWeight:700, color:C.deep, margin:"16px 0 6px" }}>{line.slice(3)}</p>;
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

const ScoreMeter = ({ score }: { score: number | null }) => {
  if (score === null || score === undefined) return null;
  const pct = Math.max(0, Math.min(100, score));
  const colour = pct >= 70 ? C.green : pct >= 40 ? C.amber : C.red;
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:12, color:C.secondary }}>Value for money score</span>
        <span style={{ fontSize:14, fontWeight:700, color:colour }}>{pct}/100</span>
      </div>
      <div style={{ height:8, borderRadius:4, background:"#E5E1D8", overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:colour,
          borderRadius:4, transition:"width 1s ease" }} />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
        <span style={{ fontSize:10, color:C.secondary }}>Overpriced</span>
        <span style={{ fontSize:10, color:C.secondary }}>Fair</span>
        <span style={{ fontSize:10, color:C.secondary }}>Excellent</span>
      </div>
    </div>
  );
};

export default function QuoteCheckerAI() {
  const [form, setForm] = useState({
    trade:"", region:"East Midlands", property_type:"",
    job_description:"", quote_text:"", quote_total:"",
  });
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [streaming, setStreaming] = useState("");
  const [verdict, setVerdict] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);

  const upd = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.trade) e.trade = "Required";
    if (!form.region) e.region = "Required";
    if (form.job_description.trim().length < 30) e.job_description = "Please describe the job in more detail";
    if (form.quote_text.trim().length < 20) e.quote_text = "Please paste the quote content";
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
    setScore(null);

    const systemPrompt = `You are ProGrafter's Quote Checker AI — an expert in UK construction costs, trades pricing, and regional labour rates. You assess quotes submitted by homeowners to determine whether they represent fair value.

Your role is to:
1. Analyse the quote against current regional UK market rates
2. Identify any missing items, ambiguous scope, or red flags
3. Give an honest, balanced verdict
4. Help the homeowner make an informed decision — not scare them away from good traders or push them toward cheap ones

You must structure your response EXACTLY as follows:

VERDICT: [one of: FAIR / OVERPRICED / UNDERPRICED / INCOMPLETE / UNKNOWN]
SCORE: [integer 0-100, where 100 = exceptional value, 50 = fair market rate, below 30 = significantly overpriced]

## Summary
[2-3 sentences: the headline verdict and why]

## What's included in this quote
[List what the quote appears to cover based on the text provided]

## Rate assessment
[Break down the pricing against typical ${form.region} regional rates for ${form.trade} work. Be specific — reference day rates, material costs, typical job costs where relevant. Acknowledge uncertainty where you cannot be precise.]

## What to watch out for
[Any missing items, ambiguous terms, payment terms red flags, or things the homeowner should clarify before accepting]

## Questions to ask the trader
[3-5 specific questions the homeowner should ask before accepting this quote]

## Our recommendation
[Clear, actionable advice — accept, negotiate, get another quote, or walk away — and why]

Be honest. If a quote looks fair, say so clearly and don't manufacture concerns. If it looks high, say so directly with evidence. Homeowners deserve straight answers.`;

    const userMessage = `Please analyse this quote:

Trade: ${form.trade}
Region: ${form.region}
Property type: ${form.property_type || "Not specified"}
Job description: ${form.job_description}
Quoted total: ${form.quote_total ? `£${form.quote_total}` : "Not separately stated — see quote below"}

Quote content:
${form.quote_text}`;

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/analyse-quote-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            max_tokens: 1500,
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
          }),
        },
      );
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

                const vMatch = fullText.match(/VERDICT:\s*(FAIR|OVERPRICED|UNDERPRICED|INCOMPLETE|UNKNOWN)/);
                if (vMatch) setVerdict(vMatch[1]);
                const sMatch = fullText.match(/SCORE:\s*(\d+)/);
                if (sMatch) setScore(parseInt(sMatch[1]));
              }
            } catch {}
          }
        }
      }

      const cleaned = fullText
        .replace(/^VERDICT:.*\n?/m, "")
        .replace(/^SCORE:.*\n?/m, "")
        .trim();
      setResult(cleaned);
      setStreaming("");
    } catch (err) {
      setResult("Unable to analyse this quote right now. Please try again in a moment.");
      setVerdict("UNKNOWN");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setStreaming("");
    setVerdict(null);
    setScore(null);
    setErrors({});
  };

  const vc = verdict ? (VERDICT_CONFIG[verdict] || VERDICT_CONFIG.UNKNOWN) : null;
  const displayText = result || streaming;

  return (
    <div style={{ minHeight:"100vh", background:C.cream, fontFamily:"system-ui, sans-serif" }}>

      <div style={{ background:C.deep, padding:"16px 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:10 }}>
        <div style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.5px" }}>
          <span style={{ color:C.cream }}>Pro</span>
          <span style={{ color:C.teal }}>Grafter</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:11, color:C.teal, background:"rgba(13,148,136,0.15)",
            padding:"3px 10px", borderRadius:20, fontWeight:600, letterSpacing:"0.05em" }}>
            AI POWERED
          </span>
          <span style={{ fontSize:12, color:"rgba(245,240,232,0.5)", letterSpacing:"0.06em" }}>
            QUOTE CHECKER
          </span>
        </div>
      </div>

      <div style={{ maxWidth:700, margin:"0 auto", padding:"2rem 1rem" }}>

        <div style={{ textAlign:"center", marginBottom:32 }}>
          <h1 style={{ fontSize:26, fontWeight:700, color:C.deep, margin:"0 0 8px",
            letterSpacing:"-0.5px" }}>
            Is your quote fair?
          </h1>
          <p style={{ fontSize:14, color:C.secondary, maxWidth:480, margin:"0 auto", lineHeight:1.65 }}>
            Paste in any quote you've received and our AI will analyse it against current
            regional UK market rates — telling you honestly whether it's fair, overpriced,
            or unusually low.
          </p>
          <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:16, flexWrap:"wrap" }}>
            {["✅ Unbiased analysis","📊 Regional rates","🔍 Red flag detection","💷 Free to use"].map(t=>(
              <span key={t} style={{ fontSize:12, color:C.secondary }}>{t}</span>
            ))}
          </div>
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
                      {form.quote_total ? ` · £${parseFloat(form.quote_total).toLocaleString()}` : ""}
                    </p>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {loading && (
                    <span style={{ fontSize:11, color:vc.text, opacity:0.7 }}>Analysing...</span>
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
              <ScoreMeter score={score} />
              <div style={{ lineHeight:1.7 }}>
                {renderText(displayText)}
              </div>
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
                  Check another quote
                </button>
                <span style={{ fontSize:12, color:C.secondary }}>
                  Want to find a vetted trader instead?
                </span>
                <button style={{ background:"none", border:`1.5px solid ${C.teal}`,
                  color:C.teal, borderRadius:8, padding:"8px 16px",
                  fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  Post a job on ProGrafter →
                </button>
              </div>
            )}
          </div>
        )}

        {!result && (
          <div style={{ background:C.white, borderRadius:16,
            border:`1.5px solid ${C.border}`, padding:"1.75rem",
            boxShadow:"0 2px 16px rgba(15,34,56,0.05)" }}>

            <div style={{ marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:C.deep, margin:"0 0 4px" }}>
                Tell us about the quote
              </h2>
              <p style={{ fontSize:13, color:C.secondary, margin:0 }}>
                The more detail you provide, the more accurate the analysis.
              </p>
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
                  {["Detached house","Semi-detached","Terraced house","Bungalow","Flat / apartment","Commercial"].map(o=>(
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </F>
              <F label="Total quoted (£)" hint="If stated separately in the quote">
                <input type="number" style={inp()} value={form.quote_total}
                  onChange={upd("quote_total")} placeholder="e.g. 3500" min="0" />
              </F>
            </G2>

            <F label="Describe the job" req err={errors.job_description}
              hint="What work are you having done? Briefly describe the job scope.">
              <textarea rows={3} style={{
                ...inp(!!errors.job_description),
                resize:"vertical", minHeight:80,
              }} value={form.job_description} onChange={upd("job_description")}
                placeholder="e.g. Full rewire of a 3-bedroom semi-detached house in Nottingham, including new consumer unit, all new cabling, sockets and lights throughout, EIC on completion." />
            </F>

            <F label="Paste the quote here" req err={errors.quote_text}
              hint="Copy and paste the quote content — line items, descriptions, materials, anything included. The more detail, the better the analysis.">
              <textarea rows={8} style={{
                ...inp(!!errors.quote_text),
                resize:"vertical", minHeight:180,
                fontFamily:"ui-monospace, monospace", fontSize:13,
              }} value={form.quote_text} onChange={upd("quote_text")}
                placeholder={`Supply and fit new Hager 18th edition consumer unit with surge protection: £380
Strip out all existing wiring (3 bed semi, approx 85m² floor area): £420
1st fix wiring — all circuits, 15 double sockets, 6 single sockets: £680
2 x smoke detectors, hard wired: £95
Lighting circuits x4, LED downlights throughout: £520
Final fix and testing: £340
EIC (Electrical Installation Certificate): £150
Materials: included above
VAT: Not registered
Total: £2,585`} />
            </F>

            <div style={{ background:C.amberBg, border:`1px solid ${C.amberBorder}`,
              borderRadius:8, padding:"10px 12px", fontSize:11,
              color:C.amber, lineHeight:1.65, marginBottom:20 }}>
              <strong>Please note:</strong> This is an AI-assisted analysis for guidance only. It is not a
              professional valuation. Regional rates vary and individual job complexity can significantly
              affect pricing. Always make your own informed decision before accepting any quote.
            </div>

            <button onClick={analyse} disabled={loading}
              style={{ width:"100%", background:loading ? "#9CA3AF" : C.teal,
                color:C.white, border:"none", borderRadius:10,
                padding:"14px 24px", fontSize:15, fontWeight:700,
                cursor:loading ? "not-allowed" : "pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
              {loading ? (
                <>
                  <span style={{ display:"inline-block", width:16, height:16,
                    border:"2px solid rgba(255,255,255,0.3)",
                    borderTopColor:"#fff", borderRadius:"50%",
                    animation:"spin 0.8s linear infinite" }} />
                  Analysing your quote...
                </>
              ) : (
                "Analyse this quote →"
              )}
            </button>
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
                { n:"01", title:"Paste your quote", body:"Copy in the full quote — line items, totals, materials, anything included." },
                { n:"02", title:"AI analysis", body:"Our AI checks it against current regional UK rates for that specific trade and location." },
                { n:"03", title:"Honest verdict", body:"You get a clear fair / overpriced / low-ball verdict with the reasoning behind it." },
                { n:"04", title:"Know what to ask", body:"Specific questions to put to the trader before you sign anything." },
              ].map(s => (
                <div key={s.n} style={{ background:C.white, border:`1px solid ${C.border}`,
                  borderRadius:12, padding:"14px 16px" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.teal,
                    letterSpacing:"0.1em", marginBottom:6 }}>{s.n}</div>
                  <p style={{ fontSize:13, fontWeight:600, color:C.navy, margin:"0 0 4px" }}>{s.title}</p>
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
