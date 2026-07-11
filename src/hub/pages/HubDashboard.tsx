import { useNavigate } from "react-router-dom";
import {
  Phone,
  CalendarClock,
  FileText,
  Radar,
  Search,
  KanbanSquare,
  CalendarDays,
  MessageCircle,
  Bookmark,
  GitBranch,
  ArrowRight,
} from "lucide-react";
import { HubCard } from "@/hub/components/ui";

const PRIORITIES = [
  { icon: <Phone size={18} />, text: "Call Mrs Smith regarding rear extension.", tone: "#1b3a5c" },
  { icon: <CalendarClock size={18} />, text: "Site visit at 2:00pm.", tone: "#0d9488" },
  { icon: <FileText size={18} />, text: "Complete kitchen quotation.", tone: "#b8791b" },
  { icon: <Radar size={18} />, text: "6 new planning opportunities within 10 miles.", tone: "#c0392b" },
];

const ACTIONS = [
  { label: "Find Work", sub: "Planning opportunities near you", icon: <Search size={26} />, to: "/hub/planning", variant: "navy" },
  { label: "Open Pipeline", sub: "Manage every opportunity", icon: <KanbanSquare size={26} />, to: "/hub/pipeline", variant: "teal" },
  { label: "Today's Jobs", sub: "What's on today", icon: <CalendarDays size={26} />, to: "/hub/calendar", variant: "amber" },
];

const ACTIVITY = [
  { icon: <MessageCircle size={16} />, text: "Mrs Smith replied.", when: "12 min ago" },
  { icon: <Bookmark size={16} />, text: "New planning application saved.", when: "1 hr ago" },
  { icon: <FileText size={16} />, text: "Quote sent yesterday.", when: "Yesterday" },
  { icon: <GitBranch size={16} />, text: "Pipeline updated.", when: "Yesterday" },
];

const HubDashboard = () => {
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <>
      {/* Morning Brief */}
      <div>
        <h1 className="hub-page-title">{greeting}, Lee</h1>
        <p className="hub-page-sub">Today's priorities</p>
      </div>

      <HubCard className="hub-brief" padded>
        <ul className="hub-brief-list">
          {PRIORITIES.map((p) => (
            <li key={p.text} className="hub-brief-item">
              <span className="hub-brief-icon" style={{ background: `${p.tone}14`, color: p.tone }}>
                {p.icon}
              </span>
              <span className="hub-brief-text">{p.text}</span>
            </li>
          ))}
        </ul>
      </HubCard>

      {/* Action buttons */}
      <div className="hub-actions-grid">
        {ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            className={`hub-action-btn hub-action-${a.variant}`}
            onClick={() => navigate(a.to)}
          >
            <span className="hub-action-icon">{a.icon}</span>
            <span className="hub-action-body">
              <span className="hub-action-label">{a.label}</span>
              <span className="hub-action-sub">{a.sub}</span>
            </span>
            <ArrowRight size={20} className="hub-action-arrow" />
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <section style={{ marginTop: 36 }}>
        <h2 className="hub-section-title" style={{ marginBottom: 16 }}>
          Recent Activity
        </h2>
        <HubCard padded={false}>
          <ul className="hub-activity">
            {ACTIVITY.map((a) => (
              <li key={a.text} className="hub-activity-item">
                <span className="hub-activity-icon">{a.icon}</span>
                <span className="hub-activity-text">{a.text}</span>
                <span className="hub-activity-when">{a.when}</span>
              </li>
            ))}
          </ul>
        </HubCard>
      </section>
    </>
  );
};

export default HubDashboard;
