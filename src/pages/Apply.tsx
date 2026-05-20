import { useState, type CSSProperties, type ReactNode, type ChangeEvent } from "react";

// ── ProGrafter Brand Palette ──────────────────────────────────────────────────
const C = {
  cream: "#F5F0E8",
  deep: "#0F2238",
  navy: "#1B3A5C",
  teal: "#0D9488",
  tealHover: "#14B8A8",
  tealLight: "#CCFBF1",
  body: "#1F2937",
  secondary: "#4B5563",
  border: "#D1CBB8",
  white: "#FFFFFF",
  error: "#DC2626",
  errorBg: "#FEF2F2",
  successBg: "#F0FDF9",
  success: "#0D9488",
};

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", textAlign: "left", background: "none", border: "none", padding: "16px 0",
          fontSize: 14, fontWeight: 600, color: C.deep, cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <span>{q}</span>
        <span style={{
          display: "inline-block", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)",
          fontSize: 12, color: C.teal, marginLeft: 12,
        }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: "0 0 16px", fontSize: 13, color: C.body, lineHeight: 1.65 }}>
          {a}
        </div>
      )}
    </div>
  );
};

const TRADES = [
  { id: "electrician", name: "Electrician", lane: "regulated", body: "Competent Person Scheme" },
  { id: "gas_engineer", name: "Gas Engineer", lane: "regulated", body: "Gas Safe Register" },
  { id: "general_builder", name: "General Builder", lane: "unregulated" },
  { id: "plasterer", name: "Plasterer", lane: "unregulated" },
  { id: "carpenter", name: "Carpenter / Joiner", lane: "unregulated" },
  { id: "tiler", name: "Tiler", lane: "unregulated" },
  { id: "decorator", name: "Decorator / Painter", lane: "unregulated" },
  { id: "roofer", name: "Roofer", lane: "unregulated" },
  { id: "plumber", name: "Plumber", lane: "unregulated" },
  { id: "scaffolder", name: "Scaffolder", lane: "unregulated" },
  { id: "landscaper", name: "Landscaper", lane: "unregulated" },
] as const;


const STEPS = ["Your details", "Your trade", "Qualifications", "Insurance", "References", "Declaration"];

type FormState = Record<string, string | boolean>;

const BLANK: FormState = {
  full_name: "", business_name: "", business_type: "", companies_house_number: "",
  email: "", phone: "", address_line1: "", address_line2: "", city: "", postcode: "",
  trade_category_id: "", years_trading: "", trading_history_description: "",
  registration_number: "", registration_expiry: "", cps_scheme: "", portfolio_description: "",
  insurance_provider: "", insurance_policy_number: "", insurance_expiry: "",
  public_liability_cover: "", employers_liability_cover: "",
  ref1_name: "", ref1_phone: "", ref1_email: "", ref1_relationship: "", ref1_job_description: "", ref1_job_year: "",
  ref2_name: "", ref2_phone: "", ref2_email: "", ref2_relationship: "", ref2_job_description: "", ref2_job_year: "",
  declaration_accepted: false,
};

const inputBase = (err?: string): CSSProperties => ({
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: `1.5px solid ${err ? C.error : C.border}`,
  fontSize: 14, color: C.body, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box", background: C.white,
  transition: "border-color 0.15s",
});

const Field = ({ label, req, hint, err, children }: { label: string; req?: boolean; hint?: string; err?: string; children: ReactNode }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.deep, marginBottom: 6 }}>
      {label}{req && <span style={{ color: C.error }}> *</span>}
    </label>
    {children}
    {hint && <p style={{ fontSize: 12, color: C.secondary, margin: "6px 0 0" }}>{hint}</p>}
    {err && <p style={{ fontSize: 12, color: C.error, margin: "6px 0 0" }}>{err}</p>}
  </div>
);

const Grid = ({ children }: { children: ReactNode }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>
);

