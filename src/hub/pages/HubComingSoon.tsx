import { Map, FileCheck2, Store } from "lucide-react";
import HubPlaceholder from "@/hub/pages/HubPlaceholder";

export const HubAtlas = () => (
  <HubPlaceholder
    soon
    title="SiteScout"
    subtitle="Deep property & location intelligence."
    icon={<Map size={22} />}
    emptyTitle="SiteScout is coming soon"
    emptyDescription="A powerful map-based view of properties, planning history and local demand."
  />
);

export const HubQuoteChecker = () => (
  <HubPlaceholder
    soon
    title="Quote Checker"
    subtitle="Check quotes for clarity, completeness and fair pricing."
    icon={<FileCheck2 size={22} />}
    emptyTitle="Quote Checker is coming soon"
    emptyDescription="Upload a quote and get an instant, structured breakdown for your customers."
  />
);

export const HubMarketplace = () => (
  <HubPlaceholder
    soon
    title="Marketplace"
    subtitle="Materials, suppliers and trade services in one place."
    icon={<Store size={22} />}
    emptyTitle="Marketplace is coming soon"
    emptyDescription="Source materials and connect with trusted suppliers directly from the hub."
  />
);
