import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthReadyState {
  isReady: boolean;
  session: Session | null;
  user: User | null;
}

const retryDelaysMs = [200, 350, 500, 800, 1200, 1600];

let authState: AuthReadyState = {
  isReady: false,
  session: null,
  user: null,
};

let authBootstrapped = false;
let initialStateResolved = false;
let recoverInFlight = false;
let retryTimer: number | null = null;
const listeners = new Set<(state: AuthReadyState) => void>();

const emitAuthState = () => {
  listeners.forEach((listener) => listener(authState));
};

const setAuthState = (session: Session | null, ready = true) => {
  authState = {
    isReady: ready,
    session,
    user: session?.user ?? null,
  };

  emitAuthState();
};

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

const resolveInitialState = (session: Session | null) => {
  if (initialStateResolved) return;
  initialStateResolved = true;
  clearRetryTimer();
  setAuthState(session, true);
};

const recoverSession = async (attempt = 0) => {
  if (initialStateResolved) return;
  if (recoverInFlight) return;

  recoverInFlight = true;

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (initialStateResolved) return;

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
  } finally {
    recoverInFlight = false;
  }
};

const bootstrapAuthReady = () => {
  if (authBootstrapped) return;
  authBootstrapped = true;

  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      if (!initialStateResolved) {
        resolveInitialState(session);
        return;
      }

      setAuthState(session, true);
      return;
    }

    if (event === "INITIAL_SESSION") {
      void recoverSession();
      return;
    }

    if (event === "TOKEN_REFRESHED") {
      // Token refresh emitted with null session – re-fetch instead of nuking auth.
      void (async () => {
        const { data } = await supabase.auth.getSession();
        setAuthState(data.session ?? null, true);
      })();
      return;
    }

    if (!initialStateResolved && event === "SIGNED_OUT") {
      void recoverSession();
      return;
    }

    setAuthState(null, true);
  });
};

export function useAuthReady(): AuthReadyState {
  const [state, setState] = useState<AuthReadyState>(authState);

  useEffect(() => {
    bootstrapAuthReady();
    listeners.add(setState);
    setState(authState);

    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}