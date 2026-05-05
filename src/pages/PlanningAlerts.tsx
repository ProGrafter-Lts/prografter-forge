import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PlanningAlertsContent = () => {
  const { isReady, user } = useAuthReady();
  const [role, setRole] = useState<"trade" | "homeowner" | null>(null);

  useEffect(() => {
    if (!isReady || !user) return;
    (async () => {
      const { data: trade } = await supabase.from("trades").select("id").eq("user_id", user.id).maybeSingle();
      if (trade) return setRole("trade");
      const { data: ho } = await supabase.from("homeowners").select("id").eq("user_id", user.id).maybeSingle();
      if (ho) setRole("homeowner");
    })();
  }, [isReady, user]);

  const isAuthed = !!user;
  const isTrade = role === "trade";

  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-teal/10 border border-teal/30">
        <span className="font-mono text-[11px] uppercase tracking-wider">Coming Soon</span>
      </div>
      <h1 className="font-heading text-4xl md:text-5xl mb-5 leading-tight">
        Planning Intelligence Alerts — Coming Soon
      </h1>
      <p className="font-body text-lg mb-10">
        We're connecting to UK Local Authority planning data feeds. Verified trades will be the first to know when projects matching their trade get planning approval in their service area.
      </p>

      <ul className="space-y-3 mb-10 font-mono text-sm">
        <li className="flex gap-3"><span className="text-teal">→</span> EWI installers alerted the moment a solid-wall insulation application is approved nearby.</li>
        <li className="flex gap-3"><span className="text-teal">→</span> EV charger installers notified about approved driveway and off-street parking changes.</li>
        <li className="flex gap-3"><span className="text-teal">→</span> Builders and extension specialists matched to approved full-house extensions and rear-extension applications.</li>
      </ul>

      {isAuthed ? (
        <a
          href={isTrade ? "/dashboard/trade" : "/dashboard/homeowner"}
          className="inline-flex items-center justify-center bg-teal text-cream font-mono text-sm px-6 py-3.5 rounded-xl hover:bg-teal-hover transition-colors"
        >
          ← Back to dashboard
        </a>
      ) : (
        <a
          href="/register/trade"
          className="inline-flex items-center justify-center bg-teal text-cream font-mono text-sm px-6 py-3.5 rounded-xl hover:bg-teal-hover transition-colors"
        >
          Be ready — register as a trade now →
        </a>
      )}

      <p className="mt-8 font-mono text-xs">
        Initial coverage: Nottinghamshire, expanding.
      </p>
    </main>
  );
};

const PlanningAlerts = () => (
  <>
    <SEO
      title="Planning Intelligence Alerts — Coming Soon | ProGrafter"
      description="ProGrafter is connecting to UK Local Authority planning data feeds. Verified trades will be the first to know about approved projects in their area."
      path="/planning-alerts"
    />
    <AppShell>
      <PlanningAlertsContent />
    </AppShell>
  </>
);

export default PlanningAlerts;
