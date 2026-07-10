import {
  Users,
  FileText,
  Radar,
  CalendarClock,
  MapPin,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  HubStatCard,
  HubCard,
  HubButton,
  HubBadge,
  HubTag,
  HubSection,
  HubEmpty,
} from "@/hub/components/ui";

const PLACEHOLDER_OPPS = [
  { title: "Two-storey side extension", area: "Guildford, GU1", tag: "Extension", when: "Awaiting details" },
  { title: "Loft conversion & dormer", area: "Woking, GU22", tag: "Loft", when: "Awaiting details" },
  { title: "Full rear renovation", area: "Farnham, GU9", tag: "Renovation", when: "Awaiting details" },
];

const PIPELINE_STAGES = [
  { name: "New", count: "—" },
  { name: "Contacted", count: "—" },
  { name: "Quoted", count: "—" },
  { name: "Won", count: "—" },
];

const HubDashboard = () => {
  return (
    <>
      {/* Page header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="hub-page-title">Good morning, Lee</h1>
          <p className="hub-page-sub">Here's your workspace at a glance.</p>
        </div>
        <HubButton variant="accent" icon={<Plus size={17} />}>
          New opportunity
        </HubButton>
      </div>

      {/* Stat cards */}
      <div className="hub-grid-4" style={{ marginTop: 28 }}>
        <HubStatCard label="Customers Waiting" value="0" icon={<Users size={20} />} accent="navy" hint="No customers waiting yet" />
        <HubStatCard label="Outstanding Quotes" value="0" icon={<FileText size={20} />} accent="teal" hint="Nothing outstanding" />
        <HubStatCard label="Planning Opportunities" value="0" icon={<Radar size={20} />} accent="amber" hint="We'll surface nearby leads here" />
        <HubStatCard label="Today's Follow Ups" value="0" icon={<CalendarClock size={20} />} accent="rose" hint="You're all caught up" />
      </div>

      {/* Latest Opportunities */}
      <HubSection
        title="Latest Opportunities"
        action={<HubButton variant="ghost" size="sm" icon={<ArrowRight size={15} />}>View all</HubButton>}
      >
        <div className="hub-grid-3">
          {PLACEHOLDER_OPPS.map((o) => (
            <HubCard key={o.title} interactive>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <HubTag>{o.tag}</HubTag>
                <HubBadge tone="info" dot>
                  {o.when}
                </HubBadge>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{o.title}</div>
              <div className="flex items-center gap-1" style={{ color: "#8a97a8", fontSize: 13, marginTop: 8 }}>
                <MapPin size={14} />
                {o.area}
              </div>
              <HubButton variant="secondary" size="sm" className="w-full" style={{ marginTop: 16 }}>
                View details
              </HubButton>
            </HubCard>
          ))}
        </div>
      </HubSection>

      {/* Pipeline Summary */}
      <HubSection
        title="Pipeline Summary"
        action={<HubButton variant="ghost" size="sm" icon={<ArrowRight size={15} />}>Open pipeline</HubButton>}
      >
        <HubCard>
          <div className="hub-grid-4">
            {PIPELINE_STAGES.map((s) => (
              <div key={s.name} style={{ textAlign: "center", padding: "8px 0" }}>
                <div className="hub-stat-value" style={{ fontSize: 28 }}>{s.count}</div>
                <div className="hub-stat-label" style={{ marginTop: 6 }}>{s.name}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <HubEmpty
              icon={<Radar size={22} />}
              title="Your pipeline is empty"
              description="As opportunities come in they'll flow through your pipeline stages here."
            />
          </div>
        </HubCard>
      </HubSection>
    </>
  );
};

export default HubDashboard;
