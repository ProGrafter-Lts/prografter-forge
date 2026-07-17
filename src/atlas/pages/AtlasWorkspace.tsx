import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Pause,
  Play,
  ClipboardCheck,
  AlertTriangle,
  Check,
  Camera,
  Mic,
  Square,
  ShieldAlert,
  MapPin,
  Clock,
  Target,
  ChevronRight,
} from "lucide-react";
import AtlasShell from "../AtlasShell";
import { ensureAtlasSections, recomputeSurveyProgress, statusPill } from "../lib";
import ObservationCard, { Observation } from "../components/ObservationCard";
import ProgressRing from "../components/ProgressRing";

interface Survey {
  id: string;
  project_title: string;
  property_address: string | null;
  postcode: string | null;
  customer_name: string | null;
  project_type: string;
  status: string;
  completion_percentage: number;
  start_route: string;
  relevant_trades: string[];
  customer_intent: string | null;
}

interface Section {
  id: string;
  section_key: string;
  title: string;
  category: string;
  sequence: number;
  completion_percentage: number;
  completion_status: string;
  critical_outstanding_count: number;
}

interface EvidenceLite {
  observation_id: string;
  evidence_type: string;
  storage_path: string | null;
  signedUrl?: string;
}

export default function AtlasWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [obs, setObs] = useState<Observation[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const readOnly = survey?.status === "completed" || survey?.status === "superseded";

  useEffect(() => {
    if (id) void load(true);
  }, [id]);

  async function load(seed = false) {
    if (!id) return;
    setLoading(true);
    const { data: s } = await (supabase as any).from("atlas_surveys").select("*").eq("id", id).maybeSingle();
    if (!s) {
      toast.error("Survey not found");
      navigate("/atlas");
      return;
    }
    setSurvey(s as Survey);

    if (seed) {
      try { await ensureAtlasSections(id); } catch (e) { console.warn(e); }
    }

    const { data: secs } = await (supabase as any)
      .from("atlas_sections")
      .select("*")
      .eq("survey_id", id)
      .order("sequence", { ascending: true });
    const secList = (secs || []) as Section[];
    setSections(secList);
    if (secList.length && !activeSection) setActiveSection(secList[0].id);

    const { data: obsData } = await (supabase as any)
      .from("atlas_observations")
      .select("*")
      .eq("survey_id", id)
      .order("created_at", { ascending: true });
    setObs((obsData || []) as Observation[]);

    // Batch-load evidence thumbnails per observation (first photo)
    const { data: evData } = await (supabase as any)
      .from("atlas_evidence")
      .select("observation_id, evidence_type, storage_path, captured_at")
      .eq("survey_id", id)
      .eq("evidence_type", "photo")
      .is("archived_at", null)
      .order("captured_at", { ascending: true });
    const map: Record<string, string> = {};
    const uniq = new Map<string, string>();
    for (const e of (evData || []) as EvidenceLite[]) {
      if (e.storage_path && !uniq.has(e.observation_id)) uniq.set(e.observation_id, e.storage_path);
    }
    await Promise.all(
      Array.from(uniq.entries()).map(async ([obsId, path]) => {
        const { data: sig } = await supabase.storage.from("atlas-evidence").createSignedUrl(path, 3600);
        if (sig?.signedUrl) map[obsId] = sig.signedUrl;
      }),
    );
    setThumbs(map);

    setLoading(false);
  }

  async function refresh() {
    await recomputeSurveyProgress(id!);
    await load(false);
  }

  const activeObs = useMemo(
    () => obs.filter((o) => o.section_id === activeSection),
    [obs, activeSection],
  );

  const totalCritical = sections.reduce((sum, s) => sum + s.critical_outstanding_count, 0);
  const totalPrompts = obs.length;
  const answered = obs.filter((o) => o.response_status === "answered").length;
  const nextSection = sections.find((s) => s.completion_status !== "completed");
  const estimatedMinutes = Math.max(20, sections.length * 6 + Math.round((100 - (survey?.completion_percentage || 0)) / 100 * 30));

  async function togglePause() {
    if (!survey) return;
    const next = survey.status === "paused" ? "in_progress" : "paused";
    await (supabase as any).from("atlas_surveys").update({
      status: next,
      paused_at: next === "paused" ? new Date().toISOString() : null,
    }).eq("id", survey.id);
    await load(false);
  }

  async function createObservation(classification: string, title: string) {
    if (!activeSection || !survey) return null;
    const { data: sess } = await supabase.auth.getSession();
    const { data, error } = await (supabase as any)
      .from("atlas_observations")
      .insert({
        survey_id: survey.id,
        section_id: activeSection,
        title,
        classification,
        response_status: classification === "risk" ? "answered" : "answered",
        is_critical: classification === "risk",
        observed_by: sess.session?.user.id,
      })
      .select("*")
      .single();
    if (error) {
      toast.error(error.message);
      return null;
    }
    setObs((prev) => [...prev, data as Observation]);
    return data as Observation;
  }

  async function quickPhoto() {
    fileRef.current?.click();
  }

  async function handlePhotoFile(file: File) {
    const target = await createObservation("known_fact", "Photo observation");
    if (!target || !id) return;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${id}/${target.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("atlas-evidence").upload(path, file);
    if (error) return toast.error(error.message);
    const { data: sess } = await supabase.auth.getSession();
    await (supabase as any).from("atlas_evidence").insert({
      survey_id: id,
      observation_id: target.id,
      evidence_type: "photo",
      storage_path: path,
      mime_type: file.type,
      captured_by: sess.session?.user.id,
    });
    toast.success("Photo captured");
    await refresh();
  }

  async function startVoice() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        await handleVoiceBlob(blob, mime);
      };
      rec.start();
      mediaRef.current = rec;
      setRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  }

  function stopVoice() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  async function handleVoiceBlob(blob: Blob, mime: string) {
    if (blob.size < 2048) return toast.error("Recording too short");
    const target = await createObservation("known_fact", "Voice observation");
    if (!target || !id) return;
    const ext = mime.includes("mp4") ? "m4a" : "webm";
    const path = `${id}/${target.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("atlas-evidence").upload(path, blob, { contentType: mime });
    if (error) return toast.error(error.message);
    let transcript = "";
    try {
      const form = new FormData();
      form.append("file", new File([blob], `voice.${ext}`, { type: mime }));
      const res = await supabase.functions.invoke("atlas-transcribe", { body: form });
      if (res.data && (res.data as any).text) transcript = (res.data as any).text;
    } catch (e) { console.warn(e); }
    const { data: sess } = await supabase.auth.getSession();
    await (supabase as any).from("atlas_evidence").insert({
      survey_id: id,
      observation_id: target.id,
      evidence_type: "voice",
      storage_path: path,
      mime_type: mime,
      transcript,
      is_ai_suggestion: !!transcript,
      captured_by: sess.session?.user.id,
    });
    toast.success(transcript ? "Voice transcribed" : "Voice captured");
    await refresh();
  }

  if (loading || !survey) {
    return (
      <AtlasShell>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-white/[0.06] rounded" />
          <div className="h-48 rounded-3xl bg-white/[0.04]" />
          <div className="h-24 rounded-2xl bg-white/[0.04]" />
        </div>
      </AtlasShell>
    );
  }

  return (
    <AtlasShell>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handlePhotoFile(e.target.files[0])}
      />

      <button
        onClick={() => navigate("/atlas")}
        className="font-mono text-xs text-white/60 hover:text-white flex items-center gap-1.5 mb-6 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> All surveys
      </button>

      {/* Project overview hero */}
      <section
        className="rounded-3xl border border-white/[0.08] p-6 md:p-8 mb-8 shadow-2xl shadow-black/30"
        style={{
          background:
            "linear-gradient(135deg, rgba(27,58,92,0.55) 0%, rgba(13,148,136,0.15) 100%), rgba(255,255,255,0.02)",
        }}
      >
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-300">
                Site survey
              </span>
              <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusPill(survey.status)}`}>
                {survey.status.replace(/_/g, " ")}
              </span>
            </div>
            <h1 className="font-heading text-white text-3xl md:text-4xl leading-tight mb-2">
              {survey.project_title}
            </h1>
            <div className="flex items-center gap-1.5 text-white/70 font-body text-sm mb-6">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {survey.property_address || "No address recorded"}
                {survey.postcode ? ` · ${survey.postcode}` : ""}
                {survey.customer_name ? ` · ${survey.customer_name}` : ""}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
              <MetaBlock
                icon={<Target className="w-4 h-4" />}
                label="Today's focus"
                value={nextSection?.title || "All sections complete"}
              />
              <MetaBlock
                icon={<Clock className="w-4 h-4" />}
                label="Estimated remaining"
                value={survey.completion_percentage >= 100 ? "Ready to review" : `~${estimatedMinutes} min`}
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 shrink-0">
            <ProgressRing
              value={survey.completion_percentage}
              size={120}
              stroke={10}
              sublabel="Complete"
              tone={totalCritical > 0 ? "amber" : "teal"}
            />
            <span className="font-mono text-[10px] text-white/50">
              {answered} of {totalPrompts} answered
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/[0.08]">
          {totalCritical > 0 && (
            <div className="flex items-center gap-1.5 font-mono text-xs text-amber-200 border border-amber-400/30 bg-amber-400/10 rounded-full px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {totalCritical} critical outstanding
            </div>
          )}
          <div className="flex-1" />
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePause}
              className="gap-1.5 text-white/80 hover:text-white hover:bg-white/[0.06] rounded-full h-9"
            >
              {survey.status === "paused" ? <><Play className="w-3.5 h-3.5" /> Resume</> : <><Pause className="w-3.5 h-3.5" /> Pause</>}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => navigate(`/atlas/${survey.id}/review`)}
            className="gap-1.5 rounded-full h-9 px-4 shadow-lg shadow-teal-500/20"
            style={{ background: "linear-gradient(180deg,#14B8A6,#0D9488)", color: "white" }}
          >
            <ClipboardCheck className="w-3.5 h-3.5" /> Review & complete
          </Button>
        </div>
      </section>

      <div className="grid md:grid-cols-[260px_1fr] gap-8">
        {/* Section nav */}
        <nav className="space-y-1.5 md:sticky md:top-6 self-start">
          <p className="font-mono text-[10px] uppercase text-white/40 tracking-[0.2em] mb-3 px-2">
            {survey.start_route === "outside" ? "Outside first · route" : "Inside first · route"}
          </p>
          {sections.map((s) => {
            const active = activeSection === s.id;
            const done = s.completion_status === "completed";
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`group w-full text-left rounded-xl px-3 py-2.5 border transition-all ${
                  active
                    ? "bg-white/[0.06] border-white/15 text-white"
                    : "bg-transparent border-transparent hover:bg-white/[0.03] text-white/70"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-body text-sm truncate flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        done ? "bg-emerald-400" : active ? "bg-teal-400" : "bg-white/20"
                      }`}
                    />
                    {s.title}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {s.critical_outstanding_count > 0 && (
                      <span className="font-mono text-[9px] bg-amber-400/15 text-amber-200 rounded-full px-1.5 py-0.5">
                        {s.critical_outstanding_count}
                      </span>
                    )}
                    {done && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    {active && !done && <ChevronRight className="w-3.5 h-3.5 text-white/40" />}
                  </div>
                </div>
                <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${done ? "bg-emerald-400" : "bg-teal-400"}`}
                    style={{ width: `${s.completion_percentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </nav>

        {/* Observation list */}
        <section className="space-y-3">
          {activeObs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <p className="font-body text-sm text-white/60">
                No observations in this section yet.
              </p>
              <p className="font-mono text-[10px] text-white/40 mt-1">
                Use the action bar below to capture the first one.
              </p>
            </div>
          )}
          {activeObs.map((o) => (
            <ObservationCard
              key={o.id}
              obs={o}
              onChange={refresh}
              readOnly={readOnly}
              thumbnail={thumbs[o.id]}
            />
          ))}
          {!readOnly && (
            <button
              onClick={() => createObservation("known_fact", "New observation")}
              className="w-full rounded-xl border border-dashed border-white/15 hover:border-teal-400/40 hover:bg-teal-500/[0.04] py-3 font-mono text-xs text-white/60 hover:text-teal-200 flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Add blank observation
            </button>
          )}
        </section>
      </div>

      {/* Sticky action bar (all viewports) */}
      {!readOnly && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-full border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/50 flex items-center gap-1 p-1.5"
          style={{ background: "rgba(15,31,56,0.85)" }}
        >
          <ActionBtn icon={<Camera className="w-4 h-4" />} label="Photo" onClick={quickPhoto} />
          {recording ? (
            <ActionBtn
              icon={<Square className="w-4 h-4 fill-current" />}
              label="Stop"
              onClick={stopVoice}
              tone="danger"
            />
          ) : (
            <ActionBtn icon={<Mic className="w-4 h-4" />} label="Voice" onClick={startVoice} />
          )}
          <ActionBtn
            icon={<Plus className="w-4 h-4" />}
            label="Note"
            onClick={() => createObservation("known_fact", "New observation")}
          />
          <ActionBtn
            icon={<ShieldAlert className="w-4 h-4" />}
            label="Risk"
            onClick={() => createObservation("risk", "New risk")}
            tone="warn"
          />
        </div>
      )}
    </AtlasShell>
  );
}

function MetaBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-teal-300 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-wider text-white/50">{label}</div>
        <div className="font-body text-sm text-white truncate">{value}</div>
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: "warn" | "danger";
}) {
  const toneCls =
    tone === "danger"
      ? "text-rose-200 hover:bg-rose-500/20"
      : tone === "warn"
        ? "text-amber-200 hover:bg-amber-500/15"
        : "text-white hover:bg-white/10";
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-full transition ${toneCls}`}
    >
      {icon}
      <span className="font-mono text-[9px] uppercase tracking-wider">{label}</span>
    </button>
  );
}
