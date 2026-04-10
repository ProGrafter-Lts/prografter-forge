import { useState, FormEvent, ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const TRADE_TYPES = [
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

type Step = 1 | 2 | 3;

const TradeRegisterNew = () => {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");

  // Step 2
  const [tradeType, setTradeType] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [bio, setBio] = useState("");

  // Step 3
  const [file, setFile] = useState<File | null>(null);

  const inputClass =
    "w-full bg-cream/5 border border-cream/10 text-cream placeholder-cream/40 font-body text-sm rounded-xl px-4 py-3 focus:border-teal focus:outline-none transition-colors";
  const labelClass = "block font-mono text-xs text-teal uppercase tracking-widest mb-1.5";

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB.");
      return;
    }
    setFile(selected || null);
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Sign up auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          user_type: "trade",
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

    // 2. Upload insurance cert if provided
    let insuranceCertUrl: string | null = null;
    if (file) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${authData.user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("insurance-certs")
        .upload(filePath, file);

      if (uploadError) {
        setError("Account created but certificate upload failed. You can upload it later.");
        setLoading(false);
        setSuccess(true);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("insurance-certs")
        .getPublicUrl(filePath);

      insuranceCertUrl = urlData.publicUrl;
    }

    // 3. Insert into trades
    const { error: dbError } = await supabase.from("trades").insert({
      name: fullName.trim(),
      trade_type: tradeType,
      company_name: companyName.trim(),
      phone: phone.trim(),
      postcode: postcode.trim(),
      bio: bio.trim() || null,
      years_experience: yearsExperience ? parseInt(yearsExperience, 10) : null,
      insurance_cert_url: insuranceCertUrl,
      user_id: authData.user.id,
    });

    setLoading(false);
    if (dbError) {
      console.error(dbError);
      setError("Account created but trade details failed to save. Please contact support.");
    }
    setSuccess(true);
  };

  const canProceedStep1 =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    phone.trim().length > 0 &&
    postcode.trim().length > 0;

  const canProceedStep2 = tradeType.length > 0 && companyName.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(var(--deep))" }}>
      <header className="py-6 px-6">
        <Link to="/" className="font-heading text-2xl tracking-wider">
          <span className="text-cream">Pro</span>
          <span className="text-teal">grafter</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
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
              Step {step} of 3
            </span>
          </div>

          {success ? (
            <div className="bg-teal/10 border border-teal/30 rounded-xl p-8 text-center">
              <h2 className="font-heading text-teal text-4xl mb-2">Application Received.</h2>
              <p className="font-body text-cream/70 text-sm mb-6">
                We'll verify your details within 24 hours.
              </p>
              <Link
                to="/"
                className="inline-block bg-teal text-cream font-mono text-sm py-3 px-8 rounded-xl hover:bg-teal-hover transition-colors"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
              {/* STEP 1 */}
              {step === 1 && (
                <>
                  <h2 className="font-heading text-cream text-[40px] leading-none mb-6">
                    Your <span className="text-teal">Account.</span>
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Full Name *</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Smith"
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
                        placeholder="john@example.com"
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
                      {password.length > 0 && password.length < 8 && (
                        <p className="font-mono text-xs text-red-400 mt-1">
                          Must be at least 8 characters
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
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!canProceedStep1}
                    onClick={() => setStep(2)}
                    className="w-full mt-8 bg-teal text-cream font-mono text-sm py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-40"
                  >
                    Continue
                  </button>
                </>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <>
                  <h2 className="font-heading text-cream text-[40px] leading-none mb-6">
                    Your <span className="text-teal">Trade.</span>
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Trade Type *</label>
                      <select
                        value={tradeType}
                        onChange={(e) => setTradeType(e.target.value)}
                        required
                        className={`${inputClass} appearance-none`}
                        style={{ backgroundColor: "hsl(var(--deep))" }}
                      >
                        <option value="">Select your trade</option>
                        {TRADE_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Company Name *</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Smith Plumbing Ltd"
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Years Experience</label>
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={yearsExperience}
                          onChange={(e) => setYearsExperience(e.target.value)}
                          placeholder="10"
                          className={inputClass}
                        />
                      </div>
                      <div />
                    </div>
                    <div>
                      <label className={labelClass}>Bio</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value.slice(0, 300))}
                        placeholder="Tell homeowners about yourself..."
                        rows={4}
                        maxLength={300}
                        className={`${inputClass} resize-none`}
                      />
                      <p className="text-right font-mono text-xs text-cream/30 mt-1">
                        {bio.length}/300
                      </p>
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
                      disabled={!canProceedStep2}
                      onClick={() => setStep(3)}
                      className="flex-1 bg-teal text-cream font-mono text-sm py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-40"
                    >
                      Continue
                    </button>
                  </div>
                </>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <>
                  <h2 className="font-heading text-cream text-[40px] leading-none mb-6">
                    Insurance <span className="text-teal">Certificate.</span>
                  </h2>
                  <p className="font-body text-cream/50 text-sm mb-6">
                    Upload your public liability insurance certificate. PDF, JPG, or PNG — max 5 MB.
                  </p>
                  <label className="block cursor-pointer">
                    <div
                      className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                        file ? "border-teal/50 bg-teal/5" : "border-cream/15 hover:border-cream/30"
                      }`}
                    >
                      {file ? (
                        <div>
                          <p className="font-mono text-teal text-sm">{file.name}</p>
                          <p className="font-body text-cream/40 text-xs mt-1">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-mono text-cream/50 text-sm">Click to select file</p>
                          <p className="font-body text-cream/30 text-xs mt-1">PDF, JPG, or PNG</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {error && (
                    <p className="text-red-400 font-mono text-xs mt-4">{error}</p>
                  )}

                  <div className="flex gap-4 mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 border border-cream/20 text-cream font-mono text-sm py-3 rounded-xl hover:bg-cream/5 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-teal text-cream font-mono text-sm py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50"
                    >
                      {loading ? "Submitting..." : "Register"}
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

export default TradeRegisterNew;
