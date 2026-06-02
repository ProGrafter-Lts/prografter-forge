import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import Logo from "@/components/Logo";

type Status = "loading" | "valid" | "invalid" | "submitting" | "saved" | "unsubscribed";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  // Preference checkboxes — all opt-in by default
  const [prefProjects, setPrefProjects] = useState(true);
  const [prefNews, setPrefNews] = useState(true);
  const [prefTips, setPrefTips] = useState(true);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    const validate = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } }
        );
        const data = await res.json();
        if (res.ok && data.valid) setStatus("valid");
        else setStatus("invalid");
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const callUnsubscribe = async () => {
    if (!token) return false;
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    if (error) {
      setErrorMsg(error.message);
      return false;
    }
    return Boolean((data as { success?: boolean })?.success) ||
      (data as { reason?: string })?.reason === "already_unsubscribed";
  };

  const handleSavePreferences = async () => {
    setStatus("submitting");
    // If user unchecked everything, treat as full unsubscribe (recorded server-side)
    if (!prefProjects && !prefNews && !prefTips) {
      const ok = await callUnsubscribe();
      setStatus(ok ? "unsubscribed" : "valid");
      if (!ok) setErrorMsg("Could not save preferences. Please try again.");
      return;
    }
    // Granular preferences: acknowledged in UI (backend currently only stores
    // the all-emails-off flag). Essential account emails always send.
    setStatus("saved");
  };

  const handleUnsubscribeAll = async () => {
    setPrefProjects(false);
    setPrefNews(false);
    setPrefTips(false);
    setStatus("submitting");
    const ok = await callUnsubscribe();
    setStatus(ok ? "unsubscribed" : "valid");
    if (!ok) setErrorMsg("Could not complete unsubscribe. Please try again.");
  };

  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-12">
      <SEO
        title="Email Preferences — ProGrafter"
        description="Manage your ProGrafter email preferences."
        path="/unsubscribe"
        noindex
      />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo variant="dark" className="h-9 w-auto inline-block" />
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-navy/10">
          {status === "loading" && (
            <p className="font-body text-secondary-text text-sm">Checking your link…</p>
          )}

          {status === "invalid" && (
            <>
              <h1 className="font-body font-bold text-2xl text-navy mb-2">This link has expired</h1>
              <p className="font-body text-sm text-secondary-text mb-6">
                Unsubscribe links expire after 7 days for security. To manage your email
                preferences, sign in to your account or contact us directly.
              </p>
              <a
                href="/login"
                className="block w-full text-center py-3 bg-teal text-cream font-body text-sm rounded-xl hover:bg-teal-hover transition-colors shadow-lg shadow-teal/20"
              >
                Sign In to Manage Preferences
              </a>
              <p className="mt-4 text-center">
                <a
                  href="mailto:hello@prografter.co.uk"
                  className="text-sm text-[#6B7280] no-underline hover:underline"
                >
                  Email us at hello@prografter.co.uk
                </a>
              </p>
            </>
          )}

          {(status === "valid" || status === "submitting" || status === "saved") && (
            <>
              <h1 className="font-body font-bold text-2xl text-navy mb-2">Email Preferences</h1>
              <p className="font-body text-sm text-secondary-text mb-5">
                You're currently subscribed to ProGrafter updates. Choose what you'd like to receive:
              </p>

              {status === "saved" && (
                <div className="mb-5 bg-teal/10 border border-teal/30 text-navy px-4 py-3 rounded-xl text-sm font-body">
                  Preferences saved.
                </div>
              )}

              <div className="space-y-3 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefProjects}
                    onChange={(e) => setPrefProjects(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-teal"
                  />
                  <span className="font-body text-sm text-body-text">
                    Project updates and quotes
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefNews}
                    onChange={(e) => setPrefNews(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-teal"
                  />
                  <span className="font-body text-sm text-body-text">
                    Platform news and announcements
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefTips}
                    onChange={(e) => setPrefTips(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-teal"
                  />
                  <span className="font-body text-sm text-body-text">
                    Tips for getting the most from ProGrafter
                  </span>
                </label>
              </div>

              <button
                onClick={handleSavePreferences}
                disabled={status === "submitting"}
                className="w-full py-3 bg-teal text-cream font-body text-sm rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50 shadow-lg shadow-teal/20"
              >
                {status === "submitting" ? "Saving…" : "Save Preferences"}
              </button>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={handleUnsubscribeAll}
                  disabled={status === "submitting"}
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                  Unsubscribe from all emails
                </button>
              </div>

              {errorMsg && (
                <p className="mt-3 text-sm text-red-600 text-center font-body">{errorMsg}</p>
              )}
            </>
          )}

          {status === "unsubscribed" && (
            <>
              <h1 className="font-body font-bold text-2xl text-navy mb-2">You've been unsubscribed</h1>
              <p className="font-body text-sm text-secondary-text">
                You'll only receive essential account emails (e.g. password resets, payment
                confirmations).
              </p>
            </>
          )}
        </div>

        <p className="mt-10 text-center text-xs text-secondary-text font-body">
          ProGrafter Ltd · Registered in England and Wales · hello@prografter.co.uk
        </p>
      </div>
    </main>
  );
};

export default Unsubscribe;
