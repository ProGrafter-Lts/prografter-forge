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

    const applySession = (session: Session | null, ready = true) => {
      if (!isMounted) return;

      setState({
        isReady: ready,
        session,
        user: session?.user ?? null,
      });
    };

    const resolveInitialState = (session: Session | null) => {
      resolvedInitialState = true;
      applySession(session, true);
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

        window.setTimeout(() => {
          if (!resolvedInitialState) {
            resolveInitialState(null);
          }
        }, 400);
      })
      .catch((error) => {
        console.error("useAuthReady getSession failed", error);
        window.setTimeout(() => {
          if (!resolvedInitialState) {
            resolveInitialState(null);
          }
        }, 400);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}