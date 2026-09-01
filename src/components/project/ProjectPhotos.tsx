import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import JobPhoto from "@/components/JobPhoto";
import PhotoDiaryUploader from "@/components/project/PhotoDiaryUploader";
import PhotoBatchThread, { type BatchReply } from "@/components/project/PhotoBatchThread";
import { groupByDay, groupIntoBatches, type DiaryPhoto } from "@/lib/photoDiary";
import {
  AccentCard,
  JobFileEmpty,
  JobFilePanel,
  SectionHeading,
  TonePill,
} from "@/components/project/jobFileUi";

interface Props {
  jobId: string;
  stages: { id: string; stage_name: string }[];
  updates: { stage_id: string; photo_urls: string[] | null; created_at: string }[];
  /** Photos posted with the original job listing. */
  jobPhotoUrls?: string[];
  /** Show the site photo upload control. */
  canUpload?: boolean;
  uploaderRole?: "trade" | "homeowner";
  /** Who is looking — controls whether replies can be posted. */
  viewerRole?: "trade" | "homeowner" | "observer";
}

/**
 * Site diary: job_photos + stage_updates.photo_urls + original job listing
 * photos, grouped by day and then by upload batch, each batch with its own
 * reply thread.
 */
const ProjectPhotos = ({
  jobId,
  stages,
  updates,
  jobPhotoUrls = [],
  canUpload = false,
  uploaderRole = "trade",
  viewerRole,
}: Props) => {
  const [jobPhotos, setJobPhotos] = useState<any[]>([]);
  const [replies, setReplies] = useState<BatchReply[]>([]);

  const effectiveViewer = viewerRole ?? (canUpload ? uploaderRole : "observer");

  const loadJobPhotos = useCallback(async () => {
    const [{ data: photos }, { data: reps }] = await Promise.all([
      supabase
        .from("job_photos")
        .select("id, photo_url, label, stage, batch_id, uploaded_by, created_at")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false }),
      supabase
        .from("job_photo_replies")
        .select("id, batch_id, body, author_role, created_at")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true }),
    ]);
    setJobPhotos(photos || []);
    setReplies((reps as BatchReply[]) || []);
  }, [jobId]);

  useEffect(() => {
    void loadJobPhotos();
  }, [loadJobPhotos]);

  const dated: DiaryPhoto[] = [];
  const undated: DiaryPhoto[] = [];

  for (const update of updates) {
    const stage = stages.find((s) => s.id === update.stage_id);
    for (const url of update.photo_urls || []) {
      dated.push({
        url,
        caption: stage?.stage_name || "Site update",
        source: "Stage update",
        createdAt: update.created_at,
        batchId: null,
        uploadedBy: "trade",
      });
    }
  }

  for (const jp of jobPhotos) {
    dated.push({
      url: jp.photo_url,
      caption: jp.label || "Site photo",
      source: "Photo log",
      createdAt: jp.created_at,
      batchId: jp.batch_id ?? null,
      uploadedBy: jp.uploaded_by || "trade",
    });
  }

  for (const url of jobPhotoUrls) {
    undated.push({
      url,
      caption: "Original job posting",
      source: "Job listing",
      createdAt: "",
    });
  }

  const days = groupByDay(dated);
  const total = dated.length + undated.length;

  return (
    <JobFilePanel className="space-y-5">
      {canUpload && (
        <PhotoDiaryUploader jobId={jobId} uploadedBy={uploaderRole} onUploaded={loadJobPhotos} />
      )}

      {total === 0 ? (
        <JobFileEmpty icon={<ImageIcon className="w-6 h-6" />}>
          No progress photos yet. Photos uploaded to the job or against a stage will appear here,
          grouped by day.
        </JobFileEmpty>
      ) : (
        <div className="space-y-4">
          <p className="font-mono text-xs text-muted-foreground">
            {total} photo{total === 1 ? "" : "s"} across {days.length} day
            {days.length === 1 ? "" : "s"} of site activity.
          </p>

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
                  jobId={jobId}
                  batch={batch}
                  replies={replies.filter((r) => r.batch_id === batch.batchId)}
                  viewerRole={effectiveViewer}
                  onReplied={loadJobPhotos}
                />
              ))}
            </div>
          ))}

          {undated.length > 0 && (
            <AccentCard tone="grey">
              <SectionHeading
                icon={<ImageIcon className="w-4 h-4 text-muted-foreground" />}
                title="Original job posting"
                count={undated.length}
              />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {undated.map((photo, i) => (
                  <div
                    key={`${photo.url}-${i}`}
                    className="rounded-xl overflow-hidden bg-card border border-border"
                  >
                    <JobPhoto
                      source={photo.url}
                      alt={photo.caption}
                      className="w-full h-32 object-cover"
                      loading="lazy"
                    />
                    <div className="p-2">
                      <TonePill tone="grey">Job listing</TonePill>
                    </div>
                  </div>
                ))}
              </div>
            </AccentCard>
          )}
        </div>
      )}
    </JobFilePanel>
  );
};

export default ProjectPhotos;
