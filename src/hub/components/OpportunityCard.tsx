import { useNavigate } from "react-router-dom";
import { MapPin, CalendarDays, FileText, Bookmark, GitBranchPlus, Users, Banknote } from "lucide-react";
import { HubButton, HubBadge, HubTag } from "@/hub/components/ui";
import { OpportunityScore } from "@/hub/components/OpportunityScore";
import { formatBuildValue, type Opportunity } from "@/hub/data/opportunities";

const statusTone = (s: Opportunity["planningStatus"]) =>
  s === "Granted" ? "success" : s === "Conditions" ? "warning" : "info";

interface Props {
  opportunity: Opportunity;
  onSave?: (o: Opportunity) => void;
  onAddToPipeline?: (o: Opportunity) => void;
}

const OpportunityCard = ({ opportunity: o, onSave, onAddToPipeline }: Props) => {
  const navigate = useNavigate();
  const open = () => navigate(`/hub/opportunity/${o.id}`);

  const stop =
    (fn?: () => void) =>
    (e: React.MouseEvent) => {
      e.stopPropagation();
      fn?.();
    };

  return (
    <div
      className="hub-opp-card hub-opp-card-click"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
    >
      <div className="hub-opp-main">
        <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginBottom: 10 }}>
          <div className="flex items-center gap-2">
            <HubTag>{o.category}</HubTag>
            <HubBadge tone={statusTone(o.planningStatus)} dot>
              {o.planningStatus}
            </HubBadge>
          </div>
          <OpportunityScore opportunity={o} size="sm" />
        </div>

        <div className="hub-opp-title">{o.projectType}</div>

        <div className="hub-opp-meta">
          <span className="flex items-center gap-1">
            <MapPin size={14} /> {o.address} · {o.distanceMiles} mi
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays size={14} />{" "}
            {new Date(o.applicationDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1 hub-opp-value">
            <Banknote size={14} /> {formatBuildValue(o.estBuildValue)} est. build value
          </span>
        </div>

        <div className="hub-opp-trades">
          <Users size={14} style={{ color: "#8a97a8" }} />
          {o.tradesRequired.map((t) => (
            <span key={t} className="hub-opp-trade">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="hub-opp-actions">
        <HubButton
          variant="secondary"
          size="sm"
          icon={<FileText size={15} />}
          onClick={stop(open)}
        >
          View Drawings
        </HubButton>
        <HubButton
          variant={o.saved ? "primary" : "ghost"}
          size="sm"
          icon={<Bookmark size={15} />}
          onClick={stop(() => onSave?.(o))}
        >
          {o.saved ? "Saved" : "Save"}
        </HubButton>
        <HubButton
          variant="accent"
          size="sm"
          icon={<GitBranchPlus size={15} />}
          onClick={stop(() => onAddToPipeline?.(o))}
        >
          Add To Pipeline
        </HubButton>
      </div>
    </div>
  );
};

export default OpportunityCard;
