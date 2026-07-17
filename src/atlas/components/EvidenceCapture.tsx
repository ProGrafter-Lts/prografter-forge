import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Mic, Square, X, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

interface Evidence {
  id: string;
  evidence_type: string;
  storage_path: string | null;
  caption: string | null;
  transcript: string | null;
  duration_seconds: number | null;
  mime_type: string | null;
  signedUrl?: string;
}

interface Props {
  surveyId: string;
  observationId: string;
}

export default function EvidenceCapture({ surveyId, observationId }: Props) {
  const [items, setItems] = useState<Evidence[]>([]);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observationId]);

  async function load() {
    const { data } = await (supabase as any)
      .from("atlas_evidence")
      .select("id, evidence_type, storage_path, caption, transcript, duration_seconds, mime_type")
      .eq("observation_id", observationId)
      .is("archived_at", null)
      .order("captured_at", { ascending: false });

    const rows = (data || []) as Evidence[];
    // Get signed URLs for photos
    for (const r of rows) {
      if (r.storage_path && (r.evidence_type === "photo" || r.evidence_type === "voice")) {
        const { data: sig } = await supabase.storage.from("atlas-evidence").createSignedUrl(r.storage_path, 3600);
        r.signedUrl = sig?.signedUrl;
      }
    }
    setItems(rows);
  }

  async function handleFile(file: File, type: "photo" | "document") {
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${surveyId}/${observationId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("atlas-evidence").upload(path, file);
      if (error) throw error;
      const { data: sess } = await supabase.auth.getSession();
      await (supabase as any).from("atlas_evidence").insert({
        survey_id: surveyId,
        observation_id: observationId,
        evidence_type: type,
        storage_path: path,
        mime_type: file.type,
        captured_by: sess.session?.user.id,
      });
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        await handleVoice(blob, mime);
      };
      rec.start();
      mediaRef.current = rec;
      setRecording(true);
    } catch (e) {
      toast.error("Microphone access denied");
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  async function handleVoice(blob: Blob, mime: string) {
    if (blob.size < 2048) {
      toast.error("That recording was too short — please try again.");
      return;
    }
    setBusy(true);
    setTranscribing(true);
    try {
      const ext = mime.includes("mp4") ? "m4a" : "webm";
      const path = `${surveyId}/${observationId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("atlas-evidence")
        .upload(path, blob, { contentType: mime });
      if (error) throw error;

      // Transcribe via edge function
      let transcript = "";
      try {
        const form = new FormData();
        form.append("file", new File([blob], `voice.${ext}`, { type: mime }));
        const res = await supabase.functions.invoke("atlas-transcribe", { body: form });
        if (res.data && (res.data as any).text) transcript = (res.data as any).text;
      } catch (e) {
        console.warn("transcription failed", e);
      }

      const { data: sess } = await supabase.auth.getSession();
      await (supabase as any).from("atlas_evidence").insert({
        survey_id: surveyId,
        observation_id: observationId,
        evidence_type: "voice",
        storage_path: path,
        mime_type: mime,
        transcript,
        is_ai_suggestion: !!transcript,
        captured_by: sess.session?.user.id,
      });
      await load();
      if (transcript) toast.success("Voice note transcribed");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      setTranscribing(false);
    }
  }

  async function addNote() {
    if (!note.trim()) return;
    setBusy(true);
    const { data: sess } = await supabase.auth.getSession();
    await (supabase as any).from("atlas_evidence").insert({
      survey_id: surveyId,
      observation_id: observationId,
      evidence_type: "text",
      caption: note.trim(),
      captured_by: sess.session?.user.id,
    });
    setNote("");
    await load();
    setBusy(false);
  }

  async function archive(id: string) {
    await (supabase as any).from("atlas_evidence").update({ archived_at: new Date().toISOString() }).eq("id", id);
    await load();
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], "photo")}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="gap-1"
        >
          <Camera className="w-4 h-4" /> Photo
        </Button>
        {!recording ? (
          <Button
            variant="outline"
            size="sm"
            onClick={startRecording}
            disabled={busy}
            className="gap-1"
          >
            <Mic className="w-4 h-4" /> Voice
          </Button>
        ) : (
          <Button size="sm" variant="destructive" onClick={stopRecording} className="gap-1">
            <Square className="w-4 h-4" /> Stop
          </Button>
        )}
      </div>

      {transcribing && (
        <div className="font-mono text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Transcribing voice note…
        </div>
      )}

      <div className="flex gap-2">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a text note…" />
        <Button size="sm" onClick={addNote} disabled={!note.trim() || busy}>Add</Button>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {items.map((ev) => (
            <div key={ev.id} className="relative rounded-lg border border-white/10 bg-white/[0.03] p-2 group">
              <button
                onClick={() => archive(ev.id)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-black/60 rounded-full p-1"
                title="Archive"
              >
                <X className="w-3 h-3 text-white" />
              </button>
              {ev.evidence_type === "photo" && ev.signedUrl && (
                <img src={ev.signedUrl} alt={ev.caption || ""} className="w-full h-24 object-cover rounded" />
              )}
              {ev.evidence_type === "voice" && (
                <div>
                  {ev.signedUrl && <audio controls src={ev.signedUrl} className="w-full h-8" />}
                  {ev.transcript && (
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground italic">
                      <span className="text-teal-300">AI transcript:</span> {ev.transcript}
                    </p>
                  )}
                </div>
              )}
              {ev.evidence_type === "text" && (
                <p className="font-body text-xs text-white/90">{ev.caption}</p>
              )}
              {ev.evidence_type === "document" && (
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <FileText className="w-4 h-4" /> {ev.caption || "Attached document"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
