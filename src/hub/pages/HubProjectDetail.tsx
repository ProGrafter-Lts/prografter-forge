import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  GitBranchPlus,
  CalendarPlus,
  Compass,
  MapPin,
  CalendarDays,
  FileText,
  Image as ImageIcon,
  StickyNote,
  History,
  Users,
} from "lucide-react";
import { HubCard, HubButton, HubBadge, HubTag, HubEmpty } from "@/hub/components/ui";
import { OpportunityScore, OpportunityScoreBreakdown } from "@/hub/components/OpportunityScore";
import { getOpportunity } from "@/hub/data/opportunities";
import { toast } from "@/hooks/use-toast";

const HISTORY = [
  { label: "Application validated", date: "2026-07-06" },
  { label: "Consultation period opened", date: "2026-07-07" },
  { label: "Decision issued — Granted", date: "2026-07-10" },
];

const HubProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const o = id ? getOpportunity(id) : undefined;

  if (!o) {
    return (
      <HubEmpty
        icon={<FileText size={22} />}
        title="Opportunity not found"
        description="This opportunity may have been removed."
        action={<HubButton variant="secondary" onClick={() => navigate("/hub/planning")}>Back to Planning Hub</HubButton>}
      />
    );
  }

  return (
    <>
      <button className="hub-back" onClick={() => navigate("/hub/planning")}>
        <ArrowLeft size={16} /> Planning Hub
      </button>

      <div className="flex items-start justify-between flex-wrap gap-4" style={{ marginTop: 12 }}>
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
            <HubTag>{o.category}</HubTag>
            <HubBadge tone={o.planningStatus === "Granted" ? "success" : "info"} dot>
              {o.planningStatus}
            </HubBadge>
          </div>
          <h1 className="hub-page-title">{o.projectType}</h1>
          <div className="hub-opp-meta" style={{ marginTop: 8 }}>
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {o.address}, {o.postcode} · {o.distanceMiles} mi
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays size={14} />{" "}
              {new Date(o.applicationDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
        <OpportunityScore opportunity={o} />
      </div>

      {/* Action buttons */}
      <div className="hub-detail-actions">
        <HubButton variant="primary" icon={<Bookmark size={16} />} onClick={() => toast({ title: "Saved" })}>
          Save
        </HubButton>
        <HubButton
          variant="accent"
          icon={<GitBranchPlus size={16} />}
          onClick={() => toast({ title: "Added to pipeline" })}
        >
          Add to Pipeline
        </HubButton>
        <HubButton
          variant="secondary"
          icon={<CalendarPlus size={16} />}
          onClick={() => navigate("/hub/calendar")}
        >
          Book Site Visit
        </HubButton>
        <HubButton variant="ghost" icon={<Compass size={16} />} disabled>
          Launch Atlas (Coming Soon)
        </HubButton>
      </div>

      <div className="hub-detail-grid">
        {/* Left column */}
        <div className="hub-detail-main">
          <HubCard padded>
            <h3 className="hub-section-title" style={{ fontSize: 16, marginBottom: 10 }}>
              Planning description
            </h3>
            <p style={{ color: "#45536b", lineHeight: 1.6, fontSize: 14 }}>{o.description}</p>
          </HubCard>

          <HubCard padded>
            <h3 className="hub-section-title" style={{ fontSize: 16, marginBottom: 14 }}>
              <ImageIcon size={16} style={{ display: "inline", marginRight: 8, verticalAlign: "-2px" }} />
              Photographs
            </h3>
            <div className="hub-thumb-row">
              {[1, 2, 3].map((n) => (
                <div key={n} className="hub-thumb" />
              ))}
            </div>
          </HubCard>

          <HubCard padded>
            <h3 className="hub-section-title" style={{ fontSize: 16, marginBottom: 14 }}>
              <FileText size={16} style={{ display: "inline", marginRight: 8, verticalAlign: "-2px" }} />
              Planning drawings & documents
            </h3>
            <div className="hub-doc-list">
              {["Existing & proposed plans.pdf", "Elevations.pdf", "Site location plan.pdf", "Design & access statement.pdf"].map(
                (d) => (
                  <div key={d} className="hub-doc-row">
                    <FileText size={16} style={{ color: "#8a97a8" }} />
                    <span>{d}</span>
                    <HubButton variant="ghost" size="sm">
                      View
                    </HubButton>
                  </div>
                ),
              )}
            </div>
          </HubCard>

          <HubCard padded>
            <h3 className="hub-section-title" style={{ fontSize: 16, marginBottom: 14 }}>
              <StickyNote size={16} style={{ display: "inline", marginRight: 8, verticalAlign: "-2px" }} />
              Notes
            </h3>
            <textarea className="hub-textarea" placeholder="Add a private note about this opportunity…" rows={3} />
          </HubCard>
        </div>

        {/* Right column */}
        <div className="hub-detail-side">
          <HubCard padded>
            <h3 className="hub-section-title" style={{ fontSize: 15, marginBottom: 12 }}>
              Opportunity score
            </h3>
            <OpportunityScoreBreakdown opportunity={o} />
          </HubCard>

          <HubCard padded>
            <h3 className="hub-section-title" style={{ fontSize: 15, marginBottom: 12 }}>
              <Users size={15} style={{ display: "inline", marginRight: 8, verticalAlign: "-2px" }} />
              Trade requirements
            </h3>
            <div className="hub-opp-trades" style={{ marginTop: 0 }}>
              {o.tradesRequired.map((t) => (
                <span key={t} className="hub-opp-trade">
                  {t}
                </span>
              ))}
            </div>
          </HubCard>

          <HubCard padded>
            <h3 className="hub-section-title" style={{ fontSize: 15, marginBottom: 12 }}>
              <History size={15} style={{ display: "inline", marginRight: 8, verticalAlign: "-2px" }} />
              Planning history
            </h3>
            <ul className="hub-timeline">
              {HISTORY.map((h) => (
                <li key={h.label} className="hub-timeline-item">
                  <span className="hub-timeline-dot" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{h.label}</div>
                    <div style={{ fontSize: 12, color: "#8a97a8" }}>
                      {new Date(h.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </HubCard>
        </div>
      </div>
    </>
  );
};

export default HubProjectDetail;
