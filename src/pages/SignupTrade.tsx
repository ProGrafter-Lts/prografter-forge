import { lazy, Suspense, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { z } from "zod";
import { Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import {
  RENEWABLE_TRADE_TYPES,
  isGreenTrade,
  showOzev,
  showFgas,
  showCiga,
  showInca,
} from "@/lib/greenTrades";
import { saveTradeSpecialisms } from "@/lib/specialisms";
import { useSetupRedirect, SetupRedirectLoader } from "@/hooks/useSetupRedirect";

const SpecialismsPicker = lazy(() => import("@/components/SpecialismsPicker"));
const TradeDateField = lazy(() => import("@/components/trade/TradeDateField"));

const GENERAL_TRADE_TYPES = [
  "Electrician",
  "Plumber",
  "Gas Engineer",
  "Builder",
  "Roofer",
  "Plasterer",
  "Carpenter",
  "Tiler",
  "Decorator",
  "Scaffolder",
  "Landscaper",
  "Other",
] as const;

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

const step1Schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters"),
  phone: z.string().trim().min(7, "Enter a valid phone").max(30),
  postcode: z.string().trim().regex(UK_POSTCODE, "Enter a valid UK postcode"),
  agreedTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to continue" }) }),
});

type Step = 1 | 2 | 3 | 4;

const labelClass = "block font-mono text-xs text-teal uppercase tracking-widest mb-1.5";
const inputClass =
  "w-full bg-cream/5 border border-cream/10 text-cream placeholder-cream/40 font-body text-sm rounded-xl px-4 py-3 focus:border-teal focus:outline-none transition-colors";
const checkboxClass = "w-4 h-4 rounded border-cream/20 bg-cream/5 accent-teal cursor-pointer";

