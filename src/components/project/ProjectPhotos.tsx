import { useCallback, useEffect, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import JobPhoto from "@/components/JobPhoto";
import PhotoDiaryUploader from "@/components/project/PhotoDiaryUploader";
import { groupByDay, type DiaryPhoto } from "@/lib/photoDiary";

interface Props {
  jobId: string;
  stages: { id: string; stage_name: string }[];
  updates: { stage_id: string; photo_urls: string[] | null; created_at: string }[];
  /** Photos posted with the original job listing. */
  jobPhotoUrls?: string[];
  /** Show the daily photo-log upload control (trade / homeowner on the project). */
  canUpload?: boolean;
  uploaderRole?: "trade" | "homeowner";
}

/**
 * Site diary: job_photos + stage_updates.photo_urls + original job listing
 * photos, grouped by the day they were captured so a week of daily photos
 * reads as a timeline.
 */
const ProjectPhotos = ({
  jobId,
  stages,
  updates,
  jobPhotoUrls = [],
  canUpload = false,
  uploaderRole = "trade",
}: Props) => {
  const [jobPhotos, setJobPhotos] = useState<any[]>([]);

  const loadJobPhotos = useCallback(async () => {
    const { data } = await supabase
      .from("job_photos")
      .select("id, photo_url, label, stage, created_at")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });
    setJobPhotos(data || []);
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
      });
    }
  }

  for (const jp of jobPhotos) {
    dated.push({
      url: jp.photo_url,
      caption: jp.label || "Daily site photo",
      source: "Photo log",
      createdAt: jp.created_at,
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

  const grid = (photos: DiaryPhoto[]) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {photos.map((photo, i) => (
        <div key={`${photo.url}-${i}`} className="rounded-xl overflow-hidden border border-border">
          <JobPhoto
            source={photo.url}
            alt={photo.caption}
            className="w-full h-32 object-cover"
            loading="lazy"
          />
          <div className="p-2">
            <p className="font-mono text-[10px] text-foreground truncate">{photo.caption}</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              {photo.source}
              {photo.createdAt
                ? ` · ${new Date(photo.createdAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      {canUpload && (
        <PhotoDiaryUploader jobId={jobId} uploadedBy={uploaderRole} onUploaded={loadJobPhotos} />
      )}

      {total === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <ImageIcon className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
          <p className="font-mono text-sm text-muted-foreground">
            No progress photos yet. Photos uploaded to the site diary or against a stage will
            appear here, grouped by day.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-6">
          <p className="font-mono text-xs text-muted-foreground">
            {total} photo{total === 1 ? "" : "s"} across {days.length} day
            {days.length === 1 ? "" : "s"} of site activity.
          </p>

          {days.map((day) => (
            <section key={day.key}>
              <div className="flex items-center gap-3 mb-3">
                <h4 className="font-heading text-primary text-sm">{day.label}</h4>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {day.photos.length} photo{day.photos.length === 1 ? "" : "s"}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              {grid(day.photos)}
            </section>
          ))}

          {undated.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-3">
                <h4 className="font-heading text-primary text-sm">Original job posting</h4>
                <div className="flex-1 h-px bg-border" />
              </div>
              {grid(undated)}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectPhotos;
