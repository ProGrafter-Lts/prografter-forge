import { Link, useLocation } from "react-router-dom";
import Logo from "@/components/Logo";

const AdminNav = () => {
  const { pathname } = useLocation();
  const isHome = pathname === "/admin";

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

        {!isHome && (
          <Link
            to="/admin"
            className="shrink-0 font-mono text-xs text-cream/80 hover:text-teal transition-colors"
          >
            ← Dashboard
          </Link>
        )}

        <Link
          to="/"
          className="shrink-0 font-mono text-xs text-cream/70 hover:text-teal transition-colors"
        >
          View site →
        </Link>
      </div>
    </header>
  );
};

export default AdminNav;