const SignupTrade = () => {
  const navigate = useNavigate();
  const checkingExisting = useSetupRedirect("trade");
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: account
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Step 2: business
  const [tradeType, setTradeType] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [specialismIds, setSpecialismIds] = useState<string[]>([]);
  const [primarySpecialismId, setPrimarySpecialismId] = useState<string | null>(null);
  // Green
  const [mcsNumber, setMcsNumber] = useState("");
  const [trustmarkNumber, setTrustmarkNumber] = useState("");
  const [pas2030, setPas2030] = useState(false);
  const [pas2035, setPas2035] = useState(false);
  const [ozevApproved, setOzevApproved] = useState(false);
  const [fgasRegistered, setFgasRegistered] = useState(false);
  const [cigaRegistered, setCigaRegistered] = useState(false);
  const [incaCertified, setIncaCertified] = useState(false);
  const [greenCertExpiry, setGreenCertExpiry] = useState<Date | undefined>();

  // Step 3: documents
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [insuranceExpiry, setInsuranceExpiry] = useState<Date | undefined>();
  const [idFile, setIdFile] = useState<File | null>(null);
  const [qualFile, setQualFile] = useState<File | null>(null);

  // Account info created during step 1
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [createdTradeId, setCreatedTradeId] = useState<string | null>(null);

  const isGreen = isGreenTrade(tradeType);

  const insuranceStatus = useMemo(() => {
    if (!insuranceExpiry) return null;
    const days = differenceInDays(insuranceExpiry, new Date());
    if (days < 0) return "expired";
    if (days <= 30) return "expiring";
    return "valid";
  }, [insuranceExpiry]);

  // ---- STEP 1: create auth user + trade row (pending) ----
  const submitStep1 = async () => {
    setError("");
    const parsed = step1Schema.safeParse({
      fullName, email, password, phone, postcode, agreedTerms,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/signup/trade/under-review`,
          data: {
            user_type: "trade",
            full_name: fullName.trim(),
            phone: phone.trim(),
            postcode: postcode.trim().toUpperCase(),
            company_name: companyName.trim() || fullName.trim(),
          },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      const userId = signUpData.user?.id ?? null;
      setCreatedUserId(userId);

      // Consents (best-effort)
      if (userId) {
        try {
          await supabase.from("consents_log").insert([
            { user_id: userId, consent_type: "terms", consented: true, user_agent: navigator.userAgent },
            { user_id: userId, consent_type: "marketing", consented: marketingOptIn, user_agent: navigator.userAgent },
          ]);
        } catch { /* non-blocking */ }
      }

      // If session not established (email confirmations on), we need to wait
      // until they verify before they can upload docs. Stash form data and
      // route to check-email page. Otherwise advance to step 2.
      if (!signUpData.session) {
        navigate("/signup/homeowner/check-email", {
          replace: true,
          state: { email: email.trim(), nextHint: "trade" },
        });
        return;
      }

      // The handle_new_user trigger created the trades row. Look it up.
      const { data: tradeRow } = await supabase
        .from("trades")
        .select("id")
        .eq("user_id", userId!)
        .maybeSingle();
      if (tradeRow?.id) setCreatedTradeId(tradeRow.id);

      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---- STEP 2: save business details ----
  const submitStep2 = async () => {
    setError("");
    if (!tradeType || !companyName.trim()) {
      setError("Trade type and company name are required");
      return;
    }
    if (!createdTradeId) {
      setError("Account not ready — refresh and try again");
      return;
    }
    setLoading(true);
    try {
      const updates: Record<string, unknown> = {
        trade_type: tradeType,
        company_name: companyName.trim(),
        years_experience: yearsExperience ? parseInt(yearsExperience, 10) : null,
        website: website.trim() || null,
        bio: bio.trim() || null,
        is_green_trade: isGreen,
        specialisms_prompt_seen: true,
      };
      if (isGreen) {
        updates.mcs_number = mcsNumber.trim() || null;
        updates.trustmark_number = trustmarkNumber.trim() || null;
        updates.pas_2030_accredited = pas2030;
        updates.pas_2035_coordinator = pas2035;
        updates.ozev_approved = ozevApproved;
        updates.fgas_registered = fgasRegistered;
        updates.ciga_registered = cigaRegistered;
        updates.inca_certified = incaCertified;
        updates.green_cert_expiry = greenCertExpiry ? format(greenCertExpiry, "yyyy-MM-dd") : null;
      }
      const { error: updErr } = await supabase
        .from("trades")
        .update(updates as any)
        .eq("id", createdTradeId);
      if (updErr) throw updErr;

      if (specialismIds.length > 0) {
        try {
          await saveTradeSpecialisms(createdTradeId, specialismIds, primarySpecialismId);
        } catch (e) {
          console.warn("Specialisms save failed (non-blocking)", e);
        }
      }
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your details");
    } finally {
      setLoading(false);
    }
  };

  // ---- STEP 3: upload documents ----
  const uploadDoc = async (file: File, docType: "insurance" | "id" | "qualification") => {
    if (!createdUserId || !createdTradeId) throw new Error("Account not ready");
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${createdUserId}/${docType}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("trade-verification-documents")
      .upload(path, file, { upsert: false });
    if (upErr) throw upErr;
    await supabase.from("trade_verification_documents").insert({
      trade_id: createdTradeId,
      doc_type: docType,
      file_path: path,
      original_filename: file.name,
      expiry_date: docType === "insurance" && insuranceExpiry
        ? format(insuranceExpiry, "yyyy-MM-dd")
        : null,
    } as any);
    return path;
  };

  const submitStep3 = async () => {
    setError("");
    if (!insuranceFile) { setError("Public liability insurance is required"); return; }
    if (!insuranceExpiry) { setError("Insurance expiry date is required"); return; }
    if (insuranceStatus === "expired") { setError("Your insurance has expired"); return; }
    if (!idFile) { setError("ID document is required"); return; }
    setLoading(true);
    try {
      const insurancePath = await uploadDoc(insuranceFile, "insurance");
      await uploadDoc(idFile, "id");
      if (qualFile) await uploadDoc(qualFile, "qualification");

      await supabase.from("trades").update({
        insurance_cert_url: insurancePath,
        insurance_expiry: format(insuranceExpiry!, "yyyy-MM-dd"),
      } as any).eq("id", createdTradeId!);

      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // ---- STEP 4: submit for review ----
  const submitFinal = async () => {
    setError("");
    setLoading(true);
    try {
      await supabase.from("trades").update({
        verification_status: "pending",
        submitted_for_review_at: new Date().toISOString(),
      } as any).eq("id", createdTradeId!);

      // Fire confirmation email (best-effort)
      try {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "trade-verification-submitted",
            recipientEmail: email.trim(),
            idempotencyKey: `trade-submitted-${createdTradeId}`,
            templateData: { name: fullName.trim() },
          },
        });
      } catch (e) { console.warn("submitted email failed (non-blocking)", e); }

      navigate("/signup/trade/under-review", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (checkingExisting) return <SetupRedirectLoader />;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(var(--deep))" }}>
      <SEO
        title="Join as a Trade — ProGrafter"
        description="Apply to join ProGrafter. Verified, insured tradespeople only. Free to join — 7.5% commission only when a job completes."
        path="/signup/trade"
      />
      <header className="py-6 px-6">
        <Link to="/" className="font-heading text-2xl tracking-wider">
          <span className="text-cream">Pro</span>
          <span className="text-teal">Grafter</span>
        </Link>
      </header>

      <div className="flex-1 flex items-start justify-center px-6 py-8">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-teal" : "bg-cream/10"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">
              Step {step} of 4
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-body">
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 className="font-heading text-cream text-[40px] leading-none mb-6">
                Your <span className="text-teal">Account.</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Smith" />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.co.uk" autoComplete="email" />
                </div>
                <div>
                  <label className={labelClass}>Password *</label>
                  <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
                </div>
                <div>
                  <label className={labelClass}>Phone *</label>
                  <input type="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07700 900000" autoComplete="tel" />
                </div>
                <div>
                  <label className={labelClass}>Business Postcode *</label>
                  <input className={`${inputClass} uppercase`} value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="SW1A 1AA" autoComplete="postal-code" />
                </div>
                <label className="flex items-start gap-3 pt-2 cursor-pointer">
                  <input type="checkbox" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} className={`${checkboxClass} mt-1`} />
                  <span className="font-body text-sm text-cream/80">
                    I agree to the <Link to="/terms" className="text-teal underline">Terms</Link> and <Link to="/privacy" className="text-teal underline">Privacy Policy</Link> *
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className={`${checkboxClass} mt-1`} />
                  <span className="font-body text-sm text-cream/80">
                    Send me product updates and lead notifications
                  </span>
                </label>
              </div>
              <button
                onClick={submitStep1}
                disabled={loading}
                className="w-full mt-8 bg-teal text-cream font-mono text-sm py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50"
              >
                {loading ? "Creating account…" : "Continue → Step 2"}
              </button>
              <p className="mt-4 text-center font-body text-sm text-cream/60">
                Already a member? <Link to="/login" className="text-teal underline">Sign in</Link>
              </p>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 className="font-heading text-cream text-[40px] leading-none mb-6">
                Your <span className="text-teal">Business.</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Trade Type *</label>
                  <select className={inputClass} value={tradeType} onChange={(e) => setTradeType(e.target.value)}>
                    <option value="">Select your trade…</option>
                    <optgroup label="General">
                      {GENERAL_TRADE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                    <optgroup label="Renewable / Green">
                      {RENEWABLE_TRADE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                  </select>
                  {isGreen && (
                    <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs text-teal">
                      <Leaf className="w-3 h-3" /> Green trade — extra MCS / TrustMark fields appear below
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Company Name *</label>
                  <input className={inputClass} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Smith Plumbing Ltd" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Years Experience</label>
                    <input type="number" min="0" className={inputClass} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="10" />
                  </div>
                  <div>
                    <label className={labelClass}>Website</label>
                    <input className={inputClass} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Short Bio</label>
                  <textarea rows={3} className={inputClass} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A few lines about your work…" />
                </div>

                {tradeType && (
                  <div>
                    <label className={labelClass}>Specialisms (optional)</label>
                    <Suspense fallback={<div className="text-cream/60 text-sm font-body py-3">Loading specialisms…</div>}>
                      <SpecialismsPicker
                        tradeType={tradeType}
                        selected={specialismIds}
                        primaryId={primarySpecialismId}
                        onChange={(sel, pid) => { setSpecialismIds(sel); setPrimarySpecialismId(pid); }}
                      />
                    </Suspense>
                  </div>
                )}

                {isGreen && (
                  <div className="space-y-4 p-4 rounded-xl border border-teal/30 bg-teal/5">
                    <p className="font-mono text-xs text-teal uppercase tracking-widest">Green Certifications</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>MCS Number</label>
                        <input className={inputClass} value={mcsNumber} onChange={(e) => setMcsNumber(e.target.value)} placeholder="MCS-12345" />
                      </div>
                      <div>
                        <label className={labelClass}>TrustMark Number</label>
                        <input className={inputClass} value={trustmarkNumber} onChange={(e) => setTrustmarkNumber(e.target.value)} placeholder="TM-67890" />
                      </div>
                    </div>
                    <label className="flex items-center gap-3"><input type="checkbox" checked={pas2030} onChange={(e) => setPas2030(e.target.checked)} className={checkboxClass} /><span className="text-sm text-cream/80">PAS 2030 accredited</span></label>
                    <label className="flex items-center gap-3"><input type="checkbox" checked={pas2035} onChange={(e) => setPas2035(e.target.checked)} className={checkboxClass} /><span className="text-sm text-cream/80">PAS 2035 coordinator</span></label>
                    {showOzev(tradeType) && <label className="flex items-center gap-3"><input type="checkbox" checked={ozevApproved} onChange={(e) => setOzevApproved(e.target.checked)} className={checkboxClass} /><span className="text-sm text-cream/80">OZEV approved</span></label>}
                    {showFgas(tradeType) && <label className="flex items-center gap-3"><input type="checkbox" checked={fgasRegistered} onChange={(e) => setFgasRegistered(e.target.checked)} className={checkboxClass} /><span className="text-sm text-cream/80">F-Gas registered</span></label>}
                    {showCiga(tradeType) && <label className="flex items-center gap-3"><input type="checkbox" checked={cigaRegistered} onChange={(e) => setCigaRegistered(e.target.checked)} className={checkboxClass} /><span className="text-sm text-cream/80">CIGA registered</span></label>}
                    {showInca(tradeType) && <label className="flex items-center gap-3"><input type="checkbox" checked={incaCertified} onChange={(e) => setIncaCertified(e.target.checked)} className={checkboxClass} /><span className="text-sm text-cream/80">INCA certified</span></label>}
                    <div>
                      <label className={labelClass}>Cert Expiry</label>
                      <Suspense fallback={null}>
                        <TradeDateField value={greenCertExpiry} onChange={setGreenCertExpiry} placeholder="Select expiry date" inputClassName={inputClass} />
                      </Suspense>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(1)} className="flex-1 border border-cream/20 text-cream/80 font-mono text-sm py-3 rounded-xl hover:bg-cream/5 transition-colors">← Back</button>
                <button onClick={submitStep2} disabled={loading} className="flex-[2] bg-teal text-cream font-mono text-sm py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50">
                  {loading ? "Saving…" : "Continue → Step 3"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h2 className="font-heading text-cream text-[40px] leading-none mb-3">
                Verification <span className="text-teal">Documents.</span>
              </h2>
              <p className="font-body text-cream/60 text-sm mb-6">
                Upload these so we can verify you. Files are stored privately and only seen by our verification team.
              </p>
              <div className="space-y-6">
                {/* Insurance */}
                <div className="p-4 rounded-xl border border-cream/10">
                  <p className="font-mono text-xs text-teal uppercase tracking-widest mb-2">Public Liability Insurance *</p>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => setInsuranceFile(e.target.files?.[0] ?? null)}
                    className="text-cream text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal file:text-cream file:font-mono file:text-xs file:cursor-pointer"
                  />
                  {insuranceFile && <p className="mt-2 text-xs text-cream/60 font-body">✓ {insuranceFile.name}</p>}
                  <div className="mt-3">
                    <label className={labelClass}>Expiry Date *</label>
                    <Suspense fallback={null}>
                      <TradeDateField value={insuranceExpiry} onChange={setInsuranceExpiry} placeholder="Select expiry date" inputClassName={inputClass} />
                    </Suspense>
                    {insuranceStatus === "expired" && <p className="mt-1 text-xs text-red-400">⚠ Insurance has expired</p>}
                    {insuranceStatus === "expiring" && <p className="mt-1 text-xs text-yellow-400">⚠ Expires within 30 days</p>}
                  </div>
                </div>

                {/* ID */}
                <div className="p-4 rounded-xl border border-cream/10">
                  <p className="font-mono text-xs text-teal uppercase tracking-widest mb-2">Photo ID *</p>
                  <p className="text-xs text-cream/60 font-body mb-2">Passport or driving licence</p>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
                    className="text-cream text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal file:text-cream file:font-mono file:text-xs file:cursor-pointer"
                  />
                  {idFile && <p className="mt-2 text-xs text-cream/60 font-body">✓ {idFile.name}</p>}
                </div>

                {/* Qualification */}
                <div className="p-4 rounded-xl border border-cream/10">
                  <p className="font-mono text-xs text-teal uppercase tracking-widest mb-2">Trade Qualification (optional)</p>
                  <p className="text-xs text-cream/60 font-body mb-2">e.g. Gas Safe card, NICEIC, MCS cert. Speeds up verification.</p>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => setQualFile(e.target.files?.[0] ?? null)}
                    className="text-cream text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal file:text-cream file:font-mono file:text-xs file:cursor-pointer"
                  />
                  {qualFile && <p className="mt-2 text-xs text-cream/60 font-body">✓ {qualFile.name}</p>}
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(2)} className="flex-1 border border-cream/20 text-cream/80 font-mono text-sm py-3 rounded-xl hover:bg-cream/5 transition-colors">← Back</button>
                <button onClick={submitStep3} disabled={loading} className="flex-[2] bg-teal text-cream font-mono text-sm py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50">
                  {loading ? "Uploading…" : "Continue → Review"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div>
              <h2 className="font-heading text-cream text-[40px] leading-none mb-3">
                Review &amp; <span className="text-teal">Submit.</span>
              </h2>
              <p className="font-body text-cream/60 text-sm mb-6">
                Check your details. Once submitted, our team will verify within 1 business day.
              </p>
              <div className="space-y-4 text-sm font-body text-cream/80">
                <SummaryRow label="Name" value={fullName} onEdit={() => setStep(1)} />
                <SummaryRow label="Email" value={email} />
                <SummaryRow label="Phone" value={phone} />
                <SummaryRow label="Postcode" value={postcode.toUpperCase()} />
                <SummaryRow label="Trade" value={tradeType} onEdit={() => setStep(2)} />
                <SummaryRow label="Company" value={companyName} />
                {yearsExperience && <SummaryRow label="Experience" value={`${yearsExperience} years`} />}
                {website && <SummaryRow label="Website" value={website} />}
                {isGreen && (
                  <>
                    {mcsNumber && <SummaryRow label="MCS" value={mcsNumber} />}
                    {trustmarkNumber && <SummaryRow label="TrustMark" value={trustmarkNumber} />}
                  </>
                )}
                <SummaryRow label="Insurance" value={insuranceFile?.name ?? "—"} onEdit={() => setStep(3)} />
                <SummaryRow label="Insurance expires" value={insuranceExpiry ? format(insuranceExpiry, "d MMM yyyy") : "—"} />
                <SummaryRow label="ID" value={idFile?.name ?? "—"} />
                <SummaryRow label="Qualification" value={qualFile?.name ?? "Not provided"} />
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(3)} className="flex-1 border border-cream/20 text-cream/80 font-mono text-sm py-3 rounded-xl hover:bg-cream/5 transition-colors">← Back</button>
                <button onClick={submitFinal} disabled={loading} className="flex-[2] bg-teal text-cream font-mono text-sm py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50">
                  {loading ? "Submitting…" : "Submit for Review"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryRow = ({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b border-cream/10">
    <div className="flex-1 min-w-0">
      <p className="font-mono text-[10px] text-teal uppercase tracking-widest mb-0.5">{label}</p>
      <p className="truncate text-cream">{value || "—"}</p>
    </div>
    {onEdit && (
      <button onClick={onEdit} className="font-mono text-xs text-teal hover:underline">Edit</button>
    )}
  </div>
);

export default SignupTrade;
