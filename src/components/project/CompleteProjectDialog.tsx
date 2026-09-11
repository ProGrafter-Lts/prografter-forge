import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  loadCompletionReport,
  completeProject,
  money,
  READINESS_LABEL,
  type CompletionReport,
} from "@/lib/projectCompletion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Props {
  jobId: string;
  role: "trade" | "homeowner";
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

const LEVEL_ICON = {
  ok: CheckCircle2,
  review: AlertTriangle,
  blocking: XCircle,
} as const;

const LEVEL_CLASS = {
  ok: "text-emerald-400",
  review: "text-amber-400",
  blocking: "text-red-400",
} as const;

/**
 * Completion readiness check + deliberate confirmation. Completion is never a
 * single accidental click: the trade must review the readiness list and type
 * the confirmation before the canonical project moves to completed.
 */
const CompleteProjectDialog = ({ jobId, role, open, onClose, onCompleted }: Props) => {
  const [report, setReport] = useState<CompletionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmText, setConfirmText] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setConfirmText("");
    void loadCompletionReport(jobId).then((r) => {
      setReport(r);
      setLoading(false);
    });
  }, [open, jobId]);

  const submit = async () => {
    if (!report) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Please sign in again.");
      return;
    }
    setSaving(true);
    try {
      await completeProject(report, { completedBy: auth.user.id, role, notes });
      toast.success("Project completed. Records are now permanent.");
      onCompleted?.();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Couldn't complete the project.");
    } finally {
      setSaving(false);
    }
  };

  const blocked = report?.overall === "blocking";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="dashboard-dark max-w-2xl max-h-[85vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground text-xl">Complete project</DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground">
            Review what ProGrafter holds for this project before closing it. Nothing is deleted —
            the full delivery history stays available afterwards.
          </DialogDescription>
        </DialogHeader>

        {loading || !report ? (
          <div className="py-10 text-center font-mono text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Checking completion readiness…
          </div>
        ) : (
          <div className="space-y-5">
            <div
              className={`rounded-xl border px-4 py-3 font-mono text-xs uppercase tracking-wide ${
                report.overall === "ok"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : report.overall === "review"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    : "border-red-500/40 bg-red-500/10 text-red-300"
              }`}
            >
              {READINESS_LABEL[report.overall]}
            </div>

            <ul className="space-y-2">
              {report.readiness.map((item) => {
                const Icon = LEVEL_ICON[item.level];
                return (
                  <li key={item.id} className="flex items-start gap-2 rounded-xl border border-border bg-card p-3">
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${LEVEL_CLASS[item.level]}`} />
                    <div>
                      <p className="font-mono text-xs text-foreground">{item.label}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{item.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="grid grid-cols-2 gap-3">
              <Figure label="Original contract" value={money(report.originalContractPence)} />
              <Figure label="Approved variations" value={money(report.approvedVariationsPence)} />
              <Figure label="Final project value" value={money(report.finalValuePence)} />
              <Figure label="Outstanding" value={money(report.paymentSummary.outstandingPence)} />
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Completion note (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 font-mono text-xs text-foreground"
                placeholder="Anything worth recording against the completion"
              />
            </div>

            {blocked ? (
              <p className="font-mono text-xs text-red-300">
                Resolve the blocking items above before this project can be completed.
              </p>
            ) : (
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Type COMPLETE to confirm
                </label>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 font-mono text-xs text-foreground"
                  placeholder="COMPLETE"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2 font-mono text-xs text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={blocked || confirmText.trim().toUpperCase() !== "COMPLETE" || saving}
                className="rounded-xl bg-teal-500 px-4 py-2 font-mono text-xs text-[#08172a] disabled:opacity-40"
              >
                {saving ? "Completing…" : "Confirm completion"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Figure = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-border bg-card p-3">
    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="font-mono text-sm text-foreground">{value}</p>
  </div>
);

export default CompleteProjectDialog;
