import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HomeownerSidebar from "@/components/homeowner/HomeownerSidebar";
import ActiveProjectsSection from "@/components/homeowner/ActiveProjectsSection";
import WelcomeBanner from "@/components/homeowner/WelcomeBanner";
import LegalReviewBanner from "@/components/LegalReviewBanner";
import QuotesReceived from "@/components/homeowner/QuotesReceived";
import MyJobs from "@/components/homeowner/MyJobs";
import RecentSiteUpdates from "@/components/homeowner/RecentSiteUpdates";
import VariationAlert from "@/components/homeowner/VariationAlert";
import GreenCertificatePack from "@/components/GreenCertificatePack";
import GreenSchemesBreakdown from "@/components/GreenSchemesBreakdown";
import { isGreenTrade } from "@/lib/greenTrades";
import { isActiveJob } from "@/lib/activeProjects";
import { BookOpen, Leaf, FolderKanban, SearchCheck, ArrowRight } from "lucide-react";
import HomeownerProfileSection from "@/components/homeowner/HomeownerProfileSection";
import { useAuthReady } from "@/hooks/useAuthReady";

const HomeownerDashboard = () => {
  const navigate = useNavigate();
  const { isReady, user } = useAuthReady();
  const [homeownerName, setHomeownerName] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  /** Server-side authoritative list of jobs that are "active" for this user.
   *  Populated by the active_projects_for_user RPC. Used by Overview, My Projects,
   *  and Manual gating so all three views always agree. */
  const [activeJobIds, setActiveJobIds] = useState<Set<string>>(new Set());
  const [quotes, setQuotes] = useState<any[]>([]);
  const [variations, setVariations] = useState<any[]>([]);
  const [siteUpdates, setSiteUpdates] = useState<any[]>([]);
  const [briefs, setBriefs] = useState<any[]>([]);
  const [freeChecks, setFreeChecks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  const [searchParams] = useSearchParams();
  const [activeNav, setActiveNav] = useState(() => {
    const tab = searchParams.get("tab");
    const valid = ["overview", "projects", "quotes", "grants", "manual", "profile"];
    return tab && valid.includes(tab) ? tab : "overview";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Keep the active tab in sync if the URL ?tab= changes (e.g. arriving from
  // "Back to dashboard" on the Quote Checks page).
  useEffect(() => {
    const tab = searchParams.get("tab");
    const valid = ["overview", "projects", "quotes", "grants", "manual", "profile"];
    if (tab && valid.includes(tab)) setActiveNav(tab);
  }, [searchParams]);

  // One-time, dismissible nudge to set a password (skip the email next time).
  const [showPasswordNudge, setShowPasswordNudge] = useState(false);
  useEffect(() => {
    if (!isReady || !user) return;
    const dismissedKey = `pg-password-nudge-dismissed-${user.id}`;
    const alreadyDismissed = localStorage.getItem(dismissedKey) === "1";
    const hasPassword = user.user_metadata?.has_password === true;
    if (!alreadyDismissed && !hasPassword) setShowPasswordNudge(true);
  }, [isReady, user]);

  const dismissPasswordNudge = () => {
    if (user) localStorage.setItem(`pg-password-nudge-dismissed-${user.id}`, "1");
    setShowPasswordNudge(false);
  };




  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      lastLoadedUserIdRef.current = null;
      setHomeownerName("");
      setJobs([]);
      setQuotes([]);
      setVariations([]);
      setSiteUpdates([]);
      setLoadError(null);
      setLoading(false);
      return;
    }

    if (user.id === lastLoadedUserIdRef.current) return;

    lastLoadedUserIdRef.current = user.id;
    void loadData(user.id);
  }, [isReady, user]);

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

    // Job briefs (the account-less-to-account spine) + free quote-check entitlements.
    const [briefRes, entRes] = await Promise.all([
      supabase
        .from("job_briefs" as any)
        .select("id, ref, job_title, trade_category_id, status, existing_quotes_count, matched_trade_count, created_at")
        .eq("homeowner_user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("quote_check_entitlements" as any)
        .select("id")
        .eq("user_id", userId)
        .is("consumed_at", null),
    ]);
    setBriefs((briefRes.data as any) || []);
    setFreeChecks(((entRes.data as any) || []).length);


    // Fetch jobs first so we can scope subsequent queries server-side.
    // Exclude is_test seed data (e.g. "Past electrical work — review #1") from production accounts.
    const { data: jobData } = await supabase
      .from("jobs")
      .select("id, title, job_type, postcode, status, stage, description, created_at, photo_urls, is_test")
      .eq("homeowner_id", ho.id)
      .eq("is_test", false)
      .order("created_at", { ascending: false });

    const jobs = jobData || [];
    setJobs(jobs);
    const jobIds = jobs.map((j: any) => j.id);

    // Authoritative active-projects list — single source of truth shared by
    // Overview, My Projects and Manual gating.
    const { data: activeRows, error: activeErr } = await supabase.rpc("active_projects_for_user", { _user_id: userId });
    if (activeErr) console.warn("active_projects_for_user RPC failed", activeErr);
    setActiveJobIds(new Set((activeRows || []).map((r: any) => r.id)));

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
        .select("id, amount, message, status, created_at, trade_id, job_id, ai_verdict, ai_verdict_summary, tier_enabled, budget_price, budget_description, standard_price, standard_description, premium_price, premium_description, selected_tier, trades:trades_public!quotes_trade_id_fkey(name, company_name, verified, review_count, avg_rating, tier, trade_type, cps_scheme, cps_registration_number, gas_safe_number), jobs(title, job_type)")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("variations")
        .select("id, title, description, materials_cost, labour_cost, programme_impact_days, status, job_id")
        .eq("status", "pending")
        .in("job_id", jobIds),
      supabase
        .from("stage_updates")
        .select("id, update_text, created_at, photo_urls, stage_id, trade_id, trades:trades_public!stage_updates_trade_id_fkey(name), project_stages(stage_name, job_id)")
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

  /** Authoritative active-jobs list. Prefers the server RPC's set when populated;
   *  falls back to the client helper if the RPC hasn't returned (offline / first paint). */
  const activeJobs = useMemo(() => {
    if (activeJobIds.size > 0) {
      return jobs.filter((j: any) => activeJobIds.has(j.id));
    }
    return jobs.filter(isActiveJob);
  }, [jobs, activeJobIds]);

  // Quote Checker prompt: surface when a brief says they already have outside quotes.
  const TRADE_TO_PROJECT_TYPE: Record<string, string> = {
    electrician: "Full Rewire",
    plumber: "Bathroom",
    gas_engineer: "Boiler/Heating Replacement",
    roofer: "Roofing",
    general_builder: "Rear Extension",
  };
  const quoteCheckerPrompt = useMemo(() => {
    const b = briefs.find((x: any) => (x.existing_quotes_count ?? 0) > 0);
    if (!b) return null;
    const projectType = TRADE_TO_PROJECT_TYPE[b.trade_category_id] || "Other";
    return { href: `/quote-checker?project_type=${encodeURIComponent(projectType)}`, jobTitle: b.job_title };
  }, [briefs]);

  const briefsUnderReview = useMemo(
    () => briefs.filter((brief: any) => brief.status === "under_review" || !brief.status),
    [briefs],
  );

  const BriefsUnderReview = () =>
    briefsUnderReview.length > 0 ? (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-4">
        <div>
          <h3 className="font-heading text-primary text-lg">Received — under review</h3>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            We're reviewing your brief before matching it with up to three vetted, local, available trades.
          </p>
        </div>
        <div className="space-y-3">
          {briefsUnderReview.map((brief: any) => (
            <div key={brief.id} className="rounded-xl border border-border/80 bg-background/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-primary text-base">{brief.job_title || "Job brief"}</p>
                  <p className="font-mono text-xs text-muted-foreground mt-1">Reference {brief.ref}</p>
                </div>
                <span className="font-mono text-[11px] text-secondary border border-secondary/30 rounded-full px-3 py-1 whitespace-nowrap">
                  Under review
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : null;



  return (
    <div className="min-h-screen dashboard-dark flex">
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

          {showPasswordNudge && (
            <div className="flex items-start gap-4 bg-secondary/10 border border-secondary/30 rounded-2xl p-4">
              <div className="flex-1">
                <p className="font-mono text-sm text-primary">
                  Want to skip the email next time?{" "}
                  <button
                    onClick={() => {
                      setActiveNav("profile");
                      dismissPasswordNudge();
                    }}
                    className="text-secondary underline underline-offset-2 hover:opacity-80"
                  >
                    Set a password
                  </button>
                  .
                </p>
              </div>
              <button
                onClick={dismissPasswordNudge}
                aria-label="Dismiss"
                className="font-mono text-xs text-muted-foreground hover:text-primary"
              >
                Dismiss
              </button>
            </div>
          )}

          <LegalReviewBanner />
          <WelcomeBanner hasProjects={jobs.length > 0} />

          {/* Homeowner Manual tab — show when there's any active project, list green ones individually */}
          {activeNav === "manual" && (
            <section className="space-y-6">
              <h2 className="font-heading text-primary text-2xl flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Homeowner Manual
              </h2>
              {(() => {
                if (activeJobs.length === 0) {
                  return (
                    <div className="bg-card rounded-2xl p-8 border border-border text-center">
                      <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="font-mono text-sm text-muted-foreground">
                        Your Homeowner Manual will be available once a project is active.
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-4">
                    {activeJobs.map((j) => (
                      <a
                        key={j.id}
                        href={`/manual/${j.id}`}
                        className="block bg-card rounded-2xl p-5 border border-border hover:border-secondary/40 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-heading text-primary text-lg flex items-center gap-2">
                              {isGreenTrade(j.job_type) && <Leaf className="w-4 h-4 text-green-500" />}
                              {j.title || j.job_type}
                            </h3>
                            <p className="font-mono text-xs text-muted-foreground mt-1">
                              Open the live manual for this project →
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                        {isGreenTrade(j.job_type) && (
                          <div className="mt-4">
                            <GreenCertificatePack jobType={j.job_type} isComplete={j.stage === "completed"} />
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                );
              })()}
            </section>
          )}

          {/* Green Grants tab — embedded scheme cards (no longer a dead-end link) */}
          {activeNav === "grants" && (
            <section>
              <h2 className="font-heading text-primary text-2xl mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-500" /> Green Grants
              </h2>
              <div className="grants-light-section -mx-4 md:-mx-8 -mt-2 rounded-2xl overflow-hidden">
                <GreenSchemesBreakdown />
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
              <BriefsUnderReview />
              <ActiveProjectsSection jobs={jobs} quoteCounts={quoteCounts} activeJobs={activeJobs} />
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

              <a
                href="/dashboard/quote-checks"
                className="block bg-card rounded-2xl p-6 border border-border shadow-sm hover:border-secondary/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-primary text-lg flex items-center gap-2">
                      <SearchCheck className="w-5 h-5" /> My Quote Checks
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground mt-1">
                      View and download PDFs of every Quote Health Check saved to your account.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </a>

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

              {quoteCheckerPrompt && (
                <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex items-start justify-between gap-4 flex-wrap">
                  <div className="max-w-lg">
                    <h3 className="font-heading text-primary text-lg flex items-center gap-2">
                      <SearchCheck className="w-5 h-5 text-secondary" /> Already got a quote? Check it's fair
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground mt-1">
                      You told us you've received quotes{quoteCheckerPrompt.jobTitle ? ` for "${quoteCheckerPrompt.jobTitle}"` : ""}.
                      Upload one and our AI flags missing line items and compares it to fair-market rates.
                      {freeChecks > 0 && <strong className="text-secondary"> Your first check is free.</strong>}
                    </p>
                  </div>
                  <a
                    href={quoteCheckerPrompt.href}
                    className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap"
                  >
                    {freeChecks > 0 ? "Run free Quote Check" : "Run Quote Checker"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <ActiveProjectsSection jobs={jobs} quoteCounts={quoteCounts} activeJobs={activeJobs} />

              <BriefsUnderReview />

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
