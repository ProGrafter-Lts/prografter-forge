import { useState } from "react";
import { CreditCard, Download, Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AccentCard,
  JobFileEmpty,
  JobFilePanel,
  SectionHeading,
  TonePill,
} from "@/components/project/jobFileUi";
import { deriveStagesFromSchedule, gbp, paymentTone, stagePercent } from "@/lib/stageSchedule";
import { generatePaymentSchedulePdf } from "@/lib/paymentSchedulePdf";

interface Stage {
  id: string;
  stage_name: string;
  stage_order?: number;
  planned_start?: string | null;
  planned_end?: string | null;
  scope_detail?: string | null;
  payment_amount: number;
  payment_status: string;
  status: string;
}

interface PaymentScheduleProps {
  stages: Stage[];
  contractValue: number;
  userRole: "trade" | "homeowner" | null;
  onReleasePayment?: (stageId: string) => void;
  /** Job context for the branded PDF and stage generation. */
  jobId?: string;
  projectTitle?: string;
  reference?: string;
  tradeName?: string;
  homeownerName?: string;
  /** Agreed payment schedule from the contract or accepted quote. */
  agreedSchedule?: unknown;
  onRefresh?: () => void;
}

const PaymentSchedule = ({
  stages,
  contractValue,
  userRole,
  onReleasePayment,
  jobId,
  projectTitle = "Project",
  reference,
  tradeName = "Your contractor",
  homeownerName,
  agreedSchedule,
  onRefresh,
}: PaymentScheduleProps) => {
  const [generating, setGenerating] = useState(false);

  const canGenerate =
    userRole === "trade" && !!jobId && stages.length === 0 && Array.isArray(agreedSchedule) && agreedSchedule.length > 0;

  const generateStages = async () => {
    if (!jobId) return;
    const drafts = deriveStagesFromSchedule(agreedSchedule, contractValue);
    if (drafts.length === 0) {
      toast.error("No payment stages found on the agreed quote.");
      return;
    }
    setGenerating(true);
    const { error } = await supabase.from("project_stages").insert(
      drafts.map((d) => ({
        job_id: jobId,
        stage_name: d.stage_name,
        stage_order: d.stage_order,
        payment_amount: d.payment_amount,
        scope_detail: d.scope_detail,
        source: "quote",
        status: d.stage_order === 1 ? "active" : "pending",
      })),
    );
    setGenerating(false);
    if (error) toast.error(`Could not create stages: ${error.message}`);
    else {
      toast.success(`${drafts.length} stages created from the agreed quote.`);
      onRefresh?.();
    }
  };

  const downloadPdf = () =>
    generatePaymentSchedulePdf(
      stages.map((s, i) => ({
        stage_name: s.stage_name,
        stage_order: s.stage_order ?? i + 1,
        planned_start: s.planned_start ?? null,
        planned_end: s.planned_end ?? null,
        status: s.status,
        payment_amount: Number(s.payment_amount || 0),
        payment_status: s.payment_status,
        scope_detail: s.scope_detail ?? null,
      })),
      { projectTitle, reference, tradeName, homeownerName, contractValue },
    );

  return (
    <JobFilePanel>
      <SectionHeading
        icon={<CreditCard className="w-5 h-5 text-emerald-400" />}
        title="Payment schedule"
        count={stages.length}
        action={
          stages.length > 0 ? (
            <button
              type="button"
              onClick={downloadPdf}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-teal-300 hover:text-teal-200"
            >
              <Download className="w-3.5 h-3.5" /> Branded PDF
            </button>
          ) : undefined
        }
      />

      {stages.length === 0 ? (
        <div className="space-y-3">
          <JobFileEmpty icon={<CreditCard className="w-8 h-8" />}>
            No payment stages agreed yet.
          </JobFileEmpty>
          {canGenerate && (
            <button
              type="button"
              onClick={generateStages}
              disabled={generating}
              className="w-full inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-mono text-xs py-2.5 rounded-xl disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              Create stages from the agreed quote
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {stages.map((s) => (
            <AccentCard key={s.id} tone={paymentTone(s.payment_status)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-base text-foreground leading-tight">{s.stage_name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {gbp(s.payment_amount)} · {stagePercent(Number(s.payment_amount || 0), contractValue)}% of contract
                  </p>
                </div>
                <TonePill tone={paymentTone(s.payment_status)}>{s.payment_status}</TonePill>
              </div>
              {userRole === "homeowner" &&
                (s.status === "complete" || s.status === "completed") &&
                s.payment_status !== "paid" &&
                onReleasePayment && (
                  <button
                    type="button"
                    onClick={() => onReleasePayment(s.id)}
                    className="mt-3 w-full bg-secondary text-secondary-foreground font-mono text-xs py-2 rounded-xl hover:opacity-90"
                  >
                    Release payment
                  </button>
                )}
            </AccentCard>
          ))}

          <div className="flex items-center justify-between rounded-xl bg-card border border-border p-4">
            <p className="font-mono text-sm text-muted-foreground">Contract value</p>
            <p className="font-heading text-2xl text-foreground">{gbp(contractValue)}</p>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">
            Issued through ProGrafter · works carried out by {tradeName}
          </p>
        </div>
      )}
    </JobFilePanel>
  );
};

export default PaymentSchedule;
