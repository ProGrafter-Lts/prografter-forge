import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";

// The @supabase/ssr / supabase-js `auth.oauth` namespace is beta and not yet in
// the generated types — provide a minimal local typing for the three methods.
type OAuthApi = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: any; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: any; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: any; error: { message: string } | null }>;
};

const oauth = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?redirect=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo variant="dark" className="h-9 w-auto inline-block" />
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-navy/10">
          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-mono">
              Could not load this authorization request: {error}
            </div>
          ) : !details ? (
            <p className="font-mono text-sm text-secondary-text text-center">Loading…</p>
          ) : (
            <div className="space-y-5">
              <div>
                <h1 className="font-heading text-2xl text-navy mb-2">
                  Connect {details.client?.name ?? "an app"} to your account
                </h1>
                <p className="font-mono text-sm text-secondary-text">
                  This lets {details.client?.name ?? "the client"} use ProGrafter as you.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  disabled={busy}
                  onClick={() => decide(true)}
                  className="flex-1 py-3 bg-teal text-cream font-mono text-sm rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  disabled={busy}
                  onClick={() => decide(false)}
                  className="flex-1 py-3 bg-cream border border-navy/20 text-navy font-mono text-sm rounded-xl hover:bg-navy/5 transition-colors disabled:opacity-50"
                >
                  Deny
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthConsent;
