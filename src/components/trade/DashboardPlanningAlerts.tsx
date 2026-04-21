import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Bell,
  MapPin,
  FileText,
  Loader2,
  ChevronRight,
  Calendar,
  Building2,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import OutreachLetterModal from "./OutreachLetterModal";
import ShortlistStatusControl, { ShortlistStatus } from "./ShortlistStatusControl";

interface PlanningAlert {
  id: string;
  application_ref: string;
  address: string;
  postcode: string;
  application_type: string;
  description: string | null;
  distance_miles: number | null;
  approved_date: string | null;
  letter_generated: boolean;
  local_authority: string | null;
  viewed: boolean;
  actioned: boolean;
  planning_portal_url: string | null;
}

interface TradeProfile {
  id: string;
  name: string;
  company_name: string;
  trade_type: string;
  phone: string;
}

const LETTER_TIERS = ["pro", "ewi", "national"];

interface ShortlistRow {
  id: string;
  planning_alert_id: string;
  contact_status: ShortlistStatus;
  note: string | null;
}

const DashboardPlanningAlerts = ({ trade }: { trade: TradeProfile }) => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<PlanningAlert[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [shortlist, setShortlist] = useState<Record<string, ShortlistRow>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [letterModal, setLetterModal] = useState<PlanningAlert | null>(null);

  useEffect(() => {
    loadData();
  }, [trade.id]);

  const handleRefresh = async (days: number = 90) => {
    setRefreshing(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/process-planning-alerts?trade_id=${trade.id}&days=${days}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${anon}`, apikey: anon },
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Refresh failed");
      const label =
        days >= 365 ? "last 12 months" : days >= 180 ? "last 6 months" : "last 3 months";
      toast({
        title: "Planning feed refreshed",
        description: `${json.inserted ?? 0} new application(s) found in your area (${label}).`,
      });
      await loadData();
    } catch (e: any) {
      toast({
        title: "Refresh failed",
        description: e?.message ?? "Please try again shortly.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const loadData = async () => {
    const [subRes, alertsRes] = await Promise.all([
      supabase
        .from("planning_alert_subs")
        .select("*")
        .eq("trade_id", trade.id)
        .eq("active", true)
        .maybeSingle(),
      supabase
        .from("planning_alerts")
        .select("*")
        .eq("trade_id", trade.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (subRes.data) setSubscription(subRes.data);
    if (alertsRes.data) setAlerts(alertsRes.data as PlanningAlert[]);
    setLoading(false);
  };

  const markViewed = async (alertId: string) => {
    await supabase
      .from("planning_alerts")
      .update({ viewed: true } as any)
      .eq("id", alertId);
  };

  const handleLetterSaved = async (alert: PlanningAlert, letter: string) => {
    await supabase.from("letters_sent").insert({
      trade_id: trade.id,
      application_reference: alert.application_ref,
      address: alert.address,
      letter_content: letter,
    });

    await supabase
      .from("planning_alerts")
      .update({ letter_generated: true, actioned: true } as any)
      .eq("id", alert.id);

    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, letter_generated: true, actioned: true } : a));
  };

  const canGenerateLetter = subscription && LETTER_TIERS.includes(subscription.tier);

  // Not subscribed — show CTA
  if (!loading && !subscription) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border p-6">
        <div className="flex items-center gap-3 mb-3">
          <Bell className="w-5 h-5 text-secondary" />
          <h2 className="font-heading text-primary text-xl">Planning Intelligence</h2>
        </div>
        <p className="font-mono text-xs text-muted-foreground mb-4">
          Get notified when planning applications are approved in your area. Reach homeowners before your competitors.
        </p>
        <button
          onClick={() => navigate("/planning-alerts")}
          className="flex items-center gap-2 bg-secondary text-white font-mono text-xs px-4 py-2.5 rounded-xl hover:bg-secondary/90 transition-colors"
        >
          View Plans from £49/mo
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-secondary" />
          <h2 className="font-heading text-primary text-xl">Recent Planning Alerts</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleRefresh(90)}
            disabled={refreshing}
            className="flex items-center gap-1.5 bg-card border border-border text-primary font-mono text-[10px] px-3 py-1.5 rounded-full hover:bg-muted transition-colors disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            {refreshing ? "Refreshing…" : "Refresh (3 mo)"}
          </button>
          <button
            onClick={() => handleRefresh(180)}
            disabled={refreshing}
            className="flex items-center gap-1.5 bg-card border border-border text-primary font-mono text-[10px] px-3 py-1.5 rounded-full hover:bg-muted transition-colors disabled:opacity-60"
            title="Search the last 6 months"
          >
            6 mo
          </button>
          <button
            onClick={() => handleRefresh(365)}
            disabled={refreshing}
            className="flex items-center gap-1.5 bg-card border border-border text-primary font-mono text-[10px] px-3 py-1.5 rounded-full hover:bg-muted transition-colors disabled:opacity-60"
            title="Search the last 12 months"
          >
            12 mo
          </button>
          <span className="bg-secondary/10 text-secondary font-mono text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
            {subscription.tier}
          </span>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-border p-6 text-center space-y-3">
          <p className="font-sans text-sm text-foreground">
            No planning alerts in your area yet.
          </p>
          <p className="font-sans text-xs text-muted-foreground">
            Many councils only publish weekly. Try widening the lookback to 6 or 12 months
            to surface approved applications you may have missed — these are still warm leads.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <button
              onClick={() => handleRefresh(180)}
              disabled={refreshing}
              className="font-mono text-[10px] bg-secondary text-white px-3 py-1.5 rounded-full hover:bg-secondary/90 transition-colors disabled:opacity-60"
            >
              Search last 6 months
            </button>
            <button
              onClick={() => handleRefresh(365)}
              disabled={refreshing}
              className="font-mono text-[10px] bg-card border border-border text-primary px-3 py-1.5 rounded-full hover:bg-muted transition-colors disabled:opacity-60"
            >
              Search last 12 months
            </button>
          </div>
        </div>
      ) : (
        alerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-card rounded-2xl p-5 border border-border shadow-sm"
            onMouseEnter={() => !alert.viewed && markViewed(alert.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Building2 className="w-3.5 h-3.5 text-secondary" />
                  <span className="font-mono text-xs text-secondary font-semibold">
                    {alert.application_ref}
                  </span>
                  <span className="bg-secondary/10 text-secondary font-mono text-[10px] px-2 py-0.5 rounded-full">
                    {alert.application_type}
                  </span>
                  {!alert.viewed && (
                    <span className="bg-destructive text-white font-mono text-[10px] px-2 py-0.5 rounded-full">
                      New
                    </span>
                  )}
                  {alert.actioned && (
                    <span className="bg-secondary/20 text-secondary font-mono text-[10px] px-2 py-0.5 rounded-full">
                      Actioned
                    </span>
                  )}
                </div>
                <h4 className="font-heading text-primary text-sm">{alert.address}</h4>
                {alert.description && (
                  <p className="font-mono text-xs text-muted-foreground mt-1 line-clamp-3">
                    {alert.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-3 flex-wrap">
              {alert.local_authority && (
                <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                  <Building2 className="w-3 h-3" />
                  {alert.local_authority}
                </span>
              )}
              {alert.distance_miles != null && (
                <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {alert.distance_miles.toFixed(1)} miles
                </span>
              )}
              {alert.approved_date && (
                <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  Decision {new Date(alert.approved_date).toLocaleDateString("en-GB")}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {canGenerateLetter && !alert.letter_generated && (
                <button
                  onClick={() => setLetterModal(alert)}
                  className="flex items-center gap-2 bg-secondary text-white font-mono text-xs px-4 py-2 rounded-xl hover:bg-secondary/90 transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  Generate Letter →
                </button>
              )}
              {alert.letter_generated && (
                <span className="flex items-center gap-1 font-mono text-[10px] text-secondary">
                  <Sparkles className="w-3 h-3" />
                  Letter generated
                </span>
              )}
              {alert.planning_portal_url && (
                <a
                  href={alert.planning_portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View on Planning Portal →
                </a>
              )}
            </div>
          </div>
        ))
      )}

      {/* Outreach letter modal */}
      {letterModal && (
        <OutreachLetterModal
          open={!!letterModal}
          onClose={() => setLetterModal(null)}
          tradeName={trade.name}
          companyName={trade.company_name}
          tradeType={trade.trade_type}
          phone={trade.phone}
          address={letterModal.address}
          onSave={(letter) => {
            handleLetterSaved(letterModal, letter);
            setLetterModal(null);
          }}
        />
      )}
    </div>
  );
};

export default DashboardPlanningAlerts;
