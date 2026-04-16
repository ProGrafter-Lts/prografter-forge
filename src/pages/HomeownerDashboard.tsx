import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FolderKanban } from "lucide-react";
import HomeownerSidebar from "@/components/homeowner/HomeownerSidebar";
import ActiveProjectHero from "@/components/homeowner/ActiveProjectHero";
import QuotesReceived from "@/components/homeowner/QuotesReceived";
import MyJobs from "@/components/homeowner/MyJobs";
import RecentSiteUpdates from "@/components/homeowner/RecentSiteUpdates";
import VariationAlert from "@/components/homeowner/VariationAlert";
import GreenCertificatePack from "@/components/GreenCertificatePack";
import { isGreenTrade } from "@/lib/greenTrades";
import { BookOpen, Leaf } from "lucide-react";

const HomeownerDashboard = () => {
  const navigate = useNavigate();
  const [homeownerName, setHomeownerName] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [variations, setVariations] = useState<any[]>([]);
  const [siteUpdates, setSiteUpdates] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<any>(null);
  const [activeNav, setActiveNav] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: ho } = await supabase
      .from("homeowners")
      .select("id, name")
      .eq("user_id", user.id)
      .single();

    if (!ho) return;
    setHomeownerName(ho.name);

    // Parallel fetches
    const [jobRes, quoteRes, variationRes, updatesRes] = await Promise.all([
      supabase
        .from("jobs")
        .select("id, title, job_type, postcode, status, stage, description, created_at, photo_urls")
        .eq("homeowner_id", ho.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("quotes")
        .select("id, amount, message, status, created_at, trade_id, job_id, trades(name, company_name, verified), jobs(title, job_type)")
        .order("created_at", { ascending: false }),
      supabase
        .from("variations")
        .select("id, title, description, materials_cost, labour_cost, programme_impact_days, status, job_id")
        .eq("status", "pending"),
      supabase
        .from("stage_updates")
        .select("id, update_text, created_at, photo_urls, stage_id, trade_id, trades(name), project_stages(stage_name)")
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    const jobData = jobRes.data || [];
    setJobs(jobData);

    // Filter quotes to only this homeowner's jobs
    const jobIds = new Set(jobData.map((j: any) => j.id));
    const homeownerQuotes = (quoteRes.data || []).filter((q: any) => jobIds.has(q.job_id));
    setQuotes(homeownerQuotes);

    // Filter variations to this homeowner's jobs
    const homeownerVariations = (variationRes.data || []).filter((v: any) => jobIds.has(v.job_id));
    setVariations(homeownerVariations);

    // Map site updates
    const mappedUpdates = (updatesRes.data || []).map((u: any) => ({
      id: u.id,
      update_text: u.update_text,
      created_at: u.created_at,
      photo_urls: u.photo_urls,
      trade_name: u.trades?.name,
      stage_name: u.project_stages?.stage_name,
    }));
    setSiteUpdates(mappedUpdates);

    // Find active project
    const active = jobData.find((j: any) => ["scheduled", "in_progress", "review"].includes(j.stage));
    setActiveProject(active || null);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <HomeownerSidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="pt-10 md:pt-0">
            <h1 className="font-heading text-primary text-3xl md:text-4xl">
              Welcome back, {homeownerName || "Homeowner"}
            </h1>
            <p className="font-mono text-sm text-muted-foreground mt-1">
              Your home projects at a glance
            </p>
          </div>

          {/* Homeowner Manual tab */}
          {activeNav === "manual" && (
            <section className="space-y-6">
              <h2 className="font-heading text-primary text-2xl flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Homeowner Manual
              </h2>
              {jobs.filter((j) => isGreenTrade(j.job_type)).length > 0 ? (
                jobs.filter((j) => isGreenTrade(j.job_type)).map((j) => (
                  <div key={j.id} className="space-y-4">
                    <h3 className="font-heading text-primary text-lg flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-green-500" />
                      {j.title || j.job_type}
                    </h3>
                    <GreenCertificatePack jobType={j.job_type} isComplete={j.stage === "completed"} />
                  </div>
                ))
              ) : (
                <div className="bg-card rounded-2xl p-8 border border-border text-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-mono text-sm text-muted-foreground">
                    Your Homeowner Manual will be available once a project is active.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Green Grants tab */}
          {activeNav === "grants" && (
            <section>
              <h2 className="font-heading text-primary text-2xl mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-500" /> Green Grants
              </h2>
              <div className="bg-card rounded-2xl p-8 border border-border text-center">
                <p className="font-mono text-sm text-muted-foreground">
                  Visit the <a href="/green" className="text-secondary hover:underline">Green Grants page</a> to explore available funding.
                </p>
              </div>
            </section>
          )}

          {/* Main overview content */}
          {activeNav !== "manual" && activeNav !== "grants" && (
            <>
              <VariationAlert variations={variations} />

              {activeProject ? (
                <ActiveProjectHero project={activeProject} />
              ) : (
                <div className="bg-card rounded-2xl p-8 border border-border text-center">
                  <FolderKanban className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-mono text-sm text-muted-foreground">
                    No active projects yet. Post a job to get started!
                  </p>
                  <a
                    href="/post-a-job"
                    className="inline-block mt-4 bg-secondary text-secondary-foreground font-mono text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                  >
                    Post a Job
                  </a>
                </div>
              )}

              <QuotesReceived quotes={quotes} />
              <MyJobs jobs={jobs} />
              <RecentSiteUpdates updates={siteUpdates} />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomeownerDashboard;
