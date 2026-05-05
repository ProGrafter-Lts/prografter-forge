import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TradeSidebar from "@/components/trade/TradeSidebar";
import HomeownerSidebar from "@/components/homeowner/HomeownerSidebar";

type Role = "trade" | "homeowner" | null;

interface AppShellProps {
  /** Page content. Rendered as-is inside whichever layout matches the session. */
  children: ReactNode;
  /** Optional: render different content (or hide CTAs) when authenticated. */
  authenticatedContent?: ReactNode;
}

/**
 * Renders `children` inside the public marketing chrome (Navbar + Footer)
 * for anonymous visitors, or inside the authenticated dashboard chrome
 * (role-aware sidebar + dark shell) for signed-in users.
 *
 * Use on informational / "coming soon" pages so logged-in users keep their
 * app context instead of being dumped into the marketing layout.
 */
const AppShell = ({ children, authenticatedContent }: AppShellProps) => {
  const { isReady, user } = useAuthReady();
  const [role, setRole] = useState<Role>(null);
  const [roleResolved, setRoleResolved] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");

  useEffect(() => {
    let cancelled = false;
    if (!isReady) return;
    if (!user) {
      setRole(null);
      setRoleResolved(true);
      return;
    }
    setRoleResolved(false);
    (async () => {
      const [{ data: trade }, { data: homeowner }] = await Promise.all([
        supabase.from("trades").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("homeowners").select("id").eq("user_id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      setRole(trade ? "trade" : homeowner ? "homeowner" : null);
      setRoleResolved(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isReady, user]);

  // Anonymous: public marketing layout
  if (isReady && !user) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        {children}
        <Footer />
      </div>
    );
  }

  // Resolving session/role — minimal chrome to avoid flash
  if (!isReady || !roleResolved) {
    return <div className="min-h-screen bg-deep" />;
  }

  // Signed in but no role record — fall back to public layout
  if (!role) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        {children}
        <Footer />
      </div>
    );
  }

  // Authenticated app layout
  const Sidebar =
    role === "trade" ? (
      <TradeSidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
    ) : (
      <HomeownerSidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
    );

  return (
    <div className="min-h-screen dashboard-dark flex">
      {Sidebar}
      <main className="flex-1 overflow-auto">
        <div className="pt-10 md:pt-0">{authenticatedContent ?? children}</div>
      </main>
    </div>
  );
};

export default AppShell;
