import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell,
  MapPin,
  FileText,
  Check,
  Loader2,
  Copy,
  ChevronRight,
  Calendar,
  Building2,
} from "lucide-react";

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
}

interface TradeProfile {
  id: string;
  name: string;
  company_name: string;
  trade_type: string;
  phone: string;
}

function generateOutreachLetter(trade: TradeProfile, address: string): string {
  return `Dear Homeowner at ${address},

I noticed your recent planning approval and wanted to make contact before your project starts.

My name is ${trade.name} and I specialise in ${trade.trade_type} in your area. I am verified and insured through ProGrafter — the UK's commission-only trades marketplace.

I would be delighted to provide a free, no-obligation quote. All work is managed through ProGrafter with daily photo updates and full project documentation.

${trade.name} | ${trade.phone} | prografter.co.uk`;
}

const DashboardPlanningAlerts = ({ trade }: { trade: TradeProfile }) => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<PlanningAlert[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingLetter, setGeneratingLetter] = useState<string | null>(null);
  const [letterGenerated, setLetterGenerated] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    if (alertsRes.data) setAlerts(alertsRes.data);
    setLoading(false);
  };

  const handleGenerateLetter = async (alert: PlanningAlert) => {
    setGeneratingLetter(alert.id);
    const letter = generateOutreachLetter(trade, alert.address);

    await supabase.from("letters_sent").insert({
      trade_id: trade.id,
      application_reference: alert.application_ref,
      address: alert.address,
      letter_content: letter,
    });

    await supabase
      .from("planning_alerts")
      .update({ letter_generated: true })
      .eq("id", alert.id);

    setLetterGenerated((prev) => ({ ...prev, [alert.id]: letter }));
    setGeneratingLetter(null);
  };

  const handleCopyLetter = (alertId: string) => {
    const letter = letterGenerated[alertId];
    if (letter) {
      navigator.clipboard.writeText(letter);
      setCopiedId(alertId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

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

  // Subscribed — show alerts
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
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-secondary" />
                  <span className="font-mono text-xs text-secondary font-semibold">
                    {alert.application_ref}
                  </span>
                  <span className="bg-secondary/10 text-secondary font-mono text-[10px] px-2 py-0.5 rounded-full">
                    {alert.application_type}
                  </span>
                </div>
                <h4 className="font-heading text-primary text-sm">{alert.address}</h4>
                {alert.description && (
                  <p className="font-mono text-xs text-muted-foreground mt-1">
                    {alert.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-3">
              {alert.distance_miles != null && (
                <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {alert.distance_miles.toFixed(1)} miles
                </span>
              )}
              {alert.approved_date && (
                <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  Approved {new Date(alert.approved_date).toLocaleDateString("en-GB")}
                </span>
              )}
            </div>

            {letterGenerated[alert.id] ? (
              <div className="mt-3 space-y-3">
                <div className="bg-background rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Generated Letter
                    </span>
                    <button
                      onClick={() => handleCopyLetter(alert.id)}
                      className="flex items-center gap-1 font-mono text-[10px] text-secondary hover:text-secondary/80 transition-colors"
                    >
                      {copiedId === alert.id ? (
                        <><Check className="w-3 h-3" /> Copied</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Copy</>
                      )}
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                    {letterGenerated[alert.id]}
                  </pre>
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleGenerateLetter(alert)}
                disabled={generatingLetter === alert.id}
                className="flex items-center gap-2 bg-secondary text-white font-mono text-xs px-4 py-2 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-50"
              >
                {generatingLetter === alert.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <FileText className="w-3 h-3" />
                )}
                Generate Outreach Letter
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default DashboardPlanningAlerts;
