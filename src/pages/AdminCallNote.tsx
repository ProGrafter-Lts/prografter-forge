import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CALL_TYPES, CALL_STATUSES, SECTIONS, CONFIDENCE_OPTIONS,
  OPENING_SCRIPT, OPENING_SCRIPT_RECORDING, TASK_TYPES, callTypeLabel,
  type GuideField,
} from "@/lib/callGuides";

interface Note {
  id: string;
  call_type: string;
  call_status: string;
  call_date: string | null;
  homeowner_id: string | null;
  job_brief_id: string | null;
  project_id: string | null;
  quote_check_id: string | null;
  homeowner_name: string | null;
  homeowner_email: string | null;
  homeowner_phone: string | null;
  project_reference: string | null;
  recording_path: string | null;
  transcript_text: string | null;
  ai_summary: string | null;
  key_concerns: string | null;
  next_steps: string | null;
  follow_up_date: string | null;
  consent_given: boolean;
  answers: Record<string, any>;
  outputs: Record<string, any>;
}

interface Task {
  id: string;
  title: string;
  task_type: string | null;
  due_date: string | null;
  status: string;
}

const OUTPUT_KEYS = [
  { key: "homeowner_summary", label: "A. Homeowner summary" },
  { key: "admin_action_plan", label: "B. Admin action plan" },
  { key: "job_brief_improvements", label: "C. Job brief improvements" },
  { key: "quote_questions", label: "D. Quote questions for builder" },
  { key: "platform_insights", label: "E. Platform insights" },
  { key: "agent_training_notes", label: "F. Agent training notes" },
];

