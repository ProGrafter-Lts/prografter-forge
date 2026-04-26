import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Temporary: /signup/trade redirects to the existing trade registration flow.
// Will be replaced with a proper 4-step signup in the next iteration.
const SignupTradeRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/register/trade", { replace: true });
  }, [navigate]);
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center font-mono text-sm text-secondary-text">
      Redirecting…
    </div>
  );
};

export default SignupTradeRedirect;
