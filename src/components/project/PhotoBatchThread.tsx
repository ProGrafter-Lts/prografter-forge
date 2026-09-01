import { useState } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import JobPhoto from "@/components/JobPhoto";
import { AccentCard, TonePill, type JobFileTone } from "@/components/project/jobFileUi";
import type { DiaryBatch } from "@/lib/photoDiary";

export interface BatchReply {
  id: string;
  batch_id: string;
  body: string;
  author_role: string;
  created_at: string;
}

interface Props {
  jobId: string;
  batch: DiaryBatch;
  replies: BatchReply[];
  viewerRole: "homeowner" | "trade" | "observer";
  onReplied?: () => void;
  compact?: boolean;
}

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const sourceTone = (source: string): JobFileTone =>
  source === "Photo log" ? "teal" : source === "Stage update" ? "sky" : "grey";

/** One upload batch: its photos, plus a lightweight reply thread. */
const PhotoBatchThread = ({
  jobId,
  batch,
  replies,
  viewerRole,
  onReplied,
  compact = false,
}: Props) => {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const canReply = (viewerRole === "homeowner" || viewerRole === "trade") && !!batch.batchId;

  const send = async () => {
    if (!draft.trim() || !batch.batchId) return;
    setSending(true);
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user.id;
    if (!userId) {
      toast.error("You need to be signed in to reply.");
      setSending(false);
      return;
    }
    const { error } = await supabase.from("job_photo_replies").insert({
      job_id: jobId,
      batch_id: batch.batchId,
      author_user_id: userId,
      author_role: viewerRole,
      body: draft.trim().slice(0, 2000),
    });
    setSending(false);
    if (error) {
      toast.error(`Could not send reply: ${error.message}`);
      return;
    }
    setDraft("");
    onReplied?.();
  };

  return (
    <AccentCard tone={batch.uploadedBy === "homeowner" ? "indigo" : "teal"}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-mono text-xs text-foreground">
            {batch.caption || "Site photos"}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
            {batch.photos.length} photo{batch.photos.length === 1 ? "" : "s"} ·{" "}
            {timeOf(batch.createdAt)} · uploaded by the {batch.uploadedBy}
          </p>
        </div>
        <TonePill tone={sourceTone(batch.photos[0].source)}>{batch.photos[0].source}</TonePill>
      </div>

      <div
        className={`grid gap-3 ${
          compact ? "grid-cols-3 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        }`}
      >
        {batch.photos.map((photo, i) => (
          <div
            key={`${photo.url}-${i}`}
            className="rounded-xl overflow-hidden bg-card border border-border"
          >
            <JobPhoto
              source={photo.url}
              alt={photo.caption}
              className={`w-full object-cover ${compact ? "h-24" : "h-32"}`}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {(replies.length > 0 || canReply) && (
        <div className="mt-4 border-t border-border pt-3 space-y-2">
          {replies.map((r) => (
            <div key={r.id} className="flex items-start gap-2">
              <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="font-mono text-[11px] text-foreground whitespace-pre-wrap">{r.body}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {r.author_role} · {new Date(r.created_at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {canReply && (
            <div className="flex items-center gap-2 pt-1">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Reply to this batch…"
                maxLength={2000}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 font-mono text-[11px] text-foreground outline-none focus:border-primary"
              />
              <button
                onClick={send}
                disabled={sending || !draft.trim()}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wide text-foreground disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Reply
              </button>
            </div>
          )}
        </div>
      )}
    </AccentCard>
  );
};

export default PhotoBatchThread;
