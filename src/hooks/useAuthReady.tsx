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
    let fallbackTimer: number | null = null;

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
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer);
      }
      applySession(session, true);
    };

    const scheduleNullResolution = (attempt = 0) => {
      if (resolvedInitialState || !isMounted) return;

      fallbackTimer = window.setTimeout(() => {
        void supabase.auth
          .getSession()
          .then(({ data: { session } }) => {
            if (session) {
              resolveInitialState(session);
              return;
            }

            if (attempt >= 9) {
              resolveInitialState(null);
              return;
            }

            scheduleNullResolution(attempt + 1);
          })
          .catch((error) => {
            console.error("useAuthReady retry getSession failed", error);

            if (attempt >= 9) {
              resolveInitialState(null);
              return;
            }

            scheduleNullResolution(attempt + 1);
          });
      }, attempt === 0 ? 250 : 300);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        resolveInitialState(session);
        return;
      }

      applySession(session, true);
    });

    void supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) {
          resolveInitialState(session);
          return;
        }

        scheduleNullResolution();
      })
      .catch((error) => {
        console.error("useAuthReady getSession failed", error);
        scheduleNullResolution();
      });

    return () => {
      isMounted = false;
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer);
      }
      subscription.unsubscribe();
    };
  }, []);

  return state;
}