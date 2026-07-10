import type { ReactNode } from "react";
import { HubEmpty, HubButton } from "@/hub/components/ui";

/** Generic premium placeholder page for modules not yet built. */
const HubPlaceholder = ({
  title,
  subtitle,
  icon,
  emptyTitle,
  emptyDescription,
  soon,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  soon?: boolean;
}) => (
  <>
    <div>
      <h1 className="hub-page-title">{title}</h1>
      <p className="hub-page-sub">{subtitle}</p>
    </div>
    <div className="hub-card hub-card-pad" style={{ marginTop: 28 }}>
      <HubEmpty
        icon={icon}
        title={emptyTitle}
        description={emptyDescription}
        action={soon ? undefined : <HubButton variant="secondary" size="sm">Get started</HubButton>}
      />
    </div>
  </>
);

export default HubPlaceholder;
