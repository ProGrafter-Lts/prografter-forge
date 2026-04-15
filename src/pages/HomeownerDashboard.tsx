import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  FolderKanban,
  SearchCheck,
  BookOpen,
  UserCircle,
  LogOut,
  Star,
  AlertTriangle,
  Clock,
  MapPin,
  Image,
  BadgeCheck,
  Leaf,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import GreenCertificatePack from "@/components/GreenCertificatePack";
import { isGreenTrade } from "@/lib/greenTrades";

interface HomeownerProfile {
  id: string;
  name: string;
}

interface Job {
  id: string;
  title: string | null;
  job_type: string;
  postcode: string;
  status: string;
  stage: string;
  description: string;
  created_at: string;
  photo_urls: string[] | null;
}

interface QuoteReceived {
  id: string;
  amount: number;
  message: string | null;
  status: string;
  created_at: string;
  trade_id: string;
  job_id: string;
  trades: {
    name: string;
    company_name: string;
    verified: boolean;
  } | null;
  jobs: {
    title: string | null;
    job_type: string;
  } | null;
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

const daysSince = (dateStr: string) => {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-teal/10 text-teal",
  matched: "bg-blue-100 text-blue-700",
  active: "bg-amber-100 text-amber-700",
  complete: "bg-green-100 text-green-700",
};

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, id: "overview" },
  { label: "My Projects", icon: FolderKanban, id: "projects" },
  { label: "Quote Checker", icon: SearchCheck, id: "quotes" },
  { label: "Homeowner Manual", icon: BookOpen, id: "manual" },
  { label: "My Profile", icon: UserCircle, id: "profile" },
];