const InfoBox = ({ variant, children }: { variant?: "blue" | "teal" | "amber"; children: ReactNode }) => {
  const styles =
    variant === "blue" ? { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF" } :
    variant === "teal" ? { bg: C.tealLight, border: "#99F6E4", text: "#0F766E" } :
    variant === "amber" ? { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E" } :
    { bg: "#F3F4F6", border: C.border, text: C.body };
  return (
    <div style={{ background: styles.bg, border: `1px solid ${styles.border}`, color: styles.text, borderRadius: 8, padding: 12, fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
      {children}
    </div>
  );
};

const StepBar = ({ current }: { current: number }) => (
  <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
    {STEPS.map((_, i) => (
      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= current ? C.teal : C.border }} />
    ))}
  </div>
);

type UpdFn = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;

const RefBlock = ({ n, px, form, upd, errors }: { n: number; px: "ref1" | "ref2"; form: FormState; upd: UpdFn; errors: Record<string, string> }) => (
  <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16, background: C.white }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.teal, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{n}</div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.deep, margin: 0 }}>Reference {n}</h3>
    </div>
    <Grid>
      <Field label="Full name" req err={errors[`${px}_name`]}>
        <input style={inputBase(errors[`${px}_name`])} value={form[`${px}_name`] as string} onChange={upd(`${px}_name`)} placeholder="Sarah Mitchell" />
      </Field>
      <Field label="Phone" req err={errors[`${px}_phone`]}>
        <input style={inputBase(errors[`${px}_phone`])} value={form[`${px}_phone`] as string} onChange={upd(`${px}_phone`)} placeholder="07700 900000" />
      </Field>
    </Grid>
    <Field label="Email" err={errors[`${px}_email`]}>
      <input style={inputBase(errors[`${px}_email`])} value={form[`${px}_email`] as string} onChange={upd(`${px}_email`)} placeholder="sarah@example.co.uk" />
    </Field>
    <Field label="Your relationship to this person" req err={errors[`${px}_relationship`]}>
      <input style={inputBase(errors[`${px}_relationship`])} value={form[`${px}_relationship`] as string} onChange={upd(`${px}_relationship`)} placeholder="Previous client / Architect / Contractor" />
    </Field>
    <Field label="What job did you do for them?" req err={errors[`${px}_job_description`]}>
      <input style={inputBase(errors[`${px}_job_description`])} value={form[`${px}_job_description`] as string} onChange={upd(`${px}_job_description`)} placeholder="Full rewire of 4-bedroom house" />
    </Field>
    <Field label="Year completed" req err={errors[`${px}_job_year`]}>
      <select style={inputBase(errors[`${px}_job_year`])} value={form[`${px}_job_year`] as string} onChange={upd(`${px}_job_year`)}>
        <option value="">Select year...</option>
        {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </Field>
  </div>
);

