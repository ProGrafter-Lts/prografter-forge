import { Link, useLocation } from "react-router-dom";
import Logo from "@/components/Logo";

const LINKS: { to: string; label: string }[] = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/waitlist", label: "Waitlist" },
  { to: "/admin/applications", label: "Applications" },
  { to: "/admin/verifications", label: "Verifications" },
  { to: "/admin/job-briefs", label: "Job briefs" },
  { to: "/admin/disputes", label: "Disputes" },
  { to: "/admin/suppliers", label: "Suppliers" },
  { to: "/admin/testimonials", label: "Testimonials" },
  { to: "/admin/planning-pipeline", label: "Planning" },
  { to: "/admin/trade-scraper", label: "Scraper" },
  { to: "/admin/email-status", label: "Email" },
  { to: "/admin/analytics", label: "Analytics" },
];

const AdminNav = () => {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-deep border-b border-cream/10">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex items-center gap-4 h-14">
        <Link to="/" className="shrink-0" aria-label="Back to ProGrafter homepage">
          <Logo variant="light" className="h-8 w-auto" />
        </Link>

        <span className="font-mono text-[11px] uppercase tracking-wide text-teal/90 border border-teal/30 rounded px-2 py-0.5 shrink-0">
          Admin
        </span>

        <nav className="flex-1 overflow-x-auto">
          <ul className="flex items-center gap-1">
            {LINKS.map((l) => {
              const active =
                l.to === "/admin" ? pathname === "/admin" : pathname.startsWith(l.to);
              return (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className={`block whitespace-nowrap font-mono text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                      active
                        ? "bg-teal text-cream"
                        : "text-cream/70 hover:text-cream hover:bg-cream/10"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link
          to="/"
          className="shrink-0 font-mono text-xs text-cream/70 hover:text-teal transition-colors"
        >
          ← View site
        </Link>
      </div>
    </header>
  );
};

export default AdminNav;
