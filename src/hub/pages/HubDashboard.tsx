import { useMemo } from "react";
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
  TrendingUp,
  ClipboardList,
  MapPin,
  MessagesSquare,
} from "lucide-react";
import { HubCard } from "@/hub/components/ui";
import {
  dashboardData,
  formatBuildValueFull,
  followUpDate,
  type DashboardTask,
  type Opportunity,
} from "@/hub/data/opportunities";

const TASK_ICON: Record<DashboardTask["icon"], JSX.Element> = {
  phone: <Phone size={18} />,
  calendar: <CalendarClock size={18} />,
  quote: <FileText size={18} />,
  radar: <Radar size={18} />,
  message: <MessageCircle size={18} />,
};

const ACTIONS = [
  { label: "Find Work", sub: "Planning opportunities near you", icon: <Search size={24} />, to: "/hub/planning", variant: "navy" },
  { label: "Pipeline", sub: "Manage every opportunity", icon: <KanbanSquare size={24} />, to: "/hub/pipeline", variant: "teal" },
  { label: "Today's Jobs", sub: "What's on today", icon: <CalendarDays size={24} />, to: "/hub/calendar", variant: "amber" },
  { label: "Generate Quote", sub: "Build a new quotation", icon: <FileText size={24} />, to: "/hub/pipeline", variant: "navy" },
  { label: "Messages", sub: "Customer conversations", icon: <MessagesSquare size={24} />, to: "/hub/messages", variant: "teal" },
];

const ACTIVITY = [
  { icon: <MessageCircle size={16} />, text: "Mrs Smith replied.", when: "12 min ago" },
  { icon: <Bookmark size={16} />, text: "New planning application saved.", when: "1 hr ago" },
  { icon: <FileText size={16} />, text: "Quote sent yesterday.", when: "Yesterday" },
  { icon: <GitBranch size={16} />, text: "Pipeline updated.", when: "Yesterday" },
];

const HubDashboard = () => {
  const navigate = useNavigate();
  const data = useMemo(() => dashboardData(), []);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  const short = (addr: string) => addr.split(",")[0];
  const dayLabel = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const TodayCard = ({
    title,
    icon,
    tone,
    items,
    render,
    empty,
  }: {
    title: string;
    icon: JSX.Element;
    tone: string;
    items: Opportunity[];
    render: (o: Opportunity) => string;
    empty: string;
  }) => (
    <div className="hub-today-card">
      <div className="hub-today-head">
        <span className="hub-today-icon" style={{ background: `${tone}14`, color: tone }}>
          {icon}
        </span>
        <span className="hub-today-title">{title}</span>
        <span className="hub-today-count" style={{ color: tone }}>
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="hub-today-empty">{empty}</p>
      ) : (
        <div className="hub-today-list">
          {items.slice(0, 3).map((o) => (
            <div
              key={o.id}
              className="hub-today-row"
              onClick={() => navigate(`/hub/opportunity/${o.id}`)}
            >
              <span className="hub-today-row-main">{short(o.address)}</span>
              <span className="hub-today-row-meta">{render(o)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Header */}
      <div>
        <h1 className="hub-page-title">{greeting}, Lee</h1>
        <p className="hub-page-sub">Today's priorities</p>
      </div>

      {/* Today's Priorities — dynamic task list */}
      <HubCard className="hub-brief" padded>
        {data.tasks.length === 0 ? (
          <p className="hub-brief-empty">You're all caught up — nothing needs your attention right now.</p>
        ) : (
          <ul className="hub-brief-list">
            {data.tasks.map((t) => (
              <li
                key={t.id}
                className="hub-brief-item hub-brief-link"
                onClick={() => navigate(t.to)}
              >
                <span className="hub-brief-icon" style={{ background: `${t.tone}14`, color: t.tone }}>
                  {TASK_ICON[t.icon]}
                </span>
                <span className="hub-brief-text">{t.text}</span>
              </li>
            ))}
          </ul>
        )}
      </HubCard>

      {/* Quick Actions */}
      <section style={{ marginTop: 32 }}>
        <h2 className="hub-section-title" style={{ marginBottom: 16 }}>
          Quick Actions
        </h2>
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
      </section>

      {/* Potential Work Nearby */}
      <section style={{ marginTop: 32 }}>
        <h2 className="hub-section-title" style={{ marginBottom: 16 }}>
          Potential Work Nearby
        </h2>
        <div className="hub-potential" onClick={() => navigate("/hub/planning")}>
          <span className="hub-potential-icon">
            <TrendingUp size={26} />
          </span>
          <span>
            <span className="hub-potential-value">{data.potentialValue}</span>
            <span className="hub-potential-label" style={{ display: "block" }}>
              Potential construction work
            </span>
            <span className="hub-potential-count" style={{ display: "block" }}>
              {data.newApplications} new planning applications
            </span>
          </span>
          <ArrowRight size={22} className="hub-potential-arrow" />
        </div>
      </section>

      {/* Today's breakdown */}
      <section style={{ marginTop: 32 }}>
        <h2 className="hub-section-title" style={{ marginBottom: 16 }}>
          Today
        </h2>
        <div className="hub-today-grid">
          <TodayCard
            title="Follow Ups"
            icon={<Phone size={16} />}
            tone="#c0392b"
            items={data.followUps}
            render={(o) => dayLabel(followUpDate(o))}
            empty="No follow-ups due today."
          />
          <TodayCard
            title="Outstanding Quotes"
            icon={<ClipboardList size={16} />}
            tone="#b8791b"
            items={data.outstandingQuotes}
            render={(o) => formatBuildValueFull(o.estBuildValue)}
            empty="No quotes outstanding."
          />
          <TodayCard
            title="Upcoming Site Visits"
            icon={<MapPin size={16} />}
            tone="#0d9488"
            items={data.siteVisits}
            render={(o) => `${o.distanceMiles} mi`}
            empty="No site visits booked."
          />
          <TodayCard
            title="Customer Replies"
            icon={<MessagesSquare size={16} />}
            tone="#1b3a5c"
            items={data.customerReplies}
            render={() => "New"}
            empty="No new replies."
          />
        </div>
      </section>

      {/* Recent Activity */}
      <section style={{ marginTop: 32 }}>
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
