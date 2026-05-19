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
};

const TRADES = [
  { id: "electrician",     name: "Electrician",        icon: "⚡" },
  { id: "gas_engineer",    name: "Gas Engineer",        icon: "🔥" },
  { id: "general_builder", name: "General Builder",     icon: "🏗️" },
  { id: "plasterer",       name: "Plasterer",           icon: "🪣" },
  { id: "carpenter",       name: "Carpenter / Joiner",  icon: "🪚" },
  { id: "tiler",           name: "Tiler",               icon: "🟫" },
  { id: "decorator",       name: "Decorator / Painter", icon: "🖌️" },
  { id: "roofer",          name: "Roofer",              icon: "🏠" },
  { id: "plumber",         name: "Plumber",             icon: "🔧" },
  { id: "landscaper",      name: "Landscaper",          icon: "🌿" },
];

const PROPERTY_TYPES = [
  "Detached house", "Semi-detached house", "Terraced house",
  "Bungalow", "Flat / apartment", "Commercial premises", "Other",
];

const BUDGETS = [
  "Under £500", "£500–£1,000", "£1,000–£2,500",
  "£2,500–£5,000", "£5,000–£10,000", "£10,000–£20,000", "Over £20,000",
];

const TIMELINES = [
  "As soon as possible", "Within 2 weeks", "Within a month",
  "1–3 months", "3–6 months", "Flexible — no rush",
];

const ACCESS = [
  "Owner occupied — I'll be home", "Owner occupied — key can be left",
  "Tenant occupied — I'll coordinate access", "Empty property",
  "Commercial — reception/keyholder", "Other — I'll explain in notes",
];

const STEPS = ["Your details", "The job", "Scope & access", "Budget & timing", "Review & submit"];

const BLANK = {
  full_name: "", email: "", phone: "", address_line1: "",
  address_line2: "", city: "", postcode: "", property_type: "",
  trade_category_id: "", job_title: "", job_description: "",
  planning_permission: "", building_regs: "",
  scope_items: "", known_issues: "", access_arrangement: "",
  parking_available: "", preferred_days: "", additional_notes: "",
  budget_band: "", timeline: "", quotes_received: "",
  decision_criteria: "",
};

const inp = (err?: string): React.CSSProperties => ({
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: `1.5px solid ${err ? C.error : C.border}`,
  fontSize: 14, color: C.body, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box", background: C.white,
});
const ta = (err?: string): React.CSSProperties => ({ ...inp(err), resize: "vertical", minHeight: 90 });
const sel = (err?: string): React.CSSProperties => ({ ...inp(err), background: C.white });
const btnPrimary: React.CSSProperties = {
  background: C.teal, color: C.white, border: "none",
  borderRadius: 10, padding: "11px 26px", fontSize: 14,
  fontWeight: 600, cursor: "pointer",
};
const btnNavy: React.CSSProperties = {
  background: C.navy, color: C.white, border: "none",
  borderRadius: 10, padding: "11px 26px", fontSize: 14,
  fontWeight: 600, cursor: "pointer",
};
const btnBack: React.CSSProperties = {
  background: "none", border: "none", color: C.secondary,
  fontSize: 14, cursor: "pointer", padding: "11px 0",
};

const F = ({ label, req, hint, err, children }: any) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600,
      color: C.navy, marginBottom: 5, letterSpacing: "0.03em" }}>
      {label}{req && <span style={{ color: C.teal }}> *</span>}
    </label>
    {children}
    {hint && <p style={{ fontSize: 11, color: C.secondary, marginTop: 4 }}>{hint}</p>}
    {err && <p style={{ fontSize: 11, color: C.error, marginTop: 4, fontWeight: 500 }}>{err}</p>}
  </div>
);

const G2 = ({ children }: any) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{children}</div>
);

