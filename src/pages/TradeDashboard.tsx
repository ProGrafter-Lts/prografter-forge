import { useEffect, useRef, useState } from "react";
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
import QuotesList from "@/components/trade/QuotesList";
import LiveMarginWidget from "@/components/trade/LiveMarginWidget";
import CalendarConnect from "@/components/trade/CalendarConnect";
import TradeProfileSection from "@/components/trade/TradeProfileSection";
import AddSpecialismsBanner from "@/components/trade/AddSpecialismsBanner";
import PipelineSection from "@/components/trade/PipelineSection";
import AvailableJobsView from "@/components/trade/AvailableJobsView";
import ActiveProjectsView from "@/components/trade/ActiveProjectsView";
import EarningsView from "@/components/trade/EarningsView";
import { useAuthReady } from "@/hooks/useAuthReady";

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
}

const TradeDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isReady, user } = useAuthReady();
  const [trade, setTrade] = useState<TradeProfile | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  // Margin data - derived from quotes and project stages
  const [marginData, setMarginData] = useState({ totalQuoted: 0, totalCosts: 0, totalReceived: 0 });

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      lastLoadedUserIdRef.current = null;
      setTrade(null);
      setLoading(false);
      return;
    }

    if (user.id === lastLoadedUserIdRef.current) return;
    lastLoadedUserIdRef.current = user.id;
    void loadDashboardData(user.id);
  }, [isReady, user]);

  const loadDashboardData = async (userId: string) => {
    setLoading(true);
    setLoadError(null);

    try {
      const { data: tradeData, error: tradeError } = await supabase
        .from("trades")
        .select("id, name, company_name, verified, trade_type, phone, is_green_trade, mcs_number, trustmark_number, pas_2030_accredited, pas_2035_coordinator, ozev_approved, fgas_registered, ciga_registered, inca_certified, green_cert_expiry, specialisms_prompt_seen, completed_jobs_count, review_count, avg_rating, tier")
        .eq("user_id", userId)
        .maybeSingle();

      if (tradeError) {
        console.error("Failed to load trade profile", tradeError);
        setLoadError("We couldn't load your trade dashboard right now.");
        setLoading(false);
        return;
      }

      if (!tradeData) {
        setTrade(null);
        // Signed-in user has no trade record — likely a homeowner.
        // Send them to the homeowner dashboard so they don't sit on a blank trade screen.
        const { data: homeownerRow } = await supabase
          .from("homeowners")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        navigate(homeownerRow ? "/dashboard/homeowner" : "/register/trade", { replace: true });
        return;
      }
      setTrade(tradeData);
      // Render the shell immediately — secondary data fills in below.
      setLoading(false);

      const [matchRes, quoteRes, contractRes] = await Promise.all([
        supabase
          .from("job_matches")
          .select("id, job_id, estimated_value, notified_at, status")
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
      const activeStages = ["scheduled", "in_progress", "review"];
      const contractJobs = Array.from(
        new Map(
          (contractRes.data || [])
            .map((contract: any) => contract.jobs)
            .filter((job: any) => job && activeStages.includes(job.stage))
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
    <div className="min-h-screen bg-background flex">
      <TradeSidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          {loading && !trade ? (
            <div className="min-h-[40vh] flex items-center justify-center font-mono text-sm text-muted-foreground">
              Loading dashboard…
            </div>
          ) : loadError && !trade ? (
            <div className="min-h-[40vh] flex items-center justify-center px-6 text-center font-mono text-sm text-muted-foreground">
              {loadError}
            </div>
          ) : (
            <>
          {/* Welcome header */}
          <div className="flex items-center gap-3 pt-10 md:pt-0">
            <div>
              <h1 className="font-heading text-primary text-3xl md:text-4xl">
                Welcome back, {trade?.name || "Trade"}
              </h1>
              <p className="font-mono text-sm text-muted-foreground mt-1">
                {trade?.company_name} · {trade?.trade_type}
              </p>
            </div>
            {trade?.verified && (
              <span className="flex items-center gap-1 bg-secondary/10 text-secondary px-3 py-1 rounded-full font-mono text-xs">
                <BadgeCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
            {trade?.is_green_trade && <GreenLeafBadge />}
          </div>

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

          {activeNav === "dashboard" && (
          <>
          {trade && (
            <AddSpecialismsBanner
              tradeId={trade.id}
              promptSeen={trade.specialisms_prompt_seen}
              onAdd={() => setActiveNav("profile")}
            />
          )}
          <StatsRow
            jobsWon={completedCount}
            earningsThisMonth={marginData.totalReceived}
            activeProjectCount={activeProjects.length}
            rating={rating}
          />

          <CalendarConnect variant="compact" />

          {trade && <PipelineSection tradeId={trade.id} />}

          <JobMatchesList matches={matches} />

          <ActiveProjectsList projects={activeProjects} />

          <LiveMarginWidget
            totalQuoted={marginData.totalQuoted}
            totalCosts={marginData.totalCosts}
            totalReceived={marginData.totalReceived}
          />

          {trade && <DashboardPlanningAlerts trade={trade} />}
          {trade && trade.is_green_trade && <CertificationsSection trade={trade} />}

          <QuotesList quotes={quotes} />
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
