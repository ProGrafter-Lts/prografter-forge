import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NotebookPen } from "lucide-react";
import type { ProjectSnapshot } from "@/lib/projectSpine";

interface Props {
  snapshot: ProjectSnapshot;
  tradeId: string;
  onPosted?: () => void;
}

/**
 * TRADE SITE DIARY ENTRY — the structured daily record the homeowner sees.
 * Writes a new stage_updates row; entries are never edited in place, so the
 * historical project record stays intact.
 */
const SiteUpdateComposer = ({ snapshot, tradeId, onPosted }: Props) => {
  const stages = snapshot.stages;
  const [stageId, setStageId] = useState(snapshot.currentStage?.id ?? stages[0]?.id ?? "");
  const [workCompleted, setWorkCompleted] = useState("");
  const [issues, setIssues] = useState("");
  const [delay, setDelay] = useState("");
  const [tomorrow, setTomorrow] = useState("");
  const [impact, setImpact] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!stageId) {
      toast.error("This project has no stages set up yet.");
      return;
    }
    if (!workCompleted.trim()) {
      toast.error("Add what was completed today.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("stage_updates").insert({
      stage_id: stageId,
      trade_id: tradeId,
      update_text: workCompleted.trim(),
      work_completed: workCompleted.trim(),
      issues_found: issues.trim() || null,
      delay_reason: delay.trim() || null,
      tomorrow_plan: tomorrow.trim() || null,
      programme_impact_days: impact ? Number(impact) : null,
      entry_date: new Date().toISOString().slice(0, 10),
    } as any);
    setSaving(false);

    if (error) {
      console.error("Site update failed", error);
      toast.error("Couldn't post the update.");
      return;
    }
    toast.success("Site update posted — the homeowner can see it now.");
    setWorkCompleted("");
    setIssues("");
    setDelay("");
    setTomorrow("");
    setImpact("");
    onPosted?.();
  };

  const field =
    "w-full bg-background border border-border rounded-xl px-3 py-2 font-mono text-sm text-primary placeholder:text-muted-foreground/60";

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <NotebookPen className="w-3.5 h-3.5" /> Record today's site update
      </p>

      {stages.length > 0 && (
        <select value={stageId} onChange={(e) => setStageId(e.target.value)} className={field}>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.stage_name}
            </option>
          ))}
        </select>
      )}

      <textarea
        rows={3}
        value={workCompleted}
        onChange={(e) => setWorkCompleted(e.target.value)}
        placeholder="What was completed today"
        className={field}
      />
      <textarea
        rows={2}
        value={issues}
        onChange={(e) => setIssues(e.target.value)}
        placeholder="Issues discovered (optional)"
        className={field}
      />
      <textarea
        rows={2}
        value={tomorrow}
        onChange={(e) => setTomorrow(e.target.value)}
        placeholder="Tomorrow's plan (optional)"
        className={field}
      />
      <div className="grid md:grid-cols-2 gap-3">
        <input
          value={delay}
          onChange={(e) => setDelay(e.target.value)}
          placeholder="Delay reason (optional)"
          className={field}
        />
        <input
          type="number"
          value={impact}
          onChange={(e) => setImpact(e.target.value)}
          placeholder="Programme impact (days)"
          className={field}
        />
      </div>

      <button
        onClick={submit}
        disabled={saving}
        className="bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Posting…" : "Post update"}
      </button>
      <p className="font-mono text-[11px] text-muted-foreground">
        Photos are added in the project's Photos section and stay on the same day's record.
      </p>
    </div>
  );
};

export default SiteUpdateComposer;
