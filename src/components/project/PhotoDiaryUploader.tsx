import { useRef, useState } from "react";
import { Camera, Info, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { compressImage } from "@/lib/imageCompress";
import { readCaptureMeta, diagnoseCaptureMeta, type CaptureDiagnostic } from "@/lib/exifCapture";
import sitePhotosBg from "@/assets/dashboard/card-sitephotos.jpg";

interface Props {
  jobId: string;
  uploadedBy: "trade" | "homeowner";
  onUploaded: () => void;
  title?: string;
  hint?: string;
}

const MAX_BATCH = 12;

/**
 * Site photo upload against the job itself. Writes to the existing job_photos
 * table (bucket path diary/<jobId>/...), tagging every file in one selection
 * with a shared batch_id so the diary, replies and the activity feed can treat
 * the upload as a single entry.
 *
 * Capture metadata (date taken, GPS, camera) is read from the ORIGINAL file
 * before compression — canvas re-encoding strips EXIF. This is a verification
 * record, so a photo is REJECTED unless it carries both a camera capture
 * time and GPS coordinates. No manual date fallback exists.
 */
const PhotoDiaryUploader = ({
  jobId,
  uploadedBy,
  onUploaded,
  title = "Add site photos to this job",
  hint = "Photos keep the date, time and location the camera recorded, so the diary reflects when the work actually happened — not when it was uploaded.",
}: Props) => {
  const [caption, setCaption] = useState("");
  const [rejected, setRejected] = useState<{ name: string; reason: string }[]>([]);
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

      let ok = 0;
      const bad: { name: string; reason: string }[] = [];

      for (const file of batch) {
        const meta = await readCaptureMeta(file);

        // Verification record: a photo is only evidence if the camera
        // recorded both when and where it was taken.
        if (!meta.takenAt || meta.lat === null || meta.lng === null) {
          const missing: string[] = [];
          if (!meta.takenAt) missing.push("no camera date/time");
          if (meta.lat === null || meta.lng === null) missing.push("no location");
          bad.push({ name: file.name, reason: missing.join(" · ") });
          continue;
        }

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
          taken_at: meta.takenAt,
          taken_at_source: "exif",
          gps_lat: meta.lat,
          gps_lng: meta.lng,
          camera_make_model: meta.cameraMakeModel,
        });
        if (insErr) {
          toast.error(`Could not save photo: ${insErr.message}`);
          continue;
        }
        ok += 1;
      }

      setRejected(bad);

      if (ok > 0) {
        toast.success(
          `${ok} photo${ok === 1 ? "" : "s"} added with camera date, time and location`,
        );
        setCaption("");
        onUploaded();
      }
      if (bad.length > 0) {
        toast.error(
          `${bad.length} photo${bad.length === 1 ? "" : "s"} rejected — no camera date/time or location`,
        );
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="td-surface p-5 space-y-3">
      <img
        src={sitePhotosBg}
        alt=""
        aria-hidden="true"
        loading="lazy"
        width={1200}
        height={700}
        className="td-img !opacity-[0.14] object-right"
      />
      <div className="td-veil" />
      <div className="td-content space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-teal-300">
            Site photos
          </p>
          <h3 className="font-heading text-foreground text-xl uppercase tracking-wide mt-1">
            Add site photos to this job
          </h3>
          <p className="font-mono text-xs text-muted-foreground mt-2">{title}</p>
          <p className="font-mono text-xs text-muted-foreground mt-1">{hint}</p>
        </div>
        <p className="td-note hidden md:block text-sm shrink-0 max-w-[10rem] text-right">
          Document progress. Build confidence.
        </p>
      </div>

      <Input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Caption for this batch (optional)"
        maxLength={200}
      />

      <p className="font-mono text-[10px] text-muted-foreground flex items-start gap-1.5">
        <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
        Only photos that carry the camera's own date, time and location are accepted —
        this is a verified site record. Send photos straight from the phone's camera roll;
        screenshots and photos forwarded through messaging apps are stripped of that data
        and will be turned away.
      </p>

      {rejected.length > 0 && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-wide text-destructive">
            Not added ({rejected.length})
          </p>
          {rejected.map((r, i) => (
            <p key={`${r.name}-${i}`} className="font-mono text-[10px] text-muted-foreground break-all">
              {r.name} — {r.reason}
            </p>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-teal-400/25 bg-white/[0.02] p-4">
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
    </div>
  );
};

export default PhotoDiaryUploader;
