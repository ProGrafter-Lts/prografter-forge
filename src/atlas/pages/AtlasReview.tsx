import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import AtlasShell from "../AtlasShell";
import { CLASSIFICATIONS, RESPONSE_STATUSES } from "../sections";
import { logAtlasAudit, recomputeSurveyProgress } from "../lib";

export default function AtlasReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<any>(null);
  const [obs, setObs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [ack, setAck] = useState(false);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      await recomputeSurveyProgress(id);
      const { data: s } = await (supabase as any).from("atlas_surveys").select("*").eq("id", id).single();
      const { data: o } = await (supabase as any).from("atlas_observations").select("*").eq("survey_id", id).order("created_at");
      setSurvey(s);
      setObs(o || []);
      setName(s?.surveyor_name || "");
      setCompany(s?.surveyor_company || "");
      setLoading(false);
    })();
  }, [id]);

  if (loading || !survey) return <AtlasShell><div className="font-mono text-sm text-muted-foreground">Loading review…</div></AtlasShell>;

  const groups: Record<string, any[]> = {};
  obs.forEach((o) => { (groups[o.classification] ||= []).push(o); });

  const criticalOutstanding = obs.filter((o) => o.is_critical && o.response_status !== "answered" && !o.skip_reason);
  const skipped = obs.filter((o) => o.skip_reason);
  const canComplete = confirmAccuracy && (criticalOutstanding.length === 0 || ack) && name.trim();

  async function completeSurvey() {
    if (!id) return;
    await (supabase as any).from("atlas_surveys").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      surveyor_name: name,
      surveyor_company: company,
      final_notes: notes,
      acknowledged_outstanding: ack,
    }).eq("id", id);
    await logAtlasAudit(id, "survey", id, "completed", ack ? "Acknowledged outstanding" : undefined);
    toast.success("Survey completed and locked");
    navigate(`/atlas/${id}/summary`);
  }

  return (
    <AtlasShell>
      <button onClick={() => navigate(`/atlas/${id}`)} className="font-mono text-xs text-muted-foreground hover:text-white flex items-center gap-1 mb-4">
        <ArrowLeft className="w-3 h-3" /> Back to workspace
      </button>

      <h1 className="font-heading text-primary text-3xl mb-2">Review & complete</h1>
      <p className="font-body text-sm text-muted-foreground mb-6">{survey.project_title}</p>

      {criticalOutstanding.length > 0 && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-300" />
            <h3 className="font-heading text-rose-100">{criticalOutstanding.length} critical observation(s) still outstanding</h3>
          </div>
          <ul className="font-mono text-xs text-rose-200 space-y-1 pl-6 list-disc">
            {criticalOutstanding.map((o) => <li key={o.id}>{o.title}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-5">
        {Object.entries(CLASSIFICATIONS).map(([k, meta]) => {
          const rows = groups[k];
          if (!rows || !rows.length) return null;
          return (
            <section key={k} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className={`font-mono text-xs uppercase tracking-widest mb-3 inline-flex px-2 py-0.5 rounded-full border ${meta.tone}`}>
                {meta.label} ({rows.length})
              </h3>
              <ul className="space-y-2">
                {rows.map((o) => (
                  <li key={o.id} className="flex items-start gap-2">
                    <button onClick={() => navigate(`/atlas/${id}?section=${o.section_id}`)} className="text-left flex-1">
                      <p className="font-body text-sm text-white/90">{o.title}</p>
                      {o.observation_text && <p className="font-mono text-xs text-muted-foreground line-clamp-2">{o.observation_text}</p>}
                      {o.skip_reason && <p className="font-mono text-xs text-amber-300 mt-0.5">Skipped: {o.skip_reason}</p>}
                    </button>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">{RESPONSE_STATUSES[o.response_status]}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-heading text-primary text-xl mb-4">Sign-off</h2>
        <div className="grid md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="font-mono text-xs text-muted-foreground">Surveyor name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="font-mono text-xs text-muted-foreground">Company</label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
        </div>
        <label className="font-mono text-xs text-muted-foreground">Final notes</label>
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="mb-4" />

        <label className="flex items-start gap-2 mb-2 cursor-pointer">
          <Checkbox checked={confirmAccuracy} onCheckedChange={(v) => setConfirmAccuracy(!!v)} />
          <span className="font-body text-sm text-white/85">
            I confirm the observations are accurate to the best of my knowledge, customer statements are marked as such,
            and I have not presented specialist decisions as confirmed facts.
          </span>
        </label>

        {criticalOutstanding.length > 0 && (
          <label className="flex items-start gap-2 mb-2 cursor-pointer">
            <Checkbox checked={ack} onCheckedChange={(v) => setAck(!!v)} />
            <span className="font-body text-sm text-amber-100">
              I acknowledge that {criticalOutstanding.length} critical observation(s) remain outstanding and will be
              addressed in a follow-up.
            </span>
          </label>
        )}

        <div className="mt-4 flex gap-2">
          <Button disabled={!canComplete} onClick={completeSurvey} className="gap-2" style={{ background: "#0D9488", color: "white" }}>
            <CheckCircle2 className="w-4 h-4" /> Complete & lock survey
          </Button>
          <Button variant="outline" onClick={() => navigate(`/atlas/${id}`)}>Keep editing</Button>
        </div>
      </section>
    </AtlasShell>
  );
}
