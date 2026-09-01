import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Camera, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PhotoBatchThread, { type BatchReply } from "@/components/project/PhotoBatchThread";
import { groupByDay, groupIntoBatches, type DiaryPhoto } from "@/lib/photoDiary";
import {
  JobFileEmpty,
  JobFilePanel,
  SectionHeading,
  TonePill,
} from "@/components/project/jobFileUi";

interface JobLike {
  id: string;
  title?: string | null;
  ref?: string | null;
}

interface Props {
  jobs: JobLike[];
}

/**
 * Homeowner site diary inbox — every project's photo batches in one place,
 * newest first, each batch replyable inline.
 */
const SiteDiaryInbox = ({ jobs }: Props) => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [replies, setReplies] = useState<BatchReply[]>([]);
  const [loading, setLoading] = useState(true);

  const jobIds = jobs.map((j) => j.id);
  const key = jobIds.join(",");

  const load = useCallback(async () => {
    if (jobIds.length === 0) {
      setPhotos([]);
      setReplies([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: ph }, { data: rep }] = await Promise.all([
      supabase
        .from("job_photos")
        .select("id, job_id, photo_url, label, batch_id, uploaded_by, created_at")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("job_photo_replies")
        .select("id, job_id, batch_id, body, author_role, created_at")
        .in("job_id", jobIds)
        .order("created_at", { ascending: true }),
    ]);
    setPhotos(ph || []);
    setReplies((rep as BatchReply[]) || []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <JobFilePanel>
        <p className="font-mono text-xs text-muted-foreground">Loading site diary…</p>
      </JobFilePanel>
    );
  }

  if (photos.length === 0) {
    return (
      <JobFilePanel>
        <JobFileEmpty icon={<Camera className="w-6 h-6" />}>
          No site photos yet. When your tradesperson uploads photos to a project they'll land here,
          grouped by day, and you can reply to each batch.
        </JobFileEmpty>
      </JobFilePanel>
    );
  }

  const byJob = jobs
    .map((job) => ({
      job,
      items: photos.filter((p) => p.job_id === job.id),
    }))
    .filter((g) => g.items.length > 0)
    .sort(
      (a, b) =>
        new Date(b.items[0].created_at).getTime() - new Date(a.items[0].created_at).getTime(),
    );

  return (
    <div className="space-y-6">
      {byJob.map(({ job, items }) => {
        const diaryPhotos: DiaryPhoto[] = items.map((p: any) => ({
          url: p.photo_url,
          caption: p.label || "Site photo",
          source: "Photo log",
          createdAt: p.created_at,
          batchId: p.batch_id ?? null,
          uploadedBy: p.uploaded_by || "trade",
        }));
        const days = groupByDay(diaryPhotos);

        return (
          <JobFilePanel key={job.id} className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-xl text-foreground">
                  {job.title || "Project"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {job.ref && <TonePill tone="grey">{job.ref}</TonePill>}
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {items.length} photo{items.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              <Link
                to={`/project/${job.id}?tab=photos`}
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground"
              >
                Open project <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {days.map((day) => (
              <div key={day.key} className="space-y-3">
                <SectionHeading
                  icon={<CalendarDays className="w-4 h-4 text-teal-400" />}
                  title={day.label}
                  count={day.photos.length}
                />
                {groupIntoBatches(day.photos).map((batch) => (
                  <PhotoBatchThread
                    key={batch.key}
                    jobId={job.id}
                    batch={batch}
                    replies={replies.filter(
                      (r: any) => r.batch_id === batch.batchId && r.job_id === job.id,
                    )}
                    viewerRole="homeowner"
                    onReplied={load}
                    compact
                  />
                ))}
              </div>
            ))}
          </JobFilePanel>
        );
      })}
    </div>
  );
};

export default SiteDiaryInbox;
