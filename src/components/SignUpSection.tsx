import { useState, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

const SignUpSection = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [postcode, setPostcode] = useState("");
  const [userType, setUserType] = useState("tradesperson");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!postcode.trim()) {
      setError("Postcode is required.");
      return;
    }
    setLoading(true);
    setError("");

    const { error: dbError } = await supabase.from("early_signups").insert({
      name: name.trim(),
      email: email.trim(),
      postcode: postcode.trim(),
      user_type: userType,
    });

    setLoading(false);
    if (dbError) {
      setError("Something went wrong. Please try again.");
      console.error(dbError);
    } else {
      setSuccess(true);
    }
  };

  return (
    <section id="signup" className="relative bg-deep py-24 px-6 overflow-hidden">
      {/* Ghost text */}
      <span className="absolute bottom-8 right-8 font-heading text-[120px] craft:text-[200px] text-cream select-none pointer-events-none leading-none" style={{ opacity: 0.03 }}>
        GRAFT
      </span>

      <div className="max-w-5xl mx-auto grid craft:grid-cols-2 gap-16 items-start relative z-10">
        {/* Left */}
        <div className="fade-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">Join the Waitlist</span>
          </div>
          <h2 className="font-heading text-cream text-[48px] craft:text-[64px] leading-none mb-4">
            Get In<br /><span className="text-teal">Early.</span>
          </h2>
          <p className="font-body text-secondary-text text-base font-light max-w-sm">
            Be the first to know when ProGrafter launches in your area. No spam, just updates that matter.
          </p>
        </div>

        {/* Right — Form */}
        <div className="fade-up">
          {success ? (
            <div className="bg-teal/10 border border-teal/30 rounded-xl p-8 text-center">
              <h3 className="font-heading text-teal text-3xl mb-2">You're In.</h3>
              <p className="font-body text-cream/70 text-sm">We'll be in touch when we launch near you.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                   className="bg-cream/5 border border-cream/10 text-cream placeholder-secondary-text font-body text-sm rounded-xl px-4 py-3 focus:border-teal focus:outline-none transition-colors"
                />
                <input
                  type="text"
                  placeholder="Postcode *"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  required
                  className="bg-cream/5 border border-cream/10 text-cream placeholder-secondary-text font-body text-sm rounded-xl px-4 py-3 focus:border-teal focus:outline-none transition-colors"
                />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-cream/5 border border-cream/10 text-cream placeholder-secondary-text font-body text-sm rounded-[4px] px-4 py-3 focus:border-teal focus:outline-none transition-colors"
              />
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="w-full bg-cream/5 border border-cream/10 text-cream font-body text-sm rounded-[4px] px-4 py-3 focus:border-teal focus:outline-none transition-colors appearance-none"
              >
                <option value="tradesperson" className="bg-deep">Tradesperson</option>
                <option value="homeowner" className="bg-deep">Homeowner</option>
                <option value="both" className="bg-deep">Both</option>
              </select>
              {error && <p className="text-red-400 font-mono text-xs">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal text-cream font-mono text-sm py-3 rounded-[4px] hover:bg-teal-hover transition-colors disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Get Early Access"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default SignUpSection;
