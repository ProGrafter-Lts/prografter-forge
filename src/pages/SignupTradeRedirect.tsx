import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// /signup/trade → canonical /register/trade.
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
