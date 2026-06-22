import { Link } from "react-router-dom";

const SignUpSection = () => {
  return (
    <section id="signup" className="relative bg-deep py-24 px-6 overflow-hidden">
      {/* Ghost text */}
      <span
        className="absolute bottom-8 right-8 font-heading text-[120px] craft:text-[200px] text-cream select-none pointer-events-none leading-none"
        style={{ opacity: 0.03 }}
      >
        GRAFT
      </span>

      <div className="max-w-[1800px] mx-auto grid craft:grid-cols-2 gap-16 items-start relative z-10">
        {/* Left */}
        <div className="fade-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">Register Free</span>
          </div>
          <h2 className="font-heading text-cream text-[48px] craft:text-[64px] leading-none mb-4">
            Live in Nottinghamshire.<br /><span className="text-teal">Growing outward.</span>
          </h2>
          <p className="font-body text-secondary-text text-base font-light max-w-sm">
            ProGrafter is live and taking signups across Nottinghamshire and the East Midlands — and growing. Register free today: no monthly fees, no spam, just verified job leads.
          </p>
        </div>

        {/* Right — Account type chooser */}
        <div className="fade-up">
          <div className="bg-cream/5 border border-cream/10 rounded-2xl p-8 craft:p-10 space-y-6">
            <div>
              <h3 className="font-heading text-cream text-2xl craft:text-3xl mb-2">Create your free account</h3>
              <p className="font-body text-secondary-text text-sm">Choose how you'd like to use ProGrafter.</p>
            </div>

            <div className="grid gap-4">
              <Link
                to="/signup/homeowner"
                className="group block bg-teal text-cream rounded-xl px-6 py-5 hover:bg-teal-hover transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest opacity-80 mb-1">For Homeowners</p>
                    <p className="font-heading text-xl">Post a job, get matched</p>
                  </div>
                  <span className="font-mono text-2xl opacity-80 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>

              <Link
                to="/signup/trade"
                className="group block bg-cream/5 border border-cream/20 text-cream rounded-xl px-6 py-5 hover:bg-cream/10 hover:border-teal/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-teal mb-1">For Tradespeople</p>
                    <p className="font-heading text-xl">One of three, not one of thirty</p>
                  </div>
                  <span className="font-mono text-2xl text-teal group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            </div>

            <p className="font-body text-secondary-text text-xs text-center">
              Already have an account?{" "}
              <Link to="/login" className="text-teal hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignUpSection;
