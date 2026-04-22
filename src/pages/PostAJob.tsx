import { useState, FormEvent, ChangeEvent, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { isGreenTrade } from "@/lib/greenTrades";
import { Specialism, fetchSpecialisms } from "@/lib/specialisms";

const ALL_JOB_TYPES = [
  { label: "Extension", icon: "🏗️", green: false },
  { label: "Loft Conversion", icon: "🏠", green: false },
  { label: "Full Rewire", icon: "⚡", green: false },
  { label: "Bathroom", icon: "🚿", green: false },
  { label: "Kitchen", icon: "🍳", green: false },
  { label: "Boiler / Heating", icon: "🔥", green: false },
  { label: "Roofing", icon: "🏚️", green: false },
  { label: "Plastering", icon: "🧱", green: false },
  { label: "Painting & Decorating", icon: "🎨", green: false },
  { label: "Landscaping", icon: "🌿", green: false },
  { label: "New Build", icon: "🏢", green: false },
  // Green / Renewable
  { label: "Solar PV Installation", icon: "☀️", green: true },
  { label: "Air Source Heat Pump", icon: "🌡️", green: true },
  { label: "Ground Source Heat Pump", icon: "🌡️", green: true },
  { label: "External Wall Insulation (EWI)", icon: "🧱", green: true },
  { label: "Cavity Wall Insulation", icon: "🏠", green: true },
  { label: "Loft Insulation", icon: "🏠", green: true },
  { label: "EV Charger Installation", icon: "🔌", green: true },
  { label: "Battery Storage", icon: "🔋", green: true },
  { label: "MVHR Installer", icon: "🌀", green: true },
  { label: "Underfloor Heating", icon: "🔥", green: true },
  { label: "Draught Proofing Specialist", icon: "🪟", green: true },
  { label: "EPC Assessor", icon: "📋", green: true },
  { label: "Retrofit Coordinator", icon: "📐", green: true },
  { label: "Other", icon: "🔧", green: false },
] as const;

/* Scheme → allowed green trade type labels */
const SCHEME_TRADE_MAP: Record<string, string[]> = {
  eco4: ["External Wall Insulation (EWI)", "Cavity Wall Insulation", "Loft Insulation", "Retrofit Coordinator", "EPC Assessor"],
  bus: ["Air Source Heat Pump", "Ground Source Heat Pump"],
  gbis: ["External Wall Insulation (EWI)", "Cavity Wall Insulation", "Loft Insulation", "Draught Proofing Specialist"],
  vat: ["Solar PV Installation", "Air Source Heat Pump", "Ground Source Heat Pump", "External Wall Insulation (EWI)", "Cavity Wall Insulation", "Loft Insulation", "EV Charger Installation", "Battery Storage", "MVHR Installer", "Underfloor Heating", "Draught Proofing Specialist", "EPC Assessor", "Retrofit Coordinator"],
  hug: ["External Wall Insulation (EWI)", "Cavity Wall Insulation", "Loft Insulation", "Retrofit Coordinator", "EPC Assessor"],
  epc: ["EPC Assessor"],
};

// UK postcode regex (covers standard formats: A9 9AA, A9A 9AA, A99 9AA, AA9 9AA, AA9A 9AA, AA99 9AA)
const UK_POSTCODE_REGEX = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = 1 | 2 | 3 | 3.5 | 4;

const PostAJob = () => {
  const [searchParams] = useSearchParams();
  const isGreenFlow = searchParams.get("green") === "1";
  const schemeParam = searchParams.get("schemes") || "";
  const schemeIds = schemeParam ? schemeParam.split(",") : [];

  const filteredJobTypes = useMemo(() => {
    if (!isGreenFlow || schemeIds.length === 0) return ALL_JOB_TYPES.filter(() => true);
    const allowedLabels = new Set<string>();
    schemeIds.forEach((id) => {
      (SCHEME_TRADE_MAP[id] || []).forEach((label) => allowedLabels.add(label));
    });
    return ALL_JOB_TYPES.filter((jt) => allowedLabels.has(jt.label));
  }, [isGreenFlow, schemeParam]);

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [jobType, setJobType] = useState("");

  // Step 2
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  // Step 3
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [specialismId, setSpecialismId] = useState<string>("");
  const [specialisms, setSpecialisms] = useState<Specialism[]>([]);

  useEffect(() => {
    fetchSpecialisms().then(setSpecialisms).catch(() => setSpecialisms([]));
  }, []);

  // Step 3b — Optional Funds Verification
  const [fundsDoc, setFundsDoc] = useState<File | null>(null);
  const [fundsDocError, setFundsDocError] = useState("");

  // Step 4
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [step4Touched, setStep4Touched] = useState(false);

  const inputClass =
    "w-full bg-cream/5 border border-cream/10 text-cream placeholder-cream/40 font-body text-sm rounded-xl px-4 py-3 focus:border-teal focus:outline-none transition-colors";
  const labelClass = "block font-mono text-xs text-teal uppercase tracking-widest mb-1.5";

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.size <= 10 * 1024 * 1024);
    if (valid.length !== files.length) {
      setError("Some files exceeded 10 MB and were skipped.");
    }
    setPhotos((prev) => [...prev, ...valid].slice(0, 4));
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!acceptedTerms) {
      setError("You must accept the Terms of Service to register.");
      return;
    }

    setLoading(true);

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          user_type: "homeowner",
          postcode: postcode.trim(),
          phone: phone.trim(),
        },
      },
    });

    if (authError || !authData.user) {
      setError(authError?.message || "Failed to create account.");
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    // 2. Insert homeowner record
    const { data: homeownerData, error: hoError } = await supabase
      .from("homeowners")
      .insert({ user_id: userId, name: name.trim(), email: email.trim(), phone: phone.trim() })
      .select("id")
      .single();

    if (hoError || !homeownerData) {
      console.error(hoError);
      setError("Account created but homeowner profile failed. Contact support.");
      setLoading(false);
      setSuccess(true);
      return;
    }

    // 3. Upload photos
    const photoUrls: string[] = [];
    for (const photo of photos) {
      const ext = photo.name.split(".").pop();
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("job-photos").upload(path, photo);
      if (!upErr) {
        // Store the bucket path; the bucket is private and consumers resolve to
        // short-lived signed URLs via src/lib/jobPhotos.ts
        photoUrls.push(path);
      }
    }

    // 4. Insert job
    const { data: jobData, error: jobError } = await supabase.from("jobs").insert({
      homeowner_id: homeownerData.id,
      title: jobType,
      job_type: jobType,
      description: description.trim(),
      address: address.trim(),
      postcode: postcode.trim(),
      budget: `£${Number(budgetMin).toLocaleString()} – £${Number(budgetMax).toLocaleString()}`,
      photo_urls: photoUrls,
      status: "open",
      is_green_job: isGreenTrade(jobType),
      specialism_id: specialismId || null,
    } as any).select("id").single();

    if (jobError || !jobData) {
      console.error(jobError);
      setError("Account created but job posting failed. Contact support.");
      setLoading(false);
      setSuccess(true);
      return;
    }

    // 5. Optional funds verification document upload
    if (fundsDoc) {
      const ext = fundsDoc.name.split(".").pop();
      const path = `${userId}/${jobData.id}/${crypto.randomUUID()}.${ext}`;
      const { error: fundsUpErr } = await supabase.storage
        .from("funds-verification")
        .upload(path, fundsDoc);
      if (!fundsUpErr) {
        await supabase.from("funds_verification").insert({
          job_id: jobData.id,
          homeowner_id: homeownerData.id,
          document_path: path,
          status: "pending",
        });
      } else {
        console.error("Funds doc upload failed", fundsUpErr);
      }
    }

    setLoading(false);
    setSuccess(true);
  };

  const canStep1 = jobType.length > 0;
  const canStep2 = description.trim().length >= 50;

  const postcodeValid = UK_POSTCODE_REGEX.test(postcode.trim());
  const minNum = budgetMin === "" ? NaN : Number(budgetMin);
  const maxNum = budgetMax === "" ? NaN : Number(budgetMax);
  const budgetValid =
    Number.isFinite(minNum) &&
    Number.isFinite(maxNum) &&
    Number.isInteger(minNum) &&
    Number.isInteger(maxNum) &&
    minNum >= 0 &&
    maxNum >= 0 &&
    maxNum >= minNum;
  const canStep3 = address.trim().length > 0 && postcodeValid && budgetValid;

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const nameLooksLikeEmail = trimmedName.includes("@");
  const emailValid = EMAIL_REGEX.test(trimmedEmail);
  const nameEmailDistinct =
    trimmedName.length > 0 &&
    trimmedEmail.length > 0 &&
    trimmedName.toLowerCase() !== trimmedEmail.toLowerCase();

  const canStep4 =
    trimmedName.length > 0 &&
    !nameLooksLikeEmail &&
    emailValid &&
    nameEmailDistinct &&
    phone.trim().length > 0 &&
    password.length >= 8;

  const stepTitles: Record<Exclude<Step, 3.5>, { white: string; teal: string }> = {
    1: { white: isGreenFlow ? "Find a Certified" : "What Do You", teal: isGreenFlow ? "Green Energy Installer" : "Need Done?" },
    2: { white: "Tell Us", teal: "More." },
    3: { white: "Where's The", teal: "Job?" },
    4: { white: "Your", teal: "Details." },
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(var(--deep))" }}>
      <SEO
        title="Post a Job Free — ProGrafter | Get Quotes from Verified Trades"
        description="Post your home improvement job free on ProGrafter. Receive quotes from verified, insured local tradespeople within 24 hours. Full project management included."
        path="/post-a-job"
      />
      <header className="py-6 px-6">
        <Link to="/" className="font-heading text-2xl tracking-wider">
          <span className="text-cream">Pro</span>
          <span className="text-teal">grafter</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= Math.floor(step) ? "bg-teal" : "bg-cream/10"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">
              {step === 3.5 ? "Optional Step" : `Step ${step} of 4`}
            </span>
          </div>

          {success ? (
            <div className="bg-teal/10 border border-teal/30 rounded-xl p-8 text-center">
              <h2 className="font-heading text-teal text-4xl mb-2">Job Posted.</h2>
              <p className="font-body text-cream/70 text-sm mb-6">
                We'll match you with verified local trades within 24 hours.
              </p>
              <Link
                to="/"
                className="inline-block bg-teal text-cream font-mono text-sm py-3 px-8 rounded-xl hover:bg-teal-hover transition-colors"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <form onSubmit={step === 4 ? handleSubmit : (e) => e.preventDefault()}>
              {/* STEP 1 — Job Type Cards */}
              {step === 1 && (
                <>
                  <h2 className="font-heading text-cream text-[36px] leading-none mb-4">
                    {stepTitles[1].white} <span className="text-teal">{stepTitles[1].teal}</span>
                  </h2>
                  {isGreenFlow && (
                    <p className="font-body text-cream/60 text-sm mb-6 leading-relaxed">
                      Based on your eligibility results, these are the certified trade types relevant to your project:
                    </p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredJobTypes.map((jt) => (
                      <button
                        key={jt.label}
                        type="button"
                        onClick={() => setJobType(jt.label)}
                        className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 transition-all text-center ${
                          jobType === jt.label
                            ? "border-teal bg-teal/10 text-teal"
                            : "border-cream/10 hover:border-cream/25 text-cream/70 hover:text-cream"
                        }`}
                      >
                        <span className="text-2xl">{jt.icon}</span>
                        <span className="font-mono text-xs uppercase tracking-wide">
                          {jt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  {isGreenFlow && (
                    <p className="font-body text-cream/40 text-xs mt-4 leading-relaxed">
                      All ProGrafter green trades hold the relevant certifications for government-funded work — MCS, TrustMark, PAS 2030, or OZEV approved as applicable.
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={!canStep1}
                    onClick={() => setStep(2)}
                    className="w-full mt-8 bg-teal text-cream font-mono text-sm py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-40"
                  >
                    Continue
                  </button>
                </>
              )}

              {/* STEP 2 — Description + Photos */}
              {step === 2 && (
                <>
                  <h2 className="font-heading text-cream text-[36px] leading-none mb-6">
                    {stepTitles[2].white} <span className="text-teal">{stepTitles[2].teal}</span>
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Description *</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the job in detail — what needs doing, any access issues, your timeframe..."
                        rows={5}
                        className={`${inputClass} resize-none`}
                      />
                      <p
                        className={`text-right font-mono text-xs mt-1 ${
                          description.trim().length < 50 ? "text-red-400" : "text-teal/70"
                        }`}
                      >
                        {description.trim().length < 50
                          ? `Minimum 50 characters — ${50 - description.trim().length} more to go`
                          : `${description.trim().length} characters · minimum met ✓`}
                      </p>
                    </div>

                    <div>
                      <label className={labelClass}>Photos (up to 4)</label>
                      {photos.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {photos.map((p, i) => (
                            <div
                              key={i}
                              className="relative group rounded-xl overflow-hidden border border-cream/10"
                            >
                              <img
                                src={URL.createObjectURL(p)}
                                alt={`Upload ${i + 1}`}
                                className="w-full h-28 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removePhoto(i)}
                                className="absolute top-2 right-2 bg-deep/80 text-cream rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ✕
                              </button>
                              <p className="absolute bottom-0 left-0 right-0 bg-deep/70 text-cream/60 font-mono text-[10px] px-2 py-1 truncate">
                                {p.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      {photos.length < 4 && (
                        <label className="block cursor-pointer">
                          <div className="border-2 border-dashed border-cream/15 hover:border-cream/30 rounded-xl p-6 text-center transition-colors">
                            <p className="font-mono text-cream/50 text-sm">Click to add photos</p>
                            <p className="font-body text-cream/30 text-xs mt-1">
                              JPG or PNG, max 10 MB each
                            </p>
                          </div>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            multiple
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 border border-cream/20 text-cream font-mono text-sm py-3 rounded-xl hover:bg-cream/5 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!canStep2}
                      onClick={() => { setError(""); setStep(3); }}
                      className="flex-1 bg-teal text-cream font-mono text-sm py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-40"
                    >
                      Continue
                    </button>
                  </div>
                </>
              )}

              {/* STEP 3 — Address + Budget */}
              {step === 3 && (
                <>
                  <h2 className="font-heading text-cream text-[36px] leading-none mb-6">
                    {stepTitles[3].white} <span className="text-teal">{stepTitles[3].teal}</span>
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Full Address *</label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 High Street, London"
                        rows={2}
                        required
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Postcode *</label>
                      <input
                        type="text"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                        placeholder="SW1A 1AA"
                        required
                        className={inputClass}
                      />
                      {postcode.trim().length > 0 && !postcodeValid && (
                        <p className="font-mono text-xs text-red-400 mt-1">
                          Enter a valid UK postcode (e.g. SW1A 1AA).
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Budget range (£) *</label>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1}
                          value={budgetMin}
                          onChange={(e) => setBudgetMin(e.target.value)}
                          placeholder="Min e.g. 5000"
                          required
                          className={inputClass}
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1}
                          value={budgetMax}
                          onChange={(e) => setBudgetMax(e.target.value)}
                          placeholder="Max e.g. 10000"
                          required
                          className={inputClass}
                        />
                      </div>
                      {(budgetMin !== "" || budgetMax !== "") && !budgetValid && (
                        <p className="font-mono text-xs text-red-400 mt-1">
                          Enter whole numbers, both required, max ≥ min.
                        </p>
                      )}
                      <p className="font-mono text-[10px] text-cream/40 mt-1">
                        Whole pounds only. Used to match you with appropriate trades.
                      </p>
                    </div>
                    <div>
                      <label className={labelClass}>Project type (optional)</label>
                      <select
                        value={specialismId}
                        onChange={(e) => setSpecialismId(e.target.value)}
                        className={`${inputClass} appearance-none`}
                        style={{ backgroundColor: "hsl(var(--deep))" }}
                      >
                        <option value="">e.g. Full bathroom renovation, Kitchen install — leave blank if not sure</option>
                        {specialisms.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <p className="font-mono text-[10px] text-cream/40 mt-1">
                        Helps us match you with trades who specialise in this work.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 border border-cream/20 text-cream font-mono text-sm py-3 rounded-xl hover:bg-cream/5 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!canStep3}
                      onClick={() => setStep(3.5)}
                      className="flex-1 bg-teal text-cream font-mono text-sm py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-40"
                    >
                      Continue
                    </button>
                  </div>
                </>
              )}

              {/* STEP 3b — OPTIONAL Funds Verification */}
              {step === 3.5 && (
                <>
                  <span className="inline-block bg-cream/10 text-cream/60 font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded mb-3">
                    Optional Step
                  </span>
                  <h2 className="font-heading text-cream text-[36px] leading-none mb-3">
                    Build Trust <span className="text-teal">With Trades.</span>
                  </h2>
                  <p className="font-mono text-xs text-teal uppercase tracking-widest mb-3">
                    Optional — Verify Your Funds
                  </p>
                  <p className="font-body text-cream/70 text-sm leading-relaxed mb-6">
                    Trades working on large projects often want confidence that funds are in
                    place before committing their time and team. Verifying your funds is
                    completely optional — but jobs with a Funds Verified badge receive
                    significantly more quotes and from higher-quality trades.
                  </p>
                  <p className="font-body text-cream/50 text-xs leading-relaxed mb-6">
                    Your financial documents are encrypted, stored privately, and never shown
                    to trades or ProGrafter staff. We only display a verification badge on
                    your job posting.
                  </p>

                  {/* OPTION A — Document upload card */}
                  <div className="rounded-xl border-l-4 border-teal bg-cream/5 border border-cream/10 p-5 mb-4">
                    <div className="flex items-start gap-3 mb-3">
                      <svg className="w-6 h-6 text-teal flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <div>
                        <h3 className="font-heading text-cream text-xl leading-tight">Upload a Funds Document</h3>
                        <p className="font-body text-cream/60 text-xs mt-1">Receive a Funds Verified badge on your job</p>
                      </div>
                    </div>
                    <p className="font-body text-cream/70 text-sm mb-3">Upload any of the following:</p>
                    <ul className="font-body text-cream/60 text-xs space-y-1 mb-4 list-disc list-inside">
                      <li>Mortgage offer letter (redact personal details if preferred)</li>
                      <li>Solicitor letter confirming funds held</li>
                      <li>Bank statement showing sufficient balance (account number and sort code can be obscured)</li>
                      <li>Financial advisor confirmation letter</li>
                    </ul>

                    {fundsDoc ? (
                      <div className="flex items-center justify-between bg-teal/10 border border-teal/30 rounded-lg px-3 py-2 mb-3">
                        <span className="font-mono text-xs text-teal truncate">✓ {fundsDoc.name}</span>
                        <button
                          type="button"
                          onClick={() => { setFundsDoc(null); setFundsDocError(""); }}
                          className="font-mono text-xs text-cream/60 hover:text-cream ml-3"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="block cursor-pointer">
                        <div className="border-2 border-dashed border-teal/40 hover:border-teal/70 rounded-xl p-5 text-center transition-colors">
                          <p className="font-mono text-teal text-sm">Click to upload document</p>
                          <p className="font-body text-cream/40 text-xs mt-1">PDF or image, max 10 MB</p>
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            if (f.size > 10 * 1024 * 1024) {
                              setFundsDocError("File exceeds 10 MB limit.");
                              return;
                            }
                            setFundsDocError("");
                            setFundsDoc(f);
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                    {fundsDocError && (
                      <p className="font-mono text-xs text-red-400 mt-2">{fundsDocError}</p>
                    )}

                    <p className="font-body text-cream/40 text-[11px] leading-relaxed mt-4 border-t border-cream/10 pt-3">
                      Your document is encrypted in transit and at rest. It is stored on
                      ProGrafter's secure servers and is accessible only to ProGrafter's
                      verification team. It will never be shared with trades, third parties,
                      or used for any purpose other than issuing your verification badge.
                      You may request deletion at any time by emailing hello@prografter.co.uk.
                      Processed under GDPR Article 6(1)(a) — your explicit consent.
                    </p>
                  </div>

                  {/* OPTION B — Skip card */}
                  <div className="rounded-xl border-l-4 border-cream/20 bg-cream/5 border border-cream/10 p-5 mb-6">
                    <h3 className="font-heading text-cream/70 text-lg leading-tight mb-1">Skip for now</h3>
                    <p className="font-body text-cream/50 text-xs">
                      Skip this step — I'll verify later if needed.
                    </p>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-1 border border-cream/20 text-cream font-mono text-sm py-3 rounded-xl hover:bg-cream/5 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFundsDoc(null); setFundsDocError(""); setStep(4); }}
                      className="flex-1 border border-cream/30 text-cream/70 font-mono text-sm py-3 rounded-xl hover:bg-cream/5 transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      disabled={!fundsDoc}
                      className="flex-1 bg-teal text-cream font-mono text-sm py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-40"
                    >
                      Continue
                    </button>
                  </div>
                </>
              )}

              {/* STEP 4 — Account */}
              {step === 4 && (
                <>
                  <h2 className="font-heading text-cream text-[36px] leading-none mb-6">
                    {stepTitles[4].white} <span className="text-teal">{stepTitles[4].teal}</span>
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Full Name *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => setStep4Touched(true)}
                        placeholder="Jane Smith"
                        autoComplete="name"
                        className={inputClass}
                      />
                      {step4Touched && trimmedName.length === 0 && (
                        <p className="font-mono text-xs text-red-400 mt-1">Please enter your name.</p>
                      )}
                      {nameLooksLikeEmail && (
                        <p className="font-mono text-xs text-red-400 mt-1">
                          Name can't contain "@". Use your real name (e.g. Jane Smith).
                        </p>
                      )}
                      {trimmedName.length > 0 &&
                        trimmedEmail.length > 0 &&
                        trimmedName.toLowerCase() === trimmedEmail.toLowerCase() && (
                          <p className="font-mono text-xs text-red-400 mt-1">
                            Name and email must be different.
                          </p>
                        )}
                    </div>
                    <div>
                      <label className={labelClass}>Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setStep4Touched(true)}
                        placeholder="jane@example.com"
                        autoComplete="email"
                        className={inputClass}
                      />
                      {step4Touched && trimmedEmail.length > 0 && !emailValid && (
                        <p className="font-mono text-xs text-red-400 mt-1">
                          Enter a valid email address.
                        </p>
                      )}
                      {step4Touched && trimmedEmail.length === 0 && (
                        <p className="font-mono text-xs text-red-400 mt-1">
                          Please enter your email.
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Phone *</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="07700 900000"
                          required
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Password *</label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          required
                          minLength={8}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    {password.length > 0 && password.length < 8 && (
                      <p className="font-mono text-xs text-red-400">
                        Must be at least 8 characters
                      </p>
                    )}
                  </div>

                  {/* Terms acceptance */}
                  <label className="flex items-start gap-3 mt-6 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => { setAcceptedTerms(e.target.checked); if (e.target.checked) setError(""); }}
                      className="mt-1 w-4 h-4 rounded border-cream/20 bg-cream/5 accent-teal cursor-pointer flex-shrink-0"
                    />
                    <span className="font-body text-cream/70 text-sm leading-relaxed">
                      I have read and agree to ProGrafter's{" "}
                      <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">Terms of Service</a>
                      {" "}and{" "}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">Privacy Policy</a>.
                    </span>
                  </label>

                  {error && (
                    <p className="text-red-400 font-mono text-xs mt-4">{error}</p>
                  )}

                  <div className="flex gap-4 mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(3.5)}
                      className="flex-1 border border-cream/20 text-cream font-mono text-sm py-3 rounded-xl hover:bg-cream/5 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !canStep4}
                      className="flex-1 bg-teal text-cream font-mono text-sm py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50"
                    >
                      {loading ? "Posting..." : "Post My Job"}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostAJob;