export default function AdminCallNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [tasks, setTasks] = useState<Task[]>([]);

  // recording
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("customer_call_notes").select("*").eq("id", id).single();
    if (error) { toast.error(error.message); setLoading(false); return; }
    const n = data as Note;
    n.answers = n.answers || {};
    n.outputs = n.outputs || {};
    setNote(n);
    const { data: t } = await (supabase as any)
      .from("customer_call_tasks").select("*").eq("call_note_id", id).order("created_at");
    setTasks((t as Task[]) ?? []);
    if (n.recording_path) {
      const { data: signed } = await (supabase as any).storage
        .from("call-recordings").createSignedUrl(n.recording_path, 3600);
      if (signed?.signedUrl) setRecordingUrl(signed.signedUrl);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const patch = (p: Partial<Note>) => setNote((prev) => (prev ? { ...prev, ...p } : prev));
  const setAnswer = (k: string, v: any) =>
    setNote((prev) => (prev ? { ...prev, answers: { ...prev.answers, [k]: v } } : prev));
  const setOutput = (k: string, v: string) =>
    setNote((prev) => (prev ? { ...prev, outputs: { ...prev.outputs, [k]: v } } : prev));

  const save = async (extra?: Partial<Note>, silent = false) => {
    if (!note) return;
    setSaving(true);
    const merged = { ...note, ...extra };
    const { id: _id, ...payload } = merged;
    const { error } = await (supabase as any)
      .from("customer_call_notes").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (extra) setNote(merged);
    if (!silent) toast.success("Saved");
  };

  // ---- recording ----
  const startRecording = async () => {
    if (!note?.consent_given) { toast.error("Confirm consent before recording."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const path = `${id}/${Date.now()}.webm`;
        const { error } = await (supabase as any).storage
          .from("call-recordings").upload(path, blob, { contentType: "audio/webm" });
        if (error) { toast.error("Upload failed: " + error.message); return; }
        await save({ recording_path: path });
        const { data: signed } = await (supabase as any).storage
          .from("call-recordings").createSignedUrl(path, 3600);
        if (signed?.signedUrl) setRecordingUrl(signed.signedUrl);
        toast.success("Recording saved");
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setPaused(false);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch {
      toast.error("Microphone permission denied.");
    }
  };
  const togglePause = () => {
    const mr = mediaRef.current;
    if (!mr) return;
    if (mr.state === "recording") { mr.pause(); setPaused(true); if (timerRef.current) clearInterval(timerRef.current); }
    else if (mr.state === "paused") { mr.resume(); setPaused(false); timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000); }
  };
  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
    setPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ---- summary generation (compiles structured answers into editable outputs) ----
  const generateSummary = () => {
    if (!note) return;
    const a = note.answers;
    const line = (label: string, v: any) => (v ? `• ${label}: ${v}\n` : "");
    const summary =
      `Homeowner: ${note.homeowner_name || "—"}\n` +
      `Call type: ${callTypeLabel(note.call_type)}\n\n` +
      line("Main concern", a.main_concern) +
      line("Project type", a.project_type) +
      line("Scope summary", a.scope_summary) +
      line("Quotes received", a.num_quotes) +
      line("Budget expectation", a.budget_expectation) +
      line("Planning status", a.planning_status) +
      line("Building Control", a.building_control_status) +
      line("Missing documents", a.missing_documents) +
      line("Decision blocker", a.decision_blocker) +
      line("Recommended next step", a.recommended_next_step);
    const outputs = {
      homeowner_summary: summary,
      admin_action_plan: line("Next step", a.recommended_next_step) + line("Follow-up", a.follow_up_required),
      job_brief_improvements: line("Missing works", a.missing_works) + line("Constraints", a.known_constraints) + line("Access", a.planning_call_notes),
      quote_questions: line("Verbal agreements to confirm in writing", a.verbal_agreements) + line("Exclusions clarity", a.exclusions_clarity),
      platform_insights: line("Product feedback", a.product_feedback) + line("Trust feedback", a.trust_feedback),
      agent_training_notes: line("Common confusion", a.decision_blocker) + line("Useful question", a.main_concern),
    };
    patch({ ai_summary: summary, outputs, key_concerns: a.main_concern || note.key_concerns });
    toast.success("Summary generated — review and edit before saving.");
  };

  // ---- save summary to job brief / quote check ----
  const saveToJobBrief = async () => {
    if (!note?.job_brief_id) { toast.error("No linked job brief."); return; }
    const scopeAddition = [note.outputs.job_brief_improvements, note.answers.scope_summary].filter(Boolean).join("\n");
    const { error } = await (supabase as any)
      .from("job_briefs")
      .update({
        admin_scope_notes: scopeAddition,
        admin_planning_notes: note.answers.planning_call_notes || null,
        admin_budget_notes: note.answers.affordability_concern || null,
      })
      .eq("id", note.job_brief_id);
    if (error) { toast.error("Could not save to job brief: " + error.message); return; }
    toast.success("Saved to job brief");
  };
  const saveToQuoteCheck = async () => {
    if (!note?.quote_check_id) { toast.error("No linked quote check."); return; }
    const { error } = await (supabase as any)
      .from("quote_checks")
      .update({ admin_call_notes: note.ai_summary || note.outputs.homeowner_summary })
      .eq("id", note.quote_check_id);
    if (error) { toast.error("Could not save to quote check: " + error.message); return; }
    toast.success("Saved to quote check");
  };

  const addToDataset = async () => {
    if (!note) return;
    const a = note.answers;
    const { error } = await (supabase as any).from("customer_call_insights").insert({
      call_note_id: note.id,
      anonymised: true,
      project_type: a.project_type || null,
      quote_issue_type: a.exclusions_clarity || a.scope_clarity || null,
      homeowner_concern_type: a.main_concern || null,
      missing_information: a.missing_documents || a.missing_works || null,
      common_confusion: a.decision_blocker || null,
      useful_question: note.outputs.quote_questions || null,
      agent_training_note: note.outputs.agent_training_notes || null,
    });
    if (error) { toast.error(error.message); return; }
    await save({ call_status: "in_dataset" });
    toast.success("Added anonymised insight to ProGrafter Intelligence Dataset");
  };

  const requestDocuments = async () => {
    if (!note?.homeowner_email) { toast.error("No homeowner email on record."); return; }
    const missing = note.answers.missing_documents || "the outstanding documents we discussed";
    const body = `Hi ${note.homeowner_name || "there"},\n\nFollowing our call, please could you upload ${missing} to your ProGrafter dashboard? This helps us prepare a clearer brief for matched trades.\n\nThanks,\nProGrafter`;
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(note.homeowner_email)}&su=${encodeURIComponent("Documents needed for your ProGrafter project")}&body=${encodeURIComponent(body)}`, "_blank");
  };

  // ---- tasks ----
  const addTask = async (taskType: string) => {
    if (!note) return;
    const { data, error } = await (supabase as any).from("customer_call_tasks").insert({
      call_note_id: note.id, title: taskType, task_type: taskType, status: "open",
      homeowner_id: note.homeowner_id, job_brief_id: note.job_brief_id,
      project_id: note.project_id, quote_check_id: note.quote_check_id,
    }).select("*").single();
    if (error) { toast.error(error.message); return; }
    setTasks((t) => [...t, data as Task]);
  };
  const updateTask = async (t: Task, p: Partial<Task>) => {
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...p } : x)));
    await (supabase as any).from("customer_call_tasks").update(p).eq("id", t.id);
  };
  const deleteTask = async (t: Task) => {
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    await (supabase as any).from("customer_call_tasks").delete().eq("id", t.id);
  };

  if (loading || !note) {
    return <div className="min-h-screen bg-cream flex items-center justify-center text-secondary-text">Loading…</div>;
  }

  const sectionKeys = CALL_TYPES.find((c) => c.value === note.call_type)?.sections ?? Object.keys(SECTIONS);
  const showRecordingScript = note.consent_given;

  const renderField = (f: GuideField) => {
    const v = note.answers[f.key] ?? "";
    const base = "w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal";
    return (
      <div key={f.key}>
        <label className="font-mono text-[11px] uppercase tracking-wide text-secondary-text">{f.label}</label>
        {f.kind === "textarea" ? (
          <textarea className={base + " mt-1 min-h-[64px]"} value={v} onChange={(e) => setAnswer(f.key, e.target.value)} />
        ) : f.kind === "select" ? (
          <select className={base + " mt-1"} value={v} onChange={(e) => setAnswer(f.key, e.target.value)}>
            <option value="">—</option>
            {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : f.kind === "yesno" ? (
          <select className={base + " mt-1"} value={v} onChange={(e) => setAnswer(f.key, e.target.value)}>
            <option value="">—</option><option value="Yes">Yes</option><option value="No">No</option><option value="Unknown">Unknown</option>
          </select>
        ) : (
          <input className={base + " mt-1"} value={v} onChange={(e) => setAnswer(f.key, e.target.value)} />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Scoping call — ProGrafter Admin" description="Guided scoping call" noindex />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <Link to="/admin/scoping-calls" className="font-mono text-xs text-teal hover:underline">← All calls</Link>
          <button onClick={() => save()} disabled={saving}
            className="rounded-lg bg-navy text-cream font-mono text-sm px-4 py-2 hover:bg-teal transition-colors disabled:opacity-50">
            {saving ? "Saving…" : "Save call"}
          </button>
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl text-navy mb-1">Scoping call</h1>
        <p className="font-body text-sm text-secondary-text mb-6">Guided customer discovery — internal use only.</p>

        {/* Header details */}
        <div className="rounded-2xl bg-white border border-navy/10 p-5 mb-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[11px] uppercase text-secondary-text">Call type</label>
            <select className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy"
              value={note.call_type} onChange={(e) => patch({ call_type: e.target.value })}>
              {CALL_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="font-mono text-[11px] uppercase text-secondary-text">Status</label>
            <select className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy"
              value={note.call_status} onChange={(e) => patch({ call_status: e.target.value })}>
              {CALL_STATUSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div><label className="font-mono text-[11px] uppercase text-secondary-text">Homeowner name</label>
            <input className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy" value={note.homeowner_name ?? ""} onChange={(e) => patch({ homeowner_name: e.target.value })} /></div>
          <div><label className="font-mono text-[11px] uppercase text-secondary-text">Homeowner email</label>
            <input className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy" value={note.homeowner_email ?? ""} onChange={(e) => patch({ homeowner_email: e.target.value })} /></div>
          <div><label className="font-mono text-[11px] uppercase text-secondary-text">Homeowner phone</label>
            <input className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy" value={note.homeowner_phone ?? ""} onChange={(e) => patch({ homeowner_phone: e.target.value })} /></div>
          <div><label className="font-mono text-[11px] uppercase text-secondary-text">Project reference</label>
            <input className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy" value={note.project_reference ?? ""} onChange={(e) => patch({ project_reference: e.target.value })} /></div>
          <div><label className="font-mono text-[11px] uppercase text-secondary-text">Follow-up date</label>
            <input type="date" className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy" value={note.follow_up_date ?? ""} onChange={(e) => patch({ follow_up_date: e.target.value })} /></div>
          <div className="sm:col-span-2 text-xs text-secondary-text">
            {note.job_brief_id && <span className="mr-3">Linked job brief ✓</span>}
            {note.quote_check_id && <span className="mr-3">Linked quote check ✓</span>}
            {note.project_id && <span className="mr-3">Linked project ✓</span>}
            {note.homeowner_id && <span>Linked homeowner ✓</span>}
          </div>
        </div>

        {/* Opening script */}
        <div className="rounded-2xl bg-navy/5 border border-navy/10 p-5 mb-5">
          <h2 className="font-heading text-lg text-navy mb-2">Opening script</h2>
          <p className="font-body text-sm text-navy/80 italic">"{OPENING_SCRIPT}"</p>
          {showRecordingScript && <p className="font-body text-sm text-navy/80 italic mt-2">"{OPENING_SCRIPT_RECORDING}"</p>}
        </div>

        {/* Consent + recording */}
        <div className="rounded-2xl bg-white border border-navy/10 p-5 mb-5">
          <h2 className="font-heading text-lg text-navy mb-2">Recording & consent</h2>
          <p className="font-body text-sm text-secondary-text mb-3">
            Before recording, confirm the homeowner is aware that this call may be recorded and transcribed for
            project scoping, platform support and service improvement.
          </p>
          <label className="flex items-start gap-2 text-sm text-navy">
            <input type="checkbox" className="mt-1" checked={note.consent_given}
              onChange={(e) => patch({ consent_given: e.target.checked })} />
            <span>I have informed the homeowner and they consent to the call being recorded.</span>
          </label>
          <p className="font-body text-xs text-secondary-text mt-2">Manual notes can be saved without recording.</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!recording ? (
              <button onClick={startRecording} disabled={!note.consent_given}
                className="rounded-lg bg-teal text-white font-mono text-sm px-4 py-2 disabled:opacity-40">● Start recording</button>
            ) : (
              <>
                <span className="font-mono text-sm text-navy">● {fmt(elapsed)}</span>
                <button onClick={togglePause} className="rounded-lg border border-navy/20 font-mono text-sm px-3 py-2">{paused ? "Resume" : "Pause"}</button>
                <button onClick={stopRecording} className="rounded-lg bg-navy text-cream font-mono text-sm px-3 py-2">Stop</button>
              </>
            )}
          </div>
          {recordingUrl && (
            <div className="mt-3">
              <audio controls src={recordingUrl} className="w-full" />
              <p className="font-mono text-xs text-teal mt-1">Recording saved (admin-only).</p>
            </div>
          )}
        </div>

        {/* Transcript */}
        <div className="rounded-2xl bg-white border border-navy/10 p-5 mb-5">
          <h2 className="font-heading text-lg text-navy mb-1">Transcript</h2>
          <p className="font-body text-xs text-secondary-text mb-2">Automatic transcription coming soon — paste or type the transcript here.</p>
          <textarea className="w-full min-h-[100px] rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy"
            value={note.transcript_text ?? ""} onChange={(e) => patch({ transcript_text: e.target.value })} />
        </div>

        {/* Guided sections */}
        <div className="space-y-3 mb-5">
          {sectionKeys.map((sk) => {
            const sec = SECTIONS[sk];
            if (!sec) return null;
            const isOpen = open[sk] ?? false;
            return (
              <div key={sk} className="rounded-2xl bg-white border border-navy/10 overflow-hidden">
                <button onClick={() => setOpen((o) => ({ ...o, [sk]: !isOpen }))}
                  className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span className="font-heading text-lg text-navy">{sec.title}</span>
                  <span className="font-mono text-teal">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 space-y-4">
                    <ul className="list-disc pl-5 space-y-1 text-sm text-secondary-text">
                      {sec.questions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                    {sk === "documents" && (
                      <button onClick={requestDocuments} className="rounded-lg border border-teal text-teal font-mono text-xs px-3 py-1.5">
                        Request documents from homeowner
                      </button>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {sec.fields.map(renderField)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary + outputs */}
        <div className="rounded-2xl bg-white border border-navy/10 p-5 mb-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="font-heading text-lg text-navy">Summary & outputs</h2>
            <button onClick={generateSummary} className="rounded-lg bg-teal text-white font-mono text-sm px-4 py-2">Generate call summary</button>
          </div>
          <label className="font-mono text-[11px] uppercase text-secondary-text">AI / call summary</label>
          <textarea className="mt-1 w-full min-h-[120px] rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy"
            value={note.ai_summary ?? ""} onChange={(e) => patch({ ai_summary: e.target.value })} />
          <div className="mt-4 space-y-3">
            {OUTPUT_KEYS.map((o) => (
              <div key={o.key}>
                <label className="font-mono text-[11px] uppercase text-secondary-text">{o.label}</label>
                <textarea className="mt-1 w-full min-h-[70px] rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy"
                  value={note.outputs[o.key] ?? ""} onChange={(e) => setOutput(o.key, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => save()} className="rounded-lg border border-navy/20 font-mono text-xs px-3 py-2">Save summary</button>
            <button onClick={saveToJobBrief} className="rounded-lg border border-navy/20 font-mono text-xs px-3 py-2">Save to job brief</button>
            <button onClick={saveToQuoteCheck} className="rounded-lg border border-navy/20 font-mono text-xs px-3 py-2">Save to quote check</button>
            <button onClick={addToDataset} className="rounded-lg bg-navy text-cream font-mono text-xs px-3 py-2">Add to Intelligence Dataset (anonymised)</button>
          </div>
        </div>

        {/* Quick markers */}
        <div className="rounded-2xl bg-white border border-navy/10 p-5 mb-5 flex flex-wrap gap-2">
          <button onClick={() => { setAnswer("planning_guidance_given", "Yes"); save({ call_status: note.call_status }); toast.success("Planning guidance marked"); }}
            className="rounded-lg border border-navy/20 font-mono text-xs px-3 py-2">Mark planning guidance given</button>
          <button onClick={() => save({ call_status: "complete" })}
            className="rounded-lg border border-navy/20 font-mono text-xs px-3 py-2">Mark scoping complete</button>
        </div>

        {/* Follow-up tasks */}
        <div className="rounded-2xl bg-white border border-navy/10 p-5 mb-8">
          <h2 className="font-heading text-lg text-navy mb-3">Follow-up tasks</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {TASK_TYPES.map((t) => (
              <button key={t} onClick={() => addTask(t)} className="rounded-full border border-teal text-teal font-mono text-xs px-3 py-1.5 hover:bg-teal/10">+ {t}</button>
            ))}
          </div>
          <div className="space-y-2">
            {tasks.length === 0 ? <p className="text-sm text-secondary-text">No tasks yet.</p> : tasks.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-2 border border-navy/10 rounded-lg p-3">
                <span className="flex-1 text-sm text-navy min-w-[140px]">{t.title}</span>
                <input type="date" className="rounded border border-navy/15 px-2 py-1 text-xs text-navy" value={t.due_date ?? ""} onChange={(e) => updateTask(t, { due_date: e.target.value })} />
                <select className="rounded border border-navy/15 px-2 py-1 text-xs text-navy" value={t.status} onChange={(e) => updateTask(t, { status: e.target.value })}>
                  <option value="open">Open</option><option value="in_progress">In progress</option><option value="done">Done</option>
                </select>
                <button onClick={() => deleteTask(t)} className="text-xs text-red-500 font-mono">Delete</button>
              </div>
            ))}
          </div>
        </div>

        <p className="font-body text-xs text-secondary-text mb-8">
          Recordings and transcripts may contain personal information. Only save what is needed for project support,
          service improvement and platform learning. Do not share recordings with trades or third parties without permission.
        </p>
      </div>
    </div>
  );
}
