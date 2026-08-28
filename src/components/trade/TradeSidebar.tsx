import { useLocation, useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import { useNewJobMatchCount } from "@/hooks/useNewJobMatches";
import { useSiteScoutAccess } from "@/lib/siteScoutAccess";
import {
  LayoutDashboard,
  Search,
  FolderKanban,
  FileText,
  CalendarDays,
  MessageSquare,
  UserCircle,
  Settings,
  LogOut,
  ShieldCheck,
  Map,
  FlaskConical,

} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { label: "Find Work", icon: Search, id: "find-work" },
  { label: "Pipeline", icon: FolderKanban, id: "pipeline" },
  { label: "Quotes", icon: FileText, id: "quotes" },
  { label: "Calendar", icon: CalendarDays, id: "calendar" },
  { label: "Messages", icon: MessageSquare, id: "messages" },
  { label: "TradeVault", icon: ShieldCheck, id: "tradevault" },
  { label: "Profile", icon: UserCircle, id: "profile" },
];

interface TradeSidebarProps {
  activeNav: string;
  setActiveNav: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const TradeSidebar = ({ activeNav, setActiveNav, sidebarOpen, setSidebarOpen }: TradeSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const verification = useVerificationStatus();
  const newMatchCount = useNewJobMatchCount();
  const siteScout = useSiteScoutAccess();


  const currentView = new URLSearchParams(location.search).get("view");
  const routeActiveNav = location.pathname.startsWith("/sitescout-sandbox")
    ? "sitescout-sandbox"
    : location.pathname.startsWith("/dashboard/trade/settings")
      ? "settings"
      : location.pathname.startsWith("/atlas")
        ? "atlas"
        : location.pathname.startsWith("/planning-alerts")
          ? "find-work"
          : currentView || activeNav;


  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleNavClick = (id: string) => {
    setActiveNav(id);

    if (id === "find-work") {
      navigate("/planning-alerts");
    } else if (id === "settings") {
      navigate("/dashboard/trade/settings");
    } else if (id === "atlas") {
      navigate("/atlas");
    } else if (id === "dashboard") {
      navigate("/dashboard/trade");
    } else {
      navigate(`/dashboard/trade?view=${id}`);
    }

    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile toggle - hidden when sidebar is open to avoid overlapping logo */}
      {!sidebarOpen && (
        <button
          className="md:hidden fixed top-14 left-4 z-50 bg-primary text-primary-foreground p-2 rounded-xl shadow-lg"
          onClick={() => setSidebarOpen(true)}
        >
          <LayoutDashboard className="w-5 h-5" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`dashboard-sidebar fixed md:sticky md:top-12 inset-y-0 left-0 z-40 w-64 h-screen md:h-[calc(100vh-3rem)] flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <Logo variant="light" className="h-10 w-auto" />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = routeActiveNav === item.id;
            const showBadge = item.id === "find-work" && newMatchCount > 0;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm transition-colors whitespace-nowrap"
                style={{
                  backgroundColor: isActive ? "rgba(13,148,136,0.18)" : "transparent",
                  color: isActive ? "#1AC2BA" : "rgba(255,255,255,0.75)",
                }}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {showBadge && (
                  <span
                    className="ml-auto min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full font-mono text-[11px] font-semibold"
                    style={{ backgroundColor: "#DC2626", color: "#FFFFFF" }}
                    aria-label={`${newMatchCount} new job matches`}
                  >
                    {newMatchCount > 99 ? "99+" : newMatchCount}
                  </span>
                )}
              </button>
            );
          })}


          {/* SiteScout — live for the closed-testing account only, otherwise "Soon" */}
          {siteScout.allowed ? (
            <button
              onClick={() => handleNavClick("atlas")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm transition-colors whitespace-nowrap"
              style={{
                backgroundColor: routeActiveNav === "atlas" ? "rgba(13,148,136,0.18)" : "transparent",
                color: routeActiveNav === "atlas" ? "#1AC2BA" : "rgba(255,255,255,0.75)",
              }}
            >
              <Map className="w-4 h-4 flex-shrink-0" />
              SiteScout
            </button>
          ) : (
            <div
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm whitespace-nowrap cursor-not-allowed"
              style={{ color: "rgba(255,255,255,0.35)" }}
              aria-disabled="true"
            >
              <Map className="w-4 h-4 flex-shrink-0" />
              SiteScout
              <span
                className="ml-auto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
              >
                Soon
              </span>
            </div>
          )}

          {/* Settings */}
          <button
            onClick={() => handleNavClick("settings")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm transition-colors whitespace-nowrap"
            style={{
              backgroundColor: routeActiveNav === "settings" ? "rgba(13,148,136,0.18)" : "transparent",
              color: routeActiveNav === "settings" ? "#1AC2BA" : "rgba(255,255,255,0.75)",
            }}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            Settings
          </button>

          {/* Internal Beta / Admin — temporary */}
          <div
            className="px-4 pt-5 pb-1 font-mono text-[10px] uppercase tracking-[0.15em]"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Internal Beta / Admin
          </div>
          <button
            onClick={() => {
              setActiveNav("sitescout-sandbox");
              navigate("/sitescout-sandbox");
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm transition-colors whitespace-nowrap"
            style={{
              backgroundColor:
                routeActiveNav === "sitescout-sandbox" ? "rgba(13,148,136,0.18)" : "transparent",
              color: routeActiveNav === "sitescout-sandbox" ? "#1AC2BA" : "rgba(255,255,255,0.75)",
            }}
          >
            <FlaskConical className="w-4 h-4 flex-shrink-0" />
            Agent Sandbox
          </button>

        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm text-primary-foreground/40 hover:text-destructive hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default TradeSidebar;