export default function Apply() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(BLANK);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const upd: UpdFn = (k) => (e) => {
    const target = e.target as HTMLInputElement;
    setForm(p => ({ ...p, [k]: target.type === "checkbox" ? target.checked : target.value }));
  };

  const cat = TRADES.find(t => t.id === form.trade_category_id);
  const reg = cat?.lane === "regulated";

  const validate = (n: number): Record<string, string> => {
    const e: Record<string, string> = {};
    const v = (k: string) => (form[k] as string)?.trim?.() ?? "";
    if (n === 0) {
      if (!v("full_name")) e.full_name = "Required";
      if (!/\S+@\S+\.\S+/.test(form.email as string)) e.email = "Valid email required";
      if (!v("phone")) e.phone = "Required";
      if (!form.business_type) e.business_type = "Required";
      if (!v("address_line1")) e.address_line1 = "Required";
      if (!v("city")) e.city = "Required";
      if (!v("postcode")) e.postcode = "Required";
      if (form.business_type === "limited_company" && !v("companies_house_number")) e.companies_house_number = "Required for limited companies";
    }
    if (n === 1) {
      if (!form.trade_category_id) e.trade_category_id = "Please select your trade";
      if (form.years_trading === "") e.years_trading = "Required";
      if (!reg && !v("trading_history_description")) e.trading_history_description = "Required";
    }
    if (n === 2) {
      if (reg) {
        if (!v("registration_number")) e.registration_number = "Required";
        if (!form.registration_expiry) e.registration_expiry = "Required";
        if (cat?.id === "electrician" && !v("cps_scheme")) e.cps_scheme = "Required";
      } else {
        if (!v("portfolio_description")) e.portfolio_description = "Required";
      }
    }
    if (n === 3) {
      if (!v("insurance_provider")) e.insurance_provider = "Required";
      if (!v("insurance_policy_number")) e.insurance_policy_number = "Required";
      if (!form.insurance_expiry) e.insurance_expiry = "Required";
      if (!form.public_liability_cover) e.public_liability_cover = "Required";
    }
    if (n === 4) {
      (["ref1", "ref2"] as const).forEach(p => {
        if (!v(`${p}_name`)) e[`${p}_name`] = "Required";
        if (!v(`${p}_phone`)) e[`${p}_phone`] = "Required";
        if (!v(`${p}_relationship`)) e[`${p}_relationship`] = "Required";
        if (!v(`${p}_job_description`)) e[`${p}_job_description`] = "Required";
        if (!form[`${p}_job_year`]) e[`${p}_job_year`] = "Required";
      });
    }
    if (n === 5 && !form.declaration_accepted) e.declaration_accepted = "You must accept the declaration to proceed";
    return e;
  };

  const next = () => { const e = validate(step); setErrors(e); if (!Object.keys(e).length) setStep(s => s + 1); };
  const back = () => { setErrors({}); setStep(s => s - 1); };
  const submit = () => { const e = validate(5); setErrors(e); if (!Object.keys(e).length) setDone(true); };

  const I = ({ f, type = "text", ...p }: { f: string; type?: string; placeholder?: string; maxLength?: number }) => (
    <input type={type} style={inputBase(errors[f])} value={form[f] as string} onChange={upd(f)} {...p} />
  );
  const S = ({ f, children }: { f: string; children: ReactNode }) => (
    <select style={inputBase(errors[f])} value={form[f] as string} onChange={upd(f)}>{children}</select>
  );
  const T = ({ f, ...p }: { f: string; placeholder?: string; rows?: number }) => (
    <textarea style={{ ...inputBase(errors[f]), resize: "vertical", minHeight: 96 }} value={form[f] as string} onChange={upd(f)} {...p} />
  );

  const pages = [
    // 0 — Details
    <div key="0">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: C.deep, margin: "0 0 4px" }}>Your details</h2>
        <p style={{ fontSize: 13, color: C.secondary, margin: 0 }}>Tell us about you and your business. All information is kept confidential.</p>
      </div>
      <Grid>
        <Field label="Full name" req err={errors.full_name}><I f="full_name" placeholder="James Harrison" /></Field>
        <Field label="Business name" hint="Leave blank if trading under your own name"><I f="business_name" placeholder="Harrison Electrical Ltd" /></Field>
      </Grid>
      <Field label="Business type" req err={errors.business_type}>
        <S f="business_type">
          <option value="">Select...</option>
          <option value="sole_trader">Sole trader</option>
          <option value="limited_company">Limited company</option>
          <option value="partnership">Partnership</option>
        </S>
      </Field>
      {form.business_type === "limited_company" && (
        <Field label="Companies House number" req err={errors.companies_house_number} hint="8-digit number from your certificate of incorporation">
          <I f="companies_house_number" placeholder="12345678" maxLength={8} />
        </Field>
      )}
      <Grid>
        <Field label="Email address" req err={errors.email}><I f="email" type="email" placeholder="james@company.co.uk" /></Field>
        <Field label="Phone" req err={errors.phone}><I f="phone" placeholder="07700 900000" /></Field>
      </Grid>
      <Field label="Address line 1" req err={errors.address_line1}><I f="address_line1" placeholder="123 High Street" /></Field>
      <Field label="Address line 2"><I f="address_line2" placeholder="Apt / Suite" /></Field>
      <Grid>
        <Field label="City / Town" req err={errors.city}><I f="city" placeholder="Nottingham" /></Field>
        <Field label="Postcode" req err={errors.postcode}><I f="postcode" placeholder="NG1 1AA" /></Field>
      </Grid>
    </div>,

    // 1 — Trade
    <div key="1">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: C.deep, margin: "0 0 4px" }}>Your trade</h2>
        <p style={{ fontSize: 13, color: C.secondary, margin: 0 }}>Select your primary trade — this determines your vetting pathway.</p>
      </div>
      <Field label="Primary trade" req err={errors.trade_category_id}>
        <S f="trade_category_id">
          <option value="">Select your trade...</option>
          {TRADES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </S>
      </Field>
      {cat?.id === "electrician" && (
        <InfoBox variant="amber">
          <strong style={{ display: "block", marginBottom: 4 }}>Electrician — Competent Person Scheme verification</strong>
          <p style={{ margin: "0 0 8px" }}>
            We verify your registration with a Competent Person Scheme (CPS) — NICEIC, NAPIT, ELECSA, or equivalent. This is the legal requirement for domestic electrical work in England and Wales under Part P of the Building Regulations.
          </p>
          <p style={{ margin: "0 0 8px" }}>
            We do not require a CSCS card or ECS Gold Card as a separate check. If you are currently registered with a CPS as a domestic installer or qualified supervisor, you are eligible regardless of your qualification route — including if you qualified via the Experienced Worker Assessment rather than a traditional apprenticeship.
          </p>
          <p style={{ margin: 0 }}>
            The ECS Gold Card requirements changed in December 2025. We are aware of this and will not penalise electricians who are mid-transition between qualification routes, provided your CPS registration is current.
          </p>
        </InfoBox>
      )}
      {cat?.id === "gas_engineer" && (
        <InfoBox variant="amber">
          <strong style={{ display: "block", marginBottom: 4 }}>Gas Engineer — Gas Safe Register verification</strong>
          You must be currently listed on the Gas Safe Register for the gas work categories you intend to carry out. We verify your registration directly against the public register — registration is the ongoing legal check, so it must be live at the time of every job.
        </InfoBox>
      )}
      {cat && cat.lane === "unregulated" && (
        <InfoBox variant="teal">
          <strong style={{ display: "block", marginBottom: 4 }}>{cat.name} — experience and insurance verification</strong>
          <p style={{ margin: "0 0 8px" }}>
            We do not require a CSCS card for domestic trades work. CSCS cards are a commercial construction site requirement and are not applicable to the residential work ProGrafter covers.
          </p>
          <p style={{ margin: "0 0 6px", fontWeight: 600 }}>We verify:</p>
          <ul style={{ margin: "0 0 8px", paddingLeft: 18 }}>
            <li>Valid public liability insurance (we contact your insurer)</li>
            <li>Trading history and business registration</li>
            <li>Two client references (we call them by phone)</li>
            <li>A short interview conducted by the ProGrafter team</li>
          </ul>
          <p style={{ margin: 0 }}>
            This is a more meaningful check for residential trades than any card — and it&apos;s how we ensure the trades on our platform are genuinely at the top of their game.
          </p>
        </InfoBox>
      )}
      <Field label="Years trading in this profession" req err={errors.years_trading}>
        <S f="years_trading">
          <option value="">Select...</option>
          <option value="0">Less than 1 year</option>
          {Array.from({ length: 40 }, (_, i) => i + 1).map(y => <option key={y} value={y}>{y} {y === 1 ? "year" : "years"}</option>)}
        </S>
      </Field>
      {cat?.lane === "unregulated" && (
        <Field label="Brief trading history" req err={errors.trading_history_description} hint="A short paragraph: what you do, typical jobs, anything we should know.">
          <T f="trading_history_description" rows={4} placeholder="I've been a domestic plasterer for 12 years, working mostly on Victorian terraces across south Manchester..." />
        </Field>
      )}
    </div>,

    // 2 — Qualifications / Portfolio
    <div key="2">
      {reg ? (
        <>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.deep, margin: "0 0 4px" }}>Registration & qualifications</h2>
            <p style={{ fontSize: 13, color: C.secondary, margin: 0 }}>We verify your registration directly with the body. Accurate details only.</p>
          </div>
          <InfoBox variant="amber">
            <strong>Important:</strong> We check your registration number against the {cat?.body} public register. Any discrepancy pauses your application until resolved.
          </InfoBox>
          {cat?.id === "electrician" ? (
            <>
              <Field
                label="Competent Person Scheme registration number"
                req
                err={errors.registration_number}
                hint="Your NICEIC, NAPIT, ELECSA or equivalent registration number. We verify this directly with your scheme — this takes 2 minutes and confirms you are currently authorised to self-certify domestic electrical work."
              >
                <I f="registration_number" placeholder="123456" />
              </Field>
              <Field label="Which scheme are you registered with?" req err={errors.cps_scheme}>
                <S f="cps_scheme">
                  <option value="">Select scheme...</option>
                  <option value="NICEIC">NICEIC</option>
                  <option value="NAPIT">NAPIT</option>
                  <option value="ELECSA">ELECSA</option>
                  <option value="Stroma Certification">Stroma Certification</option>
                  <option value="OFTEC">OFTEC (oil/solid fuel)</option>
                  <option value="Other">Other approved CPS</option>
                </S>
              </Field>
            </>
          ) : (
            <Field label={`${cat?.body} registration number`} req err={errors.registration_number}>
              <I f="registration_number" placeholder="123456" />
            </Field>
          )}
          <Field label="Registration expiry date" req err={errors.registration_expiry}>
            <I f="registration_expiry" type="date" />
          </Field>
        </>
      ) : (
        <>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.deep, margin: "0 0 4px" }}>Portfolio of work</h2>
            <p style={{ fontSize: 13, color: C.secondary, margin: 0 }}>Describe a selection of completed jobs. This is reviewed personally — be specific.</p>
          </div>
          <Field label="Describe 3–5 recent jobs" req err={errors.portfolio_description} hint="Include scope, value, location (town only), duration, and any challenges.">
            <T f="portfolio_description" rows={8} placeholder="1. Full bathroom refurb, Didsbury M20, £8,400, 9 days — replaced rotten subfloor we discovered on day 2..." />
          </Field>
          <InfoBox variant="blue">
            In production: connect a Lovable Cloud file upload here. Minimum 3 photos of completed work required before submission.
          </InfoBox>
        </>
      )}
    </div>,

    // 3 — Insurance
    <div key="3">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: C.deep, margin: "0 0 4px" }}>Insurance details</h2>
        <p style={{ fontSize: 13, color: C.secondary, margin: 0 }}>We verify insurance directly with your provider. Lapsed insurance = immediate suspension.</p>
      </div>
      <Grid>
        <Field label="Insurance provider" req err={errors.insurance_provider}><I f="insurance_provider" placeholder="Hiscox / Direct Line / etc." /></Field>
        <Field label="Policy number" req err={errors.insurance_policy_number}><I f="insurance_policy_number" placeholder="POL-12345678" /></Field>
      </Grid>
      <Grid>
        <Field label="Policy expiry" req err={errors.insurance_expiry}><I f="insurance_expiry" type="date" /></Field>
        <Field label="Public liability cover" req err={errors.public_liability_cover}>
          <S f="public_liability_cover">
            <option value="">Select cover level...</option>
            {["£1,000,000", "£2,000,000", "£5,000,000", "£10,000,000+"].map(o => <option key={o} value={o}>{o}</option>)}
          </S>
        </Field>
      </Grid>
      <Field label="Employers' liability cover (if you employ staff)">
        <S f="employers_liability_cover">
          <option value="">Not applicable</option>
          {["£1,000,000", "£2,000,000", "£5,000,000", "£10,000,000+"].map(o => <option key={o} value={o}>{o}</option>)}
        </S>
      </Field>
      <InfoBox variant="blue">
        ProGrafter will contact your insurer directly to verify this policy before your application is approved. We also set a renewal reminder — updated documentation must be provided before expiry or your listing is automatically suspended.
      </InfoBox>
    </div>,

    // 4 — References
    <div key="4">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: C.deep, margin: "0 0 4px" }}>Client references</h2>
        <p style={{ fontSize: 13, color: C.secondary, margin: 0 }}>We call both references ourselves — a phone conversation, not a form.</p>
      </div>
      <InfoBox variant="teal">
        We call these references personally. Please let them know to expect our call. We'll ask about the work you did, how you handled any problems, and whether they'd use you again.
      </InfoBox>
      <RefBlock n={1} px="ref1" form={form} upd={upd} errors={errors} />
      <RefBlock n={2} px="ref2" form={form} upd={upd} errors={errors} />
    </div>,

    // 5 — Declaration
    <div key="5">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: C.deep, margin: "0 0 4px" }}>Declaration</h2>
        <p style={{ fontSize: 13, color: C.secondary, margin: 0 }}>Please read carefully before submitting your application.</p>
      </div>
      <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16, fontSize: 13, color: C.body, lineHeight: 1.6 }}>
        <p style={{ margin: "0 0 10px", fontWeight: 600 }}>By submitting this application, I confirm that:</p>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>All information I have provided is accurate and truthful. Misrepresentation results in immediate rejection or removal.</li>
          <li>I hold valid public liability insurance and will notify ProGrafter immediately if this lapses.</li>
          <li>For regulated trades: my registration is current and I am authorised to carry out the work described.</li>
          <li>I consent to ProGrafter verifying my details with Companies House, my registration body, my insurers, and the references I have provided.</li>
          <li>I agree to ProGrafter's commission structure (7.5% of job value, capped at £900) and the platform's dispute and review processes.</li>
          <li>I understand that reviews are bilateral and immutable — neither side can remove them once submitted.</li>
          <li>ProGrafter may suspend or remove my listing if standards fall below platform requirements.</li>
        </ul>
      </div>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", padding: 12, border: `1.5px solid ${errors.declaration_accepted ? C.error : C.border}`, borderRadius: 8, background: C.white }}>
        <input type="checkbox" checked={form.declaration_accepted as boolean} onChange={upd("declaration_accepted")} style={{ marginTop: 3 }} />
        <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
          I confirm that all information is accurate and I accept the terms set out above.
        </span>
      </label>
      {errors.declaration_accepted && <p style={{ fontSize: 12, color: C.error, margin: "8px 0 0" }}>{errors.declaration_accepted}</p>}
    </div>,
  ];

  if (done) return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 480, background: C.white, borderRadius: 14, padding: 32, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.successBg, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.deep, margin: "0 0 10px" }}>Application received</h1>
        <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.6, margin: "0 0 16px" }}>
          Thank you for applying to ProGrafter. We review every application personally — you'll hear from us within 1 working day about the next steps.
        </p>
        <p style={{ fontSize: 13, color: C.body, margin: 0 }}>We'll be in touch at <strong>{form.email as string}</strong></p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.cream }}>
      <div style={{ background: C.deep, color: C.white, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="font-heading tracking-wider" style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.3 }}>
          <span>PRO</span><span style={{ color: C.tealHover }}>GRAFTER</span>
        </div>
        <div style={{ fontSize: 11, letterSpacing: 1.2, color: C.tealLight, fontWeight: 600 }}>TRADE APPLICATION</div>
      </div>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 20px 60px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.deep, margin: "0 0 6px" }}>Apply to join ProGrafter</h1>
          <p style={{ fontSize: 14, color: C.secondary, margin: 0 }}>We review every application personally. This takes around 10 minutes.</p>
        </div>

        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.deep, margin: "0 0 4px" }}>Common questions from trades</h2>
          <p style={{ fontSize: 13, color: C.secondary, margin: "0 0 16px" }}>Before you start, here are answers to questions we hear most often.</p>
          <FAQItem q="Do I need a CSCS card to join ProGrafter?" a="No. CSCS cards are a commercial construction site requirement and are not applicable to domestic residential work. We do not require a CSCS card from any trade. We verify insurance, trading history, references, and conduct a short interview — which we believe is a more meaningful check for residential work." />
          <FAQItem q="I'm an electrician — do I need an ECS Gold Card or NVQ Level 3?" a="No, not as a separate requirement. We verify your Competent Person Scheme registration (NICEIC, NAPIT, ELECSA or equivalent) directly. Your scheme membership already confirms your competence has been assessed. We are aware the ECS Gold Card requirements changed in December 2025 and will not penalise electricians who qualified via the Experienced Worker Assessment or the domestic NVQ route, as long as your CPS registration is current." />
          <FAQItem q="I've worked domestically for 20 years but don't have formal qualifications — can I still apply?" a="Yes, for unregulated trades (decorating, tiling, landscaping, groundworks, general building, bathroom fitting, carpentry, plastering, roofing). We assess experience through your portfolio, your trading history, and the two client references we call personally. A 20-year trade with demonstrable quality work is exactly who we want on ProGrafter." />
          <FAQItem q="I work on domestic properties only — do I need the same qualifications as someone who works commercially?" a="No. Commercial and industrial qualifications are irrelevant to the work ProGrafter covers. We verify what applies to residential work only." />
          <FAQItem q="What happens after I submit my application?" a="Lee Palfreeman (founder) personally reviews every application within 1 working day. We'll contact your references by phone — not by form — and may book a short interview call. You'll receive an email the moment you're verified, and you can start quoting for jobs immediately after that." />
          <FAQItem q="Is there any cost to join?" a="£0 to register. £0 to quote. We charge 7.5% commission on completed jobs only, capped at £900 regardless of contract size. No monthly fee — ever. You pay nothing until you earn." />
        </div>

        <StepBar current={step} />
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          {pages[step]}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            {step > 0
              ? <button onClick={back} style={{ background: "transparent", border: `1.5px solid ${C.border}`, color: C.body, padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← Back</button>
              : <span />}
            {step < STEPS.length - 1
              ? <button onClick={next} onMouseEnter={e => (e.currentTarget.style.background = C.tealHover)} onMouseLeave={e => (e.currentTarget.style.background = C.teal)} style={{ background: C.teal, color: C.white, border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }}>Continue →</button>
              : <button onClick={submit} style={{ background: C.teal, color: C.white, border: "none", padding: "10px 22px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Submit application</button>}
          </div>
          <p style={{ textAlign: "center", fontSize: 12, color: C.secondary, margin: "16px 0 0" }}>
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>
      </div>
    </div>
  );
}
