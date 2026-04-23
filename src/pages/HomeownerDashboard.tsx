import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HomeownerSidebar from "@/components/homeowner/HomeownerSidebar";
import ActiveProjectsSection from "@/components/homeowner/ActiveProjectsSection";
import QuotesReceived from "@/components/homeowner/QuotesReceived";
import MyJobs from "@/components/homeowner/MyJobs";
import RecentSiteUpdates from "@/components/homeowner/RecentSiteUpdates";
import VariationAlert from "@/components/homeowner/VariationAlert";
import GreenCertificatePack from "@/components/GreenCertificatePack";
import { isGreenTrade } from "@/lib/greenTrades";
import { BookOpen, Leaf, FolderKanban, SearchCheck, ArrowRight } from "lucide-react";
import HomeownerProfileSection from "@/components/homeowner/HomeownerProfileSection";

const HomeownerDashboard = () => {
  const navigate = useNavigate();
  const [homeownerName, setHomeownerName] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [variations, setVariations] = useState<any[]>([]);
  const [siteUpdates, setSiteUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  const [activeNav, setActiveNav] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const handleSession = (
      session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"],
    ) => {
      if (!isMounted) return;
      if (!session?.user) {
        lastLoadedUserIdRef.current = null;
        setLoading(false);
        return;
      }
      if (session.user.id === lastLoadedUserIdRef.current) return;
      lastLoadedUserIdRef.current = session.user.id;
      void loadData(session.user.id);
    };

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => handleSession(session))
      .catch((err) => {
        console.error("HomeownerDashboard getSession failed", err);
        if (isMounted) {
          setLoadError("We couldn't verify your session. Please sign in again.");
          setLoading(false);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      handleSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadData = async (userId: string) => {
    setLoading(true);
    setLoadError(null);
    try {
    const { data: ho, error: hoError } = await supabase
      .from("homeowners")
      .select("id, name")
      .eq("user_id", userId)
      .maybeSingle();

    if (hoError) {
      console.error("Failed to load homeowner profile", hoError);
      setLoadError("We couldn't load your dashboard right now.");
      setLoading(false);
      return;
    }

    if (!ho) {
      // Signed-in user has no homeowner record — likely a trade.
      const { data: tradeRow } = await supabase
        .from("trades")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      navigate(tradeRow ? "/dashboard/trade" : "/post-a-job", { replace: true });
      return;
    }
    setHomeownerName(ho.name);
    setLoading(false);

    // Fetch jobs first so we can scope subsequent queries server-side
    const { data: jobData } = await supabase
      .from("jobs")
      .select("id, title, job_type, postcode, status, stage, description, created_at, photo_urls")
      .eq("homeowner_id", ho.id)
      .order("created_at", { ascending: false });

    const jobs = jobData || [];
    setJobs(jobs);
    const jobIds = jobs.map((j: any) => j.id);

    if (jobIds.length === 0) {
      setQuotes([]);
      setVariations([]);
      setSiteUpdates([]);
      return;
    }

    // Now fetch quotes/variations/updates scoped to this homeowner's jobs only
    const [quoteRes, variationRes, updatesRes] = await Promise.all([
      supabase
        .from("quotes")
        .select("id, amount, message, status, created_at, trade_id, job_id, ai_verdict, ai_verdict_summary, tier_enabled, budget_price, budget_description, standard_price, standard_description, premium_price, premium_description, selected_tier, trades(name, company_name, verified, review_count, avg_rating, tier), jobs(title, job_type)")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("variations")
        .select("id, title, description, materials_cost, labour_cost, programme_impact_days, status, job_id")
        .eq("status", "pending")
        .in("job_id", jobIds),
      supabase
        .from("stage_updates")
        .select("id, update_text, created_at, photo_urls, stage_id, trade_id, trades(name), project_stages(stage_name, job_id)")
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    setQuotes(quoteRes.data || []);
    setVariations(variationRes.data || []);

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
    } catch (err) {
      console.error("Homeowner dashboard bootstrap failed", err);
      setLoadError(err instanceof Error ? err.message : "We couldn't load your dashboard right now.");
    } finally {
      setLoading(false);
    }
  };

  const reloadCurrentSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) void loadData(user.id);
  };

  const handleSelectTier = async (quoteId: string, tier: string, price: number) => {
    const { error } = await supabase
      .from("quotes")
      .update({ selected_tier: tier, amount: price } as any)
      .eq("id", quoteId);
    if (error) {
      toast.error("Failed to select tier");
    } else {
      toast.success(`${tier.charAt(0).toUpperCase() + tier.slice(1)} tier selected`);
      reloadCurrentSession();
    }
  };

  const quoteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    quotes.forEach((q: any) => {
      counts[q.job_id] = (counts[q.job_id] ?? 0) + 1;
    });
    return counts;
  }, [quotes]);

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
          {loading && !homeownerName ? (
            <div className="min-h-[40vh] flex items-center justify-center font-mono text-sm text-muted-foreground">
              Loading dashboard…
            </div>
          ) : loadError && !homeownerName ? (
            <div className="min-h-[40vh] flex items-center justify-center px-6 text-center font-mono text-sm text-muted-foreground">
              {loadError}
            </div>
          ) : (
          <>
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

          {/* Profile tab */}
          {activeNav === "profile" && <HomeownerProfileSection />}

          {/* My Projects tab */}
          {activeNav === "projects" && (
            <section className="space-y-6">
              <div>
                <h2 className="font-heading text-primary text-2xl flex items-center gap-2">
                  <FolderKanban className="w-5 h-5" /> My Projects
                </h2>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  Every project you've posted, in flight or completed.
                </p>
              </div>
              <ActiveProjectsSection jobs={jobs} quoteCounts={quoteCounts} />
              <MyJobs jobs={jobs} />
            </section>
          )}

          {/* Quote Checker tab */}
          {activeNav === "quotes" && (
            <section className="space-y-6">
              <div>
                <h2 className="font-heading text-primary text-2xl flex items-center gap-2">
                  <SearchCheck className="w-5 h-5" /> Quotes &amp; Quote Checker
                </h2>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  Compare quotes you've received and run AI checks on outside quotes.
                </p>
              </div>

              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex items-start justify-between gap-4 flex-wrap">
                <div className="max-w-lg">
                  <h3 className="font-heading text-primary text-lg">Got a quote from outside Prografter?</h3>
                  <p className="font-mono text-xs text-muted-foreground mt-1">
                    Upload any builder's quote and our AI will flag missing line items, compare it to fair-market rates and produce a homeowner-friendly verdict.
                  </p>
                </div>
                <a
                  href="/quote-checker"
                  className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap"
                >
                  Run Quote Checker
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              <QuotesReceived
                quotes={quotes}
                onSelectTier={handleSelectTier}
                onQuoteAccepted={reloadCurrentSession}
              />
            </section>
          )}

          {/* Main overview content */}
          {activeNav === "overview" && (
            <>
              <VariationAlert variations={variations} />

              <ActiveProjectsSection jobs={jobs} quoteCounts={quoteCounts} />

              <QuotesReceived quotes={quotes} onSelectTier={handleSelectTier} onQuoteAccepted={reloadCurrentSession} />
              <MyJobs jobs={jobs} />
              <RecentSiteUpdates updates={siteUpdates} />
            </>
          )}
          </>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomeownerDashboard;
