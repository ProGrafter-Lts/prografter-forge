import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileCheck2, Snowflake } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export type InspectionReport = {
  id: string;
  wallet_stage_id: string | null;
  classification: string;
  classification_reason: string | null;
  required_actions: unknown;
  open_items: unknown;
  resolved_items: unknown;
  unable_to_assess: unknown;
  file_name: string | null;
  report_date: string | null;
  status: string;
  created_at: string;
};

type StageLite = { id: string; stage_name: string };

const CLASS_STYLE: Record<string, string> = {
  CLEAR: "bg-teal/10 text-teal border-teal/30",
  HOLD: "bg-amber-50 text-amber-800 border-amber-300",
  MIXED: "bg-orange-50 text-orange-800 border-orange-300",
};

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

interface Props {
  jobId: string;
  role: "homeowner" | "trade" | null;
  stages: StageLite[];
  reports: InspectionReport[];
  frozen: boolean;
  onChanged: () => void | Promise<void>;
}

const InspectionPanel = ({ jobId, role, stages, reports, frozen, onChanged }: Props) => {
  const { isAdmin } = useIsAdmin();
  const [busy, setBusy] = useState(false);
  const [stageId, setStageId] = useState<string>(stages[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [disputeFor, setDisputeFor] = useState<string | null>(null);
  const [evidenceType, setEvidenceType] = useState("follow_up_inspection_report");
  const [evidenceRef, setEvidenceRef] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");

  const upload = async () => {
    if (!stageId) return toast.error("Choose the stage this inspection covers");
    if (!file) return toast.error("Attach the inspection report PDF");
    setBusy(true);
    try {
      const path = `${jobId}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("inspection-reports").upload(path, file);
      if (upErr) throw upErr;

      const { data, error } = await supabase.functions.invoke("submit-inspection-report", {
        body: { job_id: jobId, wallet_stage_id: stageId, file_path: path, file_name: file.name },
      });
      if (error) throw error;
      const payload = data as any;
      if (payload?.error) throw new Error(typeof payload.error === "string" ? payload.error : "Could not read the report");

      const cls = payload?.classification?.classification;
      const released = payload?.release?.released;
      toast.success(
        released
          ? `Inspection CLEAR — stage payment released`
          : `Inspection classified ${cls}. ${payload?.release?.reason ?? ""}`,
      );
      setFile(null);
      await onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit the inspection report");
    } finally {
      setBusy(false);
    }
  };

  const raiseDispute = async (reportId: string) => {
    if (evidenceRef.trim().length < 4) {
      return toast.error("Add the documented evidence reference — an objection on its own can't freeze a stage");
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("flag-inspection-dispute", {
        body: {
          inspection_report_id: reportId,
          evidence_type: evidenceType,
          evidence_reference: evidenceRef.trim(),
          evidence_notes: evidenceNotes.trim() || undefined,
        },
      });
      if (error) throw error;
      const payload = data as any;
      if (payload?.error) {
        throw new Error(typeof payload.error === "string" ? payload.error : payload.message ?? "Dispute rejected");
      }
      toast.success("Dispute logged — project frozen pending admin review");
      setDisputeFor(null); setEvidenceRef(""); setEvidenceNotes("");
      await onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not log the dispute");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-navy text-xl flex items-center gap-2">
        <FileCheck2 className="w-5 h-5 text-teal" /> Building Control inspections
      </h2>
      <p className="font-mono text-xs text-secondary-text">
        Every stage release needs an inspection classified CLEAR and the stage funded. Reports are never scored pass/fail —
        CLEAR, HOLD or MIXED, with MIXED always routed to manual review.
      </p>
      {role === "homeowner" && (
        <p className="font-mono text-xs text-secondary-text">
          Inspection reports are uploaded by your contractor — Building Control sends the report to all dutyholders.
          If it hasn't appeared here, ask them to upload it or contact ProGrafter.
        </p>
      )}

      {(role === "trade" || isAdmin) && (
        <div className="rounded-2xl border border-navy/10 bg-card p-5 space-y-3">
          {role !== "trade" && (
            <p className="font-mono text-xs text-secondary-text">Admin override upload.</p>
          )}
          <Select value={stageId} onValueChange={setStageId}>
            <SelectTrigger className="font-mono text-sm">
              <SelectValue placeholder="Stage this inspection covers" />
            </SelectTrigger>
            <SelectContent>
              {stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.stage_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button onClick={upload} disabled={busy || frozen}>
            {frozen ? "Project frozen" : "Upload inspection report"}
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-navy/10 bg-card divide-y divide-navy/5">
        {reports.length === 0 && (
          <p className="p-4 font-mono text-sm text-secondary-text">No inspection reports uploaded yet.</p>
        )}
        {reports.map((r) => {
          const outstanding = [
            ...asList(r.required_actions),
            ...asList(r.unable_to_assess),
            ...asList(r.open_items),
          ];
          const stage = stages.find((s) => s.id === r.wallet_stage_id);
          return (
            <div key={r.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm text-navy font-semibold">
                    {stage?.stage_name ?? "Stage"} · {r.file_name ?? "Inspection report"}
                  </p>
                  <p className="font-mono text-xs text-secondary-text">
                    {r.report_date ?? new Date(r.created_at).toLocaleDateString("en-GB")}
                    {r.status !== "active" && ` · ${r.status}`}
                  </p>
                </div>
                <Badge variant="outline" className={`font-mono text-xs shrink-0 ${CLASS_STYLE[r.classification] ?? ""}`}>
                  {r.classification}
                </Badge>
              </div>
              {r.classification_reason && (
                <p className="font-mono text-xs text-secondary-text">{r.classification_reason}</p>
              )}
              {outstanding.length > 0 && (
                <ul className="font-mono text-xs text-amber-800 list-disc pl-4 space-y-0.5">
                  {outstanding.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}
              {asList(r.resolved_items).length > 0 && (
                <ul className="font-mono text-xs text-teal list-disc pl-4 space-y-0.5">
                  {asList(r.resolved_items).map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}

              {role && r.status !== "disputed" && (
                disputeFor === r.id ? (
                  <div className="space-y-2 pt-2">
                    <Select value={evidenceType} onValueChange={setEvidenceType}>
                      <SelectTrigger className="font-mono text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="follow_up_inspection_report">Follow-up inspection report</SelectItem>
                        <SelectItem value="professional_body_complaint">Professional body complaint reference</SelectItem>
                        <SelectItem value="inspector_retraction">Inspector's written retraction</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Evidence reference (report no. / complaint ref / letter ref)"
                      value={evidenceRef} onChange={(e) => setEvidenceRef(e.target.value)}
                    />
                    <Textarea
                      placeholder="Optional notes"
                      value={evidenceNotes} onChange={(e) => setEvidenceNotes(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => raiseDispute(r.id)} disabled={busy}>Freeze pending review</Button>
                      <Button size="sm" variant="outline" onClick={() => setDisputeFor(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDisputeFor(r.id)}
                    className="font-mono text-xs text-secondary-text underline underline-offset-2 hover:text-navy"
                  >
                    <Snowflake className="w-3 h-3 inline mr-1" />
                    Dispute this report (documented evidence required)
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default InspectionPanel;
