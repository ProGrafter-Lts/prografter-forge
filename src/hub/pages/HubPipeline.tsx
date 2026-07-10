import { Plus } from "lucide-react";
import { HubButton, HubBadge, HubTag, HubKanbanCard } from "@/hub/components/ui";

const COLUMNS = [
  { name: "New", tone: "info" as const },
  { name: "Contacted", tone: "navy" as const },
  { name: "Quoted", tone: "warning" as const },
  { name: "Won", tone: "success" as const },
];

const HubPipeline = () => (
  <>
    <div className="flex items-end justify-between flex-wrap gap-4">
      <div>
        <h1 className="hub-page-title">Pipeline</h1>
        <p className="hub-page-sub">Track every opportunity from lead to won.</p>
      </div>
      <HubButton variant="accent" size="sm" icon={<Plus size={15} />}>
        Add card
      </HubButton>
    </div>

    <div className="hub-kanban" style={{ marginTop: 24 }}>
      {COLUMNS.map((col) => (
        <div key={col.name} className="hub-kanban-col">
          <div className="hub-kanban-col-head">
            <span className="flex items-center gap-2">
              <HubBadge tone={col.tone} dot>
                {col.name}
              </HubBadge>
            </span>
            <span className="hub-kanban-count">0</span>
          </div>

          {col.name === "New" && (
            <HubKanbanCard>
              <HubTag>Example</HubTag>
              <div style={{ fontWeight: 700, marginTop: 10 }}>Side extension</div>
              <div style={{ fontSize: 13, color: "#8a97a8", marginTop: 4 }}>Guildford, GU1</div>
            </HubKanbanCard>
          )}
        </div>
      ))}
    </div>
  </>
);

export default HubPipeline;
