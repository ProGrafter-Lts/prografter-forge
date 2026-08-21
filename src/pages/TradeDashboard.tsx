import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BadgeCheck } from "lucide-react";
import { GreenSpecialistBanner, CertificationsSection } from "@/components/GreenCertBadges";
import { GreenLeafBadge } from "@/lib/greenTrades";
import DashboardPlanningAlerts from "@/components/trade/DashboardPlanningAlerts";
import TradeSidebar from "@/components/trade/TradeSidebar";
import StatsRow from "@/components/trade/StatsRow";
import JobMatchesList from "@/components/trade/JobMatchesList";
import ActiveProjectsList from "@/components/trade/ActiveProjectsList";
import MorningBriefing from "@/components/trade/MorningBriefing";
import LiveMarginWidget from "@/components/trade/LiveMarginWidget";
import CalendarConnect from "@/components/trade/CalendarConnect";
import TradeProfileSection from "@/components/trade/TradeProfileSection";
import AddSpecialismsBanner from "@/components/trade/AddSpecialismsBanner";
import PipelineSection from "@/components/trade/PipelineSection";
import QuotesList from "@/components/trade/QuotesList";
import AvailableJobsView from "@/components/trade/AvailableJobsView";
import TradeVaultSection from "@/components/trade/tradevault/TradeVaultSection";
import TradeVaultBanners from "@/components/trade/tradevault/TradeVaultBanners";
import ActiveProjectsView from "@/components/trade/ActiveProjectsView";
import EarningsView from "@/components/trade/EarningsView";
import { useTradeAccess } from "@/hooks/useTradeAccess";
import { isContractedActiveJob } from "@/lib/activeProjects";
import LegalReviewBanner from "@/components/LegalReviewBanner";
import QuickBuildDraftsList from "@/components/trade/quickbuild/QuickBuildDraftsList";
import CommandCentre from "@/components/trade/CommandCentre";
import BusinessHealthDashboard from "@/components/trade/BusinessHealthDashboard";
import type { PriorityNav } from "@/lib/businessHealth";
import type { PriorityTarget } from "@/lib/tradeProfileStrength";
import { isFeatureEnabled } from "@/lib/featureFlags";

interface TradeProfile {
  name: string;
  company_name: string;
  verified: boolean;
  trade_type: string;
  id: string;
  phone: string;
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
  specialisms_prompt_seen: boolean;
  completed_jobs_count: number;
  review_count: number;
  avg_rating: number | null;
  tier: string | null;
  verification_status: string | null;
  submitted_for_review_at: string | null;
}

const TradeDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isReady, loading: tradeAccessLoading, trade: tradeAccess, error: tradeAccessError } = useTradeAccess({
    redirectToSetup: false,
  });
  const [trade, setTrade] = useState<TradeProfile | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Margin data - derived from quotes and project stages
  const [marginData, setMarginData] = useState({ totalQuoted: 0, totalCosts: 0, totalReceived: 0 });

  useEffect(() => {
    if (!isReady) return;

    if (!tradeAccess) {
      if (tradeAccessError) {
        setTrade(null);
        setLoading(false);
        return;
      }

      setTrade(null);
      setLoading(tradeAccessLoading);
      return;
    }

    if (trade?.id === tradeAccess.id && !loadError) {
      setLoading(false);
      return;
    }

    void loadDashboardData(tradeAccess.id);
  }, [isReady, tradeAccess, tradeAccessError, tradeAccessLoading]);

  const loadDashboardData = async (tradeId: string) => {
    setLoading(true);
    setLoadError(null);

    try {
      const { data: tradeData, error: tradeError } = await supabase
        .from("trades")
        .select("id, name, company_name, verified, trade_type, phone, is_green_trade, mcs_number, trustmark_number, pas_2030_accredited, pas_2035_coordinator, ozev_approved, fgas_registered, ciga_registered, inca_certified, green_cert_expiry, specialisms_prompt_seen, completed_jobs_count, review_count, avg_rating, tier, verification_status, submitted_for_review_at")
        .eq("id", tradeId)
        .maybeSingle();

      if (tradeError) {
        console.error("Failed to load trade profile", tradeError);
        setLoadError("We couldn't load your trade dashboard right now.");
        setLoading(false);
        return;
      }

      if (!tradeData) {
        setTrade(null);
        setLoadError("We couldn't find your trade profile.");
        navigate("/signup/trade", { replace: true });
        return;
      }
      setTrade(tradeData);
      // Render the shell immediately — secondary data fills in below.
      setLoading(false);

      const [matchRes, quoteRes, contractRes] = await Promise.all([
        supabase
          .from("job_matches")
          .select("id, job_id, estimated_value, notified_at, status, interested_at")
          .eq("trade_id", tradeData.id)
          .eq("status", "notified")
          .order("notified_at", { ascending: false })
          .limit(5),
        supabase
          .from("quotes")
          .select("id, amount, status, created_at, job_id, jobs(id, title, job_type, postcode, stage)")
          .eq("trade_id", tradeData.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("contracts")
          .select("job_id, jobs(id, title, job_type, postcode, stage)")
          .eq("trade_id", tradeData.id),
      ]);

      if (matchRes.error) console.error("Failed to load job matches", matchRes.error);
      if (quoteRes.error) console.error("Failed to load quotes", quoteRes.error);
      if (contractRes.error) console.error("Failed to load active contracts", contractRes.error);

      const rawMatches = matchRes.data || [];
      const matchedJobIds = Array.from(new Set(rawMatches.map((match: any) => match.job_id).filter(Boolean)));

      const matchedJobsRes = matchedJobIds.length
        ? await supabase
            .from("jobs")
            .select("id, title, job_type, postcode, description, funds_verified")
            .in("id", matchedJobIds)
        : { data: [], error: null };

      if (matchedJobsRes.error) console.error("Failed to load job details for matches", matchedJobsRes.error);

      const matchedJobsById = new Map(
        (matchedJobsRes.data || []).map((job: any) => [job.id, job]),
      );

      const allQuotes = quoteRes.data || [];
      const contractJobs = Array.from(
        new Map(
          (contractRes.data || [])
            .map((contract: any) => contract.jobs)
            .filter((job: any) => job && isContractedActiveJob(job))
            .map((job: any) => [job.id, job]),
        ).values(),
      ).slice(0, 10);
      const projectJobIds = Array.from(new Set((contractRes.data || []).map((contract: any) => contract.job_id)));

      const stagePaymentRes = projectJobIds.length
        ? await supabase
            .from("project_stages")
            .select("payment_amount, payment_status")
            .in("job_id", projectJobIds)
        : { data: [] };

      const hydratedMatches = rawMatches.map((match: any) => ({
        ...match,
        jobs: matchedJobsById.get(match.job_id) ?? null,
      }));

      setMatches(hydratedMatches);
      setQuotes(allQuotes.filter((quote: any) => quote.status === "pending"));
      setActiveProjects(contractJobs);

      const totalQuoted = allQuotes.reduce((sum: number, quote: any) => sum + Number(quote.amount || 0), 0);
      const totalReceived = (stagePaymentRes.data || [])
        .filter((stage: any) => stage.payment_status === "paid")
        .reduce((sum: number, stage: any) => sum + Number(stage.payment_amount || 0), 0);
      const totalCosts = Math.round(totalQuoted * 0.65);

      setMarginData({ totalQuoted, totalCosts, totalReceived });
    } catch (error) {
      console.error("Trade dashboard bootstrap failed", error);
      setLoadError(error instanceof Error ? error.message : "We couldn't load your trade dashboard right now.");
    } finally {
      setLoading(false);
    }
  };

  const completedCount = trade?.completed_jobs_count ?? 0;
  const rating = trade?.avg_rating ? Number(trade.avg_rating) : 0;
  const pipelineFilter = searchParams.get("pipeline");
  const viewFilter = searchParams.get("view");

  /**
   * Dashboard views are driven by the ?view= URL param (same as the sidebar).
   * Calling setActiveNav alone gets reverted by the URL-sync effect below,
   * which is why in-page buttons appeared to only scroll to the top.
   */
  const goToView = (view: string) => {
    setActiveNav(view);
    navigate(view === "dashboard" ? "/dashboard/trade" : `/dashboard/trade?view=${view}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goTo = (target: PriorityTarget) => {
    switch (target) {
      case "tradevault":
        goToView("tradevault");
        break;
      case "jobs":
        goToView("jobs");
        break;
      case "profile":
      case "specialisms":
        goToView("profile");
        break;
      case "settings":
        navigate("/dashboard/trade/settings");
        break;
      case "planning":
        navigate("/planning-alerts");
        break;
    }
  };

  const handleHealthNav = (target: PriorityNav) => {
    if (target === "find-work") {
      navigate("/planning-alerts");
      return;
    }
    const map: Record<Exclude<PriorityNav, "find-work">, string> = {
      pipeline: "pipeline",
      quotes: "quotes",
      tradevault: "tradevault",
      profile: "profile",
      calendar: "calendar",
      messages: "messages",
    };
    goToView(map[target] ?? "dashboard");
  };



  useEffect(() => {
    const validViews = ["dashboard", "jobs", "projects", "earnings", "profile", "tradevault", "pipeline", "quotes", "calendar", "messages"];

    if (viewFilter && validViews.includes(viewFilter)) {
      setActiveNav(viewFilter);
      return;
    }

    if (!viewFilter && activeNav !== "dashboard") {
      setActiveNav("dashboard");
    }
  }, [activeNav, viewFilter]);

  useEffect(() => {
    if (!pipelineFilter) return;
    setActiveNav("dashboard");
    const jumpToPipeline = window.setTimeout(() => {
      document.getElementById("planning-alerts-list")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);

    return () => window.clearTimeout(jumpToPipeline);
  }, [pipelineFilter]);

  return (
    <div className="min-h-screen dashboard-dark flex">
      <TradeSidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-10">
          {!isReady || tradeAccessLoading ? (
            <div className="min-h-[40vh] flex items-center justify-center font-mono text-sm text-muted-foreground">
              Loading dashboard…
            </div>
          ) : tradeAccessError && !trade ? (
            <div className="min-h-[40vh] flex items-center justify-center px-6 text-center font-mono text-sm text-muted-foreground">
              {tradeAccessError}
            </div>
          ) : loading && !trade ? (
            <div className="min-h-[40vh] flex items-center justify-center font-mono text-sm text-muted-foreground">
              Loading dashboard…
            </div>
          ) : loadError && !trade ? (
            <div className="min-h-[40vh] flex items-center justify-center px-6 text-center font-mono text-sm text-muted-foreground">
              {loadError}
            </div>
          ) : (
            <>
          <LegalReviewBanner />
          {/* Incomplete application banner */}
          {trade?.verification_status === "pending" && !trade?.submitted_for_review_at && (
            <div
              className="mt-10 md:mt-0 p-4 rounded-xl font-body text-sm"
              style={{ backgroundColor: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.35)", color: "#FDE68A" }}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#FCD34D" }}>
                    Application incomplete
                  </p>
                  <p>
                    You've created your account, but your trade application isn't finished yet. Complete the remaining steps so we can review your profile and get you on the platform.
                  </p>
                </div>
                <a
                  href="/apply"
                  className="inline-block font-mono text-xs px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#FCD34D", color: "#0F2238" }}
                >
                  Complete application
                </a>
              </div>
            </div>
          )}
          {/* Verification banner */}
          {trade?.verification_status && trade.verification_status !== "approved" && trade.verification_status !== "verified" && trade?.submitted_for_review_at && (() => {
            const status = trade.verification_status;
            const palette =
              status === "info_requested"
                ? { bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.35)", accent: "#FCD34D", text: "#FDE68A" }
                : status === "rejected"
                ? { bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.35)", accent: "#FCA5A5", text: "#FECACA" }
                : { bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.35)", accent: "#93C5FD", text: "#DBEAFE" };
            const isAssessment = status === "pending_assessment";
            return (
              <div
                className="mt-10 md:mt-0 p-4 rounded-xl font-body text-sm"
                style={{ backgroundColor: palette.bg, border: `1px solid ${palette.border}`, color: palette.text }}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: palette.accent }}>
                      {isAssessment ? "Experience assessment" : `Verification ${status.replace(/_/g," ")}`}
                    </p>
                    <p>
                      {isAssessment && "Your experience is being assessed — we'll be in touch shortly."}
                      {(status === "pending" || status === "pending_verification" || status === "pending_docs") && "Your application is being reviewed. We typically respond within 1 business day."}
                      {status === "info_requested" && "We need a little more info before we can verify you."}
                      {status === "rejected" && "Your application wasn't approved. See details on the status page."}
                    </p>
                  </div>
                  <a
                    href={isAssessment ? "/signup/trade/assessment-pending" : "/signup/trade/under-review"}
                    className="inline-block font-mono text-xs px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: palette.accent, color: "#0F2238" }}
                  >
                    View status
                  </a>
                </div>
              </div>
            );
          })()}

          {/* Welcome header — hidden on the dashboard view, where the Business Health hero takes over */}
          {activeNav !== "dashboard" && (
          <div className="flex items-center gap-3 pt-10 md:pt-0">
            <div>
              <h1 className="font-heading text-primary text-3xl md:text-4xl">
                Welcome back, {trade?.name || "Trade"}
              </h1>
              <p className="font-mono text-sm text-muted-foreground mt-1">
                {trade?.company_name} · {trade?.trade_type}
              </p>
            </div>
            {trade?.verification_status === "approved" && (
              <span className="flex items-center gap-1 bg-secondary/10 text-secondary px-3 py-1 rounded-full font-mono text-xs">
                <BadgeCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
            {trade?.is_green_trade && <GreenLeafBadge />}
          </div>
          )}

          {trade && <GreenSpecialistBanner show={trade.is_green_trade} />}

          {activeNav === "profile" && trade && (
            <TradeProfileSection tradeId={trade.id} />
          )}

          {activeNav === "jobs" && trade && (
            <AvailableJobsView tradeId={trade.id} />
          )}

          {activeNav === "projects" && trade && (
            <ActiveProjectsView tradeId={trade.id} />
          )}

          {activeNav === "earnings" && trade && (
            <EarningsView
              tradeId={trade.id}
              totalReceived={marginData.totalReceived}
              totalQuoted={marginData.totalQuoted}
            />
          )}

          {activeNav === "tradevault" && trade && (
            <TradeVaultSection tradeId={trade.id} />
          )}

          {/* Pipeline (full view) */}
          {activeNav === "pipeline" && trade && (
            <PipelineSection tradeId={trade.id} />
          )}

          {/* Quotes (full view) */}
          {activeNav === "quotes" && trade && (
            <div className="space-y-6">
              <div>
                <h1 className="font-heading text-primary text-3xl">Quotes</h1>
                <p className="font-mono text-sm text-muted-foreground mt-1">Track and manage your submitted quotes.</p>
              </div>
              <QuotesList quotes={quotes} />
            </div>
          )}

          {/* Calendar (full view) */}
          {activeNav === "calendar" && trade && (
            <div className="space-y-6">
              <div>
                <h1 className="font-heading text-primary text-3xl">Calendar</h1>
                <p className="font-mono text-sm text-muted-foreground mt-1">Sync your jobs and site visits to your calendar.</p>
              </div>
              <CalendarConnect variant="full" />
            </div>
          )}

          {/* Messages (full view) */}
          {activeNav === "messages" && trade && (
            <div className="space-y-6">
              <div>
                <h1 className="font-heading text-primary text-3xl">Messages</h1>
                <p className="font-mono text-sm text-muted-foreground mt-1">Conversations with homeowners appear here.</p>
              </div>
              <div
                className="rounded-xl p-12 text-center"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <p className="font-mono text-sm text-muted-foreground">
                  No messages yet. Once a homeowner starts a conversation, it'll show up here.
                </p>
              </div>
            </div>
          )}

          {activeNav === "dashboard" && (
          <>
          {/* Slim eligibility / document banners only — shown near the top when action is required */}
          {trade && (
            <TradeVaultBanners tradeId={trade.id} onOpenVault={() => goToView("tradevault")} />
          )}

          {/* Summary / triage: one compact card per sidebar section, real numbers only */}
          {trade && <DashboardSummary tradeId={trade.id} onOpenView={goToView} />}

          {trade && (
            <AddSpecialismsBanner
              tradeId={trade.id}
              promptSeen={trade.specialisms_prompt_seen}
              onAdd={() => goToView("profile")}
            />
          )}
          </>
          )}



            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default TradeDashboard;
