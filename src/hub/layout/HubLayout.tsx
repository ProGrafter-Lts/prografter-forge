import { Outlet } from "react-router-dom";
import "@/hub/hub.css";
import HubSidebar from "@/hub/layout/HubSidebar";
import HubTopBar from "@/hub/layout/HubTopBar";
import HubBottomNav from "@/hub/layout/HubBottomNav";

/**
 * ProGrafter Planning Hub — application shell.
 * Permanent left sidebar + sticky top bar on desktop/tablet,
 * bottom navigation on mobile. All routes render through <Outlet/>.
 */
const HubLayout = () => (
  <div className="hub-shell">
    <div className="hub-layout">
      <HubSidebar />
      <div className="hub-main">
        <HubTopBar />
        <div className="hub-content">
          <Outlet />
        </div>
      </div>
      <HubBottomNav />
    </div>
  </div>
);

export default HubLayout;