const InfoBox = ({ variant = "teal", children }: any) => {
  const v = ({
    teal:  { bg: C.tealLight,   border: "#99F6E4", text: "#0F766E" },
    amber: { bg: C.amberBg,     border: C.amberBorder, text: C.amber },
    navy:  { bg: "#EEF2F7",     border: "#C7D2E0", text: C.navy },
  } as any)[variant];
  return (
    <div style={{ background: v.bg, border: `1.5px solid ${v.border}`,
      borderRadius: 10, padding: "10px 14px", fontSize: 12,
      color: v.text, marginBottom: 16, lineHeight: 1.65 }}>
      {children}
    </div>
  );
};

const StepBar = ({ current }: { current: number }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
    {STEPS.map((label, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, transition: "all 0.2s",
            background: i < current ? C.teal : i === current ? C.deep : "#E5E1D8",
            color: i <= current ? C.cream : C.secondary,
            border: i === current ? `2px solid ${C.teal}` : "none",
            boxShadow: i === current ? `0 0 0 3px ${C.tealLight}` : "none",
          }}>
            {i < current ? "✓" : i + 1}
          </div>
        </div>
        {i < STEPS.length - 1 && (
          <div style={{ width: 28, height: 2,
            background: i < current ? C.teal : "#E5E1D8",
            transition: "background 0.3s" }} />
        )}
      </div>
    ))}
  </div>
);

const BriefPreview = ({ form }: { form: typeof BLANK }) => {
  const trade = TRADES.find(t => t.id === form.trade_category_id);
  const ref = `PG-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const Section = ({ title, children }: any) => (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: C.teal,
        letterSpacing: "0.1em", margin: "0 0 8px", textTransform: "uppercase" }}>{title}</p>
      {children}
    </div>
  );

  const Row = ({ label, value }: any) => value ? (
    <div style={{ display: "flex", gap: 8, padding: "4px 0",
      borderBottom: `1px solid ${C.cream}` }}>
      <dt style={{ width: 140, flexShrink: 0, fontSize: 11, color: C.secondary }}>{label}</dt>
      <dd style={{ fontSize: 11, color: C.body, flex: 1, margin: 0 }}>{value}</dd>
    </div>
  ) : null;

  return (
    <div style={{ background: C.white, border: `2px solid ${C.teal}`,
      borderRadius: 14, overflow: "hidden" }}>
      <div style={{ background: C.deep, padding: "16px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="font-heading tracking-wider" style={{ fontSize: 22, fontWeight: 700 }}>
            <span style={{ color: C.cream }}>PRO</span>
            <span style={{ color: C.teal }}>GRAFTER</span>
          </div>
          <p style={{ color: "rgba(245,240,232,0.6)", fontSize: 11,
            margin: "2px 0 0", letterSpacing: "0.05em" }}>JOB BRIEF</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: C.tealHover, fontSize: 12, fontWeight: 600,
            margin: 0, fontFamily: "'DM Mono', monospace" }}>{ref}</p>
          <p style={{ color: "rgba(245,240,232,0.5)", fontSize: 10,
            margin: "2px 0 0" }}>{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {trade && (
        <div style={{ background: C.tealDim, borderBottom: `1px solid #99F6E4`,
          padding: "10px 20px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{trade.icon}</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: 0 }}>{trade.name}</p>
            <p style={{ fontSize: 11, color: C.teal, margin: 0 }}>{form.job_title}</p>
          </div>
          <div style={{ marginLeft: "auto", background: C.teal,
            color: C.white, fontSize: 10, fontWeight: 600,
            padding: "3px 10px", borderRadius: 20, letterSpacing: "0.05em" }}>
            OPEN FOR QUOTES
          </div>
        </div>
      )}

      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <Section title="Homeowner">
              <Row label="Name" value={form.full_name} />
              <Row label="Email" value={form.email} />
              <Row label="Phone" value={form.phone} />
              <Row label="Address" value={[form.address_line1, form.address_line2, form.city, form.postcode].filter(Boolean).join(", ")} />
              <Row label="Property type" value={form.property_type} />
            </Section>

            <Section title="Budget & timing">
              <Row label="Budget band" value={form.budget_band} />
              <Row label="Timeline" value={form.timeline} />
              <Row label="Access" value={form.access_arrangement} />
              <Row label="Preferred days" value={form.preferred_days || "Flexible"} />
              <Row label="Parking" value={form.parking_available || "Not specified"} />
            </Section>
          </div>

          <div>
            <Section title="Job description">
              <p style={{ fontSize: 12, color: C.body, lineHeight: 1.65, margin: 0 }}>
                {form.job_description}
              </p>
            </Section>

            {form.scope_items && (
              <Section title="Scope of works">
                <p style={{ fontSize: 12, color: C.body, lineHeight: 1.65, margin: 0, whiteSpace: "pre-line" }}>
                  {form.scope_items}
                </p>
              </Section>
            )}

            {form.known_issues && (
              <Section title="Known issues / constraints">
                <p style={{ fontSize: 12, color: C.body, lineHeight: 1.65, margin: 0 }}>
                  {form.known_issues}
                </p>
              </Section>
            )}

            {form.planning_permission && (
              <Section title="Planning & regulations">
                <Row label="Planning permission" value={form.planning_permission} />
                <Row label="Building regs" value={form.building_regs} />
              </Section>
            )}
          </div>
        </div>

        {form.additional_notes && (
          <div style={{ marginTop: 4 }}>
            <Section title="Additional notes">
              <p style={{ fontSize: 12, color: C.body, lineHeight: 1.65, margin: 0 }}>
                {form.additional_notes}
              </p>
            </Section>
          </div>
        )}

        <div style={{ background: C.cream, borderRadius: 8, padding: "10px 12px",
          fontSize: 11, color: C.secondary, lineHeight: 1.6, marginTop: 12 }}>
          <strong style={{ color: C.navy }}>ProGrafter Job Brief</strong> — This document forms part of the job record.
          Both parties are required to agree the scope of works before any payment is made.
          All payments are held in escrow and released on signed milestone completion.
          Reference: <span style={{ fontFamily: "'DM Mono', monospace", color: C.teal }}>{ref}</span>
        </div>
      </div>
    </div>
  );
};

