import { useState, FormEvent, ChangeEvent, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { isGreenTrade } from "@/lib/greenTrades";

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

const BUDGETS = [
  "Under £1k",
  "£1k – £5k",
  "£5k – £15k",
  "£15k – £50k",
  "£50k+",
] as const;

type Step = 1 | 2 | 3 | 4;

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
  const [budget, setBudget] = useState("");

  // Step 4
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

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
    setLoading(true);
    setError("");

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
        const { data: urlData } = supabase.storage.from("job-photos").getPublicUrl(path);
        photoUrls.push(urlData.publicUrl);
      }
    }

    // 4. Insert job
    const { error: jobError } = await supabase.from("jobs").insert({
      homeowner_id: homeownerData.id,
      title: jobType,
      job_type: jobType,
      description: description.trim(),
      address: address.trim(),
      postcode: postcode.trim(),
      budget,
      photo_urls: photoUrls,
      status: "open",
      is_green_job: isGreenTrade(jobType),
    });

    setLoading(false);
    if (jobError) {
      console.error(jobError);
      setError("Account created but job posting failed. Contact support.");
    }
    setSuccess(true);
  };

  const canStep1 = jobType.length > 0;
  const canStep2 = description.trim().length >= 50;
  const canStep3 = address.trim().length > 0 && postcode.trim().length > 0 && budget.length > 0;
  const canStep4 =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    password.length >= 8;

  const stepTitles: Record<Step, { white: string; teal: string }> = {
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
                  s <= step ? "bg-teal" : "bg-cream/10"
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
                          description.trim().length < 50 ? "text-cream/30" : "text-teal/60"
                        }`}
                      >
                        {description.trim().length} / 50 min
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Postcode *</label>
                        <input
                          type="text"
                          value={postcode}
                          onChange={(e) => setPostcode(e.target.value)}
                          placeholder="SW1A 1AA"
                          required
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Budget *</label>
                        <select
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          required
                          className={`${inputClass} appearance-none`}
                          style={{ backgroundColor: "hsl(var(--deep))" }}
                        >
                          <option value="">Select budget</option>
                          {BUDGETS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
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
                      onClick={() => setStep(4)}
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
                        placeholder="Jane Smith"
                        required
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@example.com"
                        required
                        className={inputClass}
                      />
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

                  {error && (
                    <p className="text-red-400 font-mono text-xs mt-4">{error}</p>
                  )}

                  <div className="flex gap-4 mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
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
