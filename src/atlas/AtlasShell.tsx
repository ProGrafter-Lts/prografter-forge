import { ReactNode, useState } from "react";
import TradeSidebar from "@/components/trade/TradeSidebar";

/**
 * Wraps Atlas pages in the trade dashboard chrome so navigation feels native.
 * Atlas has its own sub-navigation inside the main content area.
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
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto pt-10 md:pt-0">{children}</div>
      </main>
    </div>
  );
}
