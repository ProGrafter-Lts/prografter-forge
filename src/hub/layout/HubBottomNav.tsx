import { NavLink } from "react-router-dom";
import { HUB_BOTTOM_NAV } from "@/hub/nav";

const HubBottomNav = () => (
  <nav className="hub-bottomnav">
    {HUB_BOTTOM_NAV.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === "/hub"}
        className={({ isActive }) => `hub-bottomnav-item${isActive ? " is-active" : ""}`}
      >
        <item.icon size={20} />
        {item.label}
      </NavLink>
    ))}
  </nav>
);

export default HubBottomNav;
