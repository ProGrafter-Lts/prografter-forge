import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check user type and redirect
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("user_id", data.user.id)
      .single();

    if (profile?.user_type === "trade") {
      navigate("/dashboard/trade");
    } else {
      navigate("/dashboard/homeowner");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <SEO
        title="Sign In — ProGrafter"
        description="Sign in to your ProGrafter account to manage your projects, quotes, and messages."
        path="/login"
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="font-heading text-[32px] leading-none tracking-wide">
            <span className="text-navy">Pro</span>
            <span className="text-teal">grafter</span>
          </a>
          <p className="font-mono text-sm text-secondary-text mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-navy/10">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-mono">
                {error}
              </div>
            )}

            <div>
              <label className="block font-mono text-sm text-navy mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-navy/20 bg-cream/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block font-mono text-sm text-navy mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-navy/20 bg-cream/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal text-cream font-mono text-sm rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50 shadow-lg shadow-teal/20"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="font-mono text-xs text-secondary-text">
              Don't have an account?{" "}
              <a href="/register/trade" className="text-teal hover:underline">Register as a Trade</a>
            </p>
            <p className="font-mono text-xs text-secondary-text">
              Need work done?{" "}
              <a href="/post-a-job" className="text-teal hover:underline">Post a Job</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
