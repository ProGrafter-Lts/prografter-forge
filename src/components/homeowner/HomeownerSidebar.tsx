import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessages";
import {
  LayoutDashboard,
  FolderKanban,
  SearchCheck,
  MessageSquare,
  Camera,
  Leaf,
  BookOpen,
  UserCircle,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, id: "overview" },
  { label: "My Projects", icon: FolderKanban, id: "projects" },
  { label: "Messages", icon: MessageSquare, id: "messages" },
  { label: "Site Diary", icon: Camera, id: "diary" },
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
  const unreadMessages = useUnreadMessageCount();

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
       className={`dashboard-sidebar ho-blueprint fixed md:sticky md:top-0 inset-y-0 left-0 z-40 w-64 h-screen md:h-screen flex flex-col transition-transform duration-300 ${
         sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
       }`}
      >
        <div className="relative z-10 p-6 border-b border-white/10">
          <Logo variant="light" className="h-12 w-auto" />
          <p className="font-mono text-[10px] mt-1 tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.65)" }}>
            Homeowner
          </p>
        </div>

        <nav className="relative z-10 flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            const isGreen = item.id === "grants";
            const showBadge = item.id === "messages" && unreadMessages > 0;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  setSidebarOpen(false);
                }}
                className={`td-nav w-full flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm ${isActive ? "is-active" : ""}`}
                style={
                  isGreen
                    ? {
                        color: isActive ? "#4ADE80" : "#22C55E",
                        backgroundColor: isActive ? "rgba(34,197,94,0.22)" : "rgba(34,197,94,0.10)",
                        fontWeight: 600,
                      }
                    : undefined
                }
              >
                <item.icon className="w-4 h-4" strokeWidth={1.6} />
                {item.label}
                {showBadge && (
                  <span
                    className="ml-auto min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full font-mono text-[11px] font-semibold"
                    style={{ backgroundColor: "#DC2626", color: "#FFFFFF" }}
                    aria-label={`${unreadMessages} unread messages`}
                  >
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="relative z-10 p-4 border-t border-primary/10">
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
