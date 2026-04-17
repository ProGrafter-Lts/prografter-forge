import { useState } from "react";
import TradeSidebar from "@/components/trade/TradeSidebar";
import CalendarConnect from "@/components/trade/CalendarConnect";
import { Settings as SettingsIcon } from "lucide-react";

const TradeSettings = () => {
  const [activeNav, setActiveNav] = useState("settings");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      <TradeSidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-3 pt-10 md:pt-0">
            <div className="bg-primary text-primary-foreground border-2 border-foreground rounded p-3 shadow-[3px_3px_0_0_hsl(var(--foreground))]">
              <SettingsIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-heading text-primary text-3xl md:text-4xl tracking-wide">
                Settings
              </h1>
              <p className="font-mono text-sm text-muted-foreground mt-1">
                Manage your account, integrations and preferences.
              </p>
            </div>
          </div>

          <CalendarConnect variant="full" />
        </div>
      </main>
    </div>
  );
};

export default TradeSettings;
