import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { HubBadge, HubTag } from "@/hub/components/ui";
import { OpportunityScore } from "@/hub/components/OpportunityScore";
import {
  OPPORTUNITIES,
  STAGE_LABELS,
  STAGE_ORDER,
  type Opportunity,
  type PipelineStage,
} from "@/hub/data/opportunities";

const STAGE_TONE: Record<PipelineStage, "info" | "navy" | "warning" | "success" | "danger" | "neutral"> = {
  new: "info",
  letter_sent: "navy",
  contacted: "navy",
  appointment: "warning",
  atlas: "info",
  quoted: "warning",
  won: "success",
  lost: "danger",
};

const HubPipeline = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Opportunity[]>(OPPORTUNITIES);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<PipelineStage | null>(null);

  const byStage = useMemo(() => {
    const map = {} as Record<PipelineStage, Opportunity[]>;
    STAGE_ORDER.forEach((s) => (map[s] = []));
    items.forEach((o) => map[o.stage].push(o));
    return map;
  }, [items]);

  const drop = (stage: PipelineStage) => {
    if (!dragId) return;
    setItems((prev) => prev.map((o) => (o.id === dragId ? { ...o, stage } : o)));
    setDragId(null);
    setOverStage(null);
  };

  return (
    <>
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="hub-page-title">Pipeline</h1>
          <p className="hub-page-sub">Guide every opportunity from discovery to won work. Drag to move.</p>
        </div>
      </div>

      <div className="hub-kanban" style={{ marginTop: 24 }}>
        {STAGE_ORDER.map((stage) => (
          <div
            key={stage}
            className={`hub-kanban-col ${overStage === stage ? "is-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(stage);
            }}
            onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
            onDrop={() => drop(stage)}
          >
            <div className="hub-kanban-col-head">
              <HubBadge tone={STAGE_TONE[stage]} dot>
                {STAGE_LABELS[stage]}
              </HubBadge>
              <span className="hub-kanban-count">{byStage[stage].length}</span>
            </div>

            {byStage[stage].map((o) => (
              <div
                key={o.id}
                className={`hub-kanban-card hub-kanban-drag ${dragId === o.id ? "is-dragging" : ""}`}
                draggable
                onDragStart={() => setDragId(o.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setOverStage(null);
                }}
                onClick={() => navigate(`/hub/opportunity/${o.id}`)}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <HubTag>{o.category}</HubTag>
                  <OpportunityScore opportunity={o} size="sm" />
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{o.projectType}</div>
                <div
                  className="flex items-center gap-1"
                  style={{ fontSize: 12, color: "#8a97a8", marginTop: 6 }}
                >
                  <MapPin size={13} />
                  {o.address} · {o.distanceMiles} mi
                </div>
              </div>
            ))}

            {byStage[stage].length === 0 && (
              <div className="hub-kanban-empty">Drop here</div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default HubPipeline;
