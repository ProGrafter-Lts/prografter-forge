import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  GitBranchPlus,
  MapPin,
  CalendarDays,
  FileText,
  Hash,
  BadgeCheck,
  Banknote,
  Users,
  History,
  Clock,
  Sparkles,
  Gauge,
  Mail,
  Share2,
  Lightbulb,
} from "lucide-react";
import { HubCard, HubButton, HubBadge, HubTag, HubEmpty } from "@/hub/components/ui";
import { OpportunityScore } from "@/hub/components/OpportunityScore";
import LetterGenerator from "@/hub/components/LetterGenerator";
import { getLetters } from "@/hub/data/letters";
import {
  getOpportunity,
  formatBuildValue,
  opportunitySummary,
  estimatedTimeline,
  estimatedCompetition,
  opportunityAnalysis,
  recommendedAction,
} from "@/hub/data/opportunities";
import { toast } from "@/hooks/use-toast";

const HISTORY = [
  { label: "Application validated", date: "2026-07-06" },
  { label: "Consultation period opened", date: "2026-07-07" },
  { label: "Decision issued — Granted", date: "2026-07-10" },
];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const HubProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const o = id ? getOpportunity(id) : undefined;
  const [saved, setSaved] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [letterVersion, setLetterVersion] = useState(0);
  const letters = useMemo(() => (o ? getLetters(o.id) : []), [o, letterVersion]);

  if (!o) {
    return (
      <HubEmpty
        icon={<FileText size={22} />}
        title="Opportunity not found"
        description="This opportunity may have been removed."
        action={
          <HubButton variant="secondary" onClick={() => navigate("/hub/planning")}>
            Back to Planning Hub
          </HubButton>
        }
      />
    );
  }

  const competition = estimatedCompetition(o);
  const analysis = opportunityAnalysis(o);

  const facts = [
    { icon: <MapPin size={15} />, label: "Address", value: `${o.address}, ${o.postcode}` },
    { icon: <Hash size={15} />, label: "Planning reference", value: o.planningRef },
    { icon: <CalendarDays size={15} />, label: "Application date", value: fmtDate(o.applicationDate) },
    { icon: <BadgeCheck size={15} />, label: "Planning status", value: o.planningStatus },
    { icon: <Banknote size={15} />, label: "Estimated build value", value: formatBuildValue(o.estBuildValue) },
    { icon: <MapPin size={15} />, label: "Distance", value: `${o.distanceMiles} miles away` },
  ];

  return (
    <>
      <button className="hub-back" onClick={() => navigate("/hub/planning")}>
        <ArrowLeft size={16} /> Planning Hub
      </button>

      {/* ---------- Top section ---------- */}
      <HubCard padded className="hub-detail-hero">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
              <HubTag>{o.category}</HubTag>
              <HubBadge tone={o.planningStatus === "Granted" ? "success" : "info"} dot>
                {o.planningStatus}
              </HubBadge>
            </div>
            <h1 className="hub-page-title">{o.projectType}</h1>
          </div>
          <OpportunityScore opportunity={o} />
        </div>

        <div className="hub-fact-grid">
          {facts.map((f) => (
            <div key={f.label} className="hub-fact">
              <span className="hub-fact-icon">{f.icon}</span>
              <div>
                <div className="hub-fact-label">{f.label}</div>
                <div className="hub-fact-value">{f.value}</div>
              </div>
            </div>
          ))}
        </div>

        <HubButton
          variant="accent"
          size="lg"
          icon={<FileText size={18} />}
          onClick={() => toast({ title: "Opening planning drawings", description: "Drawings viewer coming soon." })}
          style={{ marginTop: 20, width: "100%" }}
        >
          View Planning Drawings
        </HubButton>
      </HubCard>

      <div className="hub-detail-grid">
        {/* ---------- Left column ---------- */}
        <div className="hub-detail-main">
          {/* Overview */}
          <HubCard padded>
            <h3 className="hub-section-title hub-detail-heading">
              <Sparkles size={16} /> Overview
            </h3>
            <p style={{ color: "#45536b", lineHeight: 1.65, fontSize: 14 }}>{opportunitySummary(o)}</p>
          </HubCard>

          {/* Required Trades */}
          <HubCard padded>
            <h3 className="hub-section-title hub-detail-heading">
              <Users size={16} /> Required Trades
            </h3>
            <div className="hub-opp-trades" style={{ marginTop: 4 }}>
              {o.tradesRequired.map((t) => (
                <span key={t} className="hub-opp-trade">
                  {t}
                </span>
              ))}
            </div>
          </HubCard>

          {/* Estimated Timeline */}
          <HubCard padded>
            <h3 className="hub-section-title hub-detail-heading">
              <Clock size={16} /> Estimated Timeline
            </h3>
            <p style={{ color: "#17233a", fontWeight: 700, fontSize: 18 }}>{estimatedTimeline(o)}</p>
            <p style={{ color: "#8a97a8", fontSize: 13, marginTop: 4 }}>
              Indicative duration based on project size — confirm on a site visit.
            </p>
          </HubCard>

          {/* Opportunity Analysis */}
          <HubCard padded>
            <h3 className="hub-section-title hub-detail-heading">
              <Gauge size={16} /> Opportunity Analysis
            </h3>
            <p style={{ color: "#45536b", fontSize: 14, marginBottom: 14 }}>Why is this a good job?</p>
            <div className="hub-score-breakdown">
              {analysis.map((r) => (
                <div key={r.label} className="hub-analysis-row">
                  <div className="hub-analysis-head">
                    <span className="hub-score-row-label">{r.label}</span>
                    <span className="hub-score-row-val">{r.value}</span>
                  </div>
                  <span className="hub-score-bar">
                    <span className="hub-score-bar-fill" style={{ width: `${r.value}%` }} />
                  </span>
                  <p className="hub-analysis-note">{r.note}</p>
                </div>
              ))}
            </div>
          </HubCard>

          {/* Recommended Next Action */}
          <HubCard padded className="hub-next-action">
            <h3 className="hub-section-title hub-detail-heading">
              <Lightbulb size={16} /> Recommended Next Action
            </h3>
            <p style={{ color: "#17233a", lineHeight: 1.6, fontSize: 15, fontWeight: 600 }}>
              {recommendedAction(o)}
            </p>
            <HubButton
              variant="accent"
              size="lg"
              icon={<GitBranchPlus size={18} />}
              onClick={() => toast({ title: "Added to pipeline", description: `${o.projectType} is now in New Opportunity.` })}
              style={{ marginTop: 16, width: "100%" }}
            >
              Add To Pipeline
            </HubButton>
            <div className="hub-detail-actions" style={{ marginTop: 12 }}>
              <HubButton
                variant={saved ? "primary" : "secondary"}
                icon={<Bookmark size={16} />}
                onClick={() => {
                  setSaved((s) => !s);
                  toast({ title: saved ? "Removed from saved" : "Saved" });
                }}
              >
                {saved ? "Saved" : "Save"}
              </HubButton>
              <HubButton
                variant="secondary"
                icon={<Mail size={16} />}
                onClick={() => setLetterOpen(true)}
              >
                Generate Introduction Letter
              </HubButton>
              <HubButton
                variant="ghost"
                icon={<Share2 size={16} />}
                onClick={() => toast({ title: "Share link copied" })}
              >
                Share
              </HubButton>
            </div>
          </HubCard>
        </div>

        {/* ---------- Right column ---------- */}
        <div className="hub-detail-side">
          {/* Estimated competition */}
          <HubCard padded>
            <h3 className="hub-section-title hub-detail-heading" style={{ fontSize: 15 }}>
              <Users size={15} /> Estimated Competition
            </h3>
            <HubBadge
              tone={competition.level === "Low" ? "success" : competition.level === "Medium" ? "warning" : "neutral"}
              dot
            >
              {competition.level}
            </HubBadge>
            <p style={{ color: "#8a97a8", fontSize: 13, marginTop: 10 }}>{competition.note}</p>
          </HubCard>

          {/* Planning History */}
          <HubCard padded>
            <h3 className="hub-section-title hub-detail-heading" style={{ fontSize: 15 }}>
              <History size={15} /> Planning History
            </h3>
            <ul className="hub-timeline">
              {HISTORY.map((h) => (
                <li key={h.label} className="hub-timeline-item">
                  <span className="hub-timeline-dot" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{h.label}</div>
                    <div style={{ fontSize: 12, color: "#8a97a8" }}>{fmtDate(h.date)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </HubCard>

          {/* Letters sent — timeline */}
          <HubCard padded>
            <h3 className="hub-section-title hub-detail-heading" style={{ fontSize: 15 }}>
              <Mail size={15} /> Introduction Letters
            </h3>
            {letters.length === 0 ? (
              <p style={{ color: "#8a97a8", fontSize: 13, marginTop: 4 }}>
                No letters generated yet. Create a personalised homeowner letter in one click.
              </p>
            ) : (
              <div className="hub-letter-log">
                {letters.map((l) => (
                  <div key={l.id} className="hub-letter-log-item">
                    <span className="hub-letter-log-icon">
                      <Mail size={15} />
                    </span>
                    <div>
                      <div className="hub-letter-log-main">Introduction letter generated</div>
                      <div className="hub-letter-log-when">
                        {new Date(l.createdAt).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <HubButton
              variant="secondary"
              icon={<Mail size={16} />}
              onClick={() => setLetterOpen(true)}
              style={{ marginTop: 14, width: "100%" }}
            >
              Generate Letter
            </HubButton>
          </HubCard>


          {/* Important Dates */}
          <HubCard padded>
            <h3 className="hub-section-title hub-detail-heading" style={{ fontSize: 15 }}>
              <CalendarDays size={15} /> Important Dates
            </h3>
            <div className="hub-doc-list">
              <div className="hub-doc-row">
                <CalendarDays size={15} style={{ color: "#8a97a8" }} />
                <span>Application submitted</span>
                <strong style={{ fontSize: 13 }}>{fmtDate(o.applicationDate)}</strong>
              </div>
              <div className="hub-doc-row">
                <CalendarDays size={15} style={{ color: "#8a97a8" }} />
                <span>Decision issued</span>
                <strong style={{ fontSize: 13 }}>{fmtDate(HISTORY[HISTORY.length - 1].date)}</strong>
              </div>
            </div>
          </HubCard>
        </div>
      </div>
    </>
  );
};

export default HubProjectDetail;
