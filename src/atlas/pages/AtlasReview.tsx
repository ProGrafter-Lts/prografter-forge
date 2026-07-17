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
import ProgressRing from "../components/ProgressRing";

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

  if (loading || !survey) {
    return (
      <AtlasShell>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-white/[0.06] rounded" />
          <div className="h-32 rounded-2xl bg-white/[0.04]" />
        </div>
      </AtlasShell>
    );
  }

  const groups: Record<string, any[]> = {};
  obs.forEach((o) => { (groups[o.classification] ||= []).push(o); });

  const criticalOutstanding = obs.filter((o) => o.is_critical && o.response_status !== "answered" && !o.skip_reason);
  const skipped = obs.filter((o) => o.skip_reason);
  const answered = obs.filter((o) => o.response_status === "answered");
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
      <button
        onClick={() => navigate(`/atlas/${id}`)}
        className="font-mono text-xs text-white/60 hover:text-white flex items-center gap-1.5 mb-8 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to workspace
      </button>

      <div className="mb-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-300">Final check</span>
        <h1 className="font-heading text-white text-4xl md:text-5xl mt-1">Review & complete.</h1>
        <p className="font-body text-[15px] text-white/60 mt-2">{survey.project_title}</p>
      </div>

      {/* Summary strip */}
      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 mb-6 flex flex-wrap items-center gap-8">
        <ProgressRing
          value={survey.completion_percentage}
          size={100}
          stroke={9}
          sublabel="Answered"
          tone={criticalOutstanding.length > 0 ? "amber" : "teal"}
        />
        <SummaryStat value={answered.length} label="Answered" />
        <SummaryStat value={skipped.length} label="Skipped with reason" tone="muted" />
        <SummaryStat value={criticalOutstanding.length} label="Critical outstanding" tone={criticalOutstanding.length ? "amber" : "muted"} />
      </section>

      {criticalOutstanding.length > 0 && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/[0.06] p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-200" />
            <h3 className="font-body font-medium text-amber-100">
              {criticalOutstanding.length} critical observation{criticalOutstanding.length === 1 ? "" : "s"} outstanding
            </h3>
          </div>
          <ul className="font-body text-sm text-amber-100/80 space-y-1 pl-6 list-disc marker:text-amber-300">
            {criticalOutstanding.map((o) => <li key={o.id}>{o.title}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(CLASSIFICATIONS).map(([k, meta]) => {
          const rows = groups[k];
          if (!rows || !rows.length) return null;
          return (
            <section key={k} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
              <h3 className={`font-mono text-[10px] uppercase tracking-wider mb-3 inline-flex px-2.5 py-1 rounded-full border ${meta.tone}`}>
                {meta.label} · {rows.length}
              </h3>
              <ul className="space-y-2.5 divide-y divide-white/[0.05]">
                {rows.map((o) => (
                  <li key={o.id} className="flex items-start gap-3 pt-2.5 first:pt-0">
                    <button onClick={() => navigate(`/atlas/${id}?section=${o.section_id}`)} className="text-left flex-1">
                      <p className="font-body text-sm text-white/90">{o.title}</p>
                      {o.observation_text && <p className="font-body text-[13px] text-white/55 line-clamp-2 mt-0.5">{o.observation_text}</p>}
                      {o.skip_reason && <p className="font-mono text-[11px] text-amber-200 mt-0.5">Skipped: {o.skip_reason}</p>}
                    </button>
                    <span className="font-mono text-[10px] text-white/40 shrink-0 mt-1">{RESPONSE_STATUSES[o.response_status]}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="mt-8 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 md:p-8 shadow-2xl shadow-black/20">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-300">Sign-off</span>
        <h2 className="font-heading text-white text-2xl md:text-3xl mt-1 mb-6">Lock this survey.</h2>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-wider text-white/50 mb-1.5 block">Surveyor name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-wider text-white/50 mb-1.5 block">Company</label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} className="h-11" />
          </div>
        </div>
        <label className="font-mono text-[10px] uppercase tracking-wider text-white/50 mb-1.5 block">Final notes</label>
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="mb-5" />

        <label className="flex items-start gap-2.5 mb-3 cursor-pointer">
          <Checkbox checked={confirmAccuracy} onCheckedChange={(v) => setConfirmAccuracy(!!v)} className="mt-0.5" />
          <span className="font-body text-sm text-white/85 leading-relaxed">
            I confirm the observations are accurate to the best of my knowledge, customer statements are marked as such,
            and I have not presented specialist decisions as confirmed facts.
          </span>
        </label>

        {criticalOutstanding.length > 0 && (
          <label className="flex items-start gap-2.5 mb-3 cursor-pointer">
            <Checkbox checked={ack} onCheckedChange={(v) => setAck(!!v)} className="mt-0.5" />
            <span className="font-body text-sm text-amber-100 leading-relaxed">
              I acknowledge that {criticalOutstanding.length} critical observation(s) remain outstanding and will be
              addressed in a follow-up.
            </span>
          </label>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            disabled={!canComplete}
            onClick={completeSurvey}
            className="gap-2 rounded-full h-11 px-6 shadow-lg shadow-teal-500/20"
            style={{ background: "linear-gradient(180deg,#14B8A6,#0D9488)", color: "white" }}
          >
            <CheckCircle2 className="w-4 h-4" /> Complete & lock survey
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate(`/atlas/${id}`)}
            className="rounded-full h-11 px-5 text-white/70 hover:text-white hover:bg-white/[0.06]"
          >
            Keep editing
          </Button>
        </div>
      </section>
    </AtlasShell>
  );
}

function SummaryStat({ value, label, tone }: { value: number; label: string; tone?: "teal" | "amber" | "muted" }) {
  const color =
    tone === "amber" ? "text-amber-200" : tone === "muted" ? "text-white/50" : "text-white";
  return (
    <div>
      <div className={`font-mono text-3xl leading-none ${color}`}>{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-white/50 mt-2">{label}</div>
    </div>
  );
}
