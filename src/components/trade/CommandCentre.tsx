import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ListChecks,
  Sparkles,
  Upload,
  Tag,
  Briefcase,
  Bell,
  CalendarPlus,
  FileText,
} from "lucide-react";
import type { VaultDocument } from "@/lib/tradeVault";
import { computeDashboardVerification } from "@/lib/tradeVault";
import {
  computeProfileStrength,
  computePriorities,
  type PriorityTarget,
  type ProfileStrength as ProfileStrengthType,
  type Priority,
} from "@/lib/tradeProfileStrength";

interface Props {
  tradeId: string;
  jobMatchCount: number;
  onNavigate: (target: PriorityTarget) => void;
}

const calendarConnected = (tradeId: string) =>
  typeof window !== "undefined" &&
  window.localStorage.getItem(`pg-cal-connected-${tradeId}`) === "1";

const CommandCentre = ({ tradeId, jobMatchCount, onNavigate }: Props) => {
  const [loading, setLoading] = useState(true);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [strength, setStrength] = useState<ProfileStrengthType | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      const tradeRes = await supabase
        .from("trades")
        .select(
          "id, name, bio, phone, postcode, trade_type, service_radius_miles, public_liability_insurer, insurance_cert_url, business_logo_path, verified, verification_status, verified_on_prografter_at, gas_safe_number, mcs_number, trustmark_number, cps_registration_number, pas_2030_accredited, fgas_registered, ozev_approved, ciga_registered, inca_certified",
        )
        .eq("id", tradeId)
        .maybeSingle();

      const [vaultRes, specRes, portfolioRes] = await Promise.all([
        supabase.from("tradevault_documents").select("*").eq("trade_id", tradeId),
        supabase
          .from("trade_specialisms" as any)
          .select("specialism_id", { count: "exact", head: true })
          .eq("trade_id", tradeId),
        supabase
          .from("trade_portfolio_items" as any)
          .select("id", { count: "exact", head: true })
          .eq("trade_id", tradeId),
      ]);

      let planningCount = 0;
      try {
        const { count } = await supabase
          .from("planning_alerts" as any)
          .select("id", { count: "exact", head: true })
          .eq("actioned", false);
        planningCount = count ?? 0;
      } catch {
        planningCount = 0;
      }

      if (cancelled) return;

      const t = tradeRes.data as any;
      if (!t) {
        setLoading(false);
        return;
      }

      const vaultDocs = (vaultRes.data as VaultDocument[]) ?? [];
      const specialismCount = specRes.count ?? 0;
      const portfolioCount = portfolioRes.count ?? 0;
      const hasQualification =
        !!t.gas_safe_number ||
        !!t.mcs_number ||
        !!t.trustmark_number ||
        !!t.cps_registration_number ||
        t.pas_2030_accredited ||
        t.fgas_registered ||
        t.ozev_approved ||
        t.ciga_registered ||
        t.inca_certified;
      const calConnected = calendarConnected(tradeId);

      const ps = computeProfileStrength({
        bio: t.bio,
        phone: t.phone,
        postcode: t.postcode,
        trade_type: t.trade_type,
        name: t.name,
        service_radius_miles: t.service_radius_miles,
        public_liability_insurer: t.public_liability_insurer,
        insurance_cert_url: t.insurance_cert_url,
        business_logo_path: t.business_logo_path,
        verified: t.verified,
        hasQualification,
        specialismCount,
        portfolioCount,
        calendarConnected: calConnected,
        vaultDocs,
      });

      const verification = computeDashboardVerification(vaultDocs, {
        manuallyVerified:
          t.verified || t.verification_status === "approved" || t.verification_status === "verified",
        verifiedAt: t.verified_on_prografter_at,
      });

      const prios = computePriorities({
        strength: ps,
        verification,
        vaultDocs,
        specialismCount,
        bio: t.bio,
        calendarConnected: calConnected,
        planningOpportunities: planningCount,
        jobMatchCount,
      });

      setStrength(ps);
      setPriorities(prios);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tradeId, jobMatchCount]);

  if (loading || !strength) return null;

  const quickActions = ([
    { key: "upload", label: "Upload Documents", icon: Upload, target: "tradevault" as PriorityTarget, show: priorities.some((p) => p.target === "tradevault") },
    { key: "spec", label: "Add Specialisms", icon: Tag, target: "specialisms" as PriorityTarget, show: priorities.some((p) => p.key === "specialisms") },
    { key: "jobs", label: "View Jobs", icon: Briefcase, target: "jobs" as PriorityTarget, show: true },
    { key: "planning", label: "View Planning Intelligence", icon: Bell, target: "planning" as PriorityTarget, show: true },
    { key: "cal", label: "Connect Calendar", icon: CalendarPlus, target: "settings" as PriorityTarget, show: !calendarConnected(tradeId) },
    { key: "quote", label: "Start a Quote", icon: FileText, target: "jobs" as PriorityTarget, show: true },
  ]).filter((a) => a.show);

  return (
    <div className="space-y-6">
      {/* Today's Priorities */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <ListChecks className="w-5 h-5 text-secondary" />
          <h2 className="font-heading text-primary text-2xl">Today's Priorities</h2>
        </div>
        <p className="font-mono text-xs text-muted-foreground mb-4">
          Your next best actions to stay verified, win work and keep projects moving.
        </p>

        {priorities.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 border border-secondary/20 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-secondary shrink-0" />
            <div>
              <h3 className="font-heading text-primary text-lg">You're all set</h3>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                Your profile is in good shape. We'll notify you when new matched jobs or planning
                opportunities appear.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {priorities.map((p) => (
              <div
                key={p.key}
                className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Sparkles className="w-4 h-4 text-secondary" />
                    <h3 className="font-heading text-primary text-base leading-tight">{p.title}</h3>
                    {p.badge && (
                      <span className="font-mono text-[10px] uppercase tracking-wide bg-amber-500/15 text-amber-600 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground leading-relaxed">{p.text}</p>
                </div>
                <button
                  onClick={() => onNavigate(p.target)}
                  className="mt-4 inline-flex items-center gap-1 self-start bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
                >
                  {p.cta}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Profile Strength */}
      <section className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <h2 className="font-heading text-primary text-xl">Profile Strength</h2>
          <span className="font-mono text-sm text-secondary font-semibold">
            {strength.percent}% complete · {strength.label}
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-primary/10 overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-secondary transition-all"
            style={{ width: `${strength.percent}%` }}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mb-4">
          {strength.items.map((item) => {
            const done = item.state === "complete";
            return (
              <div key={item.key} className="flex items-center gap-2 font-mono text-xs">
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                )}
                <span className={done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                {item.state === "optional" && (
                  <span className="text-[10px] uppercase text-muted-foreground/60">Optional</span>
                )}
                {item.state === "coming_soon" && (
                  <span className="text-[10px] uppercase text-muted-foreground/60">Coming soon</span>
                )}
                {item.state === "missing" && (
                  <span className="text-[10px] uppercase text-amber-600">Missing</span>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={() => onNavigate("profile")}
          className="inline-flex items-center gap-1 font-mono text-xs text-secondary hover:underline"
        >
          Improve Profile
          <ArrowRight className="w-3 h-3" />
        </button>
      </section>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Quick actions
          </h2>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((a) => (
              <button
                key={a.key}
                onClick={() => onNavigate(a.target)}
                className="inline-flex items-center gap-2 bg-card border border-primary/10 hover:border-secondary/40 font-mono text-xs px-3 py-2 rounded-xl text-foreground transition-colors"
              >
                <a.icon className="w-3.5 h-3.5 text-secondary" />
                {a.label}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CommandCentre;
