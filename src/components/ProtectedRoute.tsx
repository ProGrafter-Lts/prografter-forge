import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isReady, user } = useAuthReady();
  const bypassActive =
    typeof location.state === "object" &&
    location.state !== null &&
    "authBypassUntil" in location.state &&
    Number((location.state as { authBypassUntil?: number }).authBypassUntil) > Date.now();

  useEffect(() => {
    if (isReady && !user) {
      const returnTo = `${location.pathname}${location.search}${location.hash}`;
      const redirectParam = encodeURIComponent(returnTo);
      navigate(`/login?redirect=${redirectParam}`, { replace: true });
    }
  }, [isReady, navigate, user, location]);

  if (!isReady && !bypassActive) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="font-mono text-sm text-secondary-text">Loading...</div>
      </div>
    );
  }

  if (bypassActive && !user) {
    return <>{children}</>;
  }

  return user ? <>{children}</> : null;
};

export default ProtectedRoute;
