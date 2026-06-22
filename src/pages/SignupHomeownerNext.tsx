import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";

const SignupHomeownerNext = () => {
  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Welcome to ProGrafter" description="Choose what to do next." path="/signup/homeowner/next" />
      <Navbar />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="font-heading text-[32px] leading-none tracking-wider inline-block mb-6">
            <Logo variant="dark" className="h-9 w-auto inline-block" />
          </div>
          <div>
            <span className="font-mono text-xs text-teal uppercase tracking-widest">Account created</span>
          </div>
          <h1 className="font-heading text-navy text-4xl craft:text-5xl mt-3 mb-4">
            What brings you here today?
          </h1>
          <p className="font-body text-secondary-text mb-10">
            You're all set up. Want to post a project right away, or take a look around first?
          </p>

          <div className="grid craft:grid-cols-2 gap-4">
            <Link
              to="/post-a-job"
              className="group bg-white rounded-2xl border border-navy/10 p-8 text-left hover:border-teal hover:shadow-lg transition-all"
            >
              <div className="font-heading text-navy text-2xl mb-2">Post a project now</div>
              <p className="font-body text-sm text-secondary-text mb-4">
                Tell us what you need and we'll match you with up to three vetted, local, available trades — not thirty.
              </p>
              <span className="inline-flex items-center font-mono text-sm text-teal">
                Get started →
              </span>
            </Link>

            <Link
              to="/dashboard/homeowner"
              className="group bg-white rounded-2xl border border-navy/10 p-8 text-left hover:border-teal hover:shadow-lg transition-all"
            >
              <div className="font-heading text-navy text-2xl mb-2">Take me to my dashboard</div>
              <p className="font-body text-sm text-secondary-text mb-4">
                I'll post a project later. Show me around the platform first.
              </p>
              <span className="inline-flex items-center font-mono text-sm text-teal">
                Go to dashboard →
              </span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignupHomeownerNext;
