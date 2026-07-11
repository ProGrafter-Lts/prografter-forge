import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CalendarClock, ArrowRight, ArrowLeft, Trophy, X, Eye } from "lucide-react";
import { HubBadge } from "@/hub/components/ui";
import { OpportunityScore } from "@/hub/components/OpportunityScore";
import {
  OPPORTUNITIES,
  STAGE_LABELS,
  STAGE_ORDER,
  followUpDate,
  type Opportunity,
  type PipelineStage,
} from "@/hub/data/opportunities";
import { toast } from "@/hooks/use-toast";

const STAGE_TONE: Record<PipelineStage, "info" | "navy" | "warning" | "success" | "danger" | "neutral"> = {
  new: "info",
  letter_sent: "navy",
  contacted: "navy",
  site_visit: "warning",
  quote_requested: "info",
  quote_sent: "warning",
  negotiation: "warning",
  won: "success",
  lost: "danger",
};

const fmtFollowUp = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (diff < 0) return { label: `${label} · overdue`, overdue: true };
  if (diff === 0) return { label: "Today", overdue: false };
  if (diff === 1) return { label: "Tomorrow", overdue: false };
  return { label, overdue: false };
};

const HubPipeline = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Opportunity[]>(OPPORTUNITIES);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<PipelineStage | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const byStage = useMemo(() => {
    const map = {} as Record<PipelineStage, Opportunity[]>;
    STAGE_ORDER.forEach((s) => (map[s] = []));
    items.forEach((o) => map[o.stage].push(o));
    return map;
  }, [items]);

  const move = (id: string, stage: PipelineStage) => {
    setItems((prev) => prev.map((o) => (o.id === id ? { ...o, stage } : o)));
  };

  const drop = (stage: PipelineStage) => {
    if (!dragId) return;
    move(dragId, stage);
    setDragId(null);
    setOverStage(null);
  };

  const shiftStage = (o: Opportunity, dir: 1 | -1) => {
    const idx = STAGE_ORDER.indexOf(o.stage);
    const next = STAGE_ORDER[idx + dir];
    if (next) {
      move(o.id, next);
      toast({ title: `Moved to ${STAGE_LABELS[next]}` });
    }
    setMenuId(null);
  };

  const startPress = (id: string) => {
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      setMenuId(id);
    }, 450);
  };
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };
  const handleTap = (id: string) => {
    cancelPress();
    if (longPressed.current) return;
    navigate(`/hub/opportunity/${id}`);
  };

  return (
    <>
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="hub-page-title">Pipeline</h1>
          <p className="hub-page-sub">Every opportunity from first contact to won work. Drag to move · hold for actions.</p>
        </div>
      </div>

      <div className="hub-kanban hub-crm" style={{ marginTop: 24 }}>
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

            <div className="hub-kanban-scroll">
              {byStage[stage].map((o) => {
                const fu = fmtFollowUp(followUpDate(o));
                const idx = STAGE_ORDER.indexOf(o.stage);
                return (
                  <div
                    key={o.id}
                    className={`hub-crm-card hub-kanban-drag ${dragId === o.id ? "is-dragging" : ""} ${menuId === o.id ? "is-active" : ""}`}
                    draggable
                    onDragStart={() => {
                      cancelPress();
                      setDragId(o.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverStage(null);
                    }}
                    onPointerDown={() => startPress(o.id)}
                    onPointerUp={() => cancelPress()}
                    onPointerLeave={() => cancelPress()}
                    onClick={() => handleTap(o.id)}
                  >
                    <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                      <span className="hub-crm-project">{o.projectType}</span>
                      <OpportunityScore opportunity={o} size="sm" />
                    </div>

                    <div className="hub-crm-meta">
                      <MapPin size={13} />
                      <span>{o.address}</span>
                    </div>

                    <div className="hub-crm-foot">
                      <HubBadge tone={o.planningStatus === "Granted" ? "success" : "info"} dot>
                        {o.planningStatus}
                      </HubBadge>
                      <span className={`hub-crm-followup ${fu.overdue ? "is-overdue" : ""}`}>
                        <CalendarClock size={12} /> {fu.label}
                      </span>
                    </div>

                    {menuId === o.id && (
                      <div className="hub-crm-menu" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setMenuId(null); navigate(`/hub/opportunity/${o.id}`); }}>
                          <Eye size={14} /> Open
                        </button>
                        {idx < STAGE_ORDER.indexOf("won") && (
                          <button onClick={() => shiftStage(o, 1)}>
                            <ArrowRight size={14} /> Move forward
                          </button>
                        )}
                        {idx > 0 && (
                          <button onClick={() => shiftStage(o, -1)}>
                            <ArrowLeft size={14} /> Move back
                          </button>
                        )}
                        <button onClick={() => { move(o.id, "won"); setMenuId(null); toast({ title: "Marked as Won" }); }}>
                          <Trophy size={14} /> Mark Won
                        </button>
                        <button className="hub-crm-menu-danger" onClick={() => { move(o.id, "lost"); setMenuId(null); toast({ title: "Marked as Lost" }); }}>
                          <X size={14} /> Mark Lost
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {byStage[stage].length === 0 && <div className="hub-kanban-empty">Drop here</div>}
            </div>
          </div>
        ))}
      </div>

      {menuId && <div className="hub-crm-scrim" onClick={() => setMenuId(null)} />}
    </>
  );
};

export default HubPipeline;
