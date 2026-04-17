import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery token in the URL hash and creates a session.
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // Also check existing session in case event already fired
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    navigate("/login?reset=success");
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <SEO
        title="Reset Password — ProGrafter"
        description="Set a new password for your ProGrafter account."
        path="/reset-password"
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="font-heading text-[32px] leading-none tracking-wide">
            <span className="text-navy">Pro</span>
            <span className="text-teal">grafter</span>
          </a>
          <p className="font-mono text-sm text-secondary-text mt-2">Set a new password</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-navy/10">
          <h1 className="font-heading text-2xl text-navy mb-1 tracking-wide">RESET YOUR PASSWORD</h1>
          <p className="font-mono text-xs text-secondary-text mb-5">
            Enter a new password for your account.
          </p>

          {!ready ? (
            <p className="font-mono text-sm text-secondary-text">
              Verifying reset link...
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-mono">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-mono text-sm text-navy mb-1.5">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl border border-navy/20 bg-cream/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block font-mono text-sm text-navy mb-1.5">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl border border-navy/20 bg-cream/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-teal text-cream font-mono text-sm rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50 shadow-lg shadow-teal/20"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
