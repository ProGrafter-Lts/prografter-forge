import {
  LayoutDashboard,
  Radar,
  KanbanSquare,
  Calendar,
  MessageSquare,
  User,
  Settings,
  Map,
  FileCheck2,
  Store,
  type LucideIcon,
} from "lucide-react";

export interface HubNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  soon?: boolean;
}

/** Primary navigation — live modules. */
export const HUB_NAV: HubNavItem[] = [
  { label: "Dashboard", to: "/hub", icon: LayoutDashboard },
  { label: "Planning Hub", to: "/hub/planning", icon: Radar },
  { label: "Pipeline", to: "/hub/pipeline", icon: KanbanSquare },
  { label: "Calendar", to: "/hub/calendar", icon: Calendar },
  { label: "Messages", to: "/hub/messages", icon: MessageSquare },
  { label: "Profile", to: "/hub/profile", icon: User },
  { label: "Settings", to: "/hub/settings", icon: Settings },
];

/** Modules not yet available — shown greyed but visible. */
export const HUB_NAV_SOON: HubNavItem[] = [
  { label: "SiteScout", to: "/hub/atlas", icon: Map, soon: true },
  { label: "Quote Checker", to: "/hub/quote-checker", icon: FileCheck2, soon: true },
  { label: "Marketplace", to: "/hub/marketplace", icon: Store, soon: true },
];

/** Condensed set for the mobile bottom bar. */
export const HUB_BOTTOM_NAV: HubNavItem[] = [
  { label: "Home", to: "/hub", icon: LayoutDashboard },
  { label: "Planning", to: "/hub/planning", icon: Radar },
  { label: "Pipeline", to: "/hub/pipeline", icon: KanbanSquare },
  { label: "Messages", to: "/hub/messages", icon: MessageSquare },
  { label: "Profile", to: "/hub/profile", icon: User },
];
