import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Subscribe first — but DON'T redirect on the initial null state.
    // Only react to explicit SIGNED_OUT events here.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === "SIGNED_OUT") {
        setAuthenticated(false);
        navigate("/login", { replace: true });
        return;
      }
      if (session) {
        setAuthenticated(true);
        setLoading(false);
      }
    });

    // Then resolve the persisted session. This is the source of truth on mount.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (!session) {
        navigate("/login", { replace: true });
      } else {
        setAuthenticated(true);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="font-mono text-sm text-secondary-text">Loading...</div>
      </div>
    );
  }

  return authenticated ? <>{children}</> : null;
};

export default ProtectedRoute;
