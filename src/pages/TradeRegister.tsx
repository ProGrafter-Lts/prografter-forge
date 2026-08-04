import { useState, FormEvent, ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useSetupRedirect, SetupRedirectLoader } from "@/hooks/useSetupRedirect";
import SEO from "@/components/SEO";

const TRADE_TYPES = [
  "Plumber",
  "Electrician",
  "Carpenter / Joiner",
  "Bricklayer",
  "Plasterer",
  "Roofer",
  "Painter & Decorator",
  "Tiler",
  "Landscaper",
  "Kitchen Fitter",
  "Bathroom Fitter",
  "General Builder",
] as const;

type Step = 1 | 2 | 3;

const TradeRegister = () => {
  const checkingExisting = useSetupRedirect("trade");
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [name, setName] = useState("");
  const [tradeType, setTradeType] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");

  // Step 2
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [website, setWebsite] = useState("");

  // Step 3
  const [file, setFile] = useState<File | null>(null);

  const inputClass =
    "w-full bg-cream/5 border border-cream/10 text-cream placeholder-secondary-text font-body text-sm rounded-xl px-4 py-3 focus:border-teal focus:outline-none transition-colors";
  const labelClass = "block font-mono text-xs text-teal uppercase tracking-widest mb-1.5";

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB.");
      return;
    }
    setFile(selected || null);
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let insuranceCertUrl: string | null = null;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be signed in to create a trade profile.");
      setLoading(false);
      return;
    }

    // Upload insurance cert if provided
    if (file) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("insurance-certs")
        .upload(filePath, file);

      if (uploadError) {
        setError("Failed to upload certificate. Please try again.");
        setLoading(false);
        console.error(uploadError);
        return;
      }

      // Store the storage path (not a public URL). Signed URLs are generated
      // on demand when an admin needs to view the certificate.
      insuranceCertUrl = filePath;
    }

    const { error: dbError } = await supabase.from("trades").insert({
      user_id: user.id,
      name: name.trim(),
      trade_type: tradeType,
      company_name: companyName.trim(),
      phone: phone.trim(),
      postcode: postcode.trim(),
      bio: bio.trim() || null,
      years_experience: yearsExperience ? parseInt(yearsExperience, 10) : null,
      website: website.trim() || null,
      insurance_cert_url: insuranceCertUrl,
    });

    setLoading(false);
    if (dbError) {
      setError("Something went wrong. Please try again.");
      console.error(dbError);
    } else {
      setSuccess(true);
    }
  };

  const canProceedStep1 = name && tradeType && companyName && phone && postcode;
  const canProceedStep2 = true; // Step 2 fields are optional

  if (checkingExisting) return <SetupRedirectLoader />;

  return (
    <div className="min-h-screen bg-deep flex flex-col">
      <SEO
        title="Join ProGrafter — Register as a Verified UK Trade"
        description="Register your trade business with ProGrafter. No monthly fees, verified-only membership, and you pay only when a job completes."
        path="/register"
      />
      {/* Header */}
      <header className="py-6 px-6">
        <Link to="/" className="font-heading text-cream text-2xl tracking-wider">
          PROGRAFTER
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    s <= step ? "bg-teal" : "bg-cream/10"
                  }`}
                />
              </div>
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
              <h2 className="font-heading text-teal text-4xl mb-2">You're Registered.</h2>
              <p className="font-body text-cream/70 text-sm mb-6">
                We'll review your details and be in touch soon.
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
                    Your <span className="text-teal">Details.</span>
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Full Name *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Smith"
                        required
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Trade Type *</label>
                      <select
                        value={tradeType}
                        onChange={(e) => setTradeType(e.target.value)}
                        required
                        className={`${inputClass} appearance-none`}
                      >
                        <option value="" className="bg-deep">Select your trade</option>
                        {TRADE_TYPES.map((t) => (
                          <option key={t} value={t} className="bg-deep">{t}</option>
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
                          placeholder="NG1 1AA"
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
                    Your <span className="text-teal">Experience.</span>
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Bio</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell homeowners about yourself and the work you do..."
                        rows={4}
                        maxLength={500}
                        className={`${inputClass} resize-none`}
                      />
                      <p className="text-right font-mono text-xs text-cream/30 mt-1">
                        {bio.length}/500
                      </p>
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
                      <div>
                        <label className={labelClass}>Website</label>
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://..."
                          className={inputClass}
                        />
                      </div>
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
                    Upload your public liability insurance certificate. PDF or image, max 10 MB.
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
                          <p className="font-mono text-cream/50 text-sm">
                            Click to select file
                          </p>
                          <p className="font-body text-cream/30 text-xs mt-1">
                            PDF, JPG, or PNG
                          </p>
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

          <p className="mt-6 text-center font-mono text-xs text-secondary-text">
            <a href="/privacy" className="hover:underline">Privacy</a>
            {" · "}
            <a href="/terms" className="hover:underline">Terms</a>
            {" · "}
            <a href="/cookies" className="hover:underline">Cookies</a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default TradeRegister;
