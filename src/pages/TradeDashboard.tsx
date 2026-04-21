import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
}

const TradeDashboard = () => {
  const navigate = useNavigate();
  const [trade, setTrade] = useState<TradeProfile | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Margin data - derived from quotes and project stages
  const [marginData, setMarginData] = useState({ totalQuoted: 0, totalCosts: 0, totalReceived: 0 });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: tradeData } = await supabase
      .from("trades")
      .select("id, name, company_name, verified, trade_type, phone, is_green_trade, mcs_number, trustmark_number, pas_2030_accredited, pas_2035_coordinator, ozev_approved, fgas_registered, ciga_registered, inca_certified, green_cert_expiry, specialisms_prompt_seen")
      .eq("user_id", user.id)
      .single();

    if (!tradeData) return;
    setTrade(tradeData);

    // Parallel data fetches
    const [matchRes, quoteRes, projectRes, stagePaymentRes] = await Promise.all([
      supabase
        .from("job_matches")
        .select("id, estimated_value, notified_at, status, jobs(title, job_type, postcode, description, funds_verified)")
        .eq("trade_id", tradeData.id)
        .eq("status", "notified")
        .order("notified_at", { ascending: false })
        .limit(5),
      supabase
        .from("quotes")
        .select("id, amount, status, created_at, jobs(title, job_type, postcode)")
        .eq("trade_id", tradeData.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("jobs")
        .select("id, title, job_type, postcode, stage")
        .in("stage", ["scheduled", "in_progress", "review"])
        .limit(10),
      supabase
        .from("project_stages")
        .select("payment_amount, payment_status")
        .in("status", ["pending", "in_progress", "completed"]),
    ]);

    if (matchRes.data) setMatches(matchRes.data);
    if (quoteRes.data) setQuotes(quoteRes.data);
    if (projectRes.data) setActiveProjects(projectRes.data);

    // Calculate margin from all quotes for this trade
    const { data: allQuotes } = await supabase
      .from("quotes")
      .select("amount, status")
      .eq("trade_id", tradeData.id);

    const totalQuoted = allQuotes?.reduce((sum, q) => sum + Number(q.amount), 0) || 0;
    const totalReceived = stagePaymentRes.data
      ?.filter(s => s.payment_status === "paid")
      .reduce((sum, s) => sum + Number(s.payment_amount || 0), 0) || 0;
    // Estimate costs at ~65% of quoted (placeholder until real cost tracking)
    const totalCosts = Math.round(totalQuoted * 0.65);

    setMarginData({ totalQuoted, totalCosts, totalReceived });
  };

  const completedCount = 0;
  const rating = 0;

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

          {activeNav !== "profile" && (
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
        </div>
      </main>
    </div>
  );
};

export default TradeDashboard;
