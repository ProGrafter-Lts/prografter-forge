import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTradeAccess } from "@/hooks/useTradeAccess";
import {
  Bell,
  Zap,
  Leaf,
  Globe,
  Check,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";

const TIERS = [
  {
    id: "daily",
    name: "Daily Alerts",
    price: 49,
    icon: Bell,
    description:
      "Daily email digest of approved householder planning applications within your chosen radius, filtered by your trade type.",
    bestFor: "Best for: general builders, electricians, plumbers",
    features: [
      "Daily digest email at 6am",
      "Filter by radius (5–50 miles)",
      "Matched to your trade type",
      "Application address & reference",
      "Distance from your postcode",
    ],
    accent: "bg-muted/10",
    iconColor: "text-primary",
    borderColor: "border-border",
  },
  {
    id: "ewi",
    name: "EWI Specialist",
    price: 79,
    icon: Leaf,
    description:
      "Instant notifications for EWI, solid wall insulation, external render, and external cladding approvals. INCA-standard outreach letter included.",
    bestFor: "Best for: EWI and insulation specialists",
    features: [
      "Instant alerts (not daily)",
      "EWI, insulation, render & cladding",
      "Auto outreach letter generation",
      "INCA-standard letter template",
    ],
    accent: "bg-green-500/5",
    iconColor: "text-green-600",
    borderColor: "border-green-500/30",
    badge: "SPECIALIST",
  },
  {
    id: "pro",
    name: "Pro Outreach",
    price: 99,
    icon: Zap,
    popular: true,
    description:
      "All daily alerts plus one-click branded outreach letter generation for every application. Auto-addressed to the planning application site.",
    bestFor: "Best for: active sales-focused trades",
    features: [
      "Everything in Daily Alerts",
      "One-click letter generation",
      "Auto-addressed to applicant site",
      "Edit before sending/copying",
    ],
    accent: "bg-secondary/5",
    iconColor: "text-secondary",
    borderColor: "border-secondary/40",
  },
  {
    id: "national",
    name: "National Intelligence",
    price: 199,
    icon: Globe,
    description:
      "Unlimited radius, all project types including commercial, HMO, and new-build applications. AI priority score per application. Weekly market report.",
    bestFor: "Best for: regional and national contractors",
    features: [
      "Unlimited radius — nationwide",
      "Commercial, HMO & new-build",
      "AI priority scoring",
      "Letter generation included",
      "Weekly market report",
    ],
    accent: "bg-primary/5",
    iconColor: "text-primary",
    borderColor: "border-primary/20",
  },
];

const RADIUS_MARKS = [5, 10, 20, 30, 50];

const TRADE_TYPES = [
  "Builder", "Electrician", "Plumber", "Roofer", "Plasterer",
  "Carpenter / Joiner", "Painter & Decorator", "Kitchen Fitter",
  "Bathroom Fitter", "EWI / Insulation", "Landscaper", "Groundworker",
  "Window Fitter", "Heating Engineer", "Solar / Renewables",
];

const PlanningAlerts = () => {
  const navigate = useNavigate();
  const { isReady: tradeReady, loading: tradeLoading, trade, error: tradeError } = useTradeAccess({
    redirectToSetup: true,
  });
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [radius, setRadius] = useState(10);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [tradeId, setTradeId] = useState<string | null>(null);
  const [tradeType, setTradeType] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    if (!trade) {
      if (tradeReady && !tradeLoading) {
        setTradeId(null);
        setTradeType("");
      }
      return () => {
        cancelled = true;
      };
    }

    setTradeId(trade.id);
    setTradeType(trade.trade_type);
    setSelectedTypes((prev) => (prev.length ? prev : [trade.trade_type]));

    const loadSubscription = async () => {
      const { data: sub } = await supabase
        .from("planning_alert_subs")
        .select("*")
        .eq("trade_id", trade.id)
        .eq("active", true)
        .maybeSingle();

      if (!cancelled && sub) setActiveSub(sub);
    };

    void loadSubscription();

    return () => {
      cancelled = true;
    };
  }, [trade, tradeLoading, tradeReady]);

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleSubscribe = async () => {
    if (!tradeId || !selectedTier) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const { error } = await supabase.from("planning_alert_subs").insert({
        trade_id: tradeId,
        tier: selectedTier,
        radius_miles: selectedTier === "national" ? 999 : radius,
        active: true,
      });

      if (error) throw error;

      setStep(5);
      setActiveSub({ tier: selectedTier, radius_miles: radius, active: true });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const tier = TIERS.find(t => t.id === selectedTier);

  if (!tradeReady || tradeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-sm text-muted-foreground">Loading planning alerts…</div>
      </div>
    );
  }

  if (tradeError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 text-center">
        <div className="font-mono text-sm text-muted-foreground">{tradeError}</div>
      </div>
    );
  }

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
        {activeSub && step !== 5 && (
          <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Check className="w-5 h-5 text-secondary shrink-0" />
              <div>
                <span className="font-heading text-primary">
                  Active: {TIERS.find(t => t.id === activeSub.tier)?.name}
                </span>
                <span className="font-mono text-xs text-muted-foreground ml-2">
                  {activeSub.radius_miles < 999 ? `${activeSub.radius_miles} mile radius` : "Nationwide"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveSub(null);
                  setSelectedTier(null);
                  setStep(1);
                }}
                className="font-mono text-xs px-3 py-2 rounded-lg border border-secondary/40 text-secondary hover:bg-secondary/10 transition-colors"
              >
                Change plan
              </button>
              <button
                onClick={async () => {
                  if (!tradeId) return;
                  if (!confirm("Cancel your planning alerts subscription? You'll stop receiving alerts immediately.")) return;
                  setLoading(true);
                  try {
                    const { error } = await supabase
                      .from("planning_alert_subs")
                      .update({ active: false })
                      .eq("trade_id", tradeId)
                      .eq("active", true);
                    if (error) throw error;
                    setActiveSub(null);
                    setSelectedTier(null);
                    setStep(1);
                    toast({ title: "Subscription cancelled", description: "You will no longer receive planning alerts." });
                  } catch (err: any) {
                    toast({ title: "Error", description: err.message, variant: "destructive" });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="font-mono text-xs px-3 py-2 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                Cancel subscription
              </button>
            </div>
          </div>
        )}

        {/* Step indicator */}
        {!activeSub && step < 5 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs transition-all ${
                  s === step ? "bg-secondary text-white" : s < step ? "bg-secondary/20 text-secondary" : "bg-muted/20 text-muted-foreground"
                }`}>
                  {s < step ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                {s < 4 && <div className={`w-8 h-0.5 ${s < step ? "bg-secondary/40" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        )}

        {/* STEP 1: Choose Tier */}
        {step === 1 && !activeSub && (
          <>
            <h2 className="font-heading text-primary text-xl text-center mb-6">Choose your plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {TIERS.map((t) => {
                const Icon = t.icon;
                const isSelected = selectedTier === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTier(t.id)}
                    className={`relative text-left rounded-2xl p-6 border-2 transition-all ${t.accent} ${
                      isSelected ? "border-secondary shadow-lg" : t.borderColor
                    } hover:shadow-sm`}
                  >
                    {t.popular && (
                      <span className="absolute -top-3 left-6 bg-secondary text-white font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    )}
                    {t.badge && (
                      <span className="absolute -top-3 left-6 bg-green-500 text-white font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                        {t.badge}
                      </span>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${t.accent}`}>
                          <Icon className={`w-5 h-5 ${t.iconColor}`} />
                        </div>
                        <span className="font-heading text-primary text-xl">{t.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-heading text-3xl text-primary">£{t.price}</span>
                        <span className="font-mono text-xs text-muted-foreground">/mo</span>
                      </div>
                    </div>

                    <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-3">
                      {t.description}
                    </p>

                    <p className="font-mono text-[10px] text-secondary italic mb-4">{t.bestFor}</p>

                    <ul className="space-y-2">
                      {t.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 font-mono text-xs text-foreground">
                          <Check className="w-3 h-3 text-secondary flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center">
              <button
                disabled={!selectedTier}
                onClick={() => setStep(selectedTier === "national" ? 3 : 2)}
                className="flex items-center gap-2 bg-secondary text-white font-mono text-sm px-8 py-3 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-40"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* STEP 2: Set Radius */}
        {step === 2 && (
          <div className="max-w-lg mx-auto">
            <h2 className="font-heading text-primary text-xl text-center mb-2">Set your alert radius</h2>
            <p className="font-mono text-xs text-muted-foreground text-center mb-8">
              How far from your postcode should we search for planning approvals?
            </p>

            <div className="bg-card rounded-2xl border border-border p-8">
              <div className="text-center mb-6">
                <span className="font-heading text-5xl text-primary">{radius}</span>
                <span className="font-mono text-sm text-muted-foreground ml-1">miles</span>
              </div>

              <Slider
                value={[RADIUS_MARKS.indexOf(radius)]}
                min={0}
                max={RADIUS_MARKS.length - 1}
                step={1}
                onValueChange={([v]) => setRadius(RADIUS_MARKS[v])}
                className="mb-4"
              />

              <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                {RADIUS_MARKS.map(r => (
                  <span key={r} className={r === radius ? "text-secondary font-semibold" : ""}>{r} mi</span>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(1)} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 bg-secondary text-white font-mono text-sm px-8 py-3 rounded-xl hover:bg-secondary/90 transition-colors"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Trade Types */}
        {step === 3 && (
          <div className="max-w-lg mx-auto">
            <h2 className="font-heading text-primary text-xl text-center mb-2">Confirm trade types to match</h2>
            <p className="font-mono text-xs text-muted-foreground text-center mb-8">
              Your primary trade is pre-selected. Add more to widen your matches.
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {TRADE_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`font-mono text-xs px-3 py-2 rounded-xl border transition-all ${
                    selectedTypes.includes(type)
                      ? "bg-secondary text-white border-secondary"
                      : "bg-card border-border text-muted-foreground hover:border-secondary/40"
                  }`}
                >
                  {selectedTypes.includes(type) && <Check className="w-3 h-3 inline mr-1" />}
                  {type}
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(selectedTier === "national" ? 1 : 2)} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                disabled={selectedTypes.length === 0}
                onClick={() => setStep(4)}
                className="flex items-center gap-2 bg-secondary text-white font-mono text-sm px-8 py-3 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-40"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Confirm & Subscribe */}
        {step === 4 && tier && (
          <div className="max-w-lg mx-auto">
            <h2 className="font-heading text-primary text-xl text-center mb-6">Confirm your subscription</h2>

            <div className={`rounded-2xl border-2 p-6 ${tier.accent} ${tier.borderColor} mb-6`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <tier.icon className={`w-5 h-5 ${tier.iconColor}`} />
                  <span className="font-heading text-primary text-lg">{tier.name}</span>
                </div>
                <div>
                  <span className="font-heading text-2xl text-primary">£{tier.price}</span>
                  <span className="font-mono text-xs text-muted-foreground">/mo</span>
                </div>
              </div>

              <div className="space-y-2 font-mono text-xs text-foreground">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Radius</span>
                  <span>{selectedTier === "national" ? "Nationwide" : `${radius} miles`}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Trade types</span>
                  <span className="text-right max-w-[200px]">{selectedTypes.join(", ")}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Billing</span>
                  <span>Monthly recurring</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="flex items-center gap-2 bg-secondary text-white font-mono text-sm px-8 py-3 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Processing…" : `Subscribe — £${tier.price}/mo`}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Confirmation */}
        {step === 5 && (
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="font-heading text-primary text-2xl mb-3">You're all set!</h2>
            <p className="font-mono text-sm text-muted-foreground mb-2">
              Your <span className="text-secondary font-semibold">{tier?.name}</span> subscription is active.
            </p>
            <p className="font-mono text-xs text-muted-foreground mb-8">
              Your first alerts will arrive tomorrow morning at 6am. Check your trade dashboard for new alerts daily.
            </p>
            <button
              onClick={() => navigate("/dashboard/trade")}
              className="flex items-center gap-2 bg-primary text-primary-foreground font-mono text-sm px-8 py-3 rounded-xl hover:bg-primary/90 transition-colors mx-auto"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <p className="font-mono text-[10px] text-muted-foreground text-center mt-8">
          Cancel anytime. Alerts begin within 24 hours of subscribing. Data sourced from local authority planning portals.
        </p>
      </div>
    </div>
  );
};

export default PlanningAlerts;
