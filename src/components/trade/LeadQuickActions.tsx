import { useState } from "react";
import { Phone, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { ShortlistStatus } from "./ShortlistStatusControl";
import { mirrorShortlistToInteraction } from "@/lib/shortlistMirror";

interface Props {
  tradeId: string;
  planningAlertId: string;
  applicantPhone?: string | null;
  currentStatus: ShortlistStatus | null;
  shortlistRowId?: string | null;
  onStatusChanged: (next: {
    id: string;
    contact_status: ShortlistStatus;
  }) => void;
}

/**
 * Two quick-action buttons that sit alongside the existing status dropdown
 * on a planning lead card:
 *  - "Call now" — opens tel: AND moves todo → contacted
 *  - "Mark contacted" — moves todo → contacted without dialling
 *
 * Both are idempotent: clicking when already past 'todo' is a no-op (no error).
 */
const LeadQuickActions = ({
  tradeId,
  planningAlertId,
  applicantPhone,
  currentStatus,
  shortlistRowId,
  onStatusChanged,
}: Props) => {
  const [busy, setBusy] = useState<"call" | "mark" | null>(null);

  const hasPhone = !!applicantPhone && applicantPhone.trim().length > 0;
  // Idempotency rule from spec: clicking "Mark contacted" when already
  // contacted (or further along) should do nothing. Only 'todo' (or no row)
  // triggers a status update.
  const needsStatusUpdate = !currentStatus || currentStatus === "todo";

  const moveToContacted = async (): Promise<boolean> => {
    if (!needsStatusUpdate) return true; // already past todo — no-op success

    if (shortlistRowId) {
      const { data, error } = await supabase
        .from("planning_alert_shortlist")
        .update({
          contact_status: "contacted",
          last_status_change_at: new Date().toISOString(),
        } as any)
        .eq("id", shortlistRowId)
        .select("id, contact_status")
        .maybeSingle();
      if (error) {
        toast({
          title: "Couldn't update lead",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
      if (data) onStatusChanged(data as { id: string; contact_status: ShortlistStatus });
      await mirrorShortlistToInteraction(tradeId, planningAlertId, "contacted");
      return true;
    }

    const { data, error } = await supabase
      .from("planning_alert_shortlist")
      .insert({
        trade_id: tradeId,
        planning_alert_id: planningAlertId,
        contact_status: "contacted",
      } as any)
      .select("id, contact_status")
      .maybeSingle();
    if (error) {
      toast({
        title: "Couldn't update lead",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
    if (data) onStatusChanged(data as { id: string; contact_status: ShortlistStatus });
    await mirrorShortlistToInteraction(tradeId, planningAlertId, "contacted");
    return true;
  };

  const handleCall = async () => {
    if (!hasPhone) return;
    setBusy("call");
    try {
      // Open the tel: link first so the dialler launches even if the DB
      // round-trip is slow.
      window.location.href = `tel:${applicantPhone!.replace(/\s+/g, "")}`;
      await moveToContacted();
    } finally {
      setBusy(null);
    }
  };

  const handleMark = async () => {
    setBusy("mark");
    try {
      await moveToContacted();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={handleCall}
        disabled={!hasPhone || busy !== null}
        title={hasPhone ? `Call ${applicantPhone}` : "No phone number on this lead"}
        aria-label={hasPhone ? "Call now and mark as contacted" : "No phone number on this lead"}
        className="inline-flex items-center gap-1.5 bg-secondary text-white font-mono text-[11px] px-3 py-1.5 rounded-full hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy === "call" ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Phone className="w-3 h-3" />
        )}
        Call now
      </button>

      <button
        type="button"
        onClick={handleMark}
        disabled={busy !== null || !needsStatusUpdate}
        title={
          needsStatusUpdate
            ? "Mark this lead as contacted"
            : "Already contacted"
        }
        aria-label="Mark this lead as contacted"
        className="inline-flex items-center gap-1.5 bg-card border border-border text-primary font-mono text-[11px] px-3 py-1.5 rounded-full hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy === "mark" ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Check className="w-3 h-3" />
        )}
        {needsStatusUpdate ? "Mark contacted" : "Contacted"}
      </button>
    </div>
  );
};

export default LeadQuickActions;
