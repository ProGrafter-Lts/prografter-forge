import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { compressImage } from "@/lib/imageCompress";

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
 * the upload as a single entry. Independent of stage_updates.photo_urls.
 */
const PhotoDiaryUploader = ({
  jobId,
  uploadedBy,
  onUploaded,
  title = "Add site photos to this job",
  hint = "Photos are timestamped, shared with the other party, and appear on the Photos tab and the activity feed.",
}: Props) => {
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      for (const file of batch) {
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
        });
        if (insErr) {
          toast.error(`Could not save photo: ${insErr.message}`);
          continue;
        }
        ok += 1;
      }
      if (ok > 0) {
        toast.success(`${ok} photo${ok === 1 ? "" : "s"} added to this job.`);
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
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
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
    </div>
  );
};

export default PhotoDiaryUploader;
