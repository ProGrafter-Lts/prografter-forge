import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StageEscrowInfo {
  /** Inspection outcome recorded against this milestone: CLEAR | HOLD | MIXED. */
  inspectionStatus: string | null;
  inspectionReportName: string | null;
  inspectionReason: string | null;
  openItems: string[];
  outstandingChecks: string[];
  drawdowns: {
    id: string;
    description: string;
    amount_pence: number;
    status: string;
    created_at: string;
  }[];
}

/**
 * Loads escrow/inspection detail for a job's payment milestones, keyed by
 * project_stages.id. Read-only overlay — it never changes stage status.
 */
export const useStageEscrow = (jobId?: string) => {
  const [byStageId, setByStageId] = useState<Record<string, StageEscrowInfo>>({});

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;

    const load = async () => {
      const { data: wallet } = await supabase
        .from("project_wallets")
        .select("id")
        .eq("job_id", jobId)
        .maybeSingle();
      if (!wallet) return;

      const [{ data: wStages }, { data: reports }, { data: drawdowns }] = await Promise.all([
        supabase
          .from("project_wallet_stages")
          .select("id, project_stage_id, inspection_status, inspection_report_id")
          .eq("wallet_id", wallet.id),
        supabase
          .from("stage_inspection_reports")
          .select("id, wallet_stage_id, file_name, classification, classification_reason, open_items, unable_to_assess")
          .eq("job_id", jobId),
        supabase
          .from("drawdown_requests")
          .select("id, wallet_stage_id, description, amount_pence, status, created_at")
          .eq("job_id", jobId)
          .order("created_at", { ascending: true }),
      ]);

      const map: Record<string, StageEscrowInfo> = {};
      (wStages || []).forEach((ws: any) => {
        if (!ws.project_stage_id) return;
        const report = (reports || []).find((r: any) => r.wallet_stage_id === ws.id);
        map[ws.project_stage_id] = {
          inspectionStatus: ws.inspection_status ?? report?.classification ?? null,
          inspectionReportName: report?.file_name ?? null,
          inspectionReason: report?.classification_reason ?? null,
          openItems: Array.isArray(report?.open_items) ? (report!.open_items as string[]) : [],
          outstandingChecks: Array.isArray(report?.unable_to_assess)
            ? (report!.unable_to_assess as string[])
            : [],
          drawdowns: (drawdowns || [])
            .filter((d: any) => d.wallet_stage_id === ws.id)
            .map((d: any) => ({
              id: d.id,
              description: d.description,
              amount_pence: Number(d.amount_pence),
              status: d.status,
              created_at: d.created_at,
            })),
        };
      });

      if (!cancelled) setByStageId(map);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  return byStageId;
};