const HomeownerDashboard = () => {
  const navigate = useNavigate();
  const [homeowner, setHomeowner] = useState<HomeownerProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [quotes, setQuotes] = useState<QuoteReceived[]>([]);
  const [activeNav, setActiveNav] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get homeowner profile
    const { data: ho } = await supabase
      .from("homeowners")
      .select("id, name")
      .eq("user_id", user.id)
      .single();

    if (!ho) return;
    setHomeowner(ho);

    // Get jobs
    const { data: jobData } = await supabase
      .from("jobs")
      .select("id, title, job_type, postcode, status, stage, description, created_at, photo_urls")
      .eq("homeowner_id", ho.id)
      .order("created_at", { ascending: false });

    if (jobData) setJobs(jobData);

    // Get quotes on homeowner's jobs
    const { data: quoteData } = await supabase
      .from("quotes")
      .select("id, amount, message, status, created_at, trade_id, job_id, trades(name, company_name, verified), jobs(title, job_type)")
      .in("job_id", (jobData || []).map((j) => j.id))
      .order("created_at", { ascending: false });

    if (quoteData) setQuotes(quoteData as unknown as QuoteReceived[]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const activeProject = jobs.find((j) => ["scheduled", "in_progress", "review"].includes(j.stage));
  const recentUpdates = jobs
    .filter((j) => j.stage !== "enquiry")
    .slice(0, 3);
  const hasVariation = false; // Placeholder for future variation logic

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Mobile sidebar toggle */}
      <button
        className="craft:hidden fixed top-4 left-4 z-50 bg-navy text-cream p-2 rounded-xl shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <LayoutDashboard className="w-5 h-5" />
      </button>

      {/* Sidebar — cream for homeowner */}
      <aside
        className={`fixed craft:static inset-y-0 left-0 z-40 w-64 bg-[#EDE8DF] border-r border-navy/10 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full craft:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-navy/10">
          <a href="/" className="font-heading text-[24px] leading-none tracking-wide">
            <span className="text-navy">Pro</span>
            <span className="text-teal">grafter</span>
          </a>
          <p className="font-mono text-[10px] text-secondary-text mt-1 tracking-wider uppercase">Homeowner</p>
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
                  ? "bg-teal/15 text-teal font-semibold"
                  : "text-navy/60 hover:text-navy hover:bg-navy/5"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-navy/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm text-navy/40 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 craft:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 p-4 craft:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="pt-10 craft:pt-0">
            <h1 className="font-heading text-navy text-3xl craft:text-4xl">
              Welcome back, {homeowner?.name || "Homeowner"}
            </h1>
            <p className="font-mono text-sm text-secondary-text mt-1">
              Your home projects at a glance
            </p>
          </div>

          {/* Variation alert */}
          {hasVariation && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-heading text-navy text-lg">Variation Pending</h3>
                <p className="font-mono text-xs text-secondary-text mt-1">
                  A variation request awaits your signature. Review and approve to keep your project on track.
                </p>
                <button className="mt-3 bg-amber-500 text-white font-mono text-xs px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors">
                  Review Variation
                </button>
              </div>
            </div>
          )}

          {/* Active project hero */}
          {activeProject ? (
            <div className="bg-white rounded-2xl p-6 border border-navy/10 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-heading text-navy text-2xl">
                  {activeProject.title || activeProject.job_type}
                </h2>
                <Badge className={STATUS_COLORS[activeProject.status] || "bg-navy/10 text-navy"}>
                  {formatStage(activeProject.stage)}
                </Badge>
              </div>
              <div className="flex items-center gap-4 font-mono text-xs text-secondary-text mb-4">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {activeProject.postcode}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Day {daysSince(activeProject.created_at)}
                </span>
              </div>
              <Progress value={getStageProgress(activeProject.stage)} className="h-3 bg-navy/10" />
              <p className="font-mono text-xs text-secondary-text mt-2 text-right">
                {getStageProgress(activeProject.stage)}% complete
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-navy/10 text-center">
              <FolderKanban className="w-10 h-10 text-navy/20 mx-auto mb-3" />
              <p className="font-mono text-sm text-secondary-text">
                No active projects yet. Post a job to get started!
              </p>
              <a
                href="/post-a-job"
                className="inline-block mt-4 bg-teal text-cream font-mono text-sm px-6 py-2.5 rounded-xl hover:bg-teal-hover transition-colors shadow-sm"
              >
                Post a Job
              </a>
            </div>
          )}

          {/* Quotes Received */}
          <section>
            <h2 className="font-heading text-navy text-2xl mb-4">Quotes Received</h2>
            {quotes.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-navy/10 text-center">
                <SearchCheck className="w-10 h-10 text-navy/20 mx-auto mb-3" />
                <p className="font-mono text-sm text-secondary-text">
                  No quotes yet. Trades will submit quotes once matched to your job.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {quotes.map((q) => (
                  <div key={q.id} className="bg-white rounded-2xl p-5 border border-navy/10 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-navy text-lg">
                            {q.trades?.name || "Trade"}
                          </h3>
                          {q.trades?.verified && (
                            <BadgeCheck className="w-4 h-4 text-teal" />
                          )}
                        </div>
                        <p className="font-mono text-xs text-secondary-text">
                          {q.trades?.company_name} · {q.jobs?.title || q.jobs?.job_type}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          ))}
                          <span className="font-mono text-[10px] text-secondary-text ml-1">
                            (New)
                          </span>
                        </div>
                        {q.message && (
                          <p className="font-mono text-xs text-secondary-text mt-2 line-clamp-2">
                            {q.message}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4 flex flex-col items-end gap-2">
                        <p className="font-heading text-teal text-2xl">
                          £{Number(q.amount).toLocaleString()}
                        </p>
                        {q.status === "pending" && (
                          <button className="bg-teal text-cream font-mono text-xs px-4 py-2 rounded-xl hover:bg-teal-hover transition-colors shadow-sm whitespace-nowrap">
                            Accept Quote
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* My Jobs */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-navy text-2xl">My Jobs</h2>
              <a
                href="/post-a-job"
                className="font-mono text-xs text-teal hover:text-teal-hover transition-colors"
              >
                + Post New Job
              </a>
            </div>
            {jobs.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-navy/10 text-center">
                <FolderKanban className="w-10 h-10 text-navy/20 mx-auto mb-3" />
                <p className="font-mono text-sm text-secondary-text">You haven't posted any jobs yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/project/${job.id}`)}
                    className="bg-white rounded-2xl p-5 border border-navy/10 shadow-sm flex items-center justify-between cursor-pointer hover:border-teal/30 hover:shadow-md transition-all"
                  >
                    <div>
                      <h3 className="font-heading text-navy text-lg">{job.title || job.job_type}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 font-mono text-xs text-secondary-text">
                          <MapPin className="w-3 h-3" />
                          {job.postcode}
                        </span>
                        <span className="font-mono text-xs text-secondary-text">
                          {timeAgo(job.created_at)}
                        </span>
                      </div>
                    </div>
                    <Badge className={STATUS_COLORS[job.status] || "bg-navy/10 text-navy"}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Updates */}
          <section>
            <h2 className="font-heading text-navy text-2xl mb-4">Recent Updates</h2>
            {recentUpdates.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-navy/10 text-center">
                <Clock className="w-10 h-10 text-navy/20 mx-auto mb-3" />
                <p className="font-mono text-sm text-secondary-text">No updates yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUpdates.map((job) => (
                  <div key={job.id} className="bg-white rounded-2xl p-5 border border-navy/10 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-heading text-navy text-base">
                          {job.title || job.job_type}
                        </h3>
                        <p className="font-mono text-xs text-secondary-text mt-1">
                          Stage updated to <span className="text-teal font-semibold">{formatStage(job.stage)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(job.photo_urls?.length ?? 0) > 0 && (
                          <span className="flex items-center gap-1 font-mono text-[10px] text-secondary-text bg-navy/5 px-2 py-1 rounded-full">
                            <Image className="w-3 h-3" />
                            {job.photo_urls!.length}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-secondary-text">
                          {timeAgo(job.created_at)}
                        </span>
                      </div>
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

export default HomeownerDashboard;
