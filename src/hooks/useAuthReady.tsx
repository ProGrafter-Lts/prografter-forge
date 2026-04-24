import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthReadyState {
  isReady: boolean;
  session: Session | null;
  user: User | null;
}

export function useAuthReady(): AuthReadyState {
  const [state, setState] = useState<AuthReadyState>({
    isReady: false,
    session: null,
    user: null,
  });

  useEffect(() => {
    let isMounted = true;
    let resolvedInitialState = false;
    let retryTimer: number | null = null;

    const retryDelaysMs = [200, 350, 500, 800, 1200, 1600];

    const isRefreshTokenNotFoundError = (error: unknown) => {
      if (!error || typeof error !== "object") return false;

      const code = "code" in error ? String(error.code ?? "") : "";
      const message = "message" in error ? String(error.message ?? "") : "";

      return code === "refresh_token_not_found" || /refresh token.*not found/i.test(message);
    };

    const clearStoredSession = () => {
      if (typeof window === "undefined") return;

      const authKeys = Object.keys(window.localStorage).filter(
        (key) => key === "supabase.auth.token" || /^sb-[^-]+-auth-token$/.test(key),
      );

      authKeys.forEach((key) => window.localStorage.removeItem(key));
      authKeys.forEach((key) => window.sessionStorage.removeItem(key));
    };

    const clearRetryTimer = () => {
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const applySession = (session: Session | null, ready = true) => {
      if (!isMounted) return;

      setState({
        isReady: ready,
        session,
        user: session?.user ?? null,
      });
    };

    const resolveInitialState = (session: Session | null) => {
      if (resolvedInitialState) return;
      resolvedInitialState = true;
      clearRetryTimer();
      applySession(session, true);
    };

    const recoverSession = async (attempt = 0) => {
      if (resolvedInitialState || !isMounted) return;

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted || resolvedInitialState) return;

        if (session) {
          resolveInitialState(session);
          return;
        }

        if (isRefreshTokenNotFoundError(error)) {
          clearStoredSession();
          resolveInitialState(null);
          return;
        }

        if (attempt >= retryDelaysMs.length - 1) {
          resolveInitialState(null);
          return;
        }

        retryTimer = window.setTimeout(() => {
          void recoverSession(attempt + 1);
        }, retryDelaysMs[attempt + 1]);
      } catch (error) {
        console.error("useAuthReady getSession failed", error);

        if (attempt >= retryDelaysMs.length - 1) {
          resolveInitialState(null);
          return;
        }

        retryTimer = window.setTimeout(() => {
          void recoverSession(attempt + 1);
        }, retryDelaysMs[attempt + 1]);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        if (!resolvedInitialState) {
          resolveInitialState(session);
          return;
        }

        applySession(session, true);
        return;
      }

      if (event === "INITIAL_SESSION") {
        void recoverSession();
        return;
      }

      if (!resolvedInitialState && event === "SIGNED_OUT") {
        void recoverSession();
        return;
      }

      applySession(null, true);
    });

    void recoverSession();

    return () => {
      isMounted = false;
      clearRetryTimer();
      subscription.unsubscribe();
    };
  }, []);

  return state;
}