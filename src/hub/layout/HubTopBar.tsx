import { Bell, HelpCircle } from "lucide-react";
import { HubSearch } from "@/hub/components/ui";

const HubTopBar = () => {
  return (
    <header className="hub-topbar">
      <div className="hub-topbar-search">
        <HubSearch placeholder="Search opportunities, jobs, contacts…" />
      </div>

      <div className="hub-topbar-actions">
        <button className="hub-icon-btn" aria-label="Help">
          <HelpCircle size={20} />
        </button>
        <button className="hub-icon-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="hub-dot" />
        </button>

        <div className="hub-profile">
          <span className="hub-avatar">LB</span>
          <span>
            <span className="hub-profile-name" style={{ display: "block" }}>
              Lee Bennett
            </span>
            <span className="hub-profile-company">Bennett Building Ltd</span>
          </span>
        </div>
      </div>
    </header>
  );
};

export default HubTopBar;
