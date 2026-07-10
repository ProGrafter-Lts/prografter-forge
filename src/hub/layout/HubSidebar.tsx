import { NavLink } from "react-router-dom";
import { HUB_NAV, HUB_NAV_SOON } from "@/hub/nav";

const HubSidebar = () => {
  return (
    <aside className="hub-sidebar">
      <div className="hub-brand">
        <span className="hub-brand-mark">PG</span>
        <span>
          <span className="hub-brand-name" style={{ display: "block" }}>
            ProGrafter
          </span>
          <span className="hub-brand-sub">Planning Hub</span>
        </span>
      </div>

      <nav className="hub-nav">
        {HUB_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/hub"}
            className={({ isActive }) => `hub-nav-item${isActive ? " is-active" : ""}`}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}

        <div className="hub-nav-label">Coming Soon</div>
        {HUB_NAV_SOON.map((item) => (
          <div key={item.to} className="hub-nav-item is-soon" aria-disabled="true">
            <item.icon size={18} />
            {item.label}
            <span className="hub-soon-badge">Soon</span>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default HubSidebar;
