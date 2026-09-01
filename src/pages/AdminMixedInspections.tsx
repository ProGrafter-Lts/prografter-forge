import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Report = {
  id: string;
  job_id: string;
  wallet_stage_id: string | null;
  classification: string;
  original_classification: string | null;
  classification_reason: string | null;
  required_actions: unknown;
  open_items: unknown;
  resolved_items: unknown;
  unable_to_assess: unknown;
  file_name: string | null;
  inspector_name: string | null;
  report_date: string | null;
  review_status: string;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

const TABS = [
  { key: "pending", label: "Awaiting review" },
  { key: "done", label: "Reviewed" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function AdminMixedInspections() {
  const [tab, setTab] = useState<TabKey>("pending");
  const [rows, setRows] = useState<Report[]>([]);
  const [stageNames, setStageNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const query = supabase
      .from("stage_inspection_reports")
      .select("*")
      .order("created_at", { ascending: false });
    const { data } = tab === "pending"
      ? await query.eq("review_status", "pending")
      : await query.in("review_status", ["cleared", "held"]);
    const list = (data ?? []) as Report[];
    setRows(list);

    const stageIds = list.map((r) => r.wallet_stage_id).filter(Boolean) as string[];
    if (stageIds.length) {
      const { data: stages } = await supabase
        .from("project_wallet_stages")
        .select("id, stage_name, stage_order")
        .in("id", stageIds);
      setStageNames(
        Object.fromEntries(
          (stages ?? []).map((s: any) => [
            s.id,
            s.stage_order != null ? `Stage ${s.stage_order} — ${s.stage_name}` : s.stage_name,
          ]),
        ),
      );
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => { void load(); }, [load]);

  const decide = async (report: Report, decision: "CLEAR" | "HOLD") => {
    const note = (notes[report.id] ?? "").trim();
    if (note.length < 4) {
      toast.error("Add a short review note — every manual decision is recorded on the audit trail");
      return;
    }
    setBusy(report.id);
    try {
      const { data, error } = await supabase.functions.invoke("resolve-mixed-inspection", {
        body: { inspection_report_id: report.id, decision, review_note: note },
      });
      if (error) throw error;
      const payload = data as any;
      if (payload?.error) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Could not record the decision");
      }
      toast.success(
        payload?.release?.released
          ? "Marked CLEAR — stage payment released"
          : `Recorded as ${decision}. ${payload?.release?.reason ?? ""}`,
      );
      setNotes((n) => ({ ...n, [report.id]: "" }));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record the decision");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="MIXED inspection review — ProGrafter admin" description="Manual review queue for MIXED inspection reports" noindex />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <AdminPageHeader
          title="MIXED inspection review"
          subtitle="Reports containing both resolved and open items. No release happens until a human decides."
        />

        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`font-mono text-xs px-3 py-1.5 rounded-full border ${
                tab === t.key ? "bg-navy text-cream border-navy" : "bg-card text-navy border-navy/20"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <p className="font-mono text-sm text-secondary-text">Loading…</p>}
        {!loading && rows.length === 0 && (
          <p className="font-mono text-sm text-secondary-text rounded-2xl border border-navy/10 bg-card p-6">
            {tab === "pending"
              ? "Nothing awaiting manual review — every MIXED report has been decided."
              : "No reviewed reports yet."}
          </p>
        )}

        <div className="space-y-4">
          {rows.map((r) => {
            const open = [...asList(r.required_actions), ...asList(r.unable_to_assess), ...asList(r.open_items)];
            const resolved = asList(r.resolved_items);
            return (
              <div key={r.id} className="rounded-2xl border border-navy/10 bg-card p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm text-navy font-semibold">
                      {r.wallet_stage_id ? stageNames[r.wallet_stage_id] ?? "Stage" : "Stage"} ·{" "}
                      {r.file_name ?? "Inspection report"}
                    </p>
                    <p className="font-mono text-xs text-secondary-text">
                      {r.inspector_name ? `${r.inspector_name} · ` : ""}
                      {r.report_date ?? new Date(r.created_at).toLocaleDateString("en-GB")} ·{" "}
                      <Link className="underline" to={`/project/${r.job_id}/wallet`}>Open project wallet</Link>
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs shrink-0 bg-orange-50 text-orange-800 border-orange-300">
                    {r.original_classification ?? "MIXED"}
                    {r.review_status !== "pending" && ` → ${r.classification}`}
                  </Badge>
                </div>

                {r.classification_reason && (
                  <p className="font-mono text-xs text-secondary-text">{r.classification_reason}</p>
                )}

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <p className="font-mono text-xs text-navy font-semibold mb-1">Open / unable to assess</p>
                    {open.length ? (
                      <ul className="font-mono text-xs text-amber-800 list-disc pl-4 space-y-0.5">
                        {open.map((i, k) => <li key={k}>{i}</li>)}
                      </ul>
                    ) : <p className="font-mono text-xs text-secondary-text">None recorded</p>}
                  </div>
                  <div>
                    <p className="font-mono text-xs text-navy font-semibold mb-1">Resolved</p>
                    {resolved.length ? (
                      <ul className="font-mono text-xs text-teal list-disc pl-4 space-y-0.5">
                        {resolved.map((i, k) => <li key={k}>{i}</li>)}
                      </ul>
                    ) : <p className="font-mono text-xs text-secondary-text">None recorded</p>}
                  </div>
                </div>

                {r.review_status === "pending" ? (
                  <div className="space-y-2 pt-1">
                    <Textarea
                      placeholder="Review note — what you checked and why this reads CLEAR or HOLD"
                      value={notes[r.id] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                      className="font-mono text-xs"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" disabled={busy === r.id} onClick={() => decide(r, "CLEAR")}>
                        Mark CLEAR &amp; attempt release
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => decide(r, "HOLD")}>
                        Mark HOLD
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="font-mono text-xs text-secondary-text">
                    Reviewed {r.reviewed_at ? new Date(r.reviewed_at).toLocaleString("en-GB") : ""} — {r.review_note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
