import { Radar, SlidersHorizontal, MapPin } from "lucide-react";
import { HubButton, HubSearch, HubDropdown, HubMap, HubBadge } from "@/hub/components/ui";

const HubPlanning = () => (
  <>
    <div className="flex items-end justify-between flex-wrap gap-4">
      <div>
        <h1 className="hub-page-title">Planning Hub</h1>
        <p className="hub-page-sub">Discover planning opportunities near you.</p>
      </div>
      <div className="flex items-center gap-2">
        <HubDropdown label="Radius: 15 mi" />
        <HubButton variant="secondary" size="sm" icon={<SlidersHorizontal size={15} />}>
          Filters
        </HubButton>
      </div>
    </div>

    <div style={{ marginTop: 24, maxWidth: 440 }}>
      <HubSearch placeholder="Search by postcode or area…" />
    </div>

    <div style={{ marginTop: 20 }}>
      <HubMap
        height={420}
        label={
          <div className="flex flex-col items-center gap-3">
            <span className="hub-empty-icon">
              <MapPin size={22} />
            </span>
            <div style={{ fontWeight: 700, color: "#17233a" }}>Map view coming soon</div>
            <HubBadge tone="navy" dot>
              Planning data connecting
            </HubBadge>
          </div>
        }
      />
    </div>
  </>
);

export default HubPlanning;
