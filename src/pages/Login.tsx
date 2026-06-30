import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { useAuthReady } from "@/hooks/useAuthReady";
import Logo from "@/components/Logo";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [homeownerEmail, setHomeownerEmail] = useState("");
  const [homeownerLoading, setHomeownerLoading] = useState(false);
  const [homeownerError, setHomeownerError] = useState("");
  const [homeownerSent, setHomeownerSent] = useState(false);
  const [homeownerCode, setHomeownerCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

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

  /** Only allow same-origin internal paths to prevent open-redirect abuse. */
  const getSafeRedirect = (): string | null => {
    const raw = searchParams.get("redirect");
    if (!raw) return null;
    let decoded = raw;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      decoded = raw;
    }
    if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
    return null;
  };

  const goTo = (path: string) => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    navigate(path, {
      replace: true,
      state: {
        authBypassUntil: Date.now() + 15_000,
      },
    });
  };

  /** Admins always land on the admin area, regardless of user_type. */
  const isAdminUser = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return !!data;
  };

  const redirectAfterAuth = async (userId: string, userType?: string | null) => {
    if (hasRedirectedRef.current) return;
    // An explicit safe redirect target always wins.
    const safe = getSafeRedirect();
    if (safe) {
      goTo(safe);
      return;
    }
    if (await isAdminUser(userId)) {
      goTo("/admin");
      return;
    }
    goTo(getDashboardPath(userType));
  };

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setSuccessMessage("Password updated. Please sign in with your new password.");
      // Clean the param from the URL
      const next = new URLSearchParams(searchParams);
      next.delete("reset");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // NOTE: we intentionally do NOT auto-redirect an already-signed-in user.
  // Landing on /login means the user wants to choose an account, so we show
  // an account chooser (continue / switch account) instead of silently
  // logging them straight back into the current session.

  const continueWithCurrentSession = async () => {
    if (!user) return;
    hasRedirectedRef.current = false;
    const metadataUserType =
      typeof user.user_metadata?.user_type === "string"
        ? user.user_metadata.user_type
        : null;
    await redirectAfterAuth(user.id, metadataUserType);
  };

  const switchAccount = async () => {
    await supabase.auth.signOut();
    hasRedirectedRef.current = false;
    setEmail("");
    setPassword("");
  };

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

      let userType =
        typeof signedInUser.user_metadata?.user_type === "string"
          ? signedInUser.user_metadata.user_type
          : null;

      if (!userType) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("user_id", signedInUser.id)
          .maybeSingle();
        userType = profile?.user_type ?? null;
      }

      await redirectAfterAuth(signedInUser.id, userType);
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

  const handleHomeownerMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setHomeownerError("");
    setHomeownerSent(false);
    setHomeownerLoading(true);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: homeownerEmail.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    if (otpError) {
      setHomeownerError(otpError.message);
      setHomeownerLoading(false);
      return;
    }

    setHomeownerSent(true);
    setHomeownerLoading(false);
  };

  const handleHomeownerCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setHomeownerError("");
    hasRedirectedRef.current = false;
    setCodeLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: homeownerEmail.trim(),
      token: homeownerCode.trim(),
      type: "email",
    });

    if (verifyError) {
      setHomeownerError(verifyError.message);
      setCodeLoading(false);
      return;
    }

    const { data: { user: otpUser } } = await supabase.auth.getUser();
    if (otpUser) {
      let userType =
        typeof otpUser.user_metadata?.user_type === "string"
          ? otpUser.user_metadata.user_type
          : null;
      if (!userType) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("user_id", otpUser.id)
          .maybeSingle();
        userType = profile?.user_type ?? null;
      }
      await redirectAfterAuth(otpUser.id, userType);
    } else {
      goTo("/dashboard/homeowner");
    }
    setCodeLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <SEO
        title="Sign In — ProGrafter"
        description="Sign in to your ProGrafter account to manage jobs, quotes and contracts."
        path="/login"
        noindex
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-2">
          <a
            href="https://prografter.co.uk"
            className="text-sm text-[#6B7280] no-underline hover:underline"
          >
            ← Back to ProGrafter
          </a>
        </div>
        <div className="text-center mb-8">
          <Logo variant="dark" className="h-9 w-auto inline-block" />
          <p className="font-mono text-sm text-secondary-text mt-2">Sign in — trade or homeowner</p>
        </div>

        {isReady && user && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-navy/10 mb-4">
            <p className="font-mono text-xs text-secondary-text mb-1">You're already signed in as</p>
            <p className="font-mono text-sm font-semibold text-navy break-all mb-4">{user.email}</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={continueWithCurrentSession}
                className="w-full py-3 bg-teal text-cream font-mono text-sm rounded-xl hover:bg-teal-hover transition-colors shadow-lg shadow-teal/20"
              >
                Continue as this account
              </button>
              <button
                type="button"
                onClick={switchAccount}
                className="w-full py-3 bg-transparent border border-navy/20 text-navy font-mono text-sm rounded-xl hover:bg-navy/5 transition-colors"
              >
                Sign in with a different account
              </button>
            </div>
          </div>
        )}

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
            <div className="rounded-xl border border-navy/10 bg-cream/60 p-4 text-left">
              <p className="font-mono text-xs font-semibold text-navy mb-3">
                Already posted a job? Enter your email for a secure sign-in link.
              </p>
              <form onSubmit={handleHomeownerMagicLink} className="space-y-3">
                {homeownerSent && (
                  <div className="bg-teal/10 border border-teal/30 text-teal px-3 py-2 rounded-lg text-xs font-mono">
                    Email sent. Click the link in your inbox, or enter the 6-digit code below.
                  </div>
                )}
                {homeownerError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-mono">
                    {homeownerError}
                  </div>
                )}
                <input
                  type="email"
                  value={homeownerEmail}
                  onChange={(e) => setHomeownerEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-navy/20 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                  placeholder="you@example.com"
                />
                <button
                  type="submit"
                  disabled={homeownerLoading}
                  className="w-full py-2 bg-navy text-cream font-mono text-xs rounded-lg hover:bg-navy/90 transition-colors disabled:opacity-50"
                >
                  {homeownerLoading ? "Sending..." : homeownerSent ? "Resend sign-in email" : "Send secure sign-in link"}
                </button>
              </form>

              {homeownerSent && (
                <form onSubmit={handleHomeownerCode} className="space-y-3 mt-3 pt-3 border-t border-navy/10">
                  <p className="font-mono text-xs text-navy">
                    Enter the 6-digit code from the email:
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={homeownerCode}
                    onChange={(e) => setHomeownerCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-3 py-2 rounded-lg border border-navy/20 bg-white font-mono text-sm tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                  />
                  <button
                    type="submit"
                    disabled={codeLoading || homeownerCode.length < 6}
                    className="w-full py-2 bg-teal text-cream font-mono text-xs rounded-lg hover:bg-teal-hover transition-colors disabled:opacity-50"
                  >
                    {codeLoading ? "Verifying..." : "Sign in with code"}
                  </button>
                </form>
              )}
            </div>
            <p className="font-mono text-xs text-secondary-text">
              Don't have an account?{" "}
              <a href="/register/trade" className="text-teal hover:underline">Register as a Trade</a>
            </p>
            <p className="font-mono text-xs text-secondary-text">
              Need work done?{" "}
              <a href="/post-a-job" className="text-teal hover:underline">Post a Job</a>
            </p>
          </div>

          <p className="mt-6 text-center font-mono text-xs text-secondary-text">
            <a href="/privacy" className="hover:underline">Privacy</a>
            {" · "}
            <a href="/terms" className="hover:underline">Terms</a>
            {" · "}
            <a href="/cookies" className="hover:underline">Cookies</a>
          </p>
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
