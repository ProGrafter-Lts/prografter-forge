import { useRef, useState } from "react";
import { Camera, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { compressImage } from "@/lib/imageCompress";
import { readCaptureMeta, diagnoseCaptureMeta, type CaptureDiagnostic } from "@/lib/exifCapture";

interface Props {
  jobId: string;
  uploadedBy: "trade" | "homeowner";
  onUploaded: () => void;
  title?: string;
  hint?: string;
}

const MAX_BATCH = 12;

const todayValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

/**
 * Site photo upload against the job itself. Writes to the existing job_photos
 * table (bucket path diary/<jobId>/...), tagging every file in one selection
 * with a shared batch_id so the diary, replies and the activity feed can treat
 * the upload as a single entry.
 *
 * Capture metadata (date taken, GPS, camera) is read from the ORIGINAL file
 * before compression — canvas re-encoding strips EXIF. Photos without usable
 * EXIF fall back to the date the uploader states below (defaults to today).
 */
const PhotoDiaryUploader = ({
  jobId,
  uploadedBy,
  onUploaded,
  title = "Add site photos to this job",
  hint = "Photos keep the date, time and location the camera recorded, so the diary reflects when the work actually happened — not when it was uploaded.",
}: Props) => {
  const [caption, setCaption] = useState("");
  const [fallbackDate, setFallbackDate] = useState(todayValue());
  const [busy, setBusy] = useState(false);
  const [diagnostics, setDiagnostics] = useState<CaptureDiagnostic[]>([]);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const diagRef = useRef<HTMLInputElement>(null);

  const runDiagnostic = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setChecking(true);
    try {
      const out: CaptureDiagnostic[] = [];
      for (const f of Array.from(files).slice(0, MAX_BATCH)) {
        out.push(await diagnoseCaptureMeta(f));
      }
      setDiagnostics(out);
    } finally {
      setChecking(false);
      if (diagRef.current) diagRef.current.value = "";
    }
  };


  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const batch = Array.from(files).slice(0, MAX_BATCH);
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const userId = sess.session?.user.id;
      if (!userId) {
        toast.error("You need to be signed in to upload photos.");
        return;
      }

      const batchId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Manual fallback: midday on the stated date, so timezone shifts can't
      // push it onto the wrong day.
      const manualIso = fallbackDate
        ? new Date(`${fallbackDate}T12:00:00`).toISOString()
        : new Date().toISOString();

      let ok = 0;
      let withExif = 0;
      let withGps = 0;

      for (const file of batch) {
        const meta = await readCaptureMeta(file);
        const compressed = await compressImage(file);
        const path = `diary/${jobId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("job-photos")
          .upload(path, compressed, { contentType: "image/jpeg" });
        if (upErr) {
          toast.error(`Upload failed: ${upErr.message}`);
          continue;
        }
        const { error: insErr } = await supabase.from("job_photos").insert({
          job_id: jobId,
          photo_url: path,
          label: caption.trim().slice(0, 200),
          uploaded_by: uploadedBy,
          uploader_user_id: userId,
          batch_id: batchId,
          taken_at: meta.takenAt ?? manualIso,
          taken_at_source: meta.takenAt ? "exif" : "manual",
          gps_lat: meta.lat,
          gps_lng: meta.lng,
          camera_make_model: meta.cameraMakeModel,
        });
        if (insErr) {
          toast.error(`Could not save photo: ${insErr.message}`);
          continue;
        }
        ok += 1;
        if (meta.takenAt) withExif += 1;
        if (meta.lat !== null) withGps += 1;
      }

      if (ok > 0) {
        const bits = [`${ok} photo${ok === 1 ? "" : "s"} added`];
        if (withExif > 0) bits.push(`${withExif} with camera date/time`);
        if (withGps > 0) bits.push(`${withGps} with location`);
        toast.success(bits.join(" · "));
        setCaption("");
        onUploaded();
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <div>
        <h3 className="font-heading text-primary text-base">{title}</h3>
        <p className="font-mono text-xs text-muted-foreground mt-1">{hint}</p>
      </div>

      <Input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Caption for this batch (optional)"
        maxLength={200}
      />

      <div className="space-y-1">
        <Label className="font-mono text-[11px] text-muted-foreground">
          If a photo has no camera date, use this date
        </Label>
        <Input
          type="date"
          value={fallbackDate}
          max={todayValue()}
          onChange={(e) => setFallbackDate(e.target.value)}
          className="max-w-[200px]"
        />
      </div>

      <p className="font-mono text-[10px] text-muted-foreground flex items-start gap-1.5">
        <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
        Where the camera recorded a location, it is stored with the photo as evidence.
        Screenshots and forwarded photos usually carry nothing, so they use the date above.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {busy ? "Uploading…" : "Upload photos"}
        </Button>

        <input
          ref={diagRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => runDiagnostic(e.target.files)}
        />
        <Button
          variant="ghost"
          size="sm"
          disabled={checking}
          onClick={() => diagRef.current?.click()}
          className="gap-2 font-mono text-[11px]"
        >
          {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Info className="w-3.5 h-3.5" />}
          {checking ? "Checking…" : "Check what a photo carries"}
        </Button>
      </div>

      {diagnostics.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              Photo details found (nothing was uploaded)
            </p>
            <button
              type="button"
              onClick={() => setDiagnostics([])}
              className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
          {diagnostics.map((d, i) => (
            <div key={`${d.fileName}-${i}`} className="space-y-1 border-t border-border/60 pt-2 first:border-0 first:pt-0">
              <p className="font-mono text-[11px] text-foreground break-all">
                {d.fileName} · {d.fileType} · {d.fileSizeKb} KB
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                Camera date: {d.parsed.takenAt ? new Date(d.parsed.takenAt).toLocaleString("en-GB") : "none"}
                {" · "}Location: {d.parsed.lat !== null ? `${d.parsed.lat.toFixed(5)}, ${d.parsed.lng?.toFixed(5)}` : "none"}
                {" · "}Camera: {d.makeModel || "none"}
              </p>
              {Object.keys(d.rawDates).length > 0 && (
                <p className="font-mono text-[10px] text-muted-foreground break-all">
                  Raw dates: {Object.entries(d.rawDates).map(([k, v]) => `${k}=${v}`).join(" | ")}
                </p>
              )}
              <p className="font-mono text-[10px] text-muted-foreground break-all">
                {d.tagsFound.length > 0
                  ? `Tags in file (${d.tagsFound.length}): ${d.tagsFound.slice(0, 30).join(", ")}`
                  : "No camera data in this file at all."}
              </p>
              {d.error && (
                <p className="font-mono text-[10px] text-amber-500">Reader said: {d.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoDiaryUploader;
