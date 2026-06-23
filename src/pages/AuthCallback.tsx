import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import Logo from "@/components/Logo";

type Phase = "working" | "error";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("working");
  const [errorMessage, setErrorMessage] = useState(
    "This link has expired or was already used — request a new one.",
  );

  // Resend state
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState("");
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const finish = (path: string) => {
      if (cancelled) return;
      navigate(path, {
        replace: true,
        state: { authBypassUntil: Date.now() + 15_000 },
      });
    };

    /** Route by role: admins to /admin, everyone else to homeowner dashboard. */
    const finishByRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: adminRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (adminRole) {
          finish("/admin");
          return;
        }
      }
      finish("/dashboard/homeowner");
    };

    const fail = (message?: string) => {
      if (cancelled) return;
      if (message) setErrorMessage(message);
      setPhase("error");
    };

    const run = async () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const search = new URLSearchParams(window.location.search);

      // Explicit error returned in the URL (expired / already used link).
      const errorCode = hashParams.get("error_code") || search.get("error_code");
      const errorDescription =
        hashParams.get("error_description") || search.get("error_description");
      const errorParam = hashParams.get("error") || search.get("error");

      if (errorParam || errorCode) {
        fail(
          errorCode === "otp_expired" || /expired/i.test(errorDescription || "")
            ? "This link has expired or was already used — request a new one."
            : errorDescription || "This sign-in link could not be used — request a new one.",
        );
        return;
      }

      // PKCE flow: ?code=... must be exchanged for a session.
      const code = search.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          fail("This link has expired or was already used — request a new one.");
          return;
        }
        finish("/dashboard/homeowner");
        return;
      }

      // Implicit flow: tokens arrive in the URL hash. The Supabase client
      // (detectSessionInUrl) processes them automatically; poll briefly for the
      // resulting session instead of bouncing silently to the login form.
      if (hashParams.get("access_token")) {
        for (let attempt = 0; attempt < 10; attempt += 1) {
          const { data } = await supabase.auth.getSession();
          if (cancelled) return;
          if (data.session) {
            finish("/dashboard/homeowner");
            return;
          }
          await new Promise((r) => setTimeout(r, 250));
        }
        fail("This link has expired or was already used — request a new one.");
        return;
      }

      // No code, no tokens, no error — maybe already signed in.
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        finish("/dashboard/homeowner");
        return;
      }
      fail("This sign-in link is missing its security token — request a new one.");
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendError("");
    setResendSent(false);
    setResendLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    if (error) {
      setResendError(error.message);
      setResendLoading(false);
      return;
    }

    setResendSent(true);
    setResendLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <SEO
        title="Signing you in — ProGrafter"
        description="Completing your secure sign-in to ProGrafter."
        path="/auth/callback"
        noindex
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo variant="dark" className="h-9 w-auto inline-block" />
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-navy/10">
          {phase === "working" ? (
            <p className="font-mono text-sm text-secondary-text text-center">
              Signing you in…
            </p>
          ) : (
            <div className="space-y-5">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-mono">
                {errorMessage}
              </div>

              <form onSubmit={handleResend} className="space-y-3">
                <label className="block font-mono text-sm text-navy">
                  Enter your email and we'll send a fresh sign-in link.
                </label>
                {resendSent && (
                  <div className="bg-teal/10 border border-teal/30 text-teal px-3 py-2 rounded-lg text-xs font-mono">
                    New secure sign-in link sent. Check your inbox.
                  </div>
                )}
                {resendError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-mono">
                    {resendError}
                  </div>
                )}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-navy/20 bg-cream/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                />
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="w-full py-3 bg-teal text-cream font-mono text-sm rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50 shadow-lg shadow-teal/20"
                >
                  {resendLoading ? "Sending…" : "Request a new link"}
                </button>
              </form>

              <p className="text-center font-mono text-xs text-secondary-text">
                <a href="/login" className="text-teal hover:underline">
                  Back to sign in
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
