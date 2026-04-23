import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    let isMounted = true;
    let resolved = false;

    const resolve = (hasSession: boolean) => {
      if (!isMounted || resolved) return;
      resolved = true;
      if (hasSession) {
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
        navigate("/login", { replace: true });
      }
    };

    const resolveAuthenticated = () => resolve(true);

    // Primary source of truth: onAuthStateChange fires INITIAL_SESSION on mount
    // with the current session (or null) — this is more reliable than getSession()
    // which can hang if the auth client is mid-initialisation.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === "INITIAL_SESSION") {
        resolve(!!session);
        return;
      }

      if (event === "SIGNED_OUT") {
        resolved = true;
        setStatus("unauthenticated");
        navigate("/login", { replace: true });
        return;
      }

      if (session) {
        resolveAuthenticated();
      }
    });

    // Backup: also call getSession() — whichever resolves first wins.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => resolve(!!session))
      .catch((err) => {
        console.error("ProtectedRoute getSession failed", err);
        resolve(false);
      });

    // Safety net: 8s timeout
    const safetyTimeout = window.setTimeout(() => {
      if (!isMounted || resolved) return;
      console.warn("ProtectedRoute: auth check timed out, redirecting to login");
      resolve(false);
    }, 8000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.clearTimeout(safetyTimeout);
    };
  }, [navigate]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="font-mono text-sm text-secondary-text">Loading...</div>
      </div>
    );
  }

  return status === "authenticated" ? <>{children}</> : null;
};

export default ProtectedRoute;
