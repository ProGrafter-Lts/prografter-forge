import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

type Status = "verifying" | "verified" | "failed";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>("verifying");

  useEffect(() => {
    let settled = false;

    const markVerified = () => {
      settled = true;
      setStatus("verified");
    };

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        markVerified();
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) markVerified();
    });

    // If neither the recovery event nor an existing session arrives, treat as failed.
    const timeout = window.setTimeout(() => {
      if (!settled) setStatus("failed");
    }, 4000);

    return () => {
      subscription.subscription.unsubscribe();
      window.clearTimeout(timeout);
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
        noindex
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="font-heading text-[32px] leading-none tracking-wider">
            <span className="text-navy">PRO</span>
            <span className="text-teal">GRAFTER</span>
          </a>
          <div className="mt-3">
            <a
              href="/login"
              className="text-sm text-[#6B7280] no-underline hover:underline"
            >
              ← Back to sign in
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-navy/10">
          <h1 className="font-body font-bold text-2xl text-navy mb-1">Reset your password.</h1>
          <p className="font-body text-sm text-secondary-text mb-5">
            Enter a new password for your account.
          </p>

          {status === "verifying" && (
            <div className="flex items-center gap-2 text-secondary-text font-body text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin text-teal" />
              <span>Verifying reset link...</span>
            </div>
          )}

          {status === "failed" && (
            <div className="space-y-4">
              <p className="text-red-600 font-body text-sm">
                This reset link has expired or has already been used.
              </p>
              <a
                href="/login"
                className="inline-flex items-center justify-center w-full py-3 border border-teal text-teal font-body text-sm rounded-xl hover:bg-teal hover:text-cream transition-colors"
              >
                Request a new reset link →
              </a>
            </div>
          )}

          {status === "verified" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-body">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-body text-sm text-navy mb-1.5">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-navy/20 bg-cream/50 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-secondary-text hover:text-navy"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-secondary-text font-body">Minimum 8 characters.</p>
              </div>

              <div>
                <label className="block font-body text-sm text-navy mb-1.5">Confirm new password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-navy/20 bg-cream/50 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-secondary-text hover:text-navy"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-teal text-cream font-body text-sm rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50 shadow-lg shadow-teal/20"
              >
                {loading ? "Updating..." : "Set New Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