export default function PostJobBrief() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const upd = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = (n: number) => {
    const e: Record<string, string> = {};
    if (n === 0) {
      if (!form.full_name.trim()) e.full_name = "Required";
      if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
      if (!form.phone.trim()) e.phone = "Required";
      if (!form.address_line1.trim()) e.address_line1 = "Required";
      if (!form.city.trim()) e.city = "Required";
      if (!form.postcode.trim()) e.postcode = "Required";
      if (!form.property_type) e.property_type = "Required";
    }
    if (n === 1) {
      if (!form.trade_category_id) e.trade_category_id = "Please select a trade";
      if (!form.job_title.trim()) e.job_title = "A brief title is required";
      if (form.job_description.trim().length < 50) e.job_description = "Please describe the job in at least 50 characters — traders need enough detail to quote accurately";
    }
    if (n === 2) {
      if (!form.access_arrangement) e.access_arrangement = "Required";
    }
    if (n === 3) {
      if (!form.budget_band) e.budget_band = "Required";
      if (!form.timeline) e.timeline = "Required";
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (!Object.keys(e).length) setStep(s => s + 1);
  };
  const back = () => { setErrors({}); setStep(s => s - 1); };
  const submit = () => setSubmitted(true);

  const I = ({ f, type = "text", ...p }: any) => (
    <input type={type} style={inp(errors[f])} value={(form as any)[f]} onChange={upd(f)} {...p} />
  );
  const S = ({ f, children }: any) => (
    <select style={sel(errors[f])} value={(form as any)[f]} onChange={upd(f)}>{children}</select>
  );
  const T = ({ f, rows = 4, ...p }: any) => (
    <textarea rows={rows} style={ta(errors[f])} value={(form as any)[f]} onChange={upd(f)} {...p} />
  );

  const pages = [
    <>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: C.deep, margin: "0 0 4px" }}>Your details</h2>
      <p style={{ fontSize: 13, color: C.secondary, margin: "0 0 20px" }}>
        These stay private — only shared with a trader once you've accepted their quote.
      </p>
      <InfoBox variant="navy">
        <strong>Identity verified</strong> — ProGrafter verifies email and mobile before your brief is published.
        This keeps the platform genuine for the trades who respond to you.
      </InfoBox>
      <G2>
        <F label="Full name" req err={errors.full_name}><I f="full_name" placeholder="Sarah Thompson" /></F>
        <F label="Mobile number" req err={errors.phone}><I f="phone" type="tel" placeholder="07700 900123" /></F>
      </G2>
      <F label="Email address" req err={errors.email}><I f="email" type="email" placeholder="sarah@example.co.uk" /></F>
      <F label="Address line 1" req err={errors.address_line1} hint="Where the work will take place">
        <I f="address_line1" placeholder="12 Elm Close" />
      </F>
      <F label="Address line 2"><I f="address_line2" placeholder="Mapperley" /></F>
      <G2>
        <F label="Town / City" req err={errors.city}><I f="city" placeholder="Nottingham" /></F>
        <F label="Postcode" req err={errors.postcode}><I f="postcode" placeholder="NG3 5AA" /></F>
      </G2>
      <F label="Property type" req err={errors.property_type}>
        <S f="property_type">
          <option value="">Select...</option>
          {PROPERTY_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
        </S>
      </F>
    </>,

    <>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: C.deep, margin: "0 0 4px" }}>Tell us about the job</h2>
      <p style={{ fontSize: 13, color: C.secondary, margin: "0 0 20px" }}>
        The more detail you provide, the more accurate the quotes you'll receive.
      </p>
      <F label="Trade required" req err={errors.trade_category_id}>
        <S f="trade_category_id">
          <option value="">Select the trade you need...</option>
          {TRADES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
        </S>
      </F>
      <F label="Job title" req err={errors.job_title}
        hint="A short headline — e.g. 'Full bathroom refurbishment' or 'Consumer unit upgrade'">
        <I f="job_title" placeholder="Full loft conversion to habitable room" />
      </F>
      <F label="Job description" req err={errors.job_description}
        hint="Describe what you want done, the current state of things, and the outcome you're looking for. The more detail the better.">
        <T f="job_description" rows={5}
          placeholder="We have a 1930s semi-detached house in Nottingham. The loft is currently boarded but uninsulated — we want to convert it into a double bedroom with an en-suite shower room..." />
      </F>
      <F label="Is planning permission required or already granted?" hint="If you're unsure, ProGrafter's Planning Intelligence tool can check for you">
        <S f="planning_permission">
          <option value="">Select...</option>
          <option value="Not required — permitted development">Not required — permitted development</option>
          <option value="Already granted — reference available">Already granted — reference available</option>
          <option value="Application submitted — pending">Application submitted — pending</option>
          <option value="Not yet checked — need advice">Not yet checked — need advice</option>
          <option value="Not applicable">Not applicable</option>
        </S>
      </F>
      <F label="Building regulations" hint="Most structural and electrical work requires Building Regs approval">
        <S f="building_regs">
          <option value="">Select...</option>
          <option value="Building regs required — not yet applied">Building regs required — not yet applied</option>
          <option value="Building regs approved — notice submitted">Building regs approved — notice submitted</option>
          <option value="Completion certificate already held">Completion certificate already held</option>
          <option value="Not required for this work">Not required for this work</option>
          <option value="Not sure — need guidance">Not sure — need guidance</option>
        </S>
      </F>
    </>,

    <>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: C.deep, margin: "0 0 4px" }}>Scope & access</h2>
      <p style={{ fontSize: 13, color: C.secondary, margin: "0 0 20px" }}>
        Help traders understand exactly what's involved before they quote.
      </p>
      <F label="Scope of works" hint="List specific items if you can. Bullet points are fine.">
        <T f="scope_items" rows={5}
          placeholder={"- Strip and remove existing loft boarding\n- Install steel beam (engineer spec to be provided)\n- Frame dormer structure to rear\n- Install 4 Velux windows to front\n- First and second fix carpentry throughout"} />
      </F>
      <F label="Known issues or constraints" hint="Anything the trader needs to know — asbestos, awkward access, listed building status, party wall, existing damage">
        <T f="known_issues" rows={3}
          placeholder="Asbestos survey has been completed — clear. Party wall agreement with next door is in progress." />
      </F>
      <F label="Access arrangement" req err={errors.access_arrangement}>
        <S f="access_arrangement">
          <option value="">Select...</option>
          {ACCESS.map(o => <option key={o} value={o}>{o}</option>)}
        </S>
      </F>
      <G2>
        <F label="Parking available?" hint="Important for trades with vans">
          <S f="parking_available">
            <option value="">Select...</option>
            <option value="Yes — off-road driveway">Yes — off-road driveway</option>
            <option value="Yes — on-street unrestricted">Yes — on-street unrestricted</option>
            <option value="Permit parking — can provide visitor permit">Permit parking — can provide visitor permit</option>
            <option value="Paid parking nearby">Paid parking nearby</option>
            <option value="Limited — please discuss">Limited — please discuss</option>
          </S>
        </F>
        <F label="Preferred working days" hint="Leave blank if flexible">
          <S f="preferred_days">
            <option value="">Flexible</option>
            <option value="Monday–Friday only">Monday–Friday only</option>
            <option value="Weekends preferred">Weekends preferred</option>
            <option value="Weekdays + Saturdays">Weekdays + Saturdays</option>
            <option value="Specific days — see notes">Specific days — see notes</option>
          </S>
        </F>
      </G2>
      <F label="Anything else the trader should know?">
        <T f="additional_notes" rows={3}
          placeholder="We have a dog (friendly!) and a 6-month-old so early morning starts before 8am would be appreciated if avoided where possible." />
      </F>
    </>,

    <>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: C.deep, margin: "0 0 4px" }}>Budget & timing</h2>
      <p style={{ fontSize: 13, color: C.secondary, margin: "0 0 20px" }}>
        Be honest about your budget — traders appreciate it and it saves everyone time.
      </p>
      <InfoBox variant="teal">
        <strong>Why share your budget?</strong> Traders who see a realistic budget can tell you immediately if the scope fits.
        It stops you receiving quotes that bear no relation to what's actually achievable for your money.
        Your budget is only visible to traders you invite to quote.
      </InfoBox>
      <F label="Budget band" req err={errors.budget_band}>
        <S f="budget_band">
          <option value="">Select your approximate budget...</option>
          {BUDGETS.map(o => <option key={o} value={o}>{o}</option>)}
        </S>
      </F>
      <F label="Preferred timeline" req err={errors.timeline}>
        <S f="timeline">
          <option value="">When do you need this done?</option>
          {TIMELINES.map(o => <option key={o} value={o}>{o}</option>)}
        </S>
      </F>
      <F label="Have you received any quotes already?" hint="This helps traders calibrate their response">
        <S f="quotes_received">
          <option value="">Select...</option>
          <option value="No — this is my first step">No — this is my first step</option>
          <option value="Yes — 1 quote received">Yes — 1 quote received</option>
          <option value="Yes — 2 or more quotes received">Yes — 2 or more quotes received</option>
          <option value="Yes — used Quote Checker to validate">Yes — used Quote Checker to validate</option>
        </S>
      </F>
      <F label="What matters most to you in choosing a trader?" hint="Optional — helps traders understand your priorities">
        <S f="decision_criteria">
          <option value="">Select...</option>
          <option value="Quality of work above all else">Quality of work above all else</option>
          <option value="Best value for money">Best value for money</option>
          <option value="Speed — I need it done quickly">Speed — I need it done quickly</option>
          <option value="Reliability and communication">Reliability and communication</option>
          <option value="Local trader preferred">Local trader preferred</option>
          <option value="Specific qualifications or accreditations">Specific qualifications or accreditations</option>
        </S>
      </F>
      <InfoBox variant="amber">
        <strong>What happens next?</strong> Once submitted, your brief is reviewed by ProGrafter before being shared with
        relevant vetted traders in your area. Traders must respond within 48 hours or the brief is passed to the next
        available trader. You are under no obligation to accept any quote.
      </InfoBox>
    </>,

    <>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: C.deep, margin: "0 0 4px" }}>Review your brief</h2>
      <p style={{ fontSize: 13, color: C.secondary, margin: "0 0 20px" }}>
        This is exactly what vetted traders will see. Check it over before submitting.
      </p>
      <BriefPreview form={form} />
      <div style={{ marginTop: 16 }}>
        <InfoBox variant="navy">
          <strong>By submitting this brief you agree that:</strong>
          <ul style={{ paddingLeft: 16, margin: "6px 0 0", lineHeight: 1.8 }}>
            <li>All information provided is accurate to the best of your knowledge.</li>
            <li>You will respond to traders who request to quote within 48 hours.</li>
            <li>You will not use ProGrafter quotes as price leverage with off-platform traders.</li>
            <li>If you accept a quote and cancel without valid reason, a cancellation fee may apply.</li>
            <li>All payments must go through ProGrafter escrow — no cash arrangements.</li>
          </ul>
        </InfoBox>
      </div>
    </>,
  ];

  if (submitted) {
    const ref = `PG-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    return (
      <div style={{ minHeight: "100vh", background: C.cream, display: "flex",
        alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', system-ui, sans-serif", padding: "2rem 1rem" }}>
        <div style={{ maxWidth: 480, width: "100%", background: C.white,
          borderRadius: 20, border: `1.5px solid ${C.border}`,
          padding: "2.5rem 2rem", textAlign: "center",
          boxShadow: "0 4px 24px rgba(15,34,56,0.07)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.tealLight,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem" }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke={C.teal} strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.deep, marginBottom: 8 }}>Brief submitted</h2>
          <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.65, marginBottom: 16 }}>
            Your job brief has been received. ProGrafter will review it and match you with
            vetted traders in your area. You'll hear from us within 24 hours.
          </p>
          <div style={{ background: C.cream, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: C.secondary, margin: "0 0 4px" }}>Your reference number</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: C.teal,
              fontFamily: "'DM Mono', monospace", margin: 0 }}>{ref}</p>
          </div>
          <p style={{ fontSize: 12, color: C.secondary }}>
            Confirmation sent to <strong style={{ color: C.navy }}>{form.email}</strong>
          </p>
          <div style={{ marginTop: 20, padding: "12px 16px", background: C.tealLight,
            borderRadius: 10, fontSize: 12, color: "#0F766E", lineHeight: 1.6 }}>
            <strong>What to expect:</strong> Traders have 48 hours to respond to your brief.
            You'll be notified for each quote received. All traders on ProGrafter are
            personally vetted — qualifications verified, references called, interview conducted.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ background: C.deep, padding: "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" }}>
          <span style={{ color: C.cream }}>Pro</span>
          <span style={{ color: C.teal }}>Grafter</span>
        </div>
        <span style={{ fontSize: 12, color: "rgba(245,240,232,0.5)", letterSpacing: "0.06em" }}>
          POST A JOB
        </span>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: C.deep, marginBottom: 4 }}>
            Post your job brief
          </p>
          <p style={{ fontSize: 13, color: C.secondary }}>
            Every trader who sees this brief is vetted, insured, and referenced. Takes about 5 minutes.
          </p>
        </div>

        <StepBar current={step} />

        <div style={{ background: C.white, borderRadius: 16,
          border: `1.5px solid ${C.border}`,
          padding: "1.75rem",
          boxShadow: "0 2px 16px rgba(15,34,56,0.05)" }}>
          {pages[step]}

          <div style={{ display: "flex", alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1.5px solid ${C.cream}`,
            paddingTop: 20, marginTop: 16 }}>
            {step > 0
              ? <button style={btnBack} onClick={back}>← Back</button>
              : <div />}

            {step < STEPS.length - 1
              ? <button style={btnPrimary} onClick={next}>Continue →</button>
              : <button style={btnNavy} onClick={submit}>Submit brief</button>}
          </div>

          <p style={{ textAlign: "center", fontSize: 11, color: C.secondary, marginTop: 12 }}>
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 24,
          marginTop: 20, flexWrap: "wrap" }}>
          {[
            "🔒 Identity verified",
            "✅ Vetted traders only",
            "💷 Escrow protected",
            "📄 Full documentation",
          ].map(item => (
            <span key={item} style={{ fontSize: 12, color: C.secondary }}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
