import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTradeAccess } from "@/hooks/useTradeAccess";
import {
  AccessLevel,
  PipelineStatus,
  PlanningFeatures,
  resolveFeatures,
  generateInviteToken,
} from "@/lib/planningIntelligence";

export interface Interaction {
  id: string;
  planning_application_id: string;
  status: PipelineStatus;
  notes: string | null;
  follow_up_date: string | null;
  invite_link_id: string | null;
  intro_letter_generated: boolean;
}

export interface TradeIdentity {
  id: string;
  name: string;
  company_name: string;
  trade_type: string;
}

interface State {
  ready: boolean;
  trade: TradeIdentity | null;
  accessLevel: AccessLevel;
  /** True once a real planning_access row exists for this trade. */
  hasAccessRecord: boolean;
  features: PlanningFeatures;
  interactions: Record<string, Interaction>;
}

export function usePlanningIntelligence() {
  const { isReady, trade: tradeAccess } = useTradeAccess({ redirectToSetup: false });
  const [state, setState] = useState<State>({
    ready: false,
    trade: null,
    accessLevel: "founding",
    hasAccessRecord: false,
    features: resolveFeatures("founding"),
    interactions: {},
  });

  useEffect(() => {
    let cancelled = false;
    if (!isReady) return;
    if (!tradeAccess) {
      setState((s) => ({ ...s, ready: true }));
      return;
    }

    const load = async () => {
      const [tradeRes, accessRes, interactionsRes] = await Promise.all([
        supabase.from("trades").select("id, name, company_name, trade_type").eq("id", tradeAccess.id).maybeSingle(),
        supabase.from("planning_access").select("access_level, features_enabled").eq("trade_id", tradeAccess.id).maybeSingle(),
        supabase
          .from("planning_opportunity_interactions")
          .select("id, planning_application_id, status, notes, follow_up_date, invite_link_id, intro_letter_generated")
          .eq("trade_id", tradeAccess.id),
      ]);

      if (cancelled) return;

      // Ensure a founding access record exists
      let accessLevel: AccessLevel = "founding";
      let overrides: Partial<PlanningFeatures> | null = null;
      let hasAccessRecord = false;
      if (accessRes.data) {
        hasAccessRecord = true;
        accessLevel = (accessRes.data.access_level as AccessLevel) || "founding";
        overrides = (accessRes.data.features_enabled as Partial<PlanningFeatures>) || null;
      } else {
        const { error: insertErr } = await supabase
          .from("planning_access")
          .insert({ trade_id: tradeAccess.id });
        hasAccessRecord = !insertErr;
        if (cancelled) return;
      }

      const interactions: Record<string, Interaction> = {};
      (interactionsRes.data || []).forEach((row: any) => {
        interactions[row.planning_application_id] = row as Interaction;
      });

      setState({
        ready: true,
        trade: tradeRes.data
          ? {
              id: tradeRes.data.id,
              name: tradeRes.data.name || "",
              company_name: tradeRes.data.company_name || "",
              trade_type: tradeRes.data.trade_type || "",
            }
          : { id: tradeAccess.id, name: "", company_name: "", trade_type: tradeAccess.trade_type },
        accessLevel,
        hasAccessRecord,
        features: resolveFeatures(accessLevel, overrides),
        interactions,
      });
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isReady, tradeAccess]);

  const upsertInteraction = useCallback(
    async (planningId: string, patch: Partial<Interaction>) => {
      if (!state.trade) return;
      const existing = state.interactions[planningId];
      const payload = {
        trade_id: state.trade.id,
        planning_application_id: planningId,
        status: patch.status ?? existing?.status ?? "new",
        notes: patch.notes ?? existing?.notes ?? null,
        follow_up_date: patch.follow_up_date ?? existing?.follow_up_date ?? null,
        invite_link_id: patch.invite_link_id ?? existing?.invite_link_id ?? null,
        intro_letter_generated: patch.intro_letter_generated ?? existing?.intro_letter_generated ?? false,
      };
      const { data, error } = await supabase
        .from("planning_opportunity_interactions")
        .upsert(payload, { onConflict: "trade_id,planning_application_id" })
        .select("id, planning_application_id, status, notes, follow_up_date, invite_link_id, intro_letter_generated")
        .maybeSingle();
      if (!error && data) {
        setState((s) => ({
          ...s,
          interactions: { ...s.interactions, [planningId]: data as Interaction },
        }));

        // Mirror the status into planning_alert_shortlist so the Pipeline view
        // (which reads only that table) stays in sync with Find Work.
        const contactStatus = SHORTLIST_STATUS[payload.status as PipelineStatus];
        if (contactStatus) {
          await supabase
            .from("planning_alert_shortlist")
            .upsert(
              {
                trade_id: state.trade.id,
                planning_alert_id: planningId,
                contact_status: contactStatus,
                next_action_date: payload.follow_up_date,
                last_status_change_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as any,
              { onConflict: "trade_id,planning_alert_id" },
            );
        }
      }
      return data as Interaction | null;
    },
    [state.trade, state.interactions],
  );


  const createInviteLink = useCallback(
    async (planningId: string, projectType: string | null) => {
      if (!state.trade) return null;
      const token = generateInviteToken();
      const { data, error } = await supabase
        .from("planning_invite_links")
        .insert({
          trade_id: state.trade.id,
          planning_application_id: planningId,
          token,
          project_type: projectType,
        })
        .select("id, token")
        .maybeSingle();
      if (error || !data) return null;
      await upsertInteraction(planningId, { invite_link_id: data.id });
      return { id: data.id, token: data.token, url: `${window.location.origin}/planning-invite/${data.token}` };
    },
    [state.trade, upsertInteraction],
  );

  return { ...state, upsertInteraction, createInviteLink };
}
