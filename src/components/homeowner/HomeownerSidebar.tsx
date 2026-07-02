import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  FolderKanban,
  SearchCheck,
  Leaf,
  BookOpen,
  UserCircle,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, id: "overview" },
  { label: "My Projects", icon: FolderKanban, id: "projects" },
  { label: "Quotes & Checks", icon: SearchCheck, id: "quotes" },
  { label: "Green Grants", icon: Leaf, id: "grants" },
  { label: "Homeowner Manual", icon: BookOpen, id: "manual" },
  { label: "My Profile", icon: UserCircle, id: "profile" },
];

interface HomeownerSidebarProps {
  activeNav: string;
  setActiveNav: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const HomeownerSidebar = ({ activeNav, setActiveNav, sidebarOpen, setSidebarOpen }: HomeownerSidebarProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <>
      {!sidebarOpen && (
        <button
          className="md:hidden fixed top-4 left-4 z-50 bg-primary text-primary-foreground p-2 rounded-xl shadow-lg"
          onClick={() => setSidebarOpen(true)}
        >
          <LayoutDashboard className="w-5 h-5" />
        </button>
      )}

     <aside
       className={`dashboard-sidebar fixed md:sticky md:top-0 inset-y-0 left-0 z-40 w-64 h-screen md:h-screen flex flex-col transition-transform duration-300 ${
         sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
       }`}
      >
        <div className="p-6 border-b border-white/10">
          <Logo variant="light" className="h-10 w-auto" />
          <p className="font-mono text-[10px] mt-1 tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.65)" }}>
            Homeowner
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            const isGreen = item.id === "grants";
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm transition-colors"
                style={{
                  backgroundColor: isActive ? (isGreen ? "rgba(34,197,94,0.18)" : "rgba(13,148,136,0.18)") : "transparent",
                  color: isActive ? (isGreen ? "#4ADE80" : "#1AC2BA") : (isGreen ? "#4ADE80" : "rgba(255,255,255,0.75)"),
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm text-primary/40 hover:text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </>
  );
};

export default HomeownerSidebar;
