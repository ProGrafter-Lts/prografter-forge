import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import {
  LayoutDashboard,
  Briefcase,
  FolderKanban,
  Bell,
  PoundSterling,
  UserCircle,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { label: "Available Jobs", icon: Briefcase, id: "jobs" },
  { label: "Active Projects", icon: FolderKanban, id: "projects" },
  { label: "Planning Alerts", icon: Bell, id: "alerts" },
  { label: "Earnings", icon: PoundSterling, id: "earnings" },
  { label: "My Profile", icon: UserCircle, id: "profile" },
  { label: "Settings", icon: Settings, id: "settings" },
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

  const currentView = new URLSearchParams(location.search).get("view");
  const routeActiveNav = location.pathname.startsWith("/dashboard/trade/settings")
    ? "settings"
    : location.pathname.startsWith("/planning-alerts")
      ? "alerts"
      : currentView || activeNav;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleNavClick = (id: string) => {
    setActiveNav(id);

    if (id === "alerts") {
      navigate("/planning-alerts");
    } else if (id === "settings") {
      navigate("/dashboard/trade/settings");
    } else if (id === "dashboard") {
      navigate("/dashboard/trade");
    } else {
      navigate(`/dashboard/trade?view=${id}`);
    }

    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-primary text-primary-foreground p-2 rounded-xl shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <LayoutDashboard className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside
        className={`dashboard-sidebar fixed md:sticky md:top-0 inset-y-0 left-0 z-40 w-64 h-screen md:h-screen flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <a href="/" className="font-heading text-[24px] leading-none tracking-wide">
            <span className="text-white">Pro</span>
            <span style={{ color: "#14B8A6" }}>grafter</span>
          </a>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = routeActiveNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm transition-colors"
                style={{
                  backgroundColor: isActive ? "rgba(13,148,136,0.18)" : "transparent",
                  color: isActive ? "#14B8A6" : "rgba(255,255,255,0.75)",
                }}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
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
