import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { useAuthReady } from "@/hooks/useAuthReady";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const hasRedirectedRef = useRef(false);
  const { isReady, user } = useAuthReady();

  const getDashboardPath = (userType?: string | null) =>
    userType === "trade" ? "/dashboard/trade" : "/dashboard/homeowner";

  const redirectToDashboard = (userType?: string | null) => {
    const nextPath = getDashboardPath(userType);

    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;

    navigate(nextPath, {
      replace: true,
      state: {
        authBypassUntil: Date.now() + 15_000,
      },
    });
  };

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setSuccessMessage("Password updated — please sign in");
      // Clean the param from the URL
      const next = new URLSearchParams(searchParams);
      next.delete("reset");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!isReady || !user) return;

    const metadataUserType =
      typeof user.user_metadata?.user_type === "string"
        ? user.user_metadata.user_type
        : null;

    redirectToDashboard(metadataUserType);
  }, [isReady, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    hasRedirectedRef.current = false;
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      const signedInUser = data.user;
      if (!signedInUser) {
        setError("Sign-in succeeded, but no user session was returned.");
        return;
      }

      const metadataUserType =
        typeof signedInUser.user_metadata?.user_type === "string"
          ? signedInUser.user_metadata.user_type
          : null;

      if (metadataUserType) {
        redirectToDashboard(metadataUserType);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", signedInUser.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
        return;
      }

      redirectToDashboard(profile?.user_type ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  };

  const openForgot = () => {
    setForgotEmail(email);
    setForgotError("");
    setForgotSent(false);
    setShowForgot(true);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setForgotError(resetError.message);
      setForgotLoading(false);
      return;
    }

    setForgotSent(true);
    setForgotLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <SEO
        title="Sign In — ProGrafter"
        description="Sign in to your ProGrafter account to manage your projects, quotes, and messages."
        path="/login"
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="font-heading text-[32px] leading-none tracking-wide">
            <span className="text-navy">Pro</span>
            <span className="text-teal">grafter</span>
          </a>
          <p className="font-mono text-sm text-secondary-text mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-navy/10">
          <form onSubmit={handleLogin} className="space-y-5">
            {successMessage && (
              <div className="bg-teal/10 border border-teal/30 text-teal px-4 py-3 rounded-xl text-sm font-mono">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-mono">
                {error}
              </div>
            )}

            <div>
              <label className="block font-mono text-sm text-navy mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-navy/20 bg-cream/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block font-mono text-sm text-navy mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-navy/20 bg-cream/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                placeholder="••••••••"
              />
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={openForgot}
                  className="font-mono text-xs text-teal no-underline hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal text-cream font-mono text-sm rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50 shadow-lg shadow-teal/20"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="font-mono text-xs text-secondary-text">
              Don't have an account?{" "}
              <a href="/register/trade" className="text-teal hover:underline">Register as a Trade</a>
            </p>
            <p className="font-mono text-xs text-secondary-text">
              Need work done?{" "}
              <a href="/post-a-job" className="text-teal hover:underline">Post a Job</a>
            </p>
          </div>
        </div>
      </div>

      {showForgot && (
        <div
          className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => !forgotLoading && setShowForgot(false)}
        >
          <div
            className="bg-cream rounded-2xl p-8 w-full max-w-md border border-navy/10 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-heading text-2xl text-navy mb-1 tracking-wide">RESET YOUR PASSWORD</h2>
            <p className="font-mono text-xs text-secondary-text mb-5">
              Enter your account email and we'll send you a reset link.
            </p>

            {forgotSent ? (
              <div className="space-y-5">
                <div className="bg-teal/10 border border-teal/30 text-navy px-4 py-3 rounded-xl text-sm font-mono">
                  If an account exists for <strong>{forgotEmail}</strong>, a password reset link is on its way. Check your inbox (and spam folder).
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="w-full py-3 bg-navy text-cream font-mono text-sm rounded-xl hover:bg-navy/90 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-5">
                {forgotError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-mono">
                    {forgotError}
                  </div>
                )}

                <div>
                  <label className="block font-mono text-sm text-navy mb-1.5">Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-navy/20 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    disabled={forgotLoading}
                    className="flex-1 py-3 bg-transparent border border-navy/20 text-navy font-mono text-sm rounded-xl hover:bg-navy/5 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-3 bg-teal text-cream font-mono text-sm rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50 shadow-lg shadow-teal/20"
                  >
                    {forgotLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
