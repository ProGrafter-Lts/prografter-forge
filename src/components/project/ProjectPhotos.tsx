import { useEffect, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import JobPhoto from "@/components/JobPhoto";

interface Props {
  jobId: string;
  stages: { id: string; stage_name: string }[];
  updates: { stage_id: string; photo_urls: string[] | null; created_at: string }[];
  /** Photos posted with the original job listing. */
  jobPhotoUrls?: string[];
}

/**
 * Same aggregation ManualPhotos does (job_photos + stage_updates.photo_urls +
 * the original job listing photos), surfaced on the project Photos tab.
 */
const ProjectPhotos = ({ jobId, stages, updates, jobPhotoUrls = [] }: Props) => {
  const [jobPhotos, setJobPhotos] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("job_photos")
      .select("id, photo_url, label, stage, created_at")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setJobPhotos(data || []);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const photos: { url: string; stageName: string; date: string }[] = [];

  for (const update of updates) {
    const stage = stages.find((s) => s.id === update.stage_id);
    for (const url of update.photo_urls || []) {
      photos.push({
        url,
        stageName: stage?.stage_name || "Site update",
        date: new Date(update.created_at).toLocaleDateString("en-GB"),
      });
    }
  }

  for (const jp of jobPhotos) {
    const stage = stages.find((s) => s.id === jp.stage);
    photos.push({
      url: jp.photo_url,
      stageName: jp.label || stage?.stage_name || "Project photo",
      date: new Date(jp.created_at).toLocaleDateString("en-GB"),
    });
  }

  for (const url of jobPhotoUrls) {
    photos.push({ url, stageName: "Original job posting", date: "—" });
  }

  if (photos.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 text-center">
        <ImageIcon className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
        <p className="font-mono text-sm text-muted-foreground">
          No progress photos yet. Photos you or your tradesperson upload against a stage will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="font-mono text-xs text-muted-foreground mb-4">
        {photos.length} photo{photos.length === 1 ? "" : "s"} across site updates and project uploads.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo, i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-border">
            <JobPhoto
              source={photo.url}
              alt={`${photo.stageName} — ${photo.date}`}
              className="w-full h-32 object-cover"
              loading="lazy"
            />
            <div className="p-2">
              <p className="font-mono text-[10px] text-foreground truncate">{photo.stageName}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{photo.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectPhotos;
