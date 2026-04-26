import { Link, useLocation } from "react-router-dom";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";

const SignupCheckEmail = () => {
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Check your inbox — ProGrafter" description="Verify your email to finish signup." path="/signup/homeowner/check-email" />
      <Navbar />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="text-6xl mb-6">📬</div>
          <h1 className="font-heading text-navy text-4xl mb-3">Check your inbox</h1>
          <p className="font-body text-body-text mb-2">
            We've sent a confirmation link to {email ? <strong>{email}</strong> : "your email"}.
          </p>
          <p className="font-body text-secondary-text text-sm mb-8">
            Click the link to verify your account, then sign in to get started. Didn't get it? Check your spam folder.
          </p>
          <Link
            to="/login"
            className="inline-block bg-teal text-cream font-mono text-sm px-8 py-3 rounded-xl hover:bg-teal-hover transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </main>
    </div>
  );
};

export default SignupCheckEmail;
