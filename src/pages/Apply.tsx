import { useCallback, useRef, useState, type CSSProperties, type ReactNode, type ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";


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
  // Regulated — mandatory scheme registration required
  { id: "electrician", name: "Electrician", lane: "regulated", body: "Competent Person Scheme (NICEIC / NAPIT)" },
  { id: "gas_engineer", name: "Gas Engineer", lane: "regulated", body: "Gas Safe Register" },
  { id: "solar_pv", name: "Solar PV Installer", lane: "regulated", body: "MCS" },
  { id: "heat_pump", name: "Heat Pump Installer", lane: "regulated", body: "MCS" },
  { id: "ev_charger", name: "EV Charger Installer", lane: "regulated", body: "OZEV-authorised" },
  { id: "oil_boiler", name: "Oil Boiler Engineer", lane: "regulated", body: "OFTEC" },
  // Unregulated — no mandatory scheme; vetted by experience, insurance, references
  { id: "plumber", name: "Plumber", lane: "unregulated" },
  { id: "general_builder", name: "General Builder", lane: "unregulated" },
  { id: "plasterer", name: "Plasterer", lane: "unregulated" },
  { id: "carpenter", name: "Carpenter / Joiner", lane: "unregulated" },
  { id: "tiler", name: "Tiler", lane: "unregulated" },
  { id: "decorator", name: "Decorator / Painter", lane: "unregulated" },
  { id: "roofer", name: "Roofer", lane: "unregulated" },
  { id: "kitchen_bathroom_fitter", name: "Kitchen / Bathroom Fitter", lane: "unregulated" },
  { id: "landscaper", name: "Landscaper", lane: "unregulated" },
] as const;


const STEPS = ["Your details", "Your trade", "Qualifications", "Portfolio of work", "Insurance", "References", "Declaration"];

const QUAL_PATHS = [
  { value: "regulated", label: "Regulated trade (electrical, gas, renewables, etc.) — I hold a current scheme card" },
  { value: "qualified", label: "Qualified trade — I have an NVQ, City & Guilds, or completed apprenticeship" },
  { value: "time_served", label: "Time-served — I have years of experience but no formal qualification on file" },
] as const;

const RELATIONSHIP_OPTIONS = [
  { value: "past_customer", label: "Past customer" },
  { value: "trade_contact", label: "Trade contact" },
  { value: "supplier", label: "Supplier" },
  { value: "other", label: "Other" },
] as const;

type RelationshipValue = (typeof RELATIONSHIP_OPTIONS)[number]["value"];

type ReferenceEntry = {
  contact_name: string;
  relationship: RelationshipValue | "";
  phone: string;
  email: string;
};

const blankRef = (): ReferenceEntry => ({ contact_name: "", relationship: "", phone: "", email: "" });

type FormState = Record<string, string | boolean>;

