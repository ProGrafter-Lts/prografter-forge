import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Briefcase,
  FolderKanban,
  Bell,
  PoundSterling,
  UserCircle,
  LogOut,
  BadgeCheck,
  TrendingUp,
  Clock,
  Star,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { GreenSpecialistBanner, CertificationsSection } from "@/components/GreenCertBadges";
import { GreenLeafBadge } from "@/lib/greenTrades";
import { PlanningAlertsSection } from "@/components/trade/PlanningAlerts";

interface TradeProfile {
  name: string;
  company_name: string;
  verified: boolean;
  trade_type: string;
  id: string;
  is_green_trade: boolean;
  mcs_number: string | null;
  trustmark_number: string | null;
  pas_2030_accredited: boolean;
  pas_2035_coordinator: boolean;
  ozev_approved: boolean;
  fgas_registered: boolean;
  ciga_registered: boolean;
  inca_certified: boolean;
  green_cert_expiry: string | null;
}

interface JobMatch {
  id: string;
  estimated_value: string | null;
  notified_at: string;
  status: string;
  jobs: {
    title: string | null;
    job_type: string;
    postcode: string;
    description: string;
  } | null;
}

interface Quote {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  jobs: {
    title: string | null;
    job_type: string;
    postcode: string;
  } | null;
}

interface ActiveProject {
  id: string;
  title: string | null;
  job_type: string;
  postcode: string;
  stage: string;
}

const STAGES = ["enquiry", "quoting", "scheduled", "in_progress", "review", "completed"];

const getStageProgress = (stage: string) => {
  const idx = STAGES.indexOf(stage);
  return idx === -1 ? 0 : Math.round(((idx + 1) / STAGES.length) * 100);
};

const formatStage = (stage: string) =>
  stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { label: "Available Jobs", icon: Briefcase, id: "jobs" },
  { label: "Active Projects", icon: FolderKanban, id: "projects" },
  { label: "Planning Alerts", icon: Bell, id: "alerts" },
  { label: "Earnings", icon: PoundSterling, id: "earnings" },
  { label: "My Profile", icon: UserCircle, id: "profile" },
];

