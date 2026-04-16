import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";
import OutreachLetterModal from "./OutreachLetterModal";

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

const DashboardPlanningAlerts = ({ trade }: { trade: TradeProfile }) => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<PlanningAlert[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [letterModal, setLetterModal] = useState<PlanningAlert | null>(null);

  useEffect(() => {
    loadData();
  }, [trade.id]);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-secondary" />
          <h2 className="font-heading text-primary text-xl">Today's Planning Alerts</h2>
        </div>
        <span className="bg-secondary/10 text-secondary font-mono text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
          {subscription.tier}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-border p-6 text-center">
          <p className="font-mono text-xs text-muted-foreground">
            No new alerts today. We scan daily at 6am and will notify you when matching applications are found.
          </p>
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
