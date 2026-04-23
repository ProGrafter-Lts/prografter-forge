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

    const applySession = (session: Session | null, ready = true) => {
      if (!isMounted) return;

      setState({
        isReady: ready,
        session,
        user: session?.user ?? null,
      });
    };

    void supabase.auth
      .getSession()
      .then(({ data: { session } }) => applySession(session, true))
      .catch((error) => {
        console.error("useAuthReady getSession failed", error);
        applySession(null, true);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session, true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}