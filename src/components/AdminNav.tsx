import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAttention } from "@/hooks/useAttention";

const AdminNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === "/admin";
  const [hasTrade, setHasTrade] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { total, counts } = useAttention();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("trades")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (mounted) setHasTrade(!!data);
    })();
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 bg-deep border-b border-cream/10">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex items-center gap-3 h-14">
        <Link to="/admin" className="shrink-0" aria-label="ProGrafter admin dashboard">
          <Logo variant="light" className="h-8 w-auto" />
        </Link>

        <span className="font-mono text-[11px] uppercase tracking-wide text-teal/90 border border-teal/30 rounded px-2 py-0.5 shrink-0">
          Admin
        </span>

        <div className="flex-1" />

        <Link
          to="/admin/attention"
          className="shrink-0 inline-flex items-center gap-1.5 font-mono text-xs text-cream/90 hover:text-teal transition-colors border border-cream/20 rounded px-2.5 py-1"
          aria-label={`Attention — ${total} items need action`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="hidden sm:inline uppercase tracking-wide">Attention</span>
          {total > 0 && (
            <span
              className={`min-w-[18px] text-center rounded-full px-1.5 py-[1px] text-[10px] ${
                counts.urgent > 0 ? "bg-red-600 text-white" : "bg-teal text-cream"
              }`}
            >
              {total}
            </span>
          )}
        </Link>

        {!isHome && (
          <Link
            to="/admin"
            className="shrink-0 font-mono text-xs text-cream/80 hover:text-teal transition-colors"
          >
            ← Dashboard
          </Link>
        )}

        {hasTrade && (
          <Link
            to="/dashboard/trade"
            className="shrink-0 font-mono text-xs text-cream/80 hover:text-teal transition-colors"
          >
            Trade dashboard →
          </Link>
        )}

        <Link
          to="/dashboard/homeowner"
          className="shrink-0 font-mono text-xs text-cream/80 hover:text-teal transition-colors"
        >
          Homeowner dashboard →
        </Link>


        <Link
          to="/"
          className="shrink-0 font-mono text-xs text-cream/70 hover:text-teal transition-colors"
        >
          View site →
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          className="shrink-0 font-mono text-xs text-cream/80 hover:text-teal transition-colors border border-cream/20 rounded px-2.5 py-1 disabled:opacity-50"
        >
          {signingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </header>
  );
};

export default AdminNav;
