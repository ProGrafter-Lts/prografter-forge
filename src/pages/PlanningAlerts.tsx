import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell,
  Zap,
  Leaf,
  Globe,
  Check,
  ChevronRight,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TIERS = [
  {
    id: "daily",
    name: "Daily Alerts",
    price: "£49",
    period: "/mo",
    icon: Bell,
    description:
      "Daily email of approved householder planning applications within your chosen radius, filtered by your trade type.",
    features: [
      "Daily digest email at 6am",
      "Filter by 5/10/20/30 mile radius",
      "Matched to your trade type",
      "Application address & reference",
    ],
    color: "border-border",
    accent: "bg-muted/10",
    iconColor: "text-primary",
  },
  {
    id: "ewi",
    name: "EWI Specialist",
    price: "£79",
    period: "/mo",
    icon: Leaf,
    description:
      "Instant notifications for EWI, solid wall insulation, and external render approvals. Includes auto-letter generation.",
    features: [
      "Instant alerts (not daily)",
      "EWI, insulation & render only",
      "Auto outreach letter generation",
      "Branded ProGrafter letterhead",
    ],
    color: "border-green-500/30",
    accent: "bg-green-500/5",
    iconColor: "text-green-600",
    badge: "SPECIALIST",
  },
  {
    id: "pro",
    name: "Pro Outreach",
    price: "£99",
    period: "/mo",
    icon: Zap,
    popular: true,
    description:
      "All daily alerts plus one-click branded outreach letter generation for every application. Auto-addressed to site.",
    features: [
      "Everything in Daily Alerts",
      "One-click letter generation",
      "Auto-addressed to applicant",
      "Edit before sending",
    ],
    color: "border-secondary/40",
    accent: "bg-secondary/5",
    iconColor: "text-secondary",
  },
  {
    id: "national",
    name: "National",
    price: "£199",
    period: "/mo",
    icon: Globe,
    description:
      "Unlimited radius. All project types including commercial, HMO, and new-build. AI prioritisation score per application.",
    features: [
      "Unlimited radius — nationwide",
      "Commercial, HMO & new-build",
      "AI priority scoring",
      "Letter generation included",
    ],
    color: "border-primary/20",
    accent: "bg-primary/5",
    iconColor: "text-primary",
  },
];

const RADIUS_OPTIONS = [5, 10, 20, 30];

const PlanningAlerts = () => {
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(false);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [tradeId, setTradeId] = useState<string | null>(null);

  useEffect(() => {
    checkExistingSub();
  }, []);

  const checkExistingSub = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }

    const { data: trade } = await supabase
      .from("trades")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!trade) { navigate("/login"); return; }
    setTradeId(trade.id);

    const { data: sub } = await supabase
      .from("planning_alert_subs")
      .select("*")
      .eq("trade_id", trade.id)
      .eq("active", true)
      .maybeSingle();

    if (sub) setActiveSub(sub);
  };

  const handleSubscribe = async (tierId: string) => {
    if (!tradeId) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      // Create subscription record (pending Stripe)
      const { error } = await supabase.from("planning_alert_subs").insert({
        trade_id: tradeId,
        tier: tierId,
        radius_miles: tierId === "national" ? 999 : radius,
        active: true,
      });

      if (error) throw error;

      toast({
        title: "Subscription activated",
        description: `Your ${TIERS.find(t => t.id === tierId)?.name} plan is now active. Alerts will start arriving shortly.`,
      });

      setActiveSub({ tier: tierId, radius_miles: radius, active: true });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        {/* Back nav */}
        <button
          onClick={() => navigate("/dashboard/trade")}
          className="flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-primary text-4xl md:text-5xl mb-3">
            Planning Intelligence
          </h1>
          <p className="font-mono text-sm text-muted-foreground max-w-xl mx-auto">
            Get notified when relevant planning applications are approved in your area.
            Reach homeowners before your competitors.
          </p>
        </div>

        {/* Active subscription banner */}
        {activeSub && (
          <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-5 mb-8 flex items-center gap-3">
            <Check className="w-5 h-5 text-secondary" />
            <div>
              <span className="font-heading text-primary">
                Active: {TIERS.find(t => t.id === activeSub.tier)?.name}
              </span>
              <span className="font-mono text-xs text-muted-foreground ml-2">
                {activeSub.radius_miles < 999 ? `${activeSub.radius_miles} mile radius` : "Nationwide"}
              </span>
            </div>
          </div>
        )}

        {/* Radius selector (for non-national tiers) */}
        {!activeSub && (
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="font-mono text-xs text-muted-foreground">Alert radius:</span>
            <div className="flex gap-2">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-all ${
                    radius === r
                      ? "bg-secondary text-white border-secondary"
                      : "border-border text-muted-foreground hover:border-secondary/40"
                  }`}
                >
                  {r} mi
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            const isActive = activeSub?.tier === tier.id;

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl p-6 border-2 transition-all ${tier.accent} ${
                  isActive
                    ? "border-secondary shadow-lg"
                    : selectedTier === tier.id
                    ? "border-secondary/60 shadow-md"
                    : tier.color
                } hover:shadow-sm`}
              >
                {tier.popular && !activeSub && (
                  <span className="absolute -top-3 left-6 bg-secondary text-white font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                {tier.badge && (
                  <span className="absolute -top-3 left-6 bg-green-500 text-white font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                    {tier.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute -top-3 right-6 bg-secondary text-white font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${tier.accent}`}>
                      <Icon className={`w-5 h-5 ${tier.iconColor}`} />
                    </div>
                    <span className="font-heading text-primary text-xl">{tier.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-heading text-3xl text-primary">{tier.price}</span>
                    <span className="font-mono text-xs text-muted-foreground">{tier.period}</span>
                  </div>
                </div>

                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">
                  {tier.description}
                </p>

                <ul className="space-y-2 mb-5">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 font-mono text-xs text-foreground">
                      <Check className="w-3 h-3 text-secondary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {!isActive && (
                  <button
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={loading}
                    className={`w-full flex items-center justify-center gap-2 font-mono text-sm px-4 py-3 rounded-xl transition-colors disabled:opacity-50 ${
                      tier.popular
                        ? "bg-secondary text-white hover:bg-secondary/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    Subscribe Now
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="font-mono text-[10px] text-muted-foreground text-center mt-8">
          Cancel anytime. Alerts begin within 24 hours of subscribing. Data sourced from local authority planning portals.
        </p>
      </div>
    </div>
  );
};

export default PlanningAlerts;