const TradeDashboard = () => {
  const navigate = useNavigate();
  const [trade, setTrade] = useState<TradeProfile | null>(null);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeProjects, setActiveProjects] = useState<ActiveProject[]>([]);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get trade profile
    const { data: tradeData } = await supabase
      .from("trades")
      .select("id, name, company_name, verified, trade_type, is_green_trade, mcs_number, trustmark_number, pas_2030_accredited, pas_2035_coordinator, ozev_approved, fgas_registered, ciga_registered, inca_certified, green_cert_expiry")
      .eq("user_id", user.id)
      .single();

    if (tradeData) {
      setTrade(tradeData);

      // Get job matches
      const { data: matchData } = await supabase
        .from("job_matches")
        .select("id, estimated_value, notified_at, status, jobs(title, job_type, postcode, description)")
        .eq("trade_id", tradeData.id)
        .eq("status", "notified")
        .order("notified_at", { ascending: false })
        .limit(5);

      if (matchData) setMatches(matchData as unknown as JobMatch[]);

      // Get quotes
      const { data: quoteData } = await supabase
        .from("quotes")
        .select("id, amount, status, created_at, jobs(title, job_type, postcode)")
        .eq("trade_id", tradeData.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (quoteData) setQuotes(quoteData as unknown as Quote[]);

      // Get active projects (jobs matched to this trade with active stages)
      const { data: projectData } = await supabase
        .from("jobs")
        .select("id, title, job_type, postcode, stage")
        .in("stage", ["scheduled", "in_progress", "review"])
        .limit(10);

      if (projectData) setActiveProjects(projectData);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const completedCount = 0; // Would come from real data
  const earnings = 0;
  const rating = 0;

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Mobile sidebar toggle */}
      <button
        className="craft:hidden fixed top-4 left-4 z-50 bg-navy text-cream p-2 rounded-xl shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <LayoutDashboard className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed craft:static inset-y-0 left-0 z-40 w-64 bg-navy flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full craft:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <a href="/" className="font-heading text-[24px] leading-none tracking-wide">
            <span className="text-cream">Pro</span>
            <span className="text-teal">grafter</span>
          </a>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm transition-colors ${
                activeNav === item.id
                  ? "bg-teal/20 text-teal"
                  : "text-cream/60 hover:text-cream hover:bg-white/5"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm text-cream/40 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 craft:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 p-4 craft:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Welcome header */}
          <div className="flex items-center gap-3 pt-10 craft:pt-0">
            <div>
              <h1 className="font-heading text-navy text-3xl craft:text-4xl">
                Welcome back, {trade?.name || "Trade"}
              </h1>
              <p className="font-mono text-sm text-secondary-text mt-1">
                {trade?.company_name} · {trade?.trade_type}
              </p>
            </div>
            {trade?.verified && (
              <span className="flex items-center gap-1 bg-teal/10 text-teal px-3 py-1 rounded-full font-mono text-xs">
                <BadgeCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
            {trade?.is_green_trade && <GreenLeafBadge />}
          </div>

          {/* Green Specialist Banner */}
          {trade && <GreenSpecialistBanner show={trade.is_green_trade} />}

          {/* Stats row */}
          <div className="grid grid-cols-2 craft:grid-cols-4 gap-4">
            {[
              { label: "Jobs Won", value: completedCount, icon: TrendingUp, color: "text-teal" },
              { label: "Earnings", value: `£${earnings.toLocaleString()}`, icon: PoundSterling, color: "text-teal" },
              { label: "Active Projects", value: activeProjects.length, icon: FolderKanban, color: "text-navy" },
              { label: "Rating", value: rating > 0 ? `${rating}/5` : "N/A", icon: Star, color: "text-yellow-500" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl p-5 border border-navy/10 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="font-heading text-2xl text-navy">{stat.value}</p>
                <p className="font-mono text-xs text-secondary-text">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* New Job Matches */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-navy text-2xl">New Job Matches</h2>
              <span className="bg-teal/10 text-teal font-mono text-xs px-3 py-1 rounded-full">
                {matches.length} new
              </span>
            </div>

            {matches.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-navy/10 text-center">
                <Briefcase className="w-10 h-10 text-navy/20 mx-auto mb-3" />
                <p className="font-mono text-sm text-secondary-text">
                  No new job matches yet. We'll notify you when relevant jobs appear in your area.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-white rounded-2xl p-5 border border-navy/10 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-heading text-navy text-lg">
                          {match.jobs?.title || match.jobs?.job_type || "Job"}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 font-mono text-xs text-secondary-text">
                            <MapPin className="w-3 h-3" />
                            {match.jobs?.postcode}
                          </span>
                          {match.estimated_value && (
                            <span className="font-mono text-xs text-teal font-semibold">
                              Est. {match.estimated_value}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-mono text-xs text-secondary-text">
                            <Clock className="w-3 h-3" />
                            {timeAgo(match.notified_at)}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-secondary-text mt-2 line-clamp-2">
                          {match.jobs?.description}
                        </p>
                      </div>
                      <button className="flex items-center gap-1 bg-teal text-cream font-mono text-xs px-4 py-2 rounded-xl hover:bg-teal-hover transition-colors whitespace-nowrap ml-4 shadow-sm">
                        View & Quote
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Active Projects */}
          <section>
            <h2 className="font-heading text-navy text-2xl mb-4">Active Projects</h2>

            {activeProjects.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-navy/10 text-center">
                <FolderKanban className="w-10 h-10 text-navy/20 mx-auto mb-3" />
                <p className="font-mono text-sm text-secondary-text">
                  No active projects. Win a job to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white rounded-2xl p-5 border border-navy/10 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-heading text-navy text-lg">
                          {project.title || project.job_type}
                        </h3>
                        <span className="flex items-center gap-1 font-mono text-xs text-secondary-text">
                          <MapPin className="w-3 h-3" />
                          {project.postcode}
                        </span>
                      </div>
                      <span className="bg-navy/10 text-navy font-mono text-xs px-3 py-1 rounded-full">
                        {formatStage(project.stage)}
                      </span>
                    </div>
                    <Progress value={getStageProgress(project.stage)} className="h-2 bg-navy/10" />
                    <p className="font-mono text-[10px] text-secondary-text mt-1 text-right">
                      {getStageProgress(project.stage)}% complete
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Green Certifications */}
          {trade && trade.is_green_trade && <CertificationsSection trade={trade} />}

          {/* My Quotes */}
          <section>
            <h2 className="font-heading text-navy text-2xl mb-4">My Quotes</h2>

            {quotes.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-navy/10 text-center">
                <PoundSterling className="w-10 h-10 text-navy/20 mx-auto mb-3" />
                <p className="font-mono text-sm text-secondary-text">
                  No pending quotes. Browse job matches to submit your first quote.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {quotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="bg-white rounded-2xl p-5 border border-navy/10 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-heading text-navy text-lg">
                        {quote.jobs?.title || quote.jobs?.job_type || "Job"}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 font-mono text-xs text-secondary-text">
                          <MapPin className="w-3 h-3" />
                          {quote.jobs?.postcode}
                        </span>
                        <span className="font-mono text-xs text-secondary-text">
                          {timeAgo(quote.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-heading text-teal text-xl">
                        £{Number(quote.amount).toLocaleString()}
                      </p>
                      <span className="bg-yellow-100 text-yellow-700 font-mono text-[10px] px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default TradeDashboard;
