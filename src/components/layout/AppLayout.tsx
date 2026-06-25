import { Outlet, useLocation, useNavigate, Link, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";

/**
 * Single shared shell for every authenticated (non-admin) route.
 *
 * Provides a persistent top bar with a Back control and a breadcrumb trail,
 * then renders the matched page through <Outlet/>. No authenticated page should
 * render its own top-level chrome outside this shell.
 *
 * Pages keep their own in-page navigation (e.g. dashboard sidebars act as tab
 * switchers); this layout supplies the consistent global frame around them.
 */

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  trade: "Trade",
  homeowner: "Homeowner",
  settings: "Settings",
  "quote-checks": "Quote Checks",
  project: "Project",
  compare: "Compare Quotes",
  contract: "Contract",
  manual: "Homeowner Manual",
  "quote-builder": "Quote Builder",
  quickbuild: "Quick Build",
  jobs: "Job",
  reviews: "Leave a Review",
  disputes: "Disputes",
  new: "New",
  signup: "Sign Up",
  "under-review": "Under Review",
  "assessment-pending": "Assessment Pending",
};

interface Crumb {
  label: string;
  to: string;
}

const HOME_BY_PREFIX: { prefix: string; to: string }[] = [
  { prefix: "/dashboard/trade", to: "/dashboard/trade" },
  { prefix: "/dashboard/homeowner", to: "/dashboard/homeowner" },
  { prefix: "/dashboard/quote-checks", to: "/dashboard/homeowner" },
  { prefix: "/project", to: "/dashboard/homeowner" },
  { prefix: "/manual", to: "/dashboard/homeowner" },
];

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const segments = location.pathname.split("/").filter(Boolean);

  // Build breadcrumb trail, skipping opaque id/ref params.
  const idValues = new Set(Object.values(params).filter(Boolean) as string[]);
  const crumbs: Crumb[] = [];
  let acc = "";
  segments.forEach((seg) => {
    acc += `/${seg}`;
    if (idValues.has(seg)) return; // hide raw ids from the trail
    crumbs.push({ label: SEGMENT_LABELS[seg] ?? seg, to: acc });
  });

  const homeTarget =
    HOME_BY_PREFIX.find(({ prefix }) => location.pathname.startsWith(prefix))?.to ??
    "/dashboard/homeowner";

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(homeTarget);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-3 px-4 md:px-6 h-12">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <span className="text-border">|</span>

          <Link
            to={homeTarget}
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dashboard home"
          >
            <Home className="w-3.5 h-3.5" />
          </Link>

          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 overflow-x-auto">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <span key={crumb.to} className="flex items-center gap-1.5 shrink-0">
                  <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                  {isLast ? (
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      to={crumb.to}
                      className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
