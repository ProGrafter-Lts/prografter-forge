import { Settings } from "lucide-react";
import HubPlaceholder from "@/hub/pages/HubPlaceholder";

const HubSettings = () => (
  <HubPlaceholder
    title="Settings"
    subtitle="Manage your account, notifications and preferences."
    icon={<Settings size={22} />}
    emptyTitle="Settings coming together"
    emptyDescription="Account, billing and notification controls will live here."
  />
);

export default HubSettings;
