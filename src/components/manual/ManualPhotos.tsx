import { Camera, Lock } from "lucide-react";
import JobPhoto from "@/components/JobPhoto";

interface Props {
  stages: any[];
  stageUpdates: any[];
  jobPhotos?: any[];
  jobPhotoUrls?: string[];
  isPro: boolean;
  onUpgrade: () => void;
}

const ManualPhotos = ({ stages, stageUpdates, jobPhotos = [], jobPhotoUrls = [], isPro, onUpgrade }: Props) => {
  // Collect all photos with stage info from multiple sources:
  //  1. stage_updates.photo_urls (daily updates from the trade)
  //  2. job_photos (uploaded by either party at any point in the project)
  //  3. job.photo_urls (initial photos posted with the job)
  const photos: { url: string; stageName: string; date: string }[] = [];

  for (const update of stageUpdates) {
    const stage = stages.find(s => s.id === update.stage_id);
    const stageName = stage?.stage_name || "Site Update";
    const urls = update.photo_urls || [];
    for (const url of urls) {
      photos.push({
        url,
        stageName,
        date: new Date(update.created_at).toLocaleDateString("en-GB"),
      });
    }
  }

  for (const jp of jobPhotos) {
    const stage = stages.find(s => s.id === jp.stage);
    photos.push({
      url: jp.photo_url,
      stageName: jp.label || stage?.stage_name || "Project Photo",
      date: new Date(jp.created_at).toLocaleDateString("en-GB"),
    });
  }

  for (const url of jobPhotoUrls) {
    photos.push({ url, stageName: "Original job posting", date: "—" });
  }

  const freeLimit = 10;
  const visiblePhotos = isPro ? photos : photos.slice(0, freeLimit);
  const lockedCount = photos.length - freeLimit;

  return (
    <section id="photos" className="bg-card rounded-2xl border border-border p-6 mb-6">
      <h2 className="font-heading text-primary text-xl mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5 text-secondary" />
        5. Photo Record
      </h2>

      {photos.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">No photos have been uploaded for this project.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {visiblePhotos.map((photo, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-border">
                <JobPhoto
                  source={photo.url}
                  alt={`${photo.stageName} - ${photo.date}`}
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

          {!isPro && lockedCount > 0 && (
            <div className="mt-4 text-center p-4 border border-dashed border-border rounded-xl">
              <Lock className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="font-mono text-xs text-muted-foreground mb-2">
                +{lockedCount} more photos available with Manual Pro
              </p>
              <button
                onClick={onUpgrade}
                className="bg-secondary text-white font-mono text-xs px-4 py-2 rounded-xl hover:bg-secondary/90 transition-colors"
              >
                Upgrade to unlock all photos
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default ManualPhotos;
