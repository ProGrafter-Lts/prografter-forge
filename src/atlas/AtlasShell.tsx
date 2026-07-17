import { ReactNode, useState } from "react";
import TradeSidebar from "@/components/trade/TradeSidebar";

/**
 * Atlas chrome — dashboard-dark base with a subtle warm gradient wash so the
 * surveying tool feels calm and premium rather than admin-utility.
 */
export default function AtlasShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen dashboard-dark flex">
      <TradeSidebar
        activeNav="atlas"
        setActiveNav={() => {}}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <main
        className="flex-1 overflow-auto relative"
        style={{
          background:
            "radial-gradient(1200px 600px at 15% -10%, rgba(20,168,161,0.10), transparent 60%), radial-gradient(900px 500px at 100% 0%, rgba(27,58,92,0.35), transparent 55%), #0B1B30",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 md:px-10 pt-12 md:pt-10 pb-32 md:pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}
