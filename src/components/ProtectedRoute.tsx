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

    const resolve = (hasSession: boolean) => {
      if (!isMounted) return;
      if (hasSession) {
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
        navigate("/login", { replace: true });
      }
    };

    // Source of truth on mount — resolves from localStorage immediately.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => resolve(!!session))
      .catch((err) => {
        console.error("ProtectedRoute getSession failed", err);
        resolve(false);
      });

    // React to subsequent sign-out events.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === "SIGNED_OUT" || (!session && event !== "INITIAL_SESSION")) {
        setStatus("unauthenticated");
        navigate("/login", { replace: true });
        return;
      }
      if (session) {
        setStatus("authenticated");
      }
    });

    // Safety net: if for any reason getSession never resolves (network/race),
    // fall back to unauthenticated after 5s instead of an infinite spinner.
    const safetyTimeout = window.setTimeout(() => {
      if (!isMounted) return;
      setStatus((current) => {
        if (current === "loading") {
          console.warn("ProtectedRoute: auth check timed out, redirecting to login");
          navigate("/login", { replace: true });
          return "unauthenticated";
        }
        return current;
      });
    }, 5000);

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
