import { useEffect, useState } from "react";
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
export function useSetupRedirect(role: "trade" | "homeowner") {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const { isReady, user } = useAuthReady();

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!isReady) return;

      // Not signed in — let the page render so the user can sign up / post.
      if (!user) {
        setChecking(false);
        return;
      }

      const userId = user.id;

      try {
        const lookupPromise = Promise.all([
          supabase.from("trades").select("id").eq("user_id", userId).maybeSingle(),
          supabase.from("homeowners").select("id").eq("user_id", userId).maybeSingle(),
        ]);

        const timeoutPromise = new Promise<never>((_, reject) => {
          window.setTimeout(() => {
            reject(new Error("Profile lookup timed out"));
          }, SETUP_LOOKUP_TIMEOUT_MS);
        });

        const [tradeRes, homeownerRes] = await Promise.race([lookupPromise, timeoutPromise]);

        if (cancelled) return;

        if (role === "trade" && tradeRes.data) {
          navigate("/dashboard/trade", { replace: true });
          return;
        }

        if (role === "homeowner" && homeownerRes.data) {
          navigate("/dashboard/homeowner", { replace: true });
          return;
        }

        // Signed in as the *other* role — bounce them to their own dashboard
        // rather than letting them create a duplicate profile in this one.
        if (role === "trade" && homeownerRes.data) {
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
