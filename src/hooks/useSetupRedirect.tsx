import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";

const SETUP_LOOKUP_TIMEOUT_MS = 6000;

/**
 * Pre-check for registration / setup pages.
 *
 * If the signed-in user already has a row in the relevant profile table
 * (`trades` or `homeowners`), they're routed straight to that dashboard
 * instead of being shown the setup form again.
 *
 * Returns `checking = true` while we resolve the session + profile state,
 * so the page can render a loading shell instead of flashing the form.
 */
export function useSetupRedirect(
  role: "trade" | "homeowner",
  options: { redirectIfExists?: boolean } = {},
) {
  const { redirectIfExists = true } = options;
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const { isReady, user } = useAuthReady();
  // One-shot guard: once we've resolved the initial redirect decision we must
  // NOT re-run on subsequent auth-state emissions (token refreshes, sign-in
  // completing mid-form, etc.). Re-running would yank a user out of a
  // multi-step signup flow as soon as their first row is created, which
  // causes the form to unmount mid-typing.
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (resolvedRef.current) return;
    if (!isReady) return;

    let cancelled = false;

    const check = async () => {
      // Not signed in — let the page render so the user can sign up / post.
      if (!user) {
        resolvedRef.current = true;
        setChecking(false);
        return;
      }

      const userId = user.id;

      try {
        const lookupPromise = Promise.all([
          supabase
            .from("trades")
            .select("id, submitted_for_review_at")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase.from("homeowners").select("id").eq("user_id", userId).maybeSingle(),
        ]);

        const timeoutPromise = new Promise<never>((_, reject) => {
          window.setTimeout(() => {
            reject(new Error("Profile lookup timed out"));
          }, SETUP_LOOKUP_TIMEOUT_MS);
        });

        const [tradeRes, homeownerRes] = await Promise.race([lookupPromise, timeoutPromise]);

        if (cancelled) return;
        resolvedRef.current = true;

        // Trade signup: only kick them to the dashboard if they've fully
        // submitted for review. A partial trade row (created at Step 1)
        // means they need to keep filling in the form — do NOT redirect.
        if (role === "trade" && tradeRes.data) {
          const submitted = (tradeRes.data as { submitted_for_review_at?: string | null })
            .submitted_for_review_at;
          if (submitted) {
            navigate("/dashboard/trade", { replace: true });
            return;
          }
          // Partial signup — fall through and let SignupTrade resume.
        }

        if (role === "homeowner" && homeownerRes.data) {
          navigate("/dashboard/homeowner", { replace: true });
          return;
        }

        // Signed in as the *other* role — bounce them to their own dashboard
        // rather than letting them create a duplicate profile in this one.
        if (role === "trade" && homeownerRes.data && !tradeRes.data) {
          navigate("/dashboard/homeowner", { replace: true });
          return;
        }
        if (role === "homeowner" && tradeRes.data) {
          navigate("/dashboard/trade", { replace: true });
          return;
        }

        setChecking(false);
      } catch (error) {
        console.error("useSetupRedirect profile lookup failed", error);
        if (!cancelled) {
          resolvedRef.current = true;
          setChecking(false);
        }
      }
    };

    void check();

    return () => {
      cancelled = true;
    };
  }, [isReady, navigate, role, user]);

  return checking;
}

export const SetupRedirectLoader = () => (
  <div className="min-h-screen bg-cream flex items-center justify-center">
    <div className="font-mono text-sm text-secondary-text">Loading…</div>
  </div>
);