const BLANK: FormState = {
  full_name: "", business_name: "", business_type: "", companies_house_number: "",
  email: "", phone: "", address_line1: "", address_line2: "", city: "", postcode: "",
  trade_category_id: "", years_trading: "", trading_history_description: "",
  registration_number: "", registration_expiry: "", cps_scheme: "", portfolio_description: "",
  insurance_provider: "", insurance_policy_number: "", insurance_expiry: "",
  public_liability_cover: "", employers_liability_cover: "",
  // Qualifications step
  qualification_path: "",
  qual_scheme_name: "", qual_reg_number: "", qual_reg_expiry: "", qual_card_doc: "",
  qual_type: "", qual_awarding_body: "", qual_year: "", qual_cert_doc: "",
  ts_years: "", ts_specialism: "",
  ts_ref1_name: "", ts_ref1_role: "", ts_ref1_phone: "", ts_ref1_email: "",
  ts_ref2_name: "", ts_ref2_role: "", ts_ref2_phone: "", ts_ref2_email: "",
  ts_consent: false,
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

const RefBlock = ({
  n,
  entry,
  errors,
  onChange,
  onRemove,
  canRemove,
}: {
  n: number;
  entry: ReferenceEntry;
  errors: Record<string, string>;
  onChange: (patch: Partial<ReferenceEntry>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) => {
  const k = (field: string) => `ref${n}_${field}`;
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16, background: C.white }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.teal, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{n}</div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.deep, margin: 0 }}>Reference {n}</h3>
        </div>
        {canRemove && (
          <button type="button" onClick={onRemove} style={{ background: "none", border: "none", color: C.error, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Remove
          </button>
        )}
      </div>
      <Field label="Contact name" req err={errors[k("contact_name")]}>
        <input style={inputBase(errors[k("contact_name")])} value={entry.contact_name} onChange={(e) => onChange({ contact_name: e.target.value })} placeholder="Sarah Mitchell" />
      </Field>
      <Field label="Relationship" req err={errors[k("relationship")]}>
        <select style={inputBase(errors[k("relationship")])} value={entry.relationship} onChange={(e) => onChange({ relationship: e.target.value as RelationshipValue })}>
          <option value="">Select...</option>
          {RELATIONSHIP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>
      <Grid>
        <Field label="Phone" err={errors[k("phone")]}>
          <input style={inputBase(errors[k("phone")])} value={entry.phone} onChange={(e) => onChange({ phone: e.target.value })} placeholder="07700 900000" />
        </Field>
        <Field label="Email" err={errors[k("email")]}>
          <input style={inputBase(errors[k("email")])} value={entry.email} onChange={(e) => onChange({ email: e.target.value })} placeholder="sarah@example.co.uk" />
        </Field>
      </Grid>
      {errors[k("contact_method")] && (
        <p style={{ fontSize: 12, color: C.error, margin: "-6px 0 0" }}>{errors[k("contact_method")]}</p>
      )}
    </div>
  );
};


export default function Apply() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(BLANK);
  const [references, setReferences] = useState<ReferenceEntry[]>([blankRef(), blankRef()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Uploaded files. Single-file fields hold a one-element array; portfolio holds many.
  const [files, setFiles] = useState<Record<string, File[]>>({});

  const setFieldFiles = (key: string, list: File[]) => setFiles((p) => ({ ...p, [key]: list }));

  const upd: UpdFn = (k) => (e) => {
    const target = e.target as HTMLInputElement;
    setForm(p => ({ ...p, [k]: target.type === "checkbox" ? target.checked : target.value }));
  };

  const updateRef = (i: number, patch: Partial<ReferenceEntry>) => {
    setReferences(prev => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  const addRef = () => setReferences(prev => [...prev, blankRef()]);
  const removeRef = (i: number) => setReferences(prev => prev.filter((_, idx) => idx !== i));

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
      const path = form.qualification_path as string;
      if (!path) {
        e.qualification_path = "Please choose the option that best describes you";
      } else if (path === "regulated") {
        if (!v("qual_scheme_name")) e.qual_scheme_name = "Required";
        if (!v("qual_reg_number")) e.qual_reg_number = "Required";
        if (!form.qual_reg_expiry) e.qual_reg_expiry = "Required";
        if (!(files.qual_card_doc?.length)) e.qual_card_doc = "Please upload your scheme card or certificate";
      } else if (path === "qualified") {
        if (!v("qual_type")) e.qual_type = "Required";
        if (!v("qual_awarding_body")) e.qual_awarding_body = "Required";
        if (!v("qual_year")) e.qual_year = "Required";
        if (!(files.qual_cert_doc?.length)) e.qual_cert_doc = "Please upload your certificate";
      } else if (path === "time_served") {
        const years = Number(form.ts_years);
        if (form.ts_years === "" || Number.isNaN(years)) e.ts_years = "Required";
        else if (years < 5) e.ts_years = "You need at least 5 years on the tools to apply via this route";
        if (!v("ts_specialism")) e.ts_specialism = "Required";
        ([1, 2] as const).forEach((rn) => {
          if (!v(`ts_ref${rn}_name`)) e[`ts_ref${rn}_name`] = "Required";
          if (!v(`ts_ref${rn}_role`)) e[`ts_ref${rn}_role`] = "Required";
          if (!v(`ts_ref${rn}_phone`)) e[`ts_ref${rn}_phone`] = "Required";
          const email = v(`ts_ref${rn}_email`);
          if (!email) e[`ts_ref${rn}_email`] = "Required";
          else if (!/\S+@\S+\.\S+/.test(email)) e[`ts_ref${rn}_email`] = "Invalid email";
        });
        if (!form.ts_consent) e.ts_consent = "You must confirm this to proceed";
      }
    }
    if (n === 3) {
      if (reg) {
        if (!v("registration_number")) e.registration_number = "Required";
        if (!form.registration_expiry) e.registration_expiry = "Required";
        if (cat?.id === "electrician" && !v("cps_scheme")) e.cps_scheme = "Required";
      } else {
        if (!v("portfolio_description")) e.portfolio_description = "Required";
      }
      if ((files.portfolio_photos?.length ?? 0) < 3) e.portfolio_photos = "Please upload at least 3 photos of completed work";
    }
    if (n === 4) {
      if (!v("insurance_provider")) e.insurance_provider = "Required";
      if (!v("insurance_policy_number")) e.insurance_policy_number = "Required";
      if (!form.insurance_expiry) e.insurance_expiry = "Required";
      if (!form.public_liability_cover) e.public_liability_cover = "Required";
      if (!(files.insurance_certificate?.length)) e.insurance_certificate = "Please upload your Certificate of Insurance";
    }
    if (n === 5) {
      if (references.length < 2) {
        e.references_count = "Please provide at least 2 references";
      }
      references.forEach((r, i) => {
        const n2 = i + 1;
        const k = (f: string) => `ref${n2}_${f}`;
        if (!r.contact_name.trim()) e[k("contact_name")] = "Required";
        if (!r.relationship) e[k("relationship")] = "Required";
        const phone = r.phone.trim();
        const email = r.email.trim();
        if (!phone && !email) {
          e[k("contact_method")] = "Provide at least a phone number or email";
        }
        if (email && !/\S+@\S+\.\S+/.test(email)) e[k("email")] = "Invalid email";
      });
    }
    if (n === 6 && !form.declaration_accepted) e.declaration_accepted = "You must accept the declaration to proceed";
    return e;
  };

  const next = () => { const e = validate(step); setErrors(e); if (!Object.keys(e).length) setStep(s => s + 1); };
  const back = () => { setErrors({}); setStep(s => s - 1); };

  const persistReferences = async () => {
    const applicantEmail = (form.email as string).trim().toLowerCase();
    if (!applicantEmail) return;
    const rows = references.map(r => ({
      applicant_email: applicantEmail,
      contact_name: r.contact_name.trim(),
      relationship: r.relationship || "other",
      phone: r.phone.trim() || null,
      email: r.email.trim() || null,
    }));
    const { error } = await supabase.from("trade_references").insert(rows);
    if (error) throw error;
  };

  const submit = async () => {
    const e = validate(6);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    try {
      await persistReferences();
      setDone(true);
    } catch (err: any) {
      console.error("Reference persistence failed", err);
      setErrors({ submit: err?.message || "Could not save your application. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };


  // Keep latest form/errors/upd accessible without recreating I/S/T each render.
  // Defining these inline as components caused React to remount the <input> on
  // every keystroke (new component type per render) → lost focus / one char at a time.
  const stateRef = useRef({ form, errors, upd, files });
  stateRef.current = { form, errors, upd, files };

  const I = useCallback(({ f, type = "text", ...p }: { f: string; type?: string; placeholder?: string; maxLength?: number }) => {
    const { form, errors, upd } = stateRef.current;
    return <input type={type} style={inputBase(errors[f])} value={form[f] as string} onChange={upd(f)} {...p} />;
  }, []);
  const S = useCallback(({ f, children }: { f: string; children: ReactNode }) => {
    const { form, errors, upd } = stateRef.current;
    return <select style={inputBase(errors[f])} value={form[f] as string} onChange={upd(f)}>{children}</select>;
  }, []);
  const T = useCallback(({ f, ...p }: { f: string; placeholder?: string; rows?: number }) => {
    const { form, errors, upd } = stateRef.current;
    return <textarea style={{ ...inputBase(errors[f]), resize: "vertical", minHeight: 96 }} value={form[f] as string} onChange={upd(f)} {...p} />;
  }, []);
  // Single-file upload (scheme card, certificate, insurance certificate).
  const F = useCallback(({ f, accept = "application/pdf,image/*" }: { f: string; accept?: string }) => {
    const { files, errors } = stateRef.current;
    const selected = files[f]?.[0];
    return (
      <div>
        <label
          style={{
            display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
            border: `1.5px solid ${errors[f] ? C.error : C.border}`, borderRadius: 8,
            padding: "10px 14px", fontSize: 13, fontWeight: 600, color: C.deep, background: C.white,
          }}
        >
          <span style={{ color: C.teal }}>⬆</span>
          {selected ? "Replace file" : "Choose file"}
          <input
            type="file"
            accept={accept}
            onChange={(ev) => {
              const file = ev.target.files?.[0];
              setFieldFiles(f, file ? [file] : []);
            }}
            style={{ display: "none" }}
          />
        </label>
        {selected && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 12, color: C.secondary }}>✓ {selected.name} ({Math.round(selected.size / 1024)} KB)</span>
            <button type="button" onClick={() => setFieldFiles(f, [])} style={{ background: "none", border: "none", color: C.error, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Remove</button>
          </div>
        )}
      </div>
    );
  }, []);

  // Multi-file photo upload (portfolio). Accepts images, supports add/remove.
  const Photos = useCallback(({ f }: { f: string }) => {
    const { files } = stateRef.current;
    const list = files[f] ?? [];
    return (
      <div>
        <label
          style={{
            display: "block", cursor: "pointer", textAlign: "center",
            border: `1.5px dashed ${C.border}`, borderRadius: 10, padding: "20px 14px",
            fontSize: 13, fontWeight: 600, color: C.deep, background: C.white,
          }}
        >
          <span style={{ display: "block", fontSize: 22, color: C.teal, marginBottom: 6 }}>⬆</span>
          Add photos of completed work
          <span style={{ display: "block", fontSize: 12, fontWeight: 400, color: C.secondary, marginTop: 4 }}>JPG or PNG — you can select several at once</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(ev) => {
              const incoming = Array.from(ev.target.files ?? []);
              if (!incoming.length) return;
              setFiles((p) => ({ ...p, [f]: [...(p[f] ?? []), ...incoming] }));
              ev.target.value = "";
            }}
            style={{ display: "none" }}
          />
        </label>
        {list.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 12 }}>
            {list.map((file, idx) => (
              <div key={idx} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, aspectRatio: "1 / 1", background: C.cream }}>
                <img src={URL.createObjectURL(file)} alt={`Work photo ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button
                  type="button"
                  onClick={() => setFiles((p) => ({ ...p, [f]: (p[f] ?? []).filter((_, i) => i !== idx) }))}
                  style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 13, cursor: "pointer", lineHeight: 1 }}
                >×</button>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize: 12, color: list.length >= 3 ? C.success : C.secondary, margin: "8px 0 0", fontWeight: 600 }}>
          {list.length} uploaded — minimum 3 required
        </p>
      </div>
    );
  }, []);

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

    // 2 — Qualifications
    <div key="2">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: C.deep, margin: "0 0 4px" }}>Qualifications</h2>
        <p style={{ fontSize: 13, color: C.secondary, margin: 0 }}>Tell us how you qualified. This sets the verification route we use for your application.</p>
      </div>
      <Field label="Which best describes you?" req err={errors.qualification_path}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {QUAL_PATHS.map((o) => {
            const active = form.qualification_path === o.value;
            return (
              <label key={o.value} style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", padding: 12, border: `1.5px solid ${active ? C.teal : C.border}`, borderRadius: 8, background: active ? C.successBg : C.white }}>
                <input
                  type="radio"
                  name="qualification_path"
                  value={o.value}
                  checked={active}
                  onChange={() => setForm((p) => ({ ...p, qualification_path: o.value }))}
                  style={{ marginTop: 3 }}
                />
                <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>{o.label}</span>
              </label>
            );
          })}
        </div>
      </Field>

      {form.qualification_path === "regulated" && (
        <>
          <Field label="Scheme name" req err={errors.qual_scheme_name}>
            <S f="qual_scheme_name">
              <option value="">Select scheme...</option>
              {["NICEIC", "NAPIT", "ELECSA", "Gas Safe", "MCS", "FENSA", "TrustMark", "Other"].map((o) => <option key={o} value={o}>{o}</option>)}
            </S>
          </Field>
          <Grid>
            <Field label="Registration number" req err={errors.qual_reg_number}><I f="qual_reg_number" placeholder="123456" /></Field>
            <Field label="Expiry date" req err={errors.qual_reg_expiry}><I f="qual_reg_expiry" type="date" /></Field>
          </Grid>
          <Field label="Upload your scheme card / certificate" req err={errors.qual_card_doc} hint="A photo or PDF of your current card or certificate.">
            <F f="qual_card_doc" />
          </Field>
        </>
      )}

      {form.qualification_path === "qualified" && (
        <>
          <Grid>
            <Field label="Qualification type" req err={errors.qual_type} hint="e.g. NVQ Level 3, City & Guilds, apprenticeship"><I f="qual_type" placeholder="NVQ Level 3 Plumbing" /></Field>
            <Field label="Awarding body" req err={errors.qual_awarding_body}><I f="qual_awarding_body" placeholder="City & Guilds" /></Field>
          </Grid>
          <Field label="Year obtained" req err={errors.qual_year}><I f="qual_year" placeholder="2014" maxLength={4} /></Field>
          <Field label="Upload your certificate" req err={errors.qual_cert_doc} hint="A photo or PDF of your qualification certificate.">
            <F f="qual_cert_doc" />
          </Field>
        </>
      )}

      {form.qualification_path === "time_served" && (
        <>
          <Field label="Years on the tools" req err={errors.ts_years} hint="Minimum 5 years to apply via this route.">
            <I f="ts_years" type="number" placeholder="12" />
          </Field>
          <Field label="Specialism" req err={errors.ts_specialism} hint="What kind of work specifically?">
            <T f="ts_specialism" rows={3} placeholder="Domestic plastering and rendering — mostly Victorian terraces and period restoration." />
          </Field>

          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.deep, margin: "20px 0 6px" }}>Two trade references</h3>
          <p style={{ fontSize: 13, color: C.secondary, margin: "0 0 14px" }}>Both references are required. We contact each one by phone.</p>

          {([1, 2] as const).map((rn) => (
            <div key={rn} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16, background: C.white }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: C.deep, margin: "0 0 12px" }}>Reference {rn}</h4>
              <Grid>
                <Field label="Name" req err={errors[`ts_ref${rn}_name`]}><I f={`ts_ref${rn}_name`} placeholder="Sarah Mitchell" /></Field>
                <Field label="Role / company" req err={errors[`ts_ref${rn}_role`]}><I f={`ts_ref${rn}_role`} placeholder="Site manager, Mitchell Builds" /></Field>
              </Grid>
              <Grid>
                <Field label="Phone" req err={errors[`ts_ref${rn}_phone`]}><I f={`ts_ref${rn}_phone`} placeholder="07700 900000" /></Field>
                <Field label="Email" req err={errors[`ts_ref${rn}_email`]}><I f={`ts_ref${rn}_email`} type="email" placeholder="sarah@example.co.uk" /></Field>
              </Grid>
            </div>
          ))}

          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", padding: 12, border: `1.5px solid ${errors.ts_consent ? C.error : C.border}`, borderRadius: 8, background: C.white, marginBottom: 12 }}>
            <input type="checkbox" checked={form.ts_consent as boolean} onChange={upd("ts_consent")} style={{ marginTop: 3 }} />
            <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
              I understand that ProGrafter will contact both references by phone before my application is approved, and that a site visit may be carried out during my first booked job.
            </span>
          </label>
          {errors.ts_consent && <p style={{ fontSize: 12, color: C.error, margin: "-4px 0 12px" }}>{errors.ts_consent}</p>}

          <InfoBox variant="amber">
            We verify time-served applications by phone call to your references and we may request a site visit on your first booked job. This usually takes 5–7 working days vs 1–2 for regulated trades.
          </InfoBox>
        </>
      )}
    </div>,

    // 3 — Portfolio of work
    <div key="3">
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
          <Field label="Photos of completed work" req err={errors.portfolio_photos} hint="Upload at least 3 photos of recent jobs. Clear, well-lit shots of finished work.">
            <Photos f="portfolio_photos" />
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
          <Field label="Photos of completed work" req err={errors.portfolio_photos} hint="Upload at least 3 photos of recent jobs. Clear, well-lit shots of finished work.">
            <Photos f="portfolio_photos" />
          </Field>
        </>
      )}
    </div>,

    // 4 — Insurance
    <div key="4">
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

    // 5 — References
    <div key="5">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: C.deep, margin: "0 0 4px" }}>References</h2>
        <p style={{ fontSize: 13, color: C.secondary, margin: 0 }}>Provide at least two references. We need a contact name, the relationship, and at least one way to reach them.</p>
      </div>
      <InfoBox variant="teal">
        We call references personally. Please let them know to expect our call. Once submitted, your reference checks are tracked in your verification record — every call is logged against your application.
      </InfoBox>
      {references.map((r, i) => (
        <RefBlock
          key={i}
          n={i + 1}
          entry={r}
          errors={errors}
          onChange={(patch) => updateRef(i, patch)}
          onRemove={() => removeRef(i)}
          canRemove={references.length > 2}
        />
      ))}
      {errors.references_count && (
        <p style={{ fontSize: 13, color: C.error, margin: "0 0 12px" }}>{errors.references_count}</p>
      )}
      <button
        type="button"
        onClick={addRef}
        style={{ background: "transparent", border: `1.5px dashed ${C.border}`, color: C.teal, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%" }}
      >
        + Add another reference
      </button>
    </div>,


    // 6 — Declaration
    <div key="6">
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
          <li>For time-served trades: the references provided are genuine and may be contacted, and the years of experience stated are accurate.</li>
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
              : <button onClick={submit} disabled={submitting} style={{ background: C.teal, color: C.white, border: "none", padding: "10px 22px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}>{submitting ? "Submitting…" : "Submit application"}</button>}
          </div>
          {errors.submit && (
            <p style={{ textAlign: "center", fontSize: 12, color: C.error, margin: "12px 0 0" }}>{errors.submit}</p>
          )}
          <p style={{ textAlign: "center", fontSize: 12, color: C.secondary, margin: "16px 0 0" }}>
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
          <p style={{ textAlign: "center", fontSize: 12, color: C.secondary, margin: "8px 0 0" }}>
            <a href="/privacy" style={{ color: C.secondary }}>Privacy</a>
            {" · "}
            <a href="/terms" style={{ color: C.secondary }}>Terms</a>
            {" · "}
            <a href="/cookies" style={{ color: C.secondary }}>Cookies</a>
          </p>


        </div>
      </div>
    </div>
  );
}
