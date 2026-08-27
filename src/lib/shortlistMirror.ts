import { supabase } from "@/integrations/supabase/client";

export type ShortlistContactStatus = "todo" | "contacted" | "quoted" | "won" | "dead";
export type InteractionStatus =
  | "new"
  | "saved"
  | "contacted"
  | "follow_up"
  | "converted"
  | "dismissed";

/**
 * Reverse of SHORTLIST_STATUS in usePlanningIntelligence: shortlist contact
 * statuses (written by Pipeline-side controls) mapped back onto the Find Work
 * interaction statuses, so both views always agree.
 */
export const INTERACTION_STATUS: Record<ShortlistContactStatus, InteractionStatus> = {
  todo: "new",
  contacted: "contacted",
  quoted: "contacted",
  won: "converted",
  dead: "dismissed",
};

/**
 * Mirror a Pipeline-side status change into planning_opportunity_interactions
 * so Find Work's pipeline tabs reflect it immediately.
 */
export async function mirrorShortlistToInteraction(
  tradeId: string,
  planningAlertId: string,
  contactStatus: ShortlistContactStatus,
): Promise<void> {
  const status = INTERACTION_STATUS[contactStatus];
  if (!status) return;
  await supabase
    .from("planning_opportunity_interactions")
    .upsert(
      {
        trade_id: tradeId,
        planning_application_id: planningAlertId,
        status,
      } as any,
      { onConflict: "trade_id,planning_application_id" },
    );
}
